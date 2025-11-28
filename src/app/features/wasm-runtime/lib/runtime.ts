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
} from './types'
import { bytesToBundle, validateBundle } from './serializer'
import { generateRuntimeId, createSandbox, deepClone } from './utils'

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

  constructor() {
    this.runtimeId = generateRuntimeId()
  }

  /**
   * Loads a compiled bundle into the runtime
   */
  async loadBundle(bundleOrBytes: CompiledStoryBundle | Uint8Array): Promise<boolean> {
    try {
      const bundle =
        bundleOrBytes instanceof Uint8Array ? bytesToBundle(bundleOrBytes) : bundleOrBytes

      const validation = validateBundle(bundle)
      if (!validation.valid) {
        console.error('Bundle validation failed:', validation.errors)
        this.emit({ type: 'error', timestamp: Date.now(), data: { errors: validation.errors } })
        return false
      }

      this.bundle = bundle
      this.initializeState()
      this.initializeSandbox()

      return true
    } catch (error) {
      console.error('Failed to load bundle:', error)
      this.emit({ type: 'error', timestamp: Date.now(), data: { error } })
      return false
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
      flags: new Set(),
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
        hasFlag: (flag: string) => this.state?.flags.has(flag) ?? false,
        setFlag: (flag: string) => this.state?.flags.add(flag),
        clearFlag: (flag: string) => this.state?.flags.delete(flag),
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
   * Gets the current runtime state
   */
  getState(): WasmRuntimeState | null {
    return this.state ? deepClone(this.state) : null
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
   * Checks if a flag is set
   */
  hasFlag(flag: string): boolean {
    return this.state?.flags.has(flag) ?? false
  }

  /**
   * Sets a flag
   */
  setFlag(flag: string): void {
    this.state?.flags.add(flag)
  }

  /**
   * Clears a flag
   */
  clearFlag(flag: string): void {
    this.state?.flags.delete(flag)
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
   * Saves current state to localStorage
   */
  private autoSave(): void {
    if (!this.autoSaveKey || !this.state) return

    try {
      const saveData = {
        currentCardId: this.state.currentCardId,
        history: this.state.history,
        variables: this.state.variables,
        flags: Array.from(this.state.flags),
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
      this.state.flags = new Set(saveData.flags || [])
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
