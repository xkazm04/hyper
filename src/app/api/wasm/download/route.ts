import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import { StoryService } from '@/lib/services/story/index'
import { serializeStory, bundleToBytes } from '@/app/features/wasm-runtime/lib/serializer'
import { compressData } from '@/app/features/wasm-runtime/lib/utils'
import type { ExportFormat } from '@/app/features/wasm-runtime/lib/types'

export async function GET(request: NextRequest) {
  try {
    const supabase = await createServerSupabaseClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const stackId = searchParams.get('stackId')
    const format = (searchParams.get('format') || 'wasm') as ExportFormat

    if (!stackId) {
      return NextResponse.json({ error: 'Stack ID is required' }, { status: 400 })
    }

    // Fetch story data
    const storyService = new StoryService()

    const stack = await storyService.getStoryStack(stackId)
    if (!stack) {
      return NextResponse.json({ error: 'Story not found' }, { status: 404 })
    }

    // Verify ownership
    if (stack.ownerId !== user.id) {
      return NextResponse.json({ error: 'Not authorized to download this story' }, { status: 403 })
    }

    // Fetch all story data
    const cards = await storyService.getStoryCards(stackId)

    const allChoices = (await Promise.all(
      cards.map((card) => storyService.getChoices(card.id))
    )).flat()

    const characters = await storyService.getCharacters(stackId)

    if (cards.length === 0) {
      return NextResponse.json(
        { error: 'Cannot export empty story' },
        { status: 400 }
      )
    }

    // Compile the bundle
    const bundle = await serializeStory(stack, cards, allChoices, characters, {
      embedAssets: true,
      compressAssets: true,
      optimizeForSize: true,
      targetFormat: format.includes('wasm') ? 'wasm' : 'json',
    })

    // Generate response based on format
    const filename = stack.slug || stack.name.toLowerCase().replace(/\s+/g, '-')

    if (format === 'json-bundle') {
      const json = JSON.stringify(bundle, null, 2)
      return new NextResponse(json, {
        status: 200,
        headers: {
          'Content-Type': 'application/json',
          'Content-Disposition': `attachment; filename="${filename}.json"`,
        },
      })
    }

    if (format === 'html-bundle') {
      const html = generateHtmlBundle(bundle, filename)
      return new NextResponse(html, {
        status: 200,
        headers: {
          'Content-Type': 'text/html',
          'Content-Disposition': `attachment; filename="${filename}.html"`,
        },
      })
    }

    // Default: WASM binary
    let bytes = bundleToBytes(bundle)
    bytes = await compressData(bytes)

    return new NextResponse(Buffer.from(bytes), {
      status: 200,
      headers: {
        'Content-Type': 'application/wasm',
        'Content-Disposition': `attachment; filename="${filename}.wasm"`,
        'Content-Length': bytes.length.toString(),
      },
    })
  } catch (error) {
    console.error('WASM download error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Download failed' },
      { status: 500 }
    )
  }
}

function generateHtmlBundle(bundle: ReturnType<typeof JSON.parse>, filename: string): string {
  const bundleJson = JSON.stringify(bundle)
  const bundleBase64 = Buffer.from(bundleJson).toString('base64')

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${escapeHtml(bundle.metadata.name)}</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body {
      font-family: system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
      background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%);
      min-height: 100vh;
      color: #e2e8f0;
    }
    #story-player { max-width: 800px; margin: 0 auto; padding: 2rem 1rem; }
    .story-card {
      background: rgba(255, 255, 255, 0.1);
      border-radius: 1rem;
      overflow: hidden;
      box-shadow: 0 4px 20px rgba(0, 0, 0, 0.3);
    }
    .card-image { width: 100%; aspect-ratio: 16/9; object-fit: cover; }
    .card-content { padding: 2rem; }
    .card-title { font-size: 2rem; font-weight: 700; margin-bottom: 1rem; text-align: center; }
    .card-text {
      font-size: 1.125rem; line-height: 1.8; text-align: center;
      color: rgba(226, 232, 240, 0.8); white-space: pre-wrap;
    }
    .choices { margin-top: 2rem; display: flex; flex-direction: column; gap: 0.75rem; }
    .choice-btn {
      padding: 1rem 1.5rem; font-size: 1rem; font-weight: 600;
      border: 2px solid rgba(255, 255, 255, 0.2); border-radius: 0.5rem;
      background: rgba(59, 130, 246, 0.2); color: #e2e8f0;
      cursor: pointer; transition: all 0.2s;
    }
    .choice-btn:hover { background: rgba(59, 130, 246, 0.4); transform: scale(1.02); }
    .choice-btn:active { transform: scale(0.98); }
    .back-btn {
      margin-top: 1.5rem; padding: 0.75rem 1.5rem; font-size: 0.875rem;
      background: transparent; border: 1px solid rgba(255, 255, 255, 0.2);
      border-radius: 0.5rem; color: rgba(226, 232, 240, 0.8); cursor: pointer;
    }
    .back-btn:hover { background: rgba(255, 255, 255, 0.1); }
    .story-end {
      text-align: center; padding: 2rem;
      background: rgba(255, 255, 255, 0.05); border-radius: 0.5rem; margin-top: 2rem;
    }
    .story-end h3 { font-size: 1.5rem; margin-bottom: 0.5rem; }
    .offline-badge {
      position: fixed; top: 1rem; right: 1rem;
      padding: 0.5rem 0.75rem; border-radius: 0.5rem;
      background: rgba(59, 130, 246, 0.2); color: #93c5fd;
      font-size: 0.75rem; font-weight: 500;
    }
  </style>
</head>
<body>
  <div class="offline-badge" data-testid="wasm-offline-badge">Running Offline</div>
  <div id="story-player" data-testid="wasm-story-player"></div>

  <script>
    class StoryPlayer {
      constructor(container, bundle) {
        this.container = container;
        this.bundle = bundle;
        this.currentCardId = null;
        this.history = [];
        this.cards = {};
        this.choices = {};

        bundle.data.cards.forEach(c => this.cards[c.id] = c);
        bundle.data.choices.forEach(c => {
          if (!this.choices[c.cardId]) this.choices[c.cardId] = [];
          this.choices[c.cardId].push(c);
        });

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
              <h1 class="card-title" data-testid="wasm-card-title">\${this.escapeHtml(card.title)}</h1>
              <p class="card-text" data-testid="wasm-card-content">\${this.escapeHtml(card.content)}</p>
              \${cardChoices.length > 0 ? \`
                <div class="choices" data-testid="wasm-choices">
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
          <div style="text-align: center; margin-top: 2rem; font-size: 0.75rem; opacity: 0.5;">
            ${escapeHtml(bundle.metadata.name)}
          </div>
        \`;

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
        return text.replace(/[&<>"']/g, m => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'})[m]);
      }
    }

    const bundleBase64 = "${bundleBase64}";
    const bundle = JSON.parse(atob(bundleBase64));
    window.storyPlayer = new StoryPlayer(document.getElementById('story-player'), bundle);
    window.storyPlayer.start();
  </script>
</body>
</html>`
}

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
}
