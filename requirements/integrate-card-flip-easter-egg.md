# Integrate CardFlipEasterEgg into Card Interactions

## Component Overview
**File:** `src/app/features/editor/CardFlipEasterEgg.tsx`
**Exports:** `CardFlipEasterEgg`
**Purpose:** Displays delightful easter eggs when cards are flipped, including fun facts, emoji animations, and confetti effects. Creates a playful, engaging experience during card editing.

## Why Integrate
This component adds delightful interaction to the editor experience:

1. **Data Source Ready**: The `@/lib/data/cardEasterEggs.ts` file already exists with 10 pre-defined easter eggs covering facts, illustrations, and animations.
2. **Deterministic Assignment**: `getEasterEggForCard(cardId)` provides consistent easter eggs per card based on ID hash.
3. **Delight Factor**: Adds unexpected joy during the creative process, encouraging exploration.
4. **Self-Contained**: Component handles its own animations and styling.

## Integration Plan

### 1. Pre-Integration Updates
- [ ] Verify `cardEasterEggs.ts` data file is properly typed and exported
- [ ] Check component CSS animations work correctly (confetti-fall keyframe)
- [ ] Consider adding `style jsx` support if not already configured

### 2. Integration Points

**Primary Usage: CardPreview Component**
- File: `src/app/features/editor/story/CardPreview.tsx`
- Location: Wrap card content in flippable container
- Changes needed:
  - Import `CardFlipEasterEgg` and `getEasterEggForCard` from respective files
  - Add 3D flip container with perspective
  - Track flip state (isFlipped)
  - Add double-click or keyboard shortcut to trigger flip
  - Render CardFlipEasterEgg on back face of card
  - Add flip animation CSS (rotateY transform)

**Example Implementation Pattern:**
```tsx
const [isFlipped, setIsFlipped] = useState(false)
const easterEgg = useMemo(() => getEasterEggForCard(card.id), [card.id])

const handleDoubleClick = () => setIsFlipped(prev => !prev)

return (
  <div
    className="flip-container"
    onDoubleClick={handleDoubleClick}
    style={{ perspective: '1000px' }}
  >
    <div className={`flip-card ${isFlipped ? 'flipped' : ''}`}>
      <div className="flip-card-front">
        {/* existing card content */}
      </div>
      <div className="flip-card-back">
        <CardFlipEasterEgg
          easterEgg={easterEgg}
          isFlipped={isFlipped}
          onFlipComplete={() => {/* optional tracking */}}
        />
      </div>
    </div>
  </div>
)
```

**Secondary Usage: CardList Thumbnails**
- File: `src/app/features/editor/story/CardList.tsx`
- Purpose: Add subtle easter egg hints on card thumbnails
- Changes: Optional - could show small indicator if card has been flipped

**Tertiary Usage: StoryPlayer (Published Stories)**
- File: `src/components/player/StoryPlayer.tsx`
- Purpose: Add playful interaction during story reading
- Note: Consider if this fits the player experience - may distract from narrative

### 3. Testing Requirements
- [ ] Verify double-click triggers flip animation
- [ ] Test flip animation smoothness (60fps)
- [ ] Verify easter egg content displays correctly
- [ ] Test confetti animation for animation-type easter eggs
- [ ] Verify flip works on mobile (touch devices)
- [ ] Test keyboard accessibility for flip action
- [ ] Verify easter eggs are deterministic per card ID

### 4. Cleanup Tasks
- [ ] Add CSS keyframes to globals.css if not using styled-jsx
- [ ] Add user preference to disable easter eggs (accessibility)
- [ ] Consider analytics tracking for easter egg discovery

## Success Criteria
- Double-clicking card preview triggers flip animation
- Easter egg content displays on card back
- Animation-type easter eggs show confetti
- Flip is smooth and performant
- Easter eggs are consistent per card (same card = same easter egg)

## Estimated Impact
- **Code Quality:** Low - Small, focused addition
- **User Experience:** Medium - Adds delight but not essential functionality
- **Maintainability:** Low - Self-contained component
- **Performance:** Neutral - Animation only on user action
