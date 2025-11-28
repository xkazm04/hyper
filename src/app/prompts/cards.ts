/**
 * Card Prompt Data
 * Prompt options for story card image generation
 * Settings and moods that work with any art style
 */

import { PromptOption, PromptColumn, PromptDimension } from './types';
import { ART_STYLES, getArtStyleById, LLM_ARTSTYLE_GUIDANCE } from './artstyles';

export type CardDimension = PromptDimension;

export const PROMPT_COLUMNS: PromptColumn[] = [
  {
    id: 'style',
    label: 'Art Style',
    icon: '🎨',
    description: 'Visual rendering style',
  },
  {
    id: 'setting',
    label: 'Setting',
    icon: '🏔️',
    description: 'Location and environment',
  },
  {
    id: 'mood',
    label: 'Mood',
    icon: '✨',
    description: 'Atmosphere and tone',
  },
];

// Legacy style options converted from art styles
export const STYLE_OPTIONS: PromptOption[] = ART_STYLES.map(artStyle => ({
  id: artStyle.id,
  label: artStyle.label,
  description: artStyle.description,
  tags: artStyle.tags,
  icon: artStyle.icon,
  prompt: artStyle.stylePrompt,
}));

export const SETTING_OPTIONS: PromptOption[] = [
  {
    id: 'medieval-highlands',
    label: 'Medieval Highlands',
    description: 'Vast windswept plains with rugged cliffs and ancient roads',
    tags: ['medieval', 'epic', 'mountains'],
    icon: '🏔️',
    prompt: `Vast medieval landscape with rolling plains, rugged cliffs, towering mountains. Untamed windswept land, scattered wooden fences, dirt paths hinting at ancient roads. Soft overcast sky, muted clouds with golden light, warm melancholic glow. Atmosphere of adventure, solitude, untold stories. Aged forgotten land of battles and lost legends.`,
  },
  {
    id: 'cyberpunk-metropolis',
    label: 'Cyberpunk Metropolis',
    description: 'Neon-lit skyscrapers and rain-soaked streets',
    tags: ['futuristic', 'neon', 'urban'],
    icon: '🌃',
    prompt: `Futuristic cyberpunk metropolis at night. Towering neon-lit skyscrapers, industrial scaffolding, holographic billboards. Rain-soaked streets reflecting vibrant lights. Flying cars and drones between buildings. Dense layered environment with steel frameworks, tangled cables, elevated walkways. Electric blues, deep purples, vibrant reds casting otherworldly digital aura.`,
  },
  {
    id: 'autumn-countryside',
    label: 'Autumn Countryside',
    description: 'Golden fields with a castle in the misty distance',
    tags: ['peaceful', 'autumn', 'pastoral'],
    icon: '🍂',
    prompt: `Picturesque medieval countryside in golden autumn hues. Rolling fields of crimson and amber leaves. Grand stone castle faint in misty background, towers reaching skyward. Dusty village road with wooden fences and cottages. Crisp serene air, peaceful adventure atmosphere like ancient chivalric tales.`,
  },
  {
    id: 'post-apocalyptic-wasteland',
    label: 'Post-Apocalyptic Wasteland',
    description: 'Barren ruins of civilization under harsh sun',
    tags: ['wasteland', 'ruins', 'survival'],
    icon: '☢️',
    prompt: `Vast barren wasteland with skeletal civilization remains. Collapsed highways, rusted vehicles, fading billboards under harsh sun. Cracked asphalt winding toward decaying city ruins. Dry dusty air echoing lost world. Abandoned structures and survivor camps telling silent stories. Somber yet adventurous survival atmosphere.`,
  },
  {
    id: 'dark-temple',
    label: 'Dark Temple',
    description: 'Ancient stone pillars with eerie glowing runes',
    tags: ['dark', 'mystical', 'ancient'],
    icon: '🏛️',
    prompt: `Massive ancient temple shrouded in darkness, eerie red crackling energy glow. Towering stone pillars with forbidden runes rising into shadows. Thick mist, burning incense scent, whispers of lost knowledge. Cracked weathered floor with smoldering embers. Oppressive dread atmosphere, walls holding memories of fallen lords.`,
  },
  {
    id: 'enchanted-forest',
    label: 'Enchanted Forest',
    description: 'Magical woodland with ancient trees and hidden paths',
    tags: ['magical', 'nature', 'mystical'],
    icon: '🌲',
    prompt: `Ancient forest in perpetual twilight. Towering gnarled moss-covered trees blocking light. Bioluminescent mushrooms and glowing flowers casting ethereal blue-green glow. Mist curling between roots, faint whispers from shadows. Overgrown stone markers hinting at forgotten paths. Serene yet unsettling living forest holding ancient secrets.`,
  },
  {
    id: 'ocean-voyage',
    label: 'Ocean Voyage',
    description: 'Ships on vast seas with dramatic skies',
    tags: ['ocean', 'adventure', 'naval'],
    icon: '⛵',
    prompt: `Endless ocean under dramatic sky of orange, purple, deep blue. Massive cresting waves with white foam catching sunset light. Weathered wooden ship with tattered sails cutting through turbulent waters. Seabirds wheeling overhead. Storm clouds gathering with lightning flashes. Exhilarating yet foreboding raw sea power.`,
  },
  {
    id: 'mountain-sanctuary',
    label: 'Mountain Sanctuary',
    description: 'Remote temple perched on misty peaks',
    tags: ['mountains', 'spiritual', 'remote'],
    icon: '🏯',
    prompt: `Remote sanctuary on towering mountain peak amid swirling mists and jagged cliffs. Ancient worn stone steps winding toward ornate gates with weathered statues. Elegant pagodas and meditation halls with snow-dusted roofs and fluttering prayer flags. Waterfalls cascading nearby. Thin crisp air with distant temple bells. Profound peace and isolation.`,
  },
];

export const MOOD_OPTIONS: PromptOption[] = [
  {
    id: 'epic-adventure',
    label: 'Epic Adventure',
    description: 'Bold heroism and grand-scale discovery',
    tags: ['heroic', 'bold', 'grand'],
    icon: '⚔️',
    prompt: `Epic grandeur and heroic energy. Dramatic light breaking through clouds, long shadows highlighting triumph. Composition emphasizing distant horizons and towering structures. Gleaming armor, fluttering banners, air charged with destiny. Courage against overwhelming odds, thrill of discovery, legendary deeds awaiting.`,
  },
  {
    id: 'dark-mystery',
    label: 'Dark Mystery',
    description: 'Shadows, secrets, and lurking danger',
    tags: ['mysterious', 'dark', 'suspenseful'],
    icon: '🔮',
    prompt: `Thick mystery and unspoken danger. Deep shadows pooling in corners, isolated light sources—candles, distant windows, glowing objects—creating visibility pockets. Half-seen faces, cryptic symbols, dark purpose hints. Muted desaturated palette of blacks, deep blues, sickly greens. Something watching from darkness, disturbing secrets kept.`,
  },
  {
    id: 'serene-peace',
    label: 'Serene Peace',
    description: 'Calm tranquility and gentle beauty',
    tags: ['peaceful', 'calm', 'gentle'],
    icon: '🕊️',
    prompt: `Profound tranquility and gentle beauty. Soft diffused light in warm muted tones. Minimal unhurried movement—gentle breeze, still water ripples, drifting dust motes. Balanced harmonious composition with natural curves. Soft pastels and soothing earth tones. Rest, reflection, worries dissolving, time slowing peacefully.`,
  },
  {
    id: 'whimsical-wonder',
    label: 'Whimsical Wonder',
    description: 'Playful magic and delightful strangeness',
    tags: ['playful', 'magical', 'fantastical'],
    icon: '🎪',
    prompt: `Playful magic and delightful impossibility. Vibrant unexpected colors—candy pinks, electric teals, sunshine yellows. Exaggerated proportions: oversized mushrooms, tiny doors, floating islands. Sparkling enchanted light. Whimsical details: tiny hidden creatures, impossible mechanisms. Childlike wonder where ordinary rules don't apply.`,
  },
  {
    id: 'tragic-sorrow',
    label: 'Tragic Sorrow',
    description: 'Melancholy beauty and emotional weight',
    tags: ['melancholy', 'emotional', 'somber'],
    icon: '🥀',
    prompt: `Profound melancholy and bittersweet beauty. Gentle rain leaving everything glistening. Muted desaturated palette—grays, faded blues, washed-out colors. Dim diffused light without harsh shadows. Tender decay: wilted flowers, abandoned cherished objects, weathered monuments. Grief, nostalgia, irretrievable loss, strange beauty in sorrow.`,
  },
  {
    id: 'tense-danger',
    label: 'Tense Danger',
    description: 'Imminent threat and high-stakes tension',
    tags: ['tense', 'dangerous', 'urgent'],
    icon: '⚡',
    prompt: `Imminent danger and urgent tension. Harsh dramatic lighting with sharp contrasts and deep shadows. Dynamic unstable composition with diagonals and asymmetry. Warning colors: reds, oranges, stark whites against blacks. Physical threats: crumbling edges, sparking machinery, drawn weapons. Critical moment where hesitation means disaster.`,
  },
  {
    id: 'romantic-warmth',
    label: 'Romantic Warmth',
    description: 'Tender intimacy and heartfelt connection',
    tags: ['romantic', 'warm', 'intimate'],
    icon: '💕',
    prompt: `Tender warmth and intimate beauty. Soft golden lighting—candlelight, sunset, fireplace glow—in flattering warm tones. Rich gentle colors: deep roses, amber, soft cream, gold touches. Connection moments: reaching hands, shared glances. Details of care: arranged flowers, personal tokens. Safety, belonging, deep emotional connection.`,
  },
  {
    id: 'triumphant-glory',
    label: 'Triumphant Glory',
    description: 'Victory, celebration, and hard-won success',
    tags: ['victory', 'celebratory', 'triumphant'],
    icon: '🏆',
    prompt: `Glory of hard-won triumph. Brilliant expansive light—sun through storm clouds, golden rays, celebration flames. Bold upward composition with soaring elements. Rich saturated colors: royal purples, burnished golds, victorious reds. Raised weapons, torn banners flying. Electric joy, pride, cathartic achievement release.`,
  },
];

export const dimensionOptions: Record<CardDimension, PromptOption[]> = {
  style: STYLE_OPTIONS,
  setting: SETTING_OPTIONS,
  mood: MOOD_OPTIONS,
};

/**
 * Get complete LLM instructions with art style context
 * Used when enriching user prompts with art style awareness
 */
export function getCompleteLLMInstructions(artStyleId: string): string {
  const artStyle = getArtStyleById(artStyleId);
  if (!artStyle) {
    return '';
  }

  return `${LLM_ARTSTYLE_GUIDANCE}

Current Art Style: ${artStyle.label}
- Style Prompt: ${artStyle.stylePrompt}
- Color Palette: ${artStyle.colorPalette}
- Rendering Technique: ${artStyle.renderingTechnique}
- Visual Features: ${artStyle.visualFeatures}

Ensure the setting and mood descriptions complement this art style's aesthetic.`;
}
