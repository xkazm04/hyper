// WASM Offline Runtime Engine
// Executes compiled story bundles entirely in the browser without server connection

import type {
  CompiledStoryBundle,
  SerializedCard,
  SerializedChoice,
  SerializedCharacter,
  WasmRuntimeState,
  RuntimeEvent,
  RuntimeEventType,
  NavigationGraph,
  AssetManifest,
  FlagBitmask,
  BundleLoadOptions,
  BundleLoaderState,
  BundleValidationResult,
} from './types'
import { bytesToBundle } from './serializer'
import { generateRuntimeId, createSandbox, deepClone } from './utils'
import {
  validateBundleIntegrity,
  safeParseBundleBytes,
  saveLastKnownGood,
  getLastKnownGood,
  hasLastKnownGood,
  createInitialLoaderState,
  delay,
} from './validator'

export type RuntimeEventListener = (event: RuntimeEvent) => void

/**
 * Offline Runtime Engine
 * Executes story bundles without any network connection
 */
export class WasmRuntime {
  private bundle: CompiledStoryBundle | null = null
  private state: WasmRuntimeState | null = null
  private listeners: Set<RuntimeEventListener> = new Set()
  private runtimeId: string = ''
  private sandbox: Record<string, unknown> = {}
  private autoSaveKey: string | null = null
  private loaderState: BundleLoaderState = createInitialLoaderState()
  private loadOptions: BundleLoadOptions = {}
  private lastValidationResult: BundleValidationResult | null = null

  constructor() {
    this.runtimeId = generateRuntimeId()
  }

  /**
   * Gets the current loader state for UI feedback
   */
  getLoaderState(): BundleLoaderState {
    return { ...this.loaderState }
  }

  /**
   * Gets the last validation result
   */
  getValidationResult(): BundleValidationResult | null {
    return this.lastValidationResult
  }

  /**
   * Loads a compiled bundle into the runtime with validation
   */
  async loadBundle(
    bundleOrBytes: CompiledStoryBundle | Uint8Array,
    options: BundleLoadOptions = {}
  ): Promise<boolean> {
    this.loadOptions = options
    this.loaderState = {
      ...createInitialLoaderState(),
      maxRetries: options.maxRetries ?? 3,
      lastKnownGoodKey: options.lastKnownGoodKey ?? null,
      hasLastKnownGood: options.lastKnownGoodKey ? hasLastKnownGood(options.lastKnownGoodKey) : false,
    }

    return this.attemptLoad(bundleOrBytes, options)
  }

  /**
   * Attempts to load a bundle with retry logic
   */
  private async attemptLoad(
    bundleOrBytes: CompiledStoryBundle | Uint8Array,
    options: BundleLoadOptions
  ): Promise<boolean> {
    const maxRetries = options.maxRetries ?? 3
    const retryDelay = options.retryDelay ?? 1000

    while (this.loaderState.retryCount <= maxRetries) {
      try {
        this.loaderState.status = this.loaderState.retryCount > 0 ? 'retrying' : 'loading'
        options.onValidationProgress?.('Loading bundle...')

        // Parse bytes if needed
        let bundle: CompiledStoryBundle
        if (bundleOrBytes instanceof Uint8Array) {
          const parseResult = safeParseBundleBytes(bundleOrBytes)
          if (parseResult.error) {
            this.loaderState.error = parseResult.error
            this.loaderState.status = 'error'
            this.emit({
              type: 'error',
              timestamp: Date.now(),
              data: { error: parseResult.error, stage: 'parse' },
            })
            // Parse errors are not retryable
            return this.handleLoadFailure(options)
          }
          bundle = parseResult.bundle!
        } else {
          bundle = bundleOrBytes
        }

        // Validate the bundle
        this.loaderState.status = 'validating'
        const validation = await validateBundleIntegrity(bundle, options)
        this.lastValidationResult = validation
        this.loaderState.warnings = validation.warnings

        if (!validation.isValid) {
          const primaryError = validation.errors[0]
          this.loaderState.error = primaryError
          this.loaderState.status = 'error'
          this.emit({
            type: 'error',
            timestamp: Date.now(),
            data: {
              error: primaryError,
              allErrors: validation.errors,
              stage: 'validation',
            },
          })

          // Schema errors are not retryable, checksum errors might be
          if (primaryError.code !== 'CHECKSUM_MISMATCH') {
            return this.handleLoadFailure(options)
          }

          // Retry for checksum mismatch (might be network issue)
          this.loaderState.retryCount++
          if (this.loaderState.retryCount <= maxRetries) {
            await delay(retryDelay * this.loaderState.retryCount)
            continue
          }
          return this.handleLoadFailure(options)
        }

        // Validation passed - load the bundle
        this.bundle = bundle
        this.loaderState.status = 'validated'
        this.initializeState()
        this.initializeSandbox()

        // Save as last known good if key provided
        if (options.lastKnownGoodKey) {
          saveLastKnownGood(options.lastKnownGoodKey, bundle)
          this.loaderState.hasLastKnownGood = true
        }

        options.onValidationProgress?.('Bundle loaded successfully')
        return true
      } catch (error) {
        console.error('Failed to load bundle:', error)
        this.loaderState.error = {
          code: 'CORRUPT_DATA',
          message: error instanceof Error ? error.message : 'Unknown error during bundle load',
          details: error,
        }
        this.loaderState.status = 'error'
        this.emit({ type: 'error', timestamp: Date.now(), data: { error } })

        this.loaderState.retryCount++
        if (this.loaderState.retryCount <= maxRetries) {
          await delay(retryDelay * this.loaderState.retryCount)
          continue
        }
        return this.handleLoadFailure(options)
      }
    }

    return this.handleLoadFailure(options)
  }

  /**
   * Handles load failure with fallback to last known good state
   */
  private handleLoadFailure(options: BundleLoadOptions): boolean {
    if (options.lastKnownGoodKey && hasLastKnownGood(options.lastKnownGoodKey)) {
      return this.loadLastKnownGood(options.lastKnownGoodKey)
    }
    return false
  }

  /**
   * Loads the last known good bundle as fallback
   */
  loadLastKnownGood(key: string): boolean {
    try {
      const bundle = getLastKnownGood(key)
      if (!bundle) {
        return false
      }

      this.bundle = bundle
      this.loaderState.status = 'fallback'
      this.initializeState()
      this.initializeSandbox()

      this.emit({
        type: 'state_restored',
        timestamp: Date.now(),
        data: { fallback: true, key },
      })

      return true
    } catch (error) {
      console.error('Failed to load last known good bundle:', error)
      return false
    }
  }

  /**
   * Retries loading the bundle
   */
  async retryLoad(bundleOrBytes: CompiledStoryBundle | Uint8Array): Promise<boolean> {
    this.loaderState.retryCount = 0
    this.loaderState.error = null
    return this.attemptLoad(bundleOrBytes, this.loadOptions)
  }

  // BigInt constants for bitmask operations
  private static readonly BIGINT_ZERO = BigInt(0)
  private static readonly BIGINT_ONE = BigInt(1)

  /**
   * Creates an empty bitmask for flags
   */
  private createEmptyFlagBitmask(): FlagBitmask {
    return {
      value: WasmRuntime.BIGINT_ZERO,
      registry: new Map(),
      nextBit: 0,
    }
  }

  /**
   * Initializes runtime state
   */
  private initializeState(): void {
    if (!this.bundle) return

    this.state = {
      currentCardId: this.bundle.data.navigation.entryNodeId,
      history: [],
      variables: {},
      flags: this.createEmptyFlagBitmask(),
      visitedCards: new Set(),
      playStartTime: Date.now(),
      totalPlayTime: 0,
      isComplete: false,
    }

    if (this.state.currentCardId) {
      this.state.visitedCards.add(this.state.currentCardId)
    }
  }

  /**
   * Gets or assigns a bit position for a flag name
   */
  private getFlagBit(flag: string): number {
    if (!this.state) return -1

    let bit = this.state.flags.registry.get(flag)
    if (bit === undefined) {
      bit = this.state.flags.nextBit++
      this.state.flags.registry.set(flag, bit)
    }
    return bit
  }

  /**
   * Checks if a flag is set using bitwise AND (O(1) operation)
   */
  private hasFlagInternal(flag: string): boolean {
    if (!this.state) return false

    const bit = this.state.flags.registry.get(flag)
    if (bit === undefined) return false

    return (this.state.flags.value & (WasmRuntime.BIGINT_ONE << BigInt(bit))) !== WasmRuntime.BIGINT_ZERO
  }

  /**
   * Sets a flag using bitwise OR (O(1) operation)
   */
  private setFlagInternal(flag: string): void {
    if (!this.state) return

    const bit = this.getFlagBit(flag)
    this.state.flags.value |= (WasmRuntime.BIGINT_ONE << BigInt(bit))
  }

  /**
   * Clears a flag using bitwise AND with complement (O(1) operation)
   */
  private clearFlagInternal(flag: string): void {
    if (!this.state) return

    const bit = this.state.flags.registry.get(flag)
    if (bit === undefined) return

    this.state.flags.value &= ~(WasmRuntime.BIGINT_ONE << BigInt(bit))
  }

  /**
   * Initializes the script execution sandbox
   */
  private initializeSandbox(): void {
    this.sandbox = createSandbox({
      // Runtime API available to scripts
      runtime: {
        getVariable: (key: string) => this.state?.variables[key],
        setVariable: (key: string, value: unknown) => {
          if (this.state) {
            this.state.variables[key] = value
          }
        },
        hasFlag: (flag: string) => this.hasFlagInternal(flag),
        setFlag: (flag: string) => this.setFlagInternal(flag),
        clearFlag: (flag: string) => this.clearFlagInternal(flag),
        hasVisited: (cardId: string) => this.state?.visitedCards.has(cardId) ?? false,
        getVisitCount: () => this.state?.visitedCards.size ?? 0,
        getCurrentCardId: () => this.state?.currentCardId ?? null,
        getPlayTime: () => this.state?.totalPlayTime ?? 0,
      },
    })
  }

  /**
   * Starts the story from the beginning
   */
  start(): void {
    if (!this.bundle || !this.state) {
      throw new Error('No bundle loaded')
    }

    this.initializeState()
    this.emit({
      type: 'story_started',
      timestamp: Date.now(),
      cardId: this.state?.currentCardId ?? undefined,
    })

    if (this.state?.currentCardId) {
      this.enterCard(this.state.currentCardId)
    }
  }

  /**
   * Gets the current card
   */
  getCurrentCard(): SerializedCard | null {
    if (!this.bundle || !this.state?.currentCardId) return null
    return this.bundle.data.cards.find((c) => c.id === this.state?.currentCardId) || null
  }

  /**
   * Gets choices for the current card
   */
  getCurrentChoices(): SerializedChoice[] {
    if (!this.bundle || !this.state?.currentCardId) return []
    return this.bundle.data.choices
      .filter((c) => c.cardId === this.state?.currentCardId)
      .sort((a, b) => a.orderIndex - b.orderIndex)
  }

  /**
   * Gets a card by ID
   */
  getCard(cardId: string): SerializedCard | null {
    if (!this.bundle) return null
    return this.bundle.data.cards.find((c) => c.id === cardId) || null
  }

  /**
   * Gets all cards
   */
  getAllCards(): SerializedCard[] {
    if (!this.bundle) return []
    return [...this.bundle.data.cards]
  }

  /**
   * Gets choices for a specific card
   */
  getChoicesForCard(cardId: string): SerializedChoice[] {
    if (!this.bundle) return []
    return this.bundle.data.choices
      .filter((c) => c.cardId === cardId)
      .sort((a, b) => a.orderIndex - b.orderIndex)
  }

  /**
   * Gets a character by ID
   */
  getCharacter(characterId: string): SerializedCharacter | null {
    if (!this.bundle) return null
    return this.bundle.data.characters.find((c) => c.id === characterId) || null
  }

  /**
   * Gets all characters
   */
  getAllCharacters(): SerializedCharacter[] {
    if (!this.bundle) return []
    return [...this.bundle.data.characters]
  }

  /**
   * Gets an asset URL from the manifest
   */
  getAssetUrl(assetRef: string): string | null {
    if (!this.bundle) return null
    const asset = this.bundle.assets.images.find((a) => a.id === assetRef)
    if (!asset) return null
    return asset.dataUri || asset.url
  }

  /**
   * Selects a choice and navigates to the target card
   */
  selectChoice(choiceId: string): boolean {
    if (!this.bundle || !this.state) return false

    const choice = this.bundle.data.choices.find((c) => c.id === choiceId)
    if (!choice || choice.cardId !== this.state.currentCardId) {
      return false
    }

    // Exit current card
    this.exitCard(this.state.currentCardId)

    // Add to history
    this.state.history.push(this.state.currentCardId)

    // Emit choice selected event
    this.emit({
      type: 'choice_selected',
      timestamp: Date.now(),
      cardId: this.state.currentCardId,
      choiceId: choice.id,
      data: { label: choice.label, targetId: choice.targetId },
    })

    // Navigate to target
    this.state.currentCardId = choice.targetId
    this.enterCard(choice.targetId)

    // Auto-save state
    this.autoSave()

    return true
  }

  /**
   * Goes back to the previous card
   */
  goBack(): boolean {
    if (!this.state || this.state.history.length === 0) return false

    const previousCardId = this.state.history.pop()!
    this.exitCard(this.state.currentCardId!)
    this.state.currentCardId = previousCardId
    this.enterCard(previousCardId)

    this.autoSave()
    return true
  }

  /**
   * Restarts the story from the beginning
   */
  restart(): void {
    if (!this.bundle) return

    const previousTotalTime = this.state?.totalPlayTime ?? 0

    this.initializeState()
    if (this.state) {
      this.state.totalPlayTime = previousTotalTime
    }

    this.emit({
      type: 'story_started',
      timestamp: Date.now(),
      cardId: this.state?.currentCardId ?? undefined,
    })

    if (this.state?.currentCardId) {
      this.enterCard(this.state.currentCardId)
    }

    this.autoSave()
  }

  /**
   * Enters a card and executes its script
   */
  private enterCard(cardId: string): void {
    if (!this.state) return

    this.state.visitedCards.add(cardId)

    const card = this.getCard(cardId)
    if (card?.script) {
      this.executeScript(card.script, cardId)
    }

    // Check if this is a dead end
    const choices = this.getChoicesForCard(cardId)
    if (choices.length === 0) {
      this.state.isComplete = true
      this.emit({
        type: 'story_completed',
        timestamp: Date.now(),
        cardId,
      })
    }

    this.emit({
      type: 'card_entered',
      timestamp: Date.now(),
      cardId,
    })
  }

  /**
   * Exits a card
   */
  private exitCard(cardId: string): void {
    this.emit({
      type: 'card_exited',
      timestamp: Date.now(),
      cardId,
    })
  }

  /**
   * Executes a card's script in a sandboxed environment
   */
  private executeScript(script: string, cardId: string): void {
    if (!script.trim()) return

    try {
      // Create a function with the sandbox as its scope
      const sandboxKeys = Object.keys(this.sandbox)
      const sandboxValues = Object.values(this.sandbox)

      // eslint-disable-next-line no-new-func
      const fn = new Function(...sandboxKeys, script)
      fn(...sandboxValues)

      this.emit({
        type: 'script_executed',
        timestamp: Date.now(),
        cardId,
      })
    } catch (error) {
      console.error(`Script execution error in card ${cardId}:`, error)
      this.emit({
        type: 'error',
        timestamp: Date.now(),
        cardId,
        data: { error: error instanceof Error ? error.message : 'Script execution failed' },
      })
    }
  }

  /**
   * Gets the navigation graph
   */
  getNavigationGraph(): NavigationGraph | null {
    return this.bundle?.data.navigation || null
  }

  /**
   * Gets the asset manifest
   */
  getAssetManifest(): AssetManifest | null {
    return this.bundle?.assets || null
  }

  /**
   * Gets bundle metadata
   */
  getMetadata() {
    return this.bundle?.metadata || null
  }

  /**
   * Clones the flag bitmask
   */
  private cloneFlagBitmask(flags: FlagBitmask): FlagBitmask {
    return {
      value: flags.value,
      registry: new Map(flags.registry),
      nextBit: flags.nextBit,
    }
  }

  /**
   * Gets the current runtime state
   */
  getState(): WasmRuntimeState | null {
    if (!this.state) return null

    return {
      currentCardId: this.state.currentCardId,
      history: [...this.state.history],
      variables: deepClone(this.state.variables),
      flags: this.cloneFlagBitmask(this.state.flags),
      visitedCards: new Set(this.state.visitedCards),
      playStartTime: this.state.playStartTime,
      totalPlayTime: this.state.totalPlayTime,
      isComplete: this.state.isComplete,
    }
  }

  /**
   * Gets a variable value
   */
  getVariable<T = unknown>(key: string): T | undefined {
    return this.state?.variables[key] as T | undefined
  }

  /**
   * Sets a variable value
   */
  setVariable(key: string, value: unknown): void {
    if (this.state) {
      this.state.variables[key] = value
    }
  }

  /**
   * Checks if a flag is set using bitwise AND (O(1) operation)
   */
  hasFlag(flag: string): boolean {
    return this.hasFlagInternal(flag)
  }

  /**
   * Sets a flag using bitwise OR (O(1) operation)
   */
  setFlag(flag: string): void {
    this.setFlagInternal(flag)
  }

  /**
   * Clears a flag using bitwise AND with complement (O(1) operation)
   */
  clearFlag(flag: string): void {
    this.clearFlagInternal(flag)
  }

  /**
   * Checks if a card has been visited
   */
  hasVisited(cardId: string): boolean {
    return this.state?.visitedCards.has(cardId) ?? false
  }

  /**
   * Gets the history of visited cards
   */
  getHistory(): string[] {
    return this.state ? [...this.state.history] : []
  }

  /**
   * Subscribes to runtime events
   */
  subscribe(listener: RuntimeEventListener): () => void {
    this.listeners.add(listener)
    return () => this.listeners.delete(listener)
  }

  /**
   * Emits a runtime event
   */
  private emit(event: RuntimeEvent): void {
    this.listeners.forEach((listener) => {
      try {
        listener(event)
      } catch (error) {
        console.error('Event listener error:', error)
      }
    })
  }

  /**
   * Enables auto-save to localStorage
   */
  enableAutoSave(key: string): void {
    this.autoSaveKey = key
    this.autoSave()
  }

  /**
   * Disables auto-save
   */
  disableAutoSave(): void {
    this.autoSaveKey = null
  }

  /**
   * Serializes flag bitmask for storage
   */
  private serializeFlags(): { value: string; registry: [string, number][] } {
    if (!this.state) return { value: '0', registry: [] }

    return {
      value: this.state.flags.value.toString(),
      registry: Array.from(this.state.flags.registry.entries()),
    }
  }

  /**
   * Saves current state to localStorage
   */
  private autoSave(): void {
    if (!this.autoSaveKey || !this.state) return

    try {
      const saveData = {
        currentCardId: this.state.currentCardId,
        history: this.state.history,
        variables: this.state.variables,
        flags: this.serializeFlags(),
        visitedCards: Array.from(this.state.visitedCards),
        totalPlayTime:
          this.state.totalPlayTime + (Date.now() - this.state.playStartTime),
      }
      localStorage.setItem(this.autoSaveKey, JSON.stringify(saveData))
    } catch (error) {
      console.warn('Auto-save failed:', error)
    }
  }

  /**
   * Deserializes flag bitmask from storage
   */
  private deserializeFlags(
    savedFlags: { value: string; registry: [string, number][] } | string[] | undefined
  ): FlagBitmask {
    // Handle legacy Set-based format (array of flag names)
    if (Array.isArray(savedFlags)) {
      const bitmask = this.createEmptyFlagBitmask()
      for (const flag of savedFlags) {
        const bit = bitmask.nextBit++
        bitmask.registry.set(flag, bit)
        bitmask.value |= (WasmRuntime.BIGINT_ONE << BigInt(bit))
      }
      return bitmask
    }

    // Handle new bitmask format
    if (savedFlags && typeof savedFlags === 'object') {
      return {
        value: BigInt(savedFlags.value || '0'),
        registry: new Map(savedFlags.registry || []),
        nextBit: savedFlags.registry?.length || 0,
      }
    }

    return this.createEmptyFlagBitmask()
  }

  /**
   * Restores state from localStorage
   */
  restoreState(key: string): boolean {
    try {
      const saved = localStorage.getItem(key)
      if (!saved || !this.state) return false

      const saveData = JSON.parse(saved)

      this.state.currentCardId = saveData.currentCardId
      this.state.history = saveData.history || []
      this.state.variables = saveData.variables || {}
      this.state.flags = this.deserializeFlags(saveData.flags)
      this.state.visitedCards = new Set(saveData.visitedCards || [])
      this.state.totalPlayTime = saveData.totalPlayTime || 0
      this.state.playStartTime = Date.now()
      this.state.isComplete = false

      this.emit({
        type: 'state_restored',
        timestamp: Date.now(),
        cardId: this.state.currentCardId ?? undefined,
      })

      if (this.state.currentCardId) {
        this.emit({
          type: 'card_entered',
          timestamp: Date.now(),
          cardId: this.state.currentCardId,
        })
      }

      return true
    } catch (error) {
      console.warn('State restore failed:', error)
      return false
    }
  }

  /**
   * Clears saved state
   */
  clearSavedState(key: string): void {
    try {
      localStorage.removeItem(key)
    } catch {
      // Ignore errors
    }
  }

  /**
   * Gets the runtime ID
   */
  getRuntimeId(): string {
    return this.runtimeId
  }

  /**
   * Checks if a bundle is loaded
   */
  isLoaded(): boolean {
    return this.bundle !== null
  }

  /**
   * Checks if the story is complete
   */
  isComplete(): boolean {
    return this.state?.isComplete ?? false
  }

  /**
   * Checks if we can go back
   */
  canGoBack(): boolean {
    return (this.state?.history.length ?? 0) > 0
  }

  /**
   * Destroys the runtime and cleans up
   */
  destroy(): void {
    this.bundle = null
    this.state = null
    this.listeners.clear()
    this.sandbox = {}
    this.autoSaveKey = null
  }
}

/**
 * Creates a new runtime instance
 */
export function createRuntime(): WasmRuntime {
  return new WasmRuntime()
}
