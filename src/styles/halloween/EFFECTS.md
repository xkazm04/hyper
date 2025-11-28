# Halloween Effects Catalog

This document catalogs all Halloween-themed visual effects available for components in the Hyper application. Each effect is designed to enhance the spooky atmosphere while maintaining usability and accessibility.

## Table of Contents

1. [Quick Reference](#quick-reference)
2. [Base Effects](#base-effects)
3. [Border Effects](#border-effects)
4. [Background Decorations](#background-decorations)
5. [Connection Line Styles](#connection-line-styles)
6. [Divider Decorations](#divider-decorations)
7. [Node & Card Decorations](#node--card-decorations)
8. [Interactive Effects](#interactive-effects)
9. [Component-Specific Theming](#component-specific-theming)
10. [Accessibility & Configuration](#accessibility--configuration)
11. [Color Palette](#color-palette)

---

## Quick Reference

### Base Effects

| Effect | CSS Class | Applicable Components |
|--------|-----------|----------------------|
| Ghost Float | `halloween-ghost-float` | cards, modals |
| Spider Web Corner | `halloween-spider-web-corner` | cards, sidebars |
| Candle Flicker | `halloween-candle-flicker` | inputs, buttons |
| Bat Silhouette | `halloween-bat-silhouette` | buttons, cards |
| Cauldron Bubble | `halloween-cauldron-bubble` | canvas, graphs |
| Pumpkin Glow | `halloween-pumpkin-glow` | buttons, cards |
| Skeleton Rattle | `halloween-skeleton-rattle` | buttons, cards |
| Fog Overlay | `halloween-fog-overlay` | canvas, sidebars |

### Border Effects

| Effect | CSS Class | Applicable Components |
|--------|-----------|----------------------|
| Dripping Border | `halloween-drip-border` | cards, panels, nodes |
| Ethereal Glow | `halloween-ethereal-glow` | panels, sidebars, modals |
| Spectral Outline | `halloween-spectral-outline` | nodes, cards |
| Candle Flicker Focus | `halloween-candle-flicker-focus` | inputs, textareas |

### Background Decorations

| Effect | CSS Class | Applicable Components |
|--------|-----------|----------------------|
| Fog Layer | `halloween-fog-layer` | canvas, graph containers |
| Dust Particles | `halloween-dust-particles` | canvas containers |
| Cobweb Pattern | `halloween-cobweb` | sidebars, panels |
| Vignette | `halloween-vignette` | main containers, editor layouts |

### Connection Lines

| Effect | CSS Class | Choice Type |
|--------|-----------|-------------|
| Ghostly Default | `halloween-line-default` | default |
| Spectral Green | `halloween-line-positive` | positive |
| Blood Red | `halloween-line-negative` | negative |
| Misty Gray | `halloween-line-neutral` | neutral |
| Particle Flow | `halloween-line-particles` | any (add to line class) |
| Glow Hover | `halloween-line-glow-hover` | any (add to line class) |

### Divider Decorations

| Effect | CSS Class | Applicable Components |
|--------|-----------|----------------------|
| Torn Edge | `halloween-torn-divider` | horizontal dividers |
| Drip Divider | `halloween-drip-divider` | vertical dividers |
| Header Icon (Bat) | `halloween-header-icon-bat` | section headers |
| Header Icon (Spider) | `halloween-header-icon-spider` | section headers |
| Header Icon (Both) | `halloween-header-icon` | section headers |
| Header Icon (Skull) | `halloween-header-icon-skull` | section headers |

### Node & Card Decorations

| Effect | CSS Class | Applicable Components |
|--------|-----------|----------------------|
| Corner Decoration | `halloween-corner-decoration` | story nodes, cards |
| Node Selected | `halloween-node-selected` | selected nodes |
| Crack Hover | `halloween-crack-hover` | story nodes, cards |
| Tombstone Border | `halloween-tombstone-border` | dead-end nodes |
| Portal Border | `halloween-portal-border` | start nodes |

### Interactive Effects

| Effect | CSS Class | Trigger |
|--------|-----------|---------|
| Smoke Wisp | `halloween-smoke-wisp` | hover |
| Spectral Ripple | `halloween-spectral-ripple` | click/active |
| Ember Focus | `halloween-ember-focus` | focus |
| Ghost Trail | `halloween-ghost-trail` | drag |

### Component-Specific

| Component | CSS Classes |
|-----------|-------------|
| OutlineSidebar | `halloween-tree-sidebar`, `halloween-branch-divider`, `halloween-tree-header`, `halloween-tree-item` |
| PromptComposer | `halloween-cauldron-container`, `halloween-bubbling-border` |
| StoryCardEditor | `halloween-spellbook-page`, `halloween-aged-edges` |
| CommandPalette | `halloween-crystal-glow`, `halloween-orb-container` |
| ScriptQualityAssistant | `halloween-potion-metrics`, `halloween-potion-bottle`, `halloween-potion-bubbles`, `halloween-potion-score` |

---

## Base Effects

### 1. Ghost Float

**CSS Class:** `halloween-ghost-float`

**Description:** A subtle floating animation with transparency pulse that gives elements an ethereal, ghostly appearance.

**Applicable Components:** cards, modals

**Usage Example:**
```tsx
<div className="halloween-ghost-float bg-card p-4 rounded-lg">
  <h3>Spooky Card</h3>
  <p>This card floats like a ghost!</p>
</div>
```

**Animation Details:**
- Duration: 4 seconds
- Easing: ease-in-out
- Movement: 8px vertical float
- Opacity: pulses between 85% and 100%

**Reduced Motion:** Static with 95% opacity

---

### 2. Spider Web Corner

**CSS Class:** `halloween-spider-web-corner`

**Description:** A decorative web pattern that appears in the top-right corner of the element, created using CSS gradients and pseudo-elements.

**Applicable Components:** cards, sidebars

**Usage Example:**
```tsx
<aside className="halloween-spider-web-corner bg-card p-4">
  <nav>Sidebar navigation with web decoration</nav>
</aside>
```

**Visual Details:**
- Size: 80px × 80px corner decoration
- Pattern: Intersecting diagonal lines
- Color: Purple (270° hue) at 20% opacity
- Position: Top-right corner

**Reduced Motion:** Static decoration at 40% opacity

---

### 3. Candle Flicker

**CSS Class:** `halloween-candle-flicker`

**Description:** A flickering glow effect on borders that simulates candlelight, perfect for interactive elements.

**Applicable Components:** inputs, buttons

**Usage Example:**
```tsx
<button className="halloween-candle-flicker px-4 py-2 rounded">
  Cast Spell
</button>
```

**Animation Details:**
- Duration: 2 seconds
- Easing: ease-in-out
- Effect: Box-shadow intensity varies
- Color: Purple glow (270° hue)

**Reduced Motion:** Static glow at 30% intensity

---

### 4. Bat Silhouette

**CSS Class:** `halloween-bat-silhouette`

**Description:** A small bat emoji decoration that appears in the top-right corner with a subtle wobble animation.

**Applicable Components:** buttons, cards

**Usage Example:**
```tsx
<button className="halloween-bat-silhouette relative px-4 py-2">
  Night Mode 🦇
</button>
```

**Animation Details:**
- Duration: 3 seconds
- Movement: Slight rotation and vertical bob
- Position: Top-right corner (-8px offset)
- Opacity: 70%

**Reduced Motion:** Static bat at -15° rotation

---

### 5. Cauldron Bubble

**CSS Class:** `halloween-cauldron-bubble`

**Description:** Rising bubble animation that creates the effect of a bubbling cauldron, using pseudo-elements for the bubbles.

**Applicable Components:** canvas, graphs

**Usage Example:**
```tsx
<div className="halloween-cauldron-bubble relative h-64 bg-card">
  <canvas>Graph visualization with bubbling effect</canvas>
</div>
```

**Animation Details:**
- Duration: 4 seconds
- Movement: 40px vertical rise
- Bubbles: Two sizes (8px and 6px)
- Stagger: 2 second delay between bubbles

**Reduced Motion:** Static bubbles at 30% opacity

---

### 6. Pumpkin Glow

**CSS Class:** `halloween-pumpkin-glow`

**Description:** An orange inner glow that pulses like a jack-o'-lantern, adding warmth to the purple theme.

**Applicable Components:** buttons, cards

**Usage Example:**
```tsx
<div className="halloween-pumpkin-glow bg-card p-6 rounded-lg">
  <h2>🎃 Featured Content</h2>
</div>
```

**Animation Details:**
- Duration: 3 seconds
- Effect: Inner and outer box-shadow
- Color: Orange (30° hue)
- Intensity: Pulses between 15% and 25%

**Reduced Motion:** Static glow at 20% intensity

---

### 7. Skeleton Rattle

**CSS Class:** `halloween-skeleton-rattle`

**Description:** A subtle shake animation triggered on hover, simulating rattling bones.

**Applicable Components:** buttons, cards

**Usage Example:**
```tsx
<button className="halloween-skeleton-rattle px-4 py-2">
  ☠️ Danger Zone
</button>
```

**Animation Details:**
- Duration: 0.6 seconds
- Trigger: Hover only
- Movement: 2px horizontal shake with rotation
- Easing: ease-in-out

**Reduced Motion:** No animation on hover

---

### 8. Fog Overlay

**CSS Class:** `halloween-fog-overlay`

**Description:** A drifting fog effect that adds atmospheric depth to large containers.

**Applicable Components:** canvas, sidebars

**Usage Example:**
```tsx
<main className="halloween-fog-overlay min-h-screen">
  <div className="relative z-10">
    Content appears above the fog
  </div>
</main>
```

**Animation Details:**
- Duration: 15 seconds
- Movement: 20px horizontal drift
- Opacity: Varies between 40% and 60%
- Gradient: Bottom-heavy fog accumulation

**Reduced Motion:** Static gradient overlay

---

## Border Effects

### 1. Dripping Border

**CSS Class:** `halloween-drip-border`

**Description:** A subtle dripping effect on the bottom edge of elements using CSS clip-path animation.

**Applicable Components:** cards, panels, nodes

**Usage Example:**
```tsx
<div className="halloween-drip-border bg-card p-4 rounded-lg">
  <p>Card with dripping border effect</p>
</div>
```

**Animation Details:**
- Duration: 4 seconds
- Effect: Animated clip-path creating drip shapes
- Color: Purple gradient (270° hue)
- Position: Bottom edge, 6px below element

**Reduced Motion:** Static drip pattern

---

### 2. Ethereal Glow

**CSS Class:** `halloween-ethereal-glow`

**Description:** An animated purple glow effect with varying intensity, perfect for panels and sidebars.

**Applicable Components:** panels, sidebars, modals

**Usage Example:**
```tsx
<aside className="halloween-ethereal-glow bg-card p-4">
  <nav>Sidebar with ethereal glow</nav>
</aside>
```

**Animation Details:**
- Duration: 3 seconds
- Effect: Pulsing box-shadow with inner glow
- Color: Purple (270° hue) at varying opacity
- Layers: Multiple shadow layers for depth

**Reduced Motion:** Static glow at medium intensity

---

### 3. Spectral Outline

**CSS Class:** `halloween-spectral-outline`

**Description:** An animated outline effect with pulsing glow, ideal for highlighting selected elements.

**Applicable Components:** nodes, cards

**Usage Example:**
```tsx
<div className="halloween-spectral-outline bg-card p-4">
  <p>Selected element with spectral outline</p>
</div>
```

**Animation Details:**
- Duration: 2 seconds
- Effect: Animated outline-offset and box-shadow
- Color: Purple (270° hue)
- Offset: Pulses between 2px and 4px

**Reduced Motion:** Static outline with glow

---

### 4. Candle Flicker Focus

**CSS Class:** `halloween-candle-flicker-focus`

**Description:** A flickering glow effect specifically for input fields on focus, simulating candlelight.

**Applicable Components:** inputs, textareas

**Usage Example:**
```tsx
<input 
  className="halloween-candle-flicker-focus border rounded px-3 py-2"
  placeholder="Type here..."
/>
```

**Animation Details:**
- Duration: 2 seconds
- Trigger: Focus state
- Effect: Flickering box-shadow with orange accent
- Colors: Purple primary, orange accent

**Reduced Motion:** Static glow on focus

---

## Background Decorations

### 1. Fog Layer

**CSS Class:** `halloween-fog-layer`

**Description:** A drifting fog effect for canvas backgrounds using animated gradients.

**Applicable Components:** canvas, graph containers (StoryGraph)

**Usage Example:**
```tsx
<div className="halloween-fog-layer relative h-full">
  <canvas>Graph content</canvas>
</div>
```

**Animation Details:**
- Duration: 20 seconds
- Movement: Horizontal and vertical drift
- Opacity: Varies between 40% and 60%
- Layers: Multiple gradient layers

**Reduced Motion:** Static fog at 50% opacity

---

### 2. Dust Particles

**CSS Class:** `halloween-dust-particles`

**Description:** Floating dust particles created with radial gradients and animated positions.

**Applicable Components:** canvas containers (InfiniteCanvas)

**Usage Example:**
```tsx
<div className="halloween-dust-particles relative h-full">
  <div>Canvas content</div>
</div>
```

**Animation Details:**
- Duration: 30 seconds
- Effect: Multiple particles with varying positions
- Color: Light purple (270° hue)
- Opacity: 60% overall

**Reduced Motion:** Static particles at 40% opacity

---

### 3. Cobweb Pattern

**CSS Class:** `halloween-cobweb`

**Description:** Subtle cobweb pattern overlay in corners using CSS gradients and masks.

**Applicable Components:** sidebars, panels (OutlineSidebar)

**Usage Example:**
```tsx
<aside className="halloween-cobweb bg-card">
  <nav>Sidebar with cobweb corners</nav>
</aside>
```

**Visual Details:**
- Top-left corner: 120px × 120px web pattern
- Bottom-right corner: 80px × 80px web pattern
- Pattern: Radial gradient lines
- Opacity: 50% (top-left), 40% (bottom-right)

**Reduced Motion:** Static (no animation by design)

---

### 4. Vignette

**CSS Class:** `halloween-vignette`

**Description:** Edge darkening effect using radial gradient to create atmospheric depth.

**Applicable Components:** main containers, editor layouts

**Usage Example:**
```tsx
<main className="halloween-vignette min-h-screen">
  <div>Editor content</div>
</main>
```

**Visual Details:**
- Effect: Radial gradient from transparent center to dark edges
- Color: Dark purple (270° hue)
- Intensity: 15% at 70%, 35% at edges

**Reduced Motion:** Static (no animation by design)

---

## Connection Line Styles

### Line Types by Choice

**Default (Purple):** `halloween-line-default`
```tsx
<path className="halloween-connection-line halloween-line-default" />
```

**Positive (Green):** `halloween-line-positive`
```tsx
<path className="halloween-connection-line halloween-line-positive" />
```

**Negative (Red):** `halloween-line-negative`
```tsx
<path className="halloween-connection-line halloween-line-negative" />
```

**Neutral (Gray):** `halloween-line-neutral`
```tsx
<path className="halloween-connection-line halloween-line-neutral" />
```

### Additional Line Effects

**Particle Flow:** Add `halloween-line-particles` for animated particles along the line.
```tsx
<path className="halloween-connection-line halloween-line-default halloween-line-particles" />
```

**Hover Glow:** Add `halloween-line-glow-hover` for enhanced glow on hover.
```tsx
<path className="halloween-connection-line halloween-line-default halloween-line-glow-hover" />
```

### SVG Gradient Definitions

Include these gradient definitions in your SVG for proper line rendering:

```tsx
<defs>
  <linearGradient id="halloween-gradient-default" x1="0%" y1="0%" x2="100%" y2="0%">
    <stop offset="0%" className="halloween-gradient-stop-default-start" />
    <stop offset="100%" className="halloween-gradient-stop-default-end" />
  </linearGradient>
  {/* Similar for positive, negative, neutral */}
</defs>
```

---

## Divider Decorations

### 1. Torn Edge Divider

**CSS Class:** `halloween-torn-divider`

**Description:** Horizontal divider with jagged torn-edge pattern using clip-path.

**Usage Example:**
```tsx
<hr className="halloween-torn-divider" />
```

**Visual Details:**
- Height: 8px total (4px top, 4px bottom pattern)
- Pattern: Jagged clip-path polygon
- Color: Purple gradient

---

### 2. Drip Divider

**CSS Class:** `halloween-drip-divider`

**Description:** Vertical divider with animated dripping effect.

**Usage Example:**
```tsx
<div className="halloween-drip-divider h-full" />
```

**Animation Details:**
- Duration: 4 seconds
- Effect: Animated clip-path drips
- Width: 8px total

**Reduced Motion:** Static drip pattern

---

### 3. Header Icons

**Bat Icon:** `halloween-header-icon-bat`
```tsx
<h2 className="halloween-header-icon-bat">Section Title</h2>
```

**Spider Icon:** `halloween-header-icon-spider`
```tsx
<h2 className="halloween-header-icon-spider">Section Title</h2>
```

**Both Icons:** `halloween-header-icon`
```tsx
<h2 className="halloween-header-icon">Section Title</h2>
```

**Skull Icon:** `halloween-header-icon-skull`
```tsx
<h2 className="halloween-header-icon-skull">Section Title</h2>
```

**Animation Details:**
- Duration: 3 seconds
- Effect: Subtle float animation
- Position: Left/right of header text

**Reduced Motion:** Static icons

---

## Node & Card Decorations

### 1. Corner Decoration

**CSS Class:** `halloween-corner-decoration`

**Description:** Pulsing corner decorations for story nodes using gradient pseudo-elements.

**Usage Example:**
```tsx
<div className="halloween-corner-decoration bg-card p-4 rounded">
  <p>Node with corner decorations</p>
</div>
```

**Animation Details:**
- Duration: 3 seconds
- Effect: Pulsing opacity and scale
- Positions: Top-left and bottom-right corners

**Reduced Motion:** Static corners at 70% opacity

---

### 2. Node Selected

**CSS Class:** `halloween-node-selected`

**Description:** Animated spectral outline for selected nodes with pulsing glow.

**Usage Example:**
```tsx
<div className={cn("bg-card", isSelected && "halloween-node-selected")}>
  <p>Selected node</p>
</div>
```

**Animation Details:**
- Duration: 2 seconds
- Effect: Pulsing box-shadow and outline-offset
- Color: Purple (270° hue)

**Reduced Motion:** Static glow

---

### 3. Crack Hover

**CSS Class:** `halloween-crack-hover`

**Description:** Crack pattern revealed on hover using gradient backgrounds.

**Usage Example:**
```tsx
<div className="halloween-crack-hover bg-card p-4">
  <p>Hover to reveal cracks</p>
</div>
```

**Animation Details:**
- Trigger: Hover
- Effect: Fade-in crack pattern
- Duration: 0.3s transition

---

### 4. Tombstone Border

**CSS Class:** `halloween-tombstone-border`

**Description:** Tombstone-inspired border styling for dead-end nodes.

**Usage Example:**
```tsx
<div className={cn("bg-card", isDeadEnd && "halloween-tombstone-border")}>
  <p>Dead-end node</p>
</div>
```

**Visual Details:**
- Border-radius: Rounded top (tombstone shape)
- Includes cross symbol (†) overlay
- Dark gradient background

---

### 5. Portal Border

**CSS Class:** `halloween-portal-border`

**Description:** Animated portal glow effect for start nodes.

**Usage Example:**
```tsx
<div className={cn("bg-card", isFirst && "halloween-portal-border")}>
  <p>Start node</p>
</div>
```

**Animation Details:**
- Duration: 3 seconds (glow), 8 seconds (ring rotation)
- Effect: Multi-color pulsing glow with rotating dashed border
- Colors: Purple spectrum (270°-290° hue)

**Reduced Motion:** Static glow

---

## Interactive Effects

### 1. Smoke Wisp

**CSS Class:** `halloween-smoke-wisp`

**Description:** Subtle smoke effect rising from buttons on hover.

**Usage Example:**
```tsx
<button className="halloween-smoke-wisp px-4 py-2">
  Hover me
</button>
```

**Animation Details:**
- Duration: 0.6 seconds
- Trigger: Hover
- Effect: Rising smoke wisps using pseudo-elements

**Reduced Motion:** Subtle box-shadow on hover

---

### 2. Spectral Ripple

**CSS Class:** `halloween-spectral-ripple`

**Description:** Ripple animation on button click.

**Usage Example:**
```tsx
<button className="halloween-spectral-ripple px-4 py-2">
  Click me
</button>
```

**Animation Details:**
- Duration: 0.4 seconds
- Trigger: Active/click
- Effect: Expanding ripple from center

**Reduced Motion:** Background color change on active

---

### 3. Ember Focus

**CSS Class:** `halloween-ember-focus`

**Description:** Ember particle animation around input fields on focus.

**Usage Example:**
```tsx
<input className="halloween-ember-focus border rounded px-3 py-2" />
```

**Animation Details:**
- Duration: 2 seconds
- Trigger: Focus
- Effect: Floating ember particles with glow
- Colors: Orange embers, purple glow

**Reduced Motion:** Static glow on focus

---

### 4. Ghost Trail

**CSS Class:** `halloween-ghost-trail`

**Description:** Ghostly trail effect for dragged nodes.

**Usage Example:**
```tsx
<div className={cn("halloween-ghost-trail", isDragging && "dragging")}>
  <p>Draggable node</p>
</div>
```

**Animation Details:**
- Duration: 0.3 seconds
- Trigger: Drag state (`.dragging` or `data-dragging="true"`)
- Effect: Fading ghost trail behind element

**Reduced Motion:** Static subtle effect

---

## Component-Specific Theming

### OutlineSidebar - Haunted Tree

**Classes:**
- `halloween-tree-sidebar` - Main container with tree trunk pattern
- `halloween-branch-divider` - Branch-like horizontal dividers
- `halloween-tree-header` - Header with tree icon
- `halloween-tree-item` - Tree items with branch connections

**Usage Example:**
```tsx
<aside className="halloween-tree-sidebar">
  <h3 className="halloween-tree-header">Outline</h3>
  <hr className="halloween-branch-divider" />
  <div className="halloween-tree-item">Item 1</div>
  <div className="halloween-tree-item">Item 2</div>
</aside>
```

---

### PromptComposer - Cauldron

**Classes:**
- `halloween-cauldron-container` - Cauldron-shaped container with rim
- `halloween-bubbling-border` - Bubbling effect inside container

**Usage Example:**
```tsx
<div className="halloween-cauldron-container">
  <div className="halloween-bubbling-border p-4">
    <textarea>Compose your prompt...</textarea>
  </div>
</div>
```

**Animation Details:**
- Cauldron simmer: 4 seconds
- Bubble rise: 3 seconds

**Reduced Motion:** Static effects

---

### StoryCardEditor - Spell Book

**Classes:**
- `halloween-spellbook-page` - Parchment-like background with binding
- `halloween-aged-edges` - Additional worn edge effect

**Usage Example:**
```tsx
<div className="halloween-spellbook-page halloween-aged-edges p-4">
  <div contentEditable>Write your story...</div>
</div>
```

**Visual Details:**
- Parchment background gradient
- Left-side binding with stitch marks
- Aged edge shadows

---

### CommandPalette - Crystal Ball

**Classes:**
- `halloween-crystal-glow` - Outer container with orb glow
- `halloween-orb-container` - Inner container with mist effect

**Usage Example:**
```tsx
<div className="halloween-crystal-glow">
  <div className="halloween-orb-container p-4">
    <input placeholder="Search commands..." />
  </div>
</div>
```

**Animation Details:**
- Crystal pulse: 4 seconds
- Mist movement: 6 seconds

**Reduced Motion:** Static glow

---

### ScriptQualityAssistant - Potion Bottles

**Classes:**
- `halloween-potion-metrics` - Container for metric bottles
- `halloween-potion-bottle` - Individual bottle shape
- `halloween-potion-bottle--green` - Green potion variant
- `halloween-potion-bottle--red` - Red potion variant
- `halloween-potion-bottle--orange` - Orange potion variant
- `halloween-potion-bottle--blue` - Blue potion variant
- `halloween-potion-bubbles` - Bubbles inside bottle
- `halloween-potion-score` - Score text styling

**Usage Example:**
```tsx
<div className="halloween-potion-metrics">
  <div className="halloween-potion-bottle halloween-potion-bottle--green">
    <div className="halloween-potion-bubbles">
      <span className="halloween-potion-score">85</span>
    </div>
  </div>
</div>
```

**Animation Details:**
- Potion glow: 3 seconds
- Bubble float: 2 seconds

**Reduced Motion:** Static effects

---

## Accessibility & Configuration

### Decoration Toggle

**CSS Custom Property:** `--halloween-decorations-enabled`

Set to `0` to disable decorations while keeping theme colors:
```css
:root {
  --halloween-decorations-enabled: 0;
}
```

**Disable Class:** `halloween-no-decorations`

Add to any element to disable decorations within:
```tsx
<div className="halloween halloween-no-decorations">
  {/* Decorations disabled here */}
</div>
```

### Reduced Motion Support

All effects include `prefers-reduced-motion` media query support:

```css
@media (prefers-reduced-motion: reduce) {
  .halloween .halloween-* {
    animation: none !important;
  }
}
```

Effects are designed to:
- Not interfere with content readability
- Maintain sufficient color contrast
- Provide static fallbacks for motion-sensitive users
- Use the established 270° purple hue palette

### Performance Optimizations

All animations use GPU-accelerated properties:
- `transform`
- `opacity`
- `filter`

Overlays use:
- `position: absolute` or `position: fixed`
- `pointer-events: none`
- `will-change: auto` (set dynamically)

---

## Color Palette

| Color | HSL Value | Usage |
|-------|-----------|-------|
| Primary Purple | `hsl(270 70% 60%)` | Main effect color |
| Border Purple | `hsl(270 40% 35%)` | Subtle decorations |
| Dark Purple | `hsl(270 30% 15%)` | Backgrounds, shadows |
| Pumpkin Orange | `hsl(30 90% 50%)` | Accent glow, embers |
| Spectral Green | `hsl(142 65% 50%)` | Positive connections |
| Blood Red | `hsl(0 70% 55%)` | Negative connections |
| Misty Gray | `hsl(270 10% 60%)` | Neutral connections |
| Muted Purple | `hsl(270 20% 10%)` | Fog/overlay |

---

## File Structure

```
src/styles/halloween/
├── EFFECTS.md              # This documentation
├── effects.css             # Base effects catalog
├── borders.css             # Border effect styles
├── backgrounds.css         # Background decoration styles
├── lines.css               # Connection line styles
├── dividers.css            # Divider decoration styles
├── nodes.css               # Node & card decoration styles
├── interactive.css         # Interactive effect styles
├── components.css          # Component-specific theming
├── accessibility.css       # Toggle & performance config
└── decorations.css         # Barrel file (imports all)
```
