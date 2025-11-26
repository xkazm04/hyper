/**
 * Art Style Prompts
 * 
 * These styles influence ALL other prompt sections (setting, mood, character)
 * to achieve consistent, high-quality results across the entire generation.
 * 
 * Each style includes:
 * - Full prompt text for image generation
 * - Color palette guidance
 * - Rendering techniques for LLM enrichment
 * - Visual features
 */

import { ArtStyle } from './types';

export const ART_STYLES: ArtStyle[] = [
  {
    id: 'cartoon_invincible',
    label: 'Invincible Cartoon',
    description: 'Amazon series animation style with bold lines and comic shading',
    tags: ['cartoon', 'animated', 'comic', 'bold'],
    icon: '💪',
    stylePrompt: `A full-body still frame in the distinct animation style of the "Invincible" Amazon series. The coloring is flat but vibrant, with heavy, clean black outlines and dramatic comic-book shading. The background is a painted, slightly blurred environment typical of the show's background art. The overall mood is gritty, tense, and action-ready.`,
    colorPalette: 'Flat vibrant colors with deep blacks and bold contrasts, strong primary colors',
    renderingTechnique: 'Flat cel-shaded coloring, heavy clean black outlines, dramatic shadows, painted backgrounds',
    visualFeatures: 'animation style, flat coloring, vibrant, heavy black outlines, comic-book shading, painted background',
    examples: ['Invincible', 'Young Justice'],
  },
  {
    id: 'arcane',
    label: 'Arcane',
    description: 'Richly painted with brushwork, rim lights, and atmospheric depth',
    tags: ['painted', 'atmospheric', 'cinematic', 'arcane'],
    icon: '🔮',
    stylePrompt: `A richly painted, Arcane-inspired full-body portrait rendered with layered brushwork, painterly textures, and atmospheric lighting. Gorgeously lit with Arcane-style rim lights, deep tonal contrast. The mood is dark and cinematic, with expressive strokes, swirling colors. The background is atmospheric, softly blurred, evoking gritty ambiance.`,
    colorPalette: 'Dark cinematic tones with glowing rim highlights, deep shadows, rich saturated accents, neon pinks and teals',
    renderingTechnique: 'Layered painterly brushwork, textured surfaces, atmospheric rim lighting, deep tonal contrast',
    visualFeatures: 'painterly, layered brushwork, rim lights, atmospheric lighting, cinematic, expressive strokes',
    examples: ['Arcane', 'League of Legends'],
  },
  {
    id: 'star_wars_comic',
    label: 'Star Wars Comic',
    description: 'Classic comic illustration with crosshatching and watercolor touches',
    tags: ['comic', 'vintage', 'illustration', 'ink'],
    icon: '🌟',
    stylePrompt: `A classic Star Wars comic book illustration, hand-drawn with rich colored inks. Traditional comic book crosshatching and bold linework with watercolor-style coloring. Subtle ink shading techniques. Background rendered in muted galactic hues with halftone dot textures, reminiscent of vintage Marvel Star Wars comics. Visible pen strokes, dramatic shadows. Hand-lettered aesthetic, slightly worn paper texture, authentic Bronze Age comic book feel.`,
    colorPalette: 'Muted galactic hues with metallic ink highlights, vintage desaturated tones, worn paper feel',
    renderingTechnique: 'Traditional crosshatching, bold ink linework, watercolor-style coloring, halftone dot textures',
    visualFeatures: 'hand-drawn, colored inks, crosshatching, bold linework, watercolor, halftone dots, vintage',
    examples: ['Marvel Star Wars Comics', 'Bronze Age comics'],
  },
  {
    id: 'cyberpunk_comic',
    label: 'Cyberpunk Comic',
    description: 'Grimy graphic novel with neon reflections and ink splatter',
    tags: ['cyberpunk', 'neon', 'gritty', 'graphic-novel'],
    icon: '🌆',
    stylePrompt: `A grimy, full-body graphic novel illustration in the style of Cyberpunk 2077 concept art. Rendered with mixed media ink and colored pencil, reflecting pink and blue neon signs. The art style is aggressive, with heavy ink splatter, chromatic aberration effects, and textured brushwork. The background is chaotic, detailed with rain-slicked surfaces and brutalist architecture.`,
    colorPalette: 'Neon pinks, electric blues, deep blacks, rain-reflective surfaces',
    renderingTechnique: 'Mixed media ink and colored pencil, ink splatter, chromatic aberration effects, textured brushwork',
    visualFeatures: 'graphic novel, mixed media, ink splatter, chromatic aberration, neon reflections, textured brushwork',
    examples: ['Cyberpunk 2077', 'Blade Runner'],
  },
  {
    id: 'witcher_book',
    label: 'Witcher Bestiary',
    description: 'Somber black and white ink with intricate crosshatching',
    tags: ['ink', 'monochrome', 'bestiary', 'fantasy'],
    icon: '📖',
    stylePrompt: `A somber, full-body black and white ink illustration in the style of a classic Witcher bestiary entry. Rendered using intricate cross-hatching and dot work to create texture and shadow. Dark aura conveyed through heavy blacks. Intense white irises against dark shaded sockets. Background is desolate, sketchy with ancient ruins on textured parchment paper.`,
    colorPalette: 'Pure black and white, parchment yellows for paper texture, no color',
    renderingTechnique: 'Intricate cross-hatching, dot work stippling, heavy blacks for shadow, parchment paper texture',
    visualFeatures: 'black and white, ink illustration, cross-hatching, dot work, parchment, bestiary',
    examples: ['The Witcher', 'Medieval bestiaries'],
  },
  {
    id: 'dispatch',
    label: 'Dispatch Tactical',
    description: 'Clean tactical cartoon with cel-shading and geometric backgrounds',
    tags: ['tactical', 'cartoon', 'clean', 'stylized'],
    icon: '🎯',
    stylePrompt: `A stylized full-body character portrait in the clean, tactical cartoon style of the "Dispatch" video game. Thick, clean outlines and smooth, cel-shaded coloring. Proportions slightly stylized but serious. Highly detailed stylized gear with pouches and equipment. Background is clean, abstract tactical map interface with muted colors and geometric shapes.`,
    colorPalette: 'Muted tactical colors, clean flat tones, geometric accent shapes',
    renderingTechnique: 'Thick clean outlines, smooth cel-shading, stylized proportions, geometric abstract backgrounds',
    visualFeatures: 'clean outlines, cel-shaded, tactical, stylized proportions, geometric, abstract backgrounds',
    examples: ['Dispatch', 'Valorant'],
  },
  {
    id: 'warhammer_rogue_trader',
    label: 'Warhammer Grimdark',
    description: 'Baroque digital painting with heavy chiaroscuro and gothic detail',
    tags: ['grimdark', 'baroque', 'gothic', 'warhammer'],
    icon: '💀',
    stylePrompt: `A full-body character portrait in the grimdark, baroque digital painting style of "Warhammer 40,000: Rogue Trader" CRPG. Oppressive dark aura, rendered with heavy brushwork and deep, dramatic chiaroscuro lighting that emphasizes texture. Warm glow of gothic candelabras. Richly detailed decaying interior with gothic arches, wiring, and dark machinery.`,
    colorPalette: 'Oppressive darks with warm candlelight glows, brass and gold accents, decayed muted tones',
    renderingTechnique: 'Heavy digital brushwork, dramatic chiaroscuro lighting, texture emphasis, gothic ornate detailing',
    visualFeatures: 'grimdark, baroque, heavy brushwork, chiaroscuro, gothic, decaying, oppressive',
    examples: ['Warhammer 40K: Rogue Trader', 'Darkest Dungeon'],
  },
  {
    id: 'adventure_journal',
    label: 'Adventure Journal',
    description: 'Hand-drawn pencil-and-ink sketchbook aesthetic',
    tags: ['sketch', 'pencil', 'journal', 'handmade'],
    icon: '📔',
    stylePrompt: `Masterful pencil-and-ink sketch with expressive hand-drawn imperfection. Thin deliberate linework, soft cross-hatching, subtle blended shading. Light muted color accents like worn colored pencils on monochrome sketchbook aesthetic. Lightly textured paper, visible strokes, organic imperfections. Adventure-book illustration feel, artistic and authentically handcrafted.`,
    colorPalette: 'Monochrome base with muted colored pencil accents, paper grain visible',
    renderingTechnique: 'Thin deliberate linework, soft cross-hatching, blended pencil shading, visible paper texture',
    visualFeatures: 'pencil-and-ink, hand-drawn, cross-hatching, sketchbook, textured paper, organic imperfections',
    examples: ['Field journals', 'Explorer sketchbooks'],
  },
  {
    id: 'expedition_sketch',
    label: 'Expedition Sketch',
    description: 'Field journal style on weathered parchment',
    tags: ['vintage', 'parchment', 'explorer', 'aged'],
    icon: '🗺️',
    stylePrompt: `Expedition-style sketch blending fine ink contours with rough textured pencil shading. Weathered parchment feel with gentle smudges, uneven line pressure, faint paper grain. Soft desaturated color touches like old field journal pencils. Predominantly monochrome, expressive detail, lived-in adventure sense. Timeless and authentically analog artifact.`,
    colorPalette: 'Desaturated earth tones, parchment browns, faded ink blacks, aged paper yellow',
    renderingTechnique: 'Fine ink contours, rough textured pencil shading, uneven line pressure, parchment texture',
    visualFeatures: 'weathered parchment, smudges, faint paper grain, desaturated, field journal, analog artifact',
    examples: ['Victorian expedition logs', 'Darwin journals'],
  },
  {
    id: 'artisan_illustration',
    label: 'Artisan Illustration',
    description: 'Master illustrator sketchbook with elegant detail',
    tags: ['elegant', 'detailed', 'artistic', 'refined'],
    icon: '✒️',
    stylePrompt: `Elegantly detailed artisan sketch merging delicate pencil gradients with confident ink strokes. Master illustrator sketchbook style: layered cross-hatching, nuanced shading, faint hand-brushed color accents. Subtle grainy paper texture with visible stroke direction. Rich, expressive, deliberately imperfect traditional pencil-and-ink artistry.`,
    colorPalette: 'Rich graphite grays, warm paper cream, subtle watercolor accents, ink blacks',
    renderingTechnique: 'Delicate pencil gradients, confident ink strokes, layered cross-hatching, hand-brushed color accents',
    visualFeatures: 'elegant detail, pencil gradients, confident ink, master illustrator, grainy paper, traditional artistry',
    examples: ['Golden Age illustration', 'Art nouveau'],
  },
];

/**
 * LLM guidance for propagating art style to other prompt sections
 */
export const LLM_ARTSTYLE_GUIDANCE = `IMPORTANT: Art Style Integration

When enriching user prompts, maintain visual coherence with the active art style:

1. SETTING descriptions should:
   - Use visual language compatible with the style's rendering technique
   - Reference lighting conditions that match the style's palette
   - Include textures and surfaces that render well in this style

2. MOOD descriptions should:
   - Use colors and lighting from the style's palette
   - Reference atmosphere effects that complement the style
   - Maintain emotional tone appropriate to the visual aesthetic

3. CHARACTER descriptions should:
   - Use proportions and details that match the style's conventions
   - Reference materials and textures the style handles well
   - Include appropriate level of detail for the style`;

/**
 * Get an art style by its ID
 */
export function getArtStyleById(id: string): ArtStyle | undefined {
  return ART_STYLES.find(style => style.id === id);
}

/**
 * Get the default art style
 */
export function getDefaultArtStyle(): ArtStyle {
  return ART_STYLES.find(style => style.id === 'adventure_journal') || ART_STYLES[0];
}

/**
 * Get style keywords for enriching other prompt sections
 */
export function getStyleKeywords(styleId: string): string[] {
  const style = getArtStyleById(styleId);
  if (!style) return [];
  return style.visualFeatures.split(', ');
}
