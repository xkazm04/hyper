/**
 * Prompt Composer Data
 * Visual prompt builder for story card image generation
 */

export type PromptDimension = 'style' | 'setting' | 'mood';

export interface PromptOption {
  id: string;
  label: string;
  description: string;
  tags: string[];
  icon: string;
  prompt: string;
}

export interface PromptColumn {
  id: PromptDimension;
  label: string;
  icon: string;
  description: string;
}

export const PROMPT_COLUMNS: PromptColumn[] = [
  {
    id: 'style',
    label: 'Art Style',
    icon: '🎨',
    description: 'Hand-drawn illustration style',
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

export const STYLE_OPTIONS: PromptOption[] = [
  {
    id: 'adventure-journal',
    label: 'Adventure Journal',
    description: 'Rough pencil-and-ink sketch with adventure-book feel',
    tags: ['sketch', 'pencil', 'journal'],
    icon: '📔',
    prompt: `Create a masterful, rough-yet-refined pencil-and-ink sketch, crafted with the expressive imperfection of traditional hand-drawn artwork. Use thin, deliberate linework, soft cross-hatching, and subtle blended shading to enhance depth. Allow for light, muted color accents—as if applied with worn colored pencils—while keeping the overall image rooted in a monochrome, sketchbook aesthetic. The artwork should evoke the feeling of an adventure-book illustration, with a lightly textured paper surface, visible pencil strokes, and organic imperfections. Emphasize mood, craftsmanship, and storytelling details. The illustration should feel artistic, tactile, and authentically handcrafted, as though drawn directly into an explorer's journal.`,
  },
  {
    id: 'expedition-sketch',
    label: 'Expedition Sketch',
    description: 'Field journal style on weathered parchment',
    tags: ['vintage', 'parchment', 'explorer'],
    icon: '🗺️',
    prompt: `Produce a meticulously crafted expedition-style sketch, blending fine ink contours with rough, textured pencil shading. The illustration should feel like it was drawn by a seasoned traveler on weathered parchment—complete with gentle smudges, uneven line pressure, faint paper grain, and natural imperfections that reveal the artist's hand. Allow touches of soft, desaturated color to seep into the piece, as if applied with old colored pencils in a field journal, but maintain a predominantly monochrome atmosphere. Focus on expressive detail, environmental storytelling, and a sense of lived-in adventure. The final artwork should appear timeless, tactile, and authentically analog, like an artifact recovered from a long-forgotten campaign.`,
  },
  {
    id: 'artisan-illustration',
    label: 'Artisan Illustration',
    description: 'Master illustrator sketchbook with elegant detail',
    tags: ['elegant', 'detailed', 'artistic'],
    icon: '✒️',
    prompt: `Create an elegantly detailed artisan sketch, merging delicate pencil gradients with purposeful, confident ink strokes. The style should convey the skill of a master illustrator working in a personal sketchbook: layered cross-hatching, nuanced shading transitions, and faint color accents that feel softly brushed in by hand. Incorporate a subtle grainy paper texture with visible stroke direction and tonal variation to enhance the handcrafted realism. Highlight fine textures, emotional atmosphere, and thoughtful composition. The final result should feel rich, expressive, and deliberately imperfect, celebrating the artistry of traditional pencil-and-ink work.`,
  },
];

export const SETTING_OPTIONS: PromptOption[] = [
  {
    id: 'medieval-highlands',
    label: 'Medieval Highlands',
    description: 'Vast windswept plains with rugged cliffs and ancient roads',
    tags: ['medieval', 'epic', 'mountains'],
    icon: '🏔️',
    prompt: `A vast, breathtaking medieval landscape, featuring rolling plains, rugged cliffs, and towering mountains stretching into the distance. The land is untamed and windswept, with scattered wooden fences and small dirt paths winding through the fields, hinting at ancient roads long traveled. The sky is soft and overcast, with a blend of muted clouds and golden light filtering through, casting a warm yet melancholic glow over the scenery. The atmosphere feels vast, open, and steeped in history, evoking a sense of adventure, solitude, and the weight of untold stories. The world appears aged and forgotten, like a land once filled with great battles and lost legends, now quiet under the passage of time.`,
  },
  {
    id: 'cyberpunk-metropolis',
    label: 'Cyberpunk Metropolis',
    description: 'Neon-lit skyscrapers and rain-soaked streets',
    tags: ['futuristic', 'neon', 'urban'],
    icon: '🌃',
    prompt: `A vast, futuristic cyberpunk metropolis at night, filled with towering neon-lit skyscrapers, industrial scaffolding, and glowing holographic billboards. The streets and rooftops are shrouded in darkness and rain, with water streaming off metal structures and reflecting vibrant city lights. Flying cars and drones hover between buildings, their headlights cutting through the haze. The environment is dense and layered, with towering steel frameworks, tangled cables, and elevated walkways, creating a sense of urban sprawl. The air is heavy with mist, rain, and the faint hum of electricity, evoking a world of high-tech intrigue and danger. The city's neon glow casts electric blues, deep purples, and vibrant reds, illuminating the scene with an otherworldly, digital aura.`,
  },
  {
    id: 'autumn-countryside',
    label: 'Autumn Countryside',
    description: 'Golden fields with a castle in the misty distance',
    tags: ['peaceful', 'autumn', 'pastoral'],
    icon: '🍂',
    prompt: `A picturesque medieval countryside bathed in the golden hues of autumn, with rolling fields covered in crimson and amber leaves. A grand stone castle stands faintly in the misty background, its towers reaching toward the sky, half-obscured by the warm morning glow. A dusty village road winds through the landscape, dotted with wooden fences and small cottages. Nearby, a sturdy warhorse stands saddled, its mane catching the sunlight, ready for travel. The air is crisp yet serene, filled with the distant sounds of rustling leaves and farm animals. The atmosphere conveys a sense of peaceful adventure, as if pulled from the pages of an ancient chivalric tale.`,
  },
  {
    id: 'post-apocalyptic-wasteland',
    label: 'Post-Apocalyptic Wasteland',
    description: 'Barren ruins of civilization under harsh sun',
    tags: ['wasteland', 'ruins', 'survival'],
    icon: '☢️',
    prompt: `A vast, barren wasteland stretches to the horizon, littered with the skeletal remains of civilization—collapsed highways, rusted-out vehicles, and broken billboards fading under the harsh sun. The cracked asphalt of an old road winds through the desolate terrain, leading toward the distant ruins of a decaying city skyline. The air is dry and filled with dust, carrying the echoes of a world long lost. Scattered remnants of the past—abandoned gas stations, half-buried structures, and makeshift survivor camps—dot the landscape, telling silent stories of those who once lived here. In the distance, a rusting rocket stands as a forgotten relic of a more hopeful time. The overall atmosphere is somber yet adventurous, evoking the struggle of survival in a world shaped by both destruction and resilience.`,
  },
  {
    id: 'dark-temple',
    label: 'Dark Temple',
    description: 'Ancient stone pillars with eerie glowing runes',
    tags: ['dark', 'mystical', 'ancient'],
    icon: '🏛️',
    prompt: `A massive, ancient temple, shrouded in darkness and illuminated by the eerie red glow of crackling energy. Towering stone pillars, engraved with forbidden runes, rise into the shadows above. The air is thick with mist and the scent of burning incense, carrying whispers of lost knowledge and dark power. The stone floor is cracked and weathered, with embers smoldering from recent battle. In the distance, faint flickers of red and orange light pulse from unseen energy sources, casting ominous shadows across the walls. The atmosphere is oppressive, filled with an overwhelming sense of dread and ancient power, as if the very walls hold the memories of countless fallen lords.`,
  },
  {
    id: 'enchanted-forest',
    label: 'Enchanted Forest',
    description: 'Magical woodland with ancient trees and hidden paths',
    tags: ['magical', 'nature', 'mystical'],
    icon: '🌲',
    prompt: `A vast, ancient forest shrouded in perpetual twilight, where towering trees with gnarled, moss-covered trunks stretch endlessly toward a canopy that blocks most light. Bioluminescent mushrooms and glowing flowers dot the forest floor, casting an ethereal blue and green glow across the undergrowth. Mist curls between the roots, and faint whispers seem to emanate from the shadows. Ancient stone markers, overgrown with vines, hint at paths long forgotten. Shafts of soft golden light break through gaps in the canopy, illuminating floating particles of pollen and dust. The atmosphere is both serene and unsettling, as if the forest itself is alive, watching, and holding secrets from ages past.`,
  },
  {
    id: 'ocean-voyage',
    label: 'Ocean Voyage',
    description: 'Ships on vast seas with dramatic skies',
    tags: ['ocean', 'adventure', 'naval'],
    icon: '⛵',
    prompt: `A vast, endless ocean stretches to the horizon under a dramatic sky painted with streaks of orange, purple, and deep blue. Massive waves crest and roll, their white foam catching the fading light of the setting sun. A weathered wooden ship with tattered sails cuts through the turbulent waters, its hull scarred by countless voyages. Seabirds wheel overhead, their cries barely audible above the roar of the wind and waves. In the distance, storm clouds gather, flashes of lightning illuminating their dark bellies. The atmosphere is both exhilarating and foreboding, capturing the raw power of the sea and the courage of those who dare to sail it.`,
  },
  {
    id: 'mountain-sanctuary',
    label: 'Mountain Sanctuary',
    description: 'Remote temple perched on misty peaks',
    tags: ['mountains', 'spiritual', 'remote'],
    icon: '🏯',
    prompt: `A remote sanctuary perched on a towering mountain peak, surrounded by swirling mists and jagged cliffs. Ancient stone steps, worn smooth by centuries of pilgrims, wind up the mountainside toward ornate gates flanked by weathered statues. The sanctuary itself is a blend of elegant pagodas and meditation halls, their curved roofs dusted with snow and adorned with prayer flags that flutter in the constant wind. Waterfalls cascade down nearby cliffs, their mist mingling with the clouds. The air is thin and crisp, carrying the distant sound of temple bells. The atmosphere is one of profound peace and isolation, a place where the mundane world feels impossibly far away.`,
  },
];

export const MOOD_OPTIONS: PromptOption[] = [
  {
    id: 'epic-adventure',
    label: 'Epic Adventure',
    description: 'Bold heroism and grand-scale discovery',
    tags: ['heroic', 'bold', 'grand'],
    icon: '⚔️',
    prompt: `The scene radiates with epic grandeur and heroic energy. Light breaks dramatically through clouds or architectural features, casting long shadows and highlighting moments of triumph. The composition draws the eye toward distant horizons or towering structures, emphasizing scale and possibility. Every element suggests a pivotal moment in a greater journey—armor gleams, banners flutter, and the very air seems charged with destiny. The overall feeling is one of courage in the face of overwhelming odds, the thrill of discovery, and the weight of legendary deeds yet to be accomplished.`,
  },
  {
    id: 'dark-mystery',
    label: 'Dark Mystery',
    description: 'Shadows, secrets, and lurking danger',
    tags: ['mysterious', 'dark', 'suspenseful'],
    icon: '🔮',
    prompt: `The atmosphere is thick with mystery and unspoken danger. Deep shadows pool in corners and crevices, while isolated sources of light—candles, distant windows, or strange glowing objects—create pockets of visibility that only deepen the surrounding darkness. Details emerge partially from the gloom: half-seen faces, cryptic symbols, objects that hint at dark purposes. The color palette is muted and desaturated, dominated by blacks, deep blues, and sickly greens. There's a sense that something is watching from the darkness, that secrets are being kept, and that the truth, when revealed, will be disturbing.`,
  },
  {
    id: 'serene-peace',
    label: 'Serene Peace',
    description: 'Calm tranquility and gentle beauty',
    tags: ['peaceful', 'calm', 'gentle'],
    icon: '🕊️',
    prompt: `The scene exudes profound tranquility and gentle beauty. Soft, diffused light—whether from a setting sun, overcast sky, or filtered through leaves—bathes everything in warm, muted tones. Movement is minimal and unhurried: perhaps a gentle breeze stirring grass, ripples spreading across still water, or dust motes drifting in a sunbeam. The composition is balanced and harmonious, with natural curves and flowing lines. Colors are soft pastels and earth tones that soothe the eye. The atmosphere suggests a moment of rest, reflection, and connection with something greater—a place where worries dissolve and time slows to a peaceful crawl.`,
  },
  {
    id: 'whimsical-wonder',
    label: 'Whimsical Wonder',
    description: 'Playful magic and delightful strangeness',
    tags: ['playful', 'magical', 'fantastical'],
    icon: '🎪',
    prompt: `The scene bubbles with playful magic and delightful impossibility. Colors are vibrant and unexpected—candy pinks, electric teals, sunshine yellows—applied in ways that defy mundane reality. Proportions are subtly exaggerated: oversized mushrooms, tiny doors, floating islands, gravity-defying architecture. Light sparkles and glitters, suggesting enchantment and hidden magic. Whimsical details reward close inspection: tiny creatures peeking from hiding spots, impossible mechanisms, and objects with personality. The atmosphere is one of childlike wonder and joy, where the rules of the ordinary world don't apply and anything marvelous might happen at any moment.`,
  },
  {
    id: 'tragic-sorrow',
    label: 'Tragic Sorrow',
    description: 'Melancholy beauty and emotional weight',
    tags: ['melancholy', 'emotional', 'somber'],
    icon: '🥀',
    prompt: `The scene is suffused with profound melancholy and bittersweet beauty. Rain falls gently, or has recently fallen, leaving everything glistening and dripping. The color palette is muted and desaturated—grays, faded blues, and washed-out colors that suggest vitality drained away. Light is dim and diffused, casting no harsh shadows but offering little warmth. Elements of decay and loss are present but rendered with tender attention: wilted flowers still beautiful, abandoned objects that speak of cherished memories, weathered monuments to what once was. The atmosphere evokes grief, nostalgia, and the ache of irretrievable loss, yet also the strange beauty found in sorrow.`,
  },
  {
    id: 'tense-danger',
    label: 'Tense Danger',
    description: 'Imminent threat and high-stakes tension',
    tags: ['tense', 'dangerous', 'urgent'],
    icon: '⚡',
    prompt: `The atmosphere crackles with imminent danger and urgent tension. Lighting is harsh and dramatic—sharp contrasts, deep shadows, and highlights that seem almost too bright. The composition is dynamic and unstable, with diagonal lines, asymmetric framing, and elements that seem about to collide or collapse. Colors trend toward warning tones: reds, oranges, and stark whites against deep blacks. Details suggest immediate physical threat: crumbling edges, sparking machinery, drawn weapons, or natural forces barely contained. The overall feeling is one of a critical moment where decisions must be made instantly, where hesitation means disaster, and where survival hangs in the balance.`,
  },
  {
    id: 'romantic-warmth',
    label: 'Romantic Warmth',
    description: 'Tender intimacy and heartfelt connection',
    tags: ['romantic', 'warm', 'intimate'],
    icon: '💕',
    prompt: `The scene glows with tender warmth and intimate beauty. Lighting is soft and golden—candlelight, sunset hues, or the gentle glow of a fireplace—casting everything in flattering, warm tones. Colors are rich but gentle: deep roses, amber, soft cream, and touches of gold. The composition draws attention to moments of connection and closeness: hands reaching toward each other, shared glances, protective gestures. Details suggest care and affection: carefully arranged flowers, personal tokens, comfortable furnishings. The atmosphere is one of safety, belonging, and deep emotional connection—a moment suspended in time where nothing exists beyond the warmth shared between souls.`,
  },
  {
    id: 'triumphant-glory',
    label: 'Triumphant Glory',
    description: 'Victory, celebration, and hard-won success',
    tags: ['victory', 'celebratory', 'triumphant'],
    icon: '🏆',
    prompt: `The scene blazes with the glory of hard-won triumph. Light is brilliant and expansive—sun breaking through storm clouds, golden rays streaming from above, or flames of celebration burning bright. The composition is bold and upward-reaching, with vertical lines and elements that soar toward the sky. Colors are rich and saturated: royal purples, burnished golds, victorious reds. Details speak of accomplishment and celebration: raised weapons or tools, torn banners still flying, the aftermath of struggle transformed into symbols of success. The atmosphere is electric with joy, relief, and pride—the cathartic release of achieving what once seemed impossible, and the dawning realization that everything has changed.`,
  },
];

export const dimensionOptions: Record<PromptDimension, PromptOption[]> = {
  style: STYLE_OPTIONS,
  setting: SETTING_OPTIONS,
  mood: MOOD_OPTIONS,
};

export function composePrompt(
  selections: Partial<Record<PromptDimension, PromptOption | undefined>>
): string {
  const parts: string[] = [];

  // Start with style prompt (the main instruction)
  if (selections.style) {
    parts.push(selections.style.prompt);
  }

  // Add setting description
  if (selections.setting) {
    parts.push(`\n\nDepict the following scene:\n${selections.setting.prompt}`);
  }

  // Add mood/atmosphere
  if (selections.mood) {
    parts.push(`\n\nAtmosphere and mood:\n${selections.mood.prompt}`);
  }

  return parts.join('');
}

export function getAllTags(): string[] {
  const tagSet = new Set<string>();

  Object.values(dimensionOptions).forEach(options => {
    options.forEach(option => {
      option.tags.forEach(tag => tagSet.add(tag));
    });
  });

  return Array.from(tagSet).sort();
}
