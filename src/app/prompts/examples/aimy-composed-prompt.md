# Character Prompt Composition Example: Aimy

This document shows the complete flow of how `/api/ai/compose-prompt` transforms input data into a final image generation prompt.

## Input Data

```json
{
  "characterName": "Aimy",
  "characterAppearance": "Species/Age: Young female Chiss, approximately 35 years old\nFace:\n- V-shaped, very slim face with likeable features\n- Small nose\n- Smaller lips\n- Piercing, glowing red eyes (slightly squinted)\n- Visible marks of tiredness around eyes with slight dark shadows\n- Focused, determined, deeply concentrated expression\n\nSkin:\n- Smooth blue skin with no marks or patterns\n- Subtle olive-toned complexion\n\nHair:\n- Dark, raven-black hair pulled back\n- A few stray strands framing her face\n\nTattoo:\n- Crosshair symbol tattoo coiled around her upper chest\n\nClothing:\n- Black, worn vest with deep décolletage\n- Intricate silver accents on the vest\n\nBuild/Physique:\n- Attractive physique\n\n\nOverall Vibe:\n- Cool and dark aura\n- Mercenary persona\n- Exceptional marksmanship skills implied\n- Touch of subtle vulnerability",
  "pose": {
    "id": "profile-left",
    "label": "Profile Left",
    "description": "Side view facing left",
    "tags": ["profile", "side", "training", "full-body"],
    "icon": "👤",
    "prompt": "Zoomed out wide shot, full-body character illustration from head to feet. Profile view facing left, complete side silhouette visible. Distinct facial profile - nose, chin, forehead contour. Standing straight, arms visible from side. Full figure proportions clear. Simple background emphasizing silhouette."
  },
  "storyArtStyle": "Generate an image in a warm, sepia-toned color palette with a muted, earthy quality, evoking a sense of worn, aged parchment. Employ a rendering technique that blends digital painting with subtle, organic textures, reminiscent of rough, handmade paper or worn leather. Use bold, expressive brushstrokes to define forms, with visible texture and a tactile quality. Lighting is soft and diffused, with deep, dramatic shadows that add depth and atmosphere to the scene. The overall mood is contemplative and melancholic, with a sense of nostalgia and longing. Line work is loose and gestural, with a focus on capturing the essence of the scene rather than precise details. Incorporate subtle gradient transitions and atmospheric effects to enhance the sense of depth and distance. The visual style should evoke a sense of aged, vintage illustration, as if the image has been plucked from a dusty, leather-bound tome. The goal is to create a dreamlike, ethereal quality that invites the viewer to step into a world of faded grandeur and forgotten lore.",
  "maxLength": 1500
}
```

## System Prompt (sent to LLM)

The API uses `CHARACTER_COMPOSE_SYSTEM_PROMPT` from `@/app/prompts/character/system-prompts.ts`:

```
You are an expert at composing rich, detailed image generation prompts for character illustrations.
Your task is to combine multiple prompt elements into a single, coherent, DETAILED prompt for a FULL-BODY character illustration.

CRITICAL LENGTH REQUIREMENT - MUST NOT EXCEED:
- ABSOLUTE MAXIMUM: 1500 characters - NEVER exceed this limit
- Target output: 1275 to 1500 characters
- USE THE FULL SPACE AVAILABLE - longer, more detailed prompts produce better images
- Include ALL provided details, expand with relevant visual descriptors
- DO NOT summarize or shorten - elaborate and enrich instead

COMPOSITION REQUIREMENT:
- Output is for a FULL-BODY character illustration in 2:3 vertical ratio
- Include head-to-toe character details: face, hair, clothing, accessories, footwear
- Describe the full figure stance, posture, and how the character fills the vertical frame
- Include ground/floor context and environmental hints for the bottom of the frame
- IMPORTANT: Do NOT use the word "portrait" - use "illustration" or "character art" instead

PRIORITY ORDER (highest to lowest):
1. CHARACTER APPEARANCE - PRESERVE EXACTLY AND COMPLETELY. Include every visual detail provided.
2. Pose and Expression - Include full descriptions, adapt to complement the character's look
3. Archetype - Include equipment, props, and class-specific visual details
4. Art Style - Apply as rendering technique throughout the description

Rules:
1. Output MUST be between 1275 and 1500 characters - NEVER EXCEED 1500
2. CHARACTER APPEARANCE IS SACRED - include ALL appearance details verbatim
3. Include rich visual details: textures, materials, lighting suggestions, compositional elements
4. Art style affects HOW the character is rendered (linework, colors, shading), not WHAT they look like
5. Be specific, descriptive, and verbose - more detail = better results
6. Output ONLY the prompt text, no explanations or meta-commentary
7. If approaching the limit, prioritize character appearance over archetype details
8. NEVER use the word "portrait" - it triggers close-up face framing
```

## User Prompt (constructed by API)

```
Compose a DETAILED, RICH image generation prompt for a FULL-BODY character illustration.

CRITICAL LENGTH CONSTRAINT: Your output MUST be between 1200-1500 characters. NEVER exceed 1500 characters. Include ALL details provided and expand with relevant visual descriptors. DO NOT summarize - be verbose and descriptive.

Remember: Character appearance details are SACRED and must be preserved completely.

[HIGHEST PRIORITY - PRESERVE COMPLETELY] Character Appearance:
Name: Aimy
Visual details: Species/Age: Young female Chiss, approximately 35 years old
Face:
- V-shaped, very slim face with likeable features
- Small nose
- Smaller lips
- Piercing, glowing red eyes (slightly squinted)
- Visible marks of tiredness around eyes with slight dark shadows
- Focused, determined, deeply concentrated expression

Skin:
- Smooth blue skin with no marks or patterns
- Subtle olive-toned complexion

Hair:
- Dark, raven-black hair pulled back
- A few stray strands framing her face

Tattoo:
- Crosshair symbol tattoo coiled around her upper chest

Clothing:
- Black, worn vest with deep décolletage
- Intricate silver accents on the vest

Build/Physique:
- Attractive physique


Overall Vibe:
- Cool and dark aura
- Mercenary persona
- Exceptional marksmanship skills implied
- Touch of subtle vulnerability

[PRIORITY 2] Pose (Profile Left): Zoomed out wide shot, full-body character illustration from head to feet. Profile view facing left, complete side silhouette visible. Distinct facial profile - nose, chin, forehead contour. Standing straight, arms visible from side. Full figure proportions clear. Simple background emphasizing silhouette.

[RENDERING STYLE - Apply as technique, don't alter character features] Art Style: Generate an image in a warm, sepia-toned color palette with a muted, earthy quality, evoking a sense of worn, aged parchment. Employ a rendering technique that blends digital painting with subtle, organic textures, reminiscent of rough, handmade paper or worn leather. Use bold, expressive brushstrokes to define forms, with visible texture and a tactile quality. Lighting is soft and diffused, with deep, dramatic shadows that add depth and atmosphere to the scene. The overall mood is contemplative and melancholic, with a sense of nostalgia and longing. Line work is loose and gestural, with a focus on capturing the essence of the scene rather than precise details. Incorporate subtle gradient transitions and atmospheric effects to enhance the sense of depth and distance. The visual style should evoke a sense of aged, vintage illustration, as if the image has been plucked from a dusty, leather-bound tome. The goal is to create a dreamlike, ethereal quality that invites the viewer to step into a world of faded grandeur and forgotten lore.
```

## Expected LLM Output (Composed Prompt)

The LLM combines all elements into a single coherent prompt. Example output:

```
Full-body character illustration, 2:3 vertical ratio, rendered in warm sepia-toned palette with muted, earthy quality evoking aged parchment. Bold expressive brushstrokes define forms with visible texture and tactile quality. Soft diffused lighting with deep dramatic shadows adding depth and atmosphere.

Aimy, young female Chiss approximately 35 years old. V-shaped, very slim face with likeable features, small nose, smaller lips. Piercing glowing red eyes slightly squinted, visible marks of tiredness around eyes with slight dark shadows underneath. Focused, determined, deeply concentrated expression. Smooth blue skin with no marks or patterns, subtle olive-toned complexion. Dark raven-black hair pulled back tightly, a few stray strands framing her face.

Crosshair symbol tattoo coiled around her upper chest, partially visible. Black worn vest with deep décolletage revealing the tattoo, intricate silver accents catching diffused light. Attractive athletic physique suggesting deadly capability beneath mercenary exterior.

Profile view facing left, complete side silhouette visible against simple muted background. Standing straight with perfect posture, arms relaxed at sides visible from profile angle. Distinct facial profile showing the sharp contours of nose, chin, forehead. Full figure proportions clear from head to feet, boots planted firmly on ground.

Cool dark aura radiating from her stance. The overall mood contemplative and melancholic, touch of subtle vulnerability beneath the hardened mercenary persona. Rendered with loose gestural linework capturing essence rather than precise details, atmospheric effects enhancing depth. Dreamlike ethereal quality like illustration from dusty leather-bound tome.
```

**Character count: ~1,489 characters**

---

## Fallback Output (if LLM fails)

If the Groq API is unavailable, the fallback prompt builder produces:

```
Full-body character illustration, head to toe, 2:3 vertical ratio. Generate an image in a warm, sepia-toned color palette with a muted, earthy quality, evoking a sense of worn, aged parchment. Employ a rendering technique that blends digital painting with subtle, organic textures, reminiscent of rough, handmade paper or worn leather. Use bold, expressive brushstrokes to define forms, with visible texture and a tactile quality. Lighting is soft and diffused, with deep, dramatic shadows that add depth and atmosphere to the scene. The overall mood is contemplative and melancholic, with a sense of nostalgia and longing. Line work is loose and gestural, with a focus on capturing the essence of the scene rather than precise details. Incorporate subtle gradient transitions and atmospheric effects to enhance the sense of depth and distance. The visual style should evoke a sense of aged, vintage illustration, as if the image has been plucked from a dusty, leather-bound tome. The goal is to create a dreamlike, ethereal quality that invites the viewer to step into a world of faded grandeur and forgotten lore. Character: Aimy. Appearance: Species/Age: Young female Chiss, approximately 35 years old
Face:
- V-shaped, very slim face with likeable features
...
```

The fallback simply concatenates the elements in priority order without LLM enhancement.

---

## API Response

```json
{
  "success": true,
  "prompt": "Full-body character illustration, 2:3 vertical ratio, rendered in warm sepia-toned palette...",
  "truncated": false
}
```

If truncation was needed:
```json
{
  "success": true,
  "prompt": "...(truncated to 1500 chars)...",
  "truncated": true,
  "originalLength": 1623
}
```
