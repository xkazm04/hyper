// WASM Compiler Module
// Compiles story bundles into standalone WASM binaries

import type { StoryStack, StoryCard, Choice, Character } from '@/lib/types'
import type {
  CompiledStoryBundle,
  CompileOptions,
  CompileResult,
  CompileError,
  CompileWarning,
  CompileStats,
  ExportFormat,
  ExportOptions,
} from './types'
import { serializeStory, bundleToBytes, validateBundle } from './serializer'
import { compressData, formatBytes } from './utils'

const DEFAULT_COMPILE_OPTIONS: CompileOptions = {
  embedAssets: true,
  compressAssets: true,
  maxAssetSize: 5 * 1024 * 1024,
  maxBundleSize: 50 * 1024 * 1024,
  includeDebugInfo: false,
  optimizeForSize: true,
  targetFormat: 'wasm',
}

const DEFAULT_EXPORT_OPTIONS: ExportOptions = {
  format: 'html-bundle',
  filename: 'story',
  includePlayer: true,
  minifyOutput: true,
  embedStyles: true,
}

/**
 * Compiles a story into a WASM-ready bundle
 */
export async function compileStory(
  stack: StoryStack,
  cards: StoryCard[],
  choices: Choice[],
  characters: Character[],
  options: Partial<CompileOptions> = {}
): Promise<CompileResult> {
  const startTime = performance.now()
  const opts = { ...DEFAULT_COMPILE_OPTIONS, ...options }
  const errors: CompileError[] = []
  const warnings: CompileWarning[] = []

  try {
    // Validate input data
    const validationIssues = validateInputData(stack, cards, choices)
    errors.push(...validationIssues.errors)
    warnings.push(...validationIssues.warnings)

    if (errors.length > 0) {
      return createFailedResult(errors, warnings, startTime)
    }

    // Serialize the story
    const bundle = await serializeStory(stack, cards, choices, characters, opts)

    // Validate the bundle
    const bundleValidation = validateBundle(bundle)
    if (!bundleValidation.valid) {
      for (const error of bundleValidation.errors) {
        errors.push({ code: 'BUNDLE_INVALID', message: error })
      }
      return createFailedResult(errors, warnings, startTime)
    }

    // Convert to bytes
    let wasmBytes = bundleToBytes(bundle)

    // Compress if requested
    if (opts.compressAssets) {
      try {
        wasmBytes = await compressData(wasmBytes)
      } catch {
        warnings.push({
          code: 'COMPRESSION_FAILED',
          message: 'Failed to compress bundle, using uncompressed format',
        })
      }
    }

    // Check size limits
    if (wasmBytes.length > opts.maxBundleSize) {
      errors.push({
        code: 'BUNDLE_TOO_LARGE',
        message: `Bundle size (${formatBytes(wasmBytes.length)}) exceeds maximum (${formatBytes(opts.maxBundleSize)})`,
      })
      return createFailedResult(errors, warnings, startTime)
    }

    // Calculate stats
    const stats = calculateStats(bundle, wasmBytes, startTime)

    return {
      success: true,
      bundle,
      wasmBytes,
      errors: [],
      warnings,
      stats,
    }
  } catch (error) {
    errors.push({
      code: 'COMPILE_ERROR',
      message: error instanceof Error ? error.message : 'Unknown compilation error',
    })
    return createFailedResult(errors, warnings, startTime)
  }
}

/**
 * Validates input data before compilation
 */
function validateInputData(
  stack: StoryStack,
  cards: StoryCard[],
  choices: Choice[]
): { errors: CompileError[]; warnings: CompileWarning[] } {
  const errors: CompileError[] = []
  const warnings: CompileWarning[] = []
  const cardIds = new Set(cards.map((c) => c.id))

  // Check for empty story
  if (cards.length === 0) {
    errors.push({
      code: 'NO_CARDS',
      message: 'Story must have at least one card',
    })
    return { errors, warnings }
  }

  // Validate first card
  if (stack.firstCardId && !cardIds.has(stack.firstCardId)) {
    errors.push({
      code: 'INVALID_FIRST_CARD',
      message: `First card ID "${stack.firstCardId}" does not exist`,
      cardId: stack.firstCardId,
    })
  }

  // Validate choices
  for (const choice of choices) {
    if (!cardIds.has(choice.storyCardId)) {
      errors.push({
        code: 'INVALID_CHOICE_SOURCE',
        message: `Choice "${choice.label}" references non-existent source card`,
        cardId: choice.storyCardId,
      })
    }
    if (!cardIds.has(choice.targetCardId)) {
      errors.push({
        code: 'INVALID_CHOICE_TARGET',
        message: `Choice "${choice.label}" references non-existent target card`,
        cardId: choice.targetCardId,
      })
    }
  }

  // Check for orphaned cards
  const reachableCards = findReachableCards(stack.firstCardId || cards[0]?.id, cards, choices)
  for (const card of cards) {
    if (!reachableCards.has(card.id)) {
      warnings.push({
        code: 'ORPHANED_CARD',
        message: `Card "${card.title}" is not reachable from the start`,
        cardId: card.id,
        suggestion: 'Consider adding a choice that leads to this card',
      })
    }
  }

  // Check for dead ends
  for (const card of cards) {
    const cardChoices = choices.filter((c) => c.storyCardId === card.id)
    if (cardChoices.length === 0) {
      warnings.push({
        code: 'DEAD_END',
        message: `Card "${card.title}" has no choices (dead end)`,
        cardId: card.id,
        suggestion: 'This may be intentional if it is a story ending',
      })
    }
  }

  // Check for empty content
  for (const card of cards) {
    if (!card.content.trim()) {
      warnings.push({
        code: 'EMPTY_CONTENT',
        message: `Card "${card.title}" has no content`,
        cardId: card.id,
      })
    }
  }

  return { errors, warnings }
}

/**
 * Finds all cards reachable from a starting card
 */
function findReachableCards(
  startId: string | null,
  cards: StoryCard[],
  choices: Choice[]
): Set<string> {
  const reachable = new Set<string>()
  if (!startId) return reachable

  const queue = [startId]
  while (queue.length > 0) {
    const currentId = queue.shift()!
    if (reachable.has(currentId)) continue
    reachable.add(currentId)

    const outgoingChoices = choices.filter((c) => c.storyCardId === currentId)
    for (const choice of outgoingChoices) {
      if (!reachable.has(choice.targetCardId)) {
        queue.push(choice.targetCardId)
      }
    }
  }

  return reachable
}

/**
 * Creates a failed compilation result
 */
function createFailedResult(
  errors: CompileError[],
  warnings: CompileWarning[],
  startTime: number
): CompileResult {
  return {
    success: false,
    bundle: null,
    wasmBytes: null,
    errors,
    warnings,
    stats: {
      totalCards: 0,
      totalChoices: 0,
      totalCharacters: 0,
      totalAssets: 0,
      bundleSizeBytes: 0,
      compileDurationMs: performance.now() - startTime,
      assetsSizeBytes: 0,
      dataCompressionRatio: 0,
    },
  }
}

/**
 * Calculates compilation statistics
 */
function calculateStats(
  bundle: CompiledStoryBundle,
  wasmBytes: Uint8Array,
  startTime: number
): CompileStats {
  const uncompressedSize = JSON.stringify(bundle).length

  return {
    totalCards: bundle.data.cards.length,
    totalChoices: bundle.data.choices.length,
    totalCharacters: bundle.data.characters.length,
    totalAssets: bundle.assets.images.length,
    bundleSizeBytes: wasmBytes.length,
    compileDurationMs: performance.now() - startTime,
    assetsSizeBytes: bundle.assets.totalSize,
    dataCompressionRatio: uncompressedSize > 0 ? wasmBytes.length / uncompressedSize : 1,
  }
}

/**
 * Exports a compiled bundle in various formats
 */
export async function exportBundle(
  result: CompileResult,
  options: Partial<ExportOptions> = {}
): Promise<Blob | null> {
  if (!result.success || !result.bundle || !result.wasmBytes) {
    return null
  }

  const opts = { ...DEFAULT_EXPORT_OPTIONS, ...options }

  switch (opts.format) {
    case 'html-bundle':
      return createHtmlBundle(result.bundle, result.wasmBytes, opts)
    case 'json-bundle':
      return createJsonBundle(result.bundle)
    case 'wasm-standalone':
    case 'wasm-embed':
      return new Blob([new Uint8Array(result.wasmBytes).buffer as ArrayBuffer], { type: 'application/wasm' })
    default:
      return null
  }
}

/**
 * Creates a standalone HTML bundle with embedded player
 */
async function createHtmlBundle(
  bundle: CompiledStoryBundle,
  wasmBytes: Uint8Array,
  options: ExportOptions
): Promise<Blob> {
  const bundleBase64 = btoa(String.fromCharCode(...wasmBytes))

  const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${escapeHtml(bundle.metadata.name)}</title>
  <style>
    ${getEmbeddedStyles(options)}
  </style>
</head>
<body>
  <div id="story-player" data-testid="wasm-story-player"></div>

  <script>
    ${getPlayerScript()}

    // Embedded bundle data
    const bundleBase64 = "${bundleBase64}";

    // Initialize player
    (async function() {
      const bytes = Uint8Array.from(atob(bundleBase64), c => c.charCodeAt(0));
      const decoder = new TextDecoder();
      const json = decoder.decode(bytes);
      const bundle = JSON.parse(json);

      window.storyPlayer = new StoryPlayer(document.getElementById('story-player'), bundle);
      window.storyPlayer.start();
    })();
  </script>
</body>
</html>`

  return new Blob([html], { type: 'text/html' })
}

/**
 * Creates a JSON bundle
 */
function createJsonBundle(bundle: CompiledStoryBundle): Blob {
  return new Blob([JSON.stringify(bundle, null, 2)], { type: 'application/json' })
}

/**
 * Returns embedded CSS styles for the player
 */
function getEmbeddedStyles(options: ExportOptions): string {
  return `
    * { margin: 0; padding: 0; box-sizing: border-box; }

    body {
      font-family: system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
      background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%);
      min-height: 100vh;
      color: #e2e8f0;
    }

    #story-player {
      max-width: 800px;
      margin: 0 auto;
      padding: 2rem 1rem;
    }

    .story-card {
      background: rgba(255, 255, 255, 0.1);
      border-radius: 1rem;
      overflow: hidden;
      box-shadow: 0 4px 20px rgba(0, 0, 0, 0.3);
    }

    .card-image {
      width: 100%;
      aspect-ratio: 16/9;
      object-fit: cover;
    }

    .card-content {
      padding: 2rem;
    }

    .card-title {
      font-size: 2rem;
      font-weight: 700;
      margin-bottom: 1rem;
      text-align: center;
    }

    .card-text {
      font-size: 1.125rem;
      line-height: 1.8;
      text-align: center;
      color: rgba(226, 232, 240, 0.8);
      white-space: pre-wrap;
    }

    .choices {
      margin-top: 2rem;
      display: flex;
      flex-direction: column;
      gap: 0.75rem;
    }

    .choice-btn {
      padding: 1rem 1.5rem;
      font-size: 1rem;
      font-weight: 600;
      border: 2px solid rgba(255, 255, 255, 0.2);
      border-radius: 0.5rem;
      background: rgba(59, 130, 246, 0.2);
      color: #e2e8f0;
      cursor: pointer;
      transition: all 0.2s;
    }

    .choice-btn:hover {
      background: rgba(59, 130, 246, 0.4);
      transform: scale(1.02);
    }

    .choice-btn:active {
      transform: scale(0.98);
    }

    .back-btn {
      margin-top: 1.5rem;
      padding: 0.75rem 1.5rem;
      font-size: 0.875rem;
      background: transparent;
      border: 1px solid rgba(255, 255, 255, 0.2);
      border-radius: 0.5rem;
      color: rgba(226, 232, 240, 0.8);
      cursor: pointer;
    }

    .back-btn:hover {
      background: rgba(255, 255, 255, 0.1);
    }

    .story-end {
      text-align: center;
      padding: 2rem;
      background: rgba(255, 255, 255, 0.05);
      border-radius: 0.5rem;
      margin-top: 2rem;
    }

    .story-end h3 {
      font-size: 1.5rem;
      margin-bottom: 0.5rem;
    }

    ${options.customCss || ''}
  `
}

/**
 * Returns the embedded player script
 */
function getPlayerScript(): string {
  return `
    class StoryPlayer {
      constructor(container, bundle) {
        this.container = container;
        this.bundle = bundle;
        this.currentCardId = null;
        this.history = [];
        this.cards = {};
        this.choices = {};

        // Index data
        bundle.data.cards.forEach(c => this.cards[c.id] = c);
        bundle.data.choices.forEach(c => {
          if (!this.choices[c.cardId]) this.choices[c.cardId] = [];
          this.choices[c.cardId].push(c);
        });

        // Sort choices by orderIndex
        Object.keys(this.choices).forEach(cardId => {
          this.choices[cardId].sort((a, b) => a.orderIndex - b.orderIndex);
        });

        this.entryCardId = bundle.data.navigation.entryNodeId || bundle.data.cards[0]?.id;
      }

      start() {
        this.currentCardId = this.entryCardId;
        this.history = [];
        this.render();
      }

      render() {
        const card = this.cards[this.currentCardId];
        if (!card) return;

        const cardChoices = this.choices[this.currentCardId] || [];
        const imageUrl = this.getAssetUrl(card.imageRef);

        this.container.innerHTML = \`
          <div class="story-card" data-testid="wasm-story-card">
            \${imageUrl ? \`<img class="card-image" src="\${imageUrl}" alt="\${this.escapeHtml(card.title)}">\` : ''}
            <div class="card-content">
              <h1 class="card-title">\${this.escapeHtml(card.title)}</h1>
              <p class="card-text">\${this.escapeHtml(card.content)}</p>

              \${cardChoices.length > 0 ? \`
                <div class="choices">
                  \${cardChoices.map((c, i) => \`
                    <button class="choice-btn" data-testid="wasm-choice-btn-\${i}" data-choice-id="\${c.id}">
                      \${this.escapeHtml(c.label)}
                    </button>
                  \`).join('')}
                </div>
              \` : \`
                <div class="story-end" data-testid="wasm-story-end">
                  <h3>The End</h3>
                  <p>You've reached the end of this story path</p>
                </div>
              \`}
            </div>
          </div>

          \${this.history.length > 0 ? \`
            <div style="text-align: center;">
              <button class="back-btn" data-testid="wasm-back-btn">← Go Back</button>
            </div>
          \` : ''}
        \`;

        // Bind events
        this.container.querySelectorAll('.choice-btn').forEach(btn => {
          btn.addEventListener('click', () => this.selectChoice(btn.dataset.choiceId));
        });

        const backBtn = this.container.querySelector('.back-btn');
        if (backBtn) {
          backBtn.addEventListener('click', () => this.goBack());
        }
      }

      selectChoice(choiceId) {
        const cardChoices = this.choices[this.currentCardId] || [];
        const choice = cardChoices.find(c => c.id === choiceId);
        if (!choice) return;

        this.history.push(this.currentCardId);
        this.currentCardId = choice.targetId;
        this.render();
        window.scrollTo({ top: 0, behavior: 'smooth' });
      }

      goBack() {
        if (this.history.length === 0) return;
        this.currentCardId = this.history.pop();
        this.render();
        window.scrollTo({ top: 0, behavior: 'smooth' });
      }

      getAssetUrl(assetRef) {
        if (!assetRef) return null;
        const asset = this.bundle.assets.images.find(a => a.id === assetRef);
        return asset?.dataUri || asset?.url || null;
      }

      escapeHtml(text) {
        if (!text) return '';
        return text.replace(/[&<>"']/g, m => ({
          '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
        })[m]);
      }
    }
  `
}

/**
 * Escapes HTML entities
 */
function escapeHtml(text: string): string {
  const htmlEntities: Record<string, string> = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#39;',
  }
  return text.replace(/[&<>"']/g, (m) => htmlEntities[m] || m)
}

/**
 * Generates a download link for the exported bundle
 */
export function createDownloadUrl(blob: Blob): string {
  return URL.createObjectURL(blob)
}

/**
 * Revokes a download URL to free memory
 */
export function revokeDownloadUrl(url: string): void {
  URL.revokeObjectURL(url)
}

/**
 * Triggers a file download
 */
export function downloadFile(blob: Blob, filename: string): void {
  const url = createDownloadUrl(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  revokeDownloadUrl(url)
}
