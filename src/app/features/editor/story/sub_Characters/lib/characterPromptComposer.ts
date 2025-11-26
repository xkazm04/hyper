/**
 * Character Prompt Composer Data
 * Visual prompt builder for character image generation
 * Max total prompt length: 1618 characters (Leonardo limit)
 */

export type CharacterDimension = 'archetype' | 'pose' | 'mood';

export interface CharacterPromptOption {
  id: string;
  label: string;
  description: string;
  tags: string[];
  icon: string;
  prompt: string;
  isCustom?: boolean;
}

export interface CharacterPromptColumn {
  id: CharacterDimension;
  label: string;
  icon: string;
  description: string;
}

export const MAX_PROMPT_LENGTH = 1618;

export const CHARACTER_PROMPT_COLUMNS: CharacterPromptColumn[] = [
  {
    id: 'archetype',
    label: 'Archetype',
    icon: '⚔️',
    description: 'Character class and role',
  },
  {
    id: 'pose',
    label: 'Pose',
    icon: '🎭',
    description: 'Body posture and stance',
  },
  {
    id: 'mood',
    label: 'Expression',
    icon: '✨',
    description: 'Facial expression and demeanor',
  },
];

export const ARCHETYPE_OPTIONS: CharacterPromptOption[] = [
  {
    id: 'knight',
    label: 'Knight',
    description: 'Armored warrior with shield and sword',
    tags: ['warrior', 'armor', 'melee'],
    icon: '🛡️',
    prompt: `Noble knight in polished plate armor with intricate heraldic engravings. Heavy steel pauldrons, articulated gauntlets, chainmail visible at joints. Long flowing cape with embroidered sigil. Longsword at hip or in hand, kite shield bearing noble crest. Weathered face of a veteran, honorable bearing.`,
  },
  {
    id: 'wizard',
    label: 'Wizard',
    description: 'Mystical spellcaster with arcane robes',
    tags: ['magic', 'robes', 'arcane'],
    icon: '🧙',
    prompt: `Powerful wizard in flowing ceremonial robes adorned with arcane symbols and constellation patterns. Long grey or silver beard, wise weathered eyes holding ancient knowledge. Gnarled wooden staff topped with glowing crystal orb. Pouches of spell components, ancient tome tucked at side. Subtle magical aura emanating.`,
  },
  {
    id: 'assassin',
    label: 'Assassin',
    description: 'Stealthy shadow operative with daggers',
    tags: ['stealth', 'agile', 'dark'],
    icon: '🗡️',
    prompt: `Deadly assassin in form-fitting dark leather armor designed for silence and agility. Hood casting deep shadows over calculating eyes. Multiple concealed blades, throwing knives, vials of poison. Lightweight boots for silent movement. Thin scar across cheek, cold focused expression. Shadow-blending cloak.`,
  },
  {
    id: 'ranger',
    label: 'Ranger',
    description: 'Woodland tracker with bow and nature gear',
    tags: ['nature', 'bow', 'scout'],
    icon: '🏹',
    prompt: `Skilled ranger in practical forest-toned leather and cloth attire. Hooded cloak of mottled green and brown for woodland camouflage. Expertly crafted longbow across back, quiver of fletched arrows. Hunting knife at belt, bedroll and survival pouches. Keen observant eyes, weathered by outdoor life.`,
  },
  {
    id: 'cleric',
    label: 'Cleric',
    description: 'Holy warrior with divine vestments',
    tags: ['holy', 'healer', 'divine'],
    icon: '⛪',
    prompt: `Devoted cleric in ornate religious vestments combining protective chainmail with sacred robes. Prominent holy symbol on chain around neck, glowing faintly with divine power. Heavy mace or war hammer. Sacred texts bound to belt. Serene yet resolute expression, aura of protective light.`,
  },
  {
    id: 'barbarian',
    label: 'Barbarian',
    description: 'Fierce tribal warrior with massive weapon',
    tags: ['primal', 'savage', 'tribal'],
    icon: '🪓',
    prompt: `Massive barbarian warrior with muscular build and battle-scarred skin. Minimal armor—fur pelts, leather straps, tribal bone ornaments. Wild untamed hair with braids and war beads. Enormous two-handed axe or greatsword. Fierce war paint, intimidating presence. Necklace of enemy trophies.`,
  },
  {
    id: 'bard',
    label: 'Bard',
    description: 'Charismatic performer with musical instrument',
    tags: ['music', 'charismatic', 'performer'],
    icon: '🎸',
    prompt: `Charismatic bard in flamboyant colorful attire mixing noble fashion with practical travel wear. Feathered cap, embroidered doublet, fine leather boots. Ornate lute or lyre always at hand. Rapier at hip for self-defense. Charming smile, expressive theatrical gestures. Pouch of coins and love letters.`,
  },
  {
    id: 'custom',
    label: 'Custom',
    description: 'Define your own character archetype',
    tags: ['custom'],
    icon: '✏️',
    prompt: '',
    isCustom: true,
  },
];

export const POSE_OPTIONS: CharacterPromptOption[] = [
  {
    id: 'heroic-stance',
    label: 'Heroic Stance',
    description: 'Confident and powerful standing pose',
    tags: ['confident', 'powerful', 'standing'],
    icon: '🦸',
    prompt: `Full-body portrait, heroic stance with feet planted firmly shoulder-width apart. Chest forward, shoulders back, chin slightly raised in confident determination. One hand resting on weapon hilt, other relaxed at side. Weight balanced, ready for action. Powerful silhouette against dramatic backdrop.`,
  },
  {
    id: 'battle-ready',
    label: 'Battle Ready',
    description: 'Combat-prepared aggressive stance',
    tags: ['combat', 'aggressive', 'alert'],
    icon: '⚔️',
    prompt: `Full-body portrait, aggressive battle-ready stance. Weapon drawn and raised, body coiled for attack. Knees slightly bent, weight on balls of feet. Intense focused expression, eyes locked on threat. Dynamic tension in muscles, cape or clothing billowing with movement. Ready to strike.`,
  },
  {
    id: 'casual-standing',
    label: 'Casual Standing',
    description: 'Relaxed natural standing pose',
    tags: ['relaxed', 'natural', 'informal'],
    icon: '🧍',
    prompt: `Full-body portrait, relaxed casual standing pose. Weight shifted slightly to one hip, arms loose and natural. Approachable open body language. Gentle confident expression, at ease with surroundings. Natural lighting, comfortable everyday moment captured. Authentic personality showing through.`,
  },
  {
    id: 'sitting',
    label: 'Sitting',
    description: 'Seated contemplative or resting pose',
    tags: ['seated', 'resting', 'thoughtful'],
    icon: '🪑',
    prompt: `Full-body portrait, seated pose on throne, rock, or simple chair. Posture revealing character—regal straight back, casual slouch, or tired slump. Hands may hold item of significance. Legs positioned naturally. Moment of rest or deep thought, background suggesting setting context.`,
  },
  {
    id: 'walking',
    label: 'Walking',
    description: 'Mid-stride traveling pose',
    tags: ['movement', 'travel', 'dynamic'],
    icon: '🚶',
    prompt: `Full-body portrait, captured mid-stride in purposeful walk. One foot forward, weight shifting naturally. Arms swinging in motion, cloak or equipment moving with momentum. Looking ahead toward destination. Dynamic sense of journey and purpose, path visible in scene.`,
  },
  {
    id: 'action-pose',
    label: 'Action Pose',
    description: 'Dynamic mid-action combat moment',
    tags: ['action', 'dynamic', 'combat'],
    icon: '💥',
    prompt: `Full-body portrait, explosive action pose frozen mid-movement. Weapon mid-swing or spell mid-cast. Body twisted in dynamic motion, muscles tensed. Hair and clothing caught in motion blur. Dramatic lighting emphasizing action. Energy and power radiating from figure.`,
  },
  {
    id: 'mysterious',
    label: 'Mysterious',
    description: 'Enigmatic partially-concealed pose',
    tags: ['mysterious', 'shadowed', 'enigmatic'],
    icon: '🌙',
    prompt: `Full-body portrait, mysterious enigmatic pose partially shrouded in shadow or mist. Face partially obscured by hood, hair, or angle. Body language guarded, secrets held close. One eye visible, gleaming with hidden knowledge. Dramatic rim lighting creating intrigue. Viewer drawn to wonder.`,
  },
  {
    id: 'regal',
    label: 'Regal',
    description: 'Noble authoritative commanding pose',
    tags: ['noble', 'commanding', 'royal'],
    icon: '👑',
    prompt: `Full-body portrait, regal commanding pose of authority. Perfect posture, every line radiating power and breeding. One hand may rest on scepter, sword, or throne arm. Expression of serene superiority, accustomed to obedience. Rich ornate attire and setting befitting status. Born to lead.`,
  },
];

export const EXPRESSION_OPTIONS: CharacterPromptOption[] = [
  {
    id: 'determined',
    label: 'Determined',
    description: 'Fierce unwavering resolve',
    tags: ['focused', 'resolute', 'strong'],
    icon: '😤',
    prompt: `Expression of unwavering determination. Set jaw, furrowed brow, eyes burning with inner fire. Mouth pressed in firm line of resolve. Muscles slightly tensed with purpose. The look of someone who will not be stopped, who has made an unbreakable vow.`,
  },
  {
    id: 'serene',
    label: 'Serene',
    description: 'Calm peaceful inner tranquility',
    tags: ['peaceful', 'calm', 'wise'],
    icon: '😌',
    prompt: `Expression of profound serenity and inner peace. Soft relaxed features, gentle knowing smile. Eyes half-lidded or peacefully closed, at one with world. No tension in face or posture. Wisdom and acceptance radiating outward. Master of their own spirit.`,
  },
  {
    id: 'fierce',
    label: 'Fierce',
    description: 'Intimidating warrior intensity',
    tags: ['aggressive', 'intimidating', 'wild'],
    icon: '😠',
    prompt: `Fierce warrior expression of barely contained rage. Bared teeth, flared nostrils, eyes wide with battle fury. Veins visible at temples, face flushed with adrenaline. Primal intimidating presence. The look that makes enemies hesitate and allies take courage.`,
  },
  {
    id: 'cunning',
    label: 'Cunning',
    description: 'Sly knowing scheming smile',
    tags: ['clever', 'sly', 'scheming'],
    icon: '😏',
    prompt: `Cunning knowing expression hiding secrets. Slight smirk playing at lips, eyes sharp and calculating. Head slightly tilted as if seeing through deceptions. Amused confidence of someone always three steps ahead. The face of a master manipulator or brilliant strategist.`,
  },
  {
    id: 'noble',
    label: 'Noble',
    description: 'Dignified aristocratic bearing',
    tags: ['dignified', 'proud', 'regal'],
    icon: '🎩',
    prompt: `Noble dignified expression of refined bearing. Slight upward tilt of chin, composed neutral features. Eyes intelligent and appraising. Perfect control of emotion, revealing only what is intended. The expression of one born to privilege who carries it well.`,
  },
  {
    id: 'haunted',
    label: 'Haunted',
    description: 'Troubled by dark memories',
    tags: ['dark', 'troubled', 'mysterious'],
    icon: '😔',
    prompt: `Haunted troubled expression bearing weight of terrible memories. Shadows under distant eyes that have seen too much. Lines of grief and weariness etched in features. Mouth that rarely smiles anymore. The look of one who carries dark burden alone.`,
  },
  {
    id: 'joyful',
    label: 'Joyful',
    description: 'Warm genuine happiness',
    tags: ['happy', 'warm', 'friendly'],
    icon: '😊',
    prompt: `Joyful warm expression of genuine happiness. Bright eyes crinkled with smile, full laugh or grin. Relaxed open features radiating positive energy. Approachable and inviting demeanor. The face of someone who finds delight in adventure and companionship.`,
  },
  {
    id: 'mysterious',
    label: 'Mysterious',
    description: 'Unreadable enigmatic allure',
    tags: ['enigmatic', 'alluring', 'secretive'],
    icon: '🎭',
    prompt: `Mysterious unreadable expression of enigmatic allure. Features perfectly composed, emotions hidden. Eyes that hold secrets and promise of hidden depths. Slight Mona Lisa smile that could mean anything. Compelling presence that draws curiosity.`,
  },
];

export const characterDimensionOptions: Record<CharacterDimension, CharacterPromptOption[]> = {
  archetype: ARCHETYPE_OPTIONS,
  pose: POSE_OPTIONS,
  mood: EXPRESSION_OPTIONS,
};

/**
 * Create a custom prompt option for user input
 */
export function createCustomCharacterOption(dimension: CharacterDimension, customPrompt: string): CharacterPromptOption {
  return {
    id: `custom-${dimension}`,
    label: 'Custom',
    description: 'Your custom prompt',
    tags: ['custom'],
    icon: '✏️',
    prompt: customPrompt,
    isCustom: true,
  };
}

/**
 * Compose the final character prompt from selections
 * Adds character appearance context and ensures total length stays within MAX_PROMPT_LENGTH
 */
export function composeCharacterPrompt(
  selections: Partial<Record<CharacterDimension, CharacterPromptOption | undefined>>,
  characterName?: string,
  characterAppearance?: string
): string {
  const parts: string[] = [];

  // Add base character context
  parts.push(`Character portrait illustration. Hand-drawn sketchbook style with expressive linework and subtle color accents.`);

  // Add character name and appearance if provided
  if (characterName || characterAppearance) {
    const charContext = [
      characterName && `Character: ${characterName}.`,
      characterAppearance && `Appearance: ${characterAppearance}.`
    ].filter(Boolean).join(' ');
    parts.push(`\n\n${charContext}`);
  }

  // Add archetype description
  if (selections.archetype) {
    parts.push(`\n\nClass: ${selections.archetype.prompt}`);
  }

  // Add pose description
  if (selections.pose) {
    parts.push(`\n\nPose: ${selections.pose.prompt}`);
  }

  // Add expression/mood
  if (selections.mood) {
    parts.push(`\n\nExpression: ${selections.mood.prompt}`);
  }

  const result = parts.join('');
  
  // Truncate if exceeds limit
  if (result.length > MAX_PROMPT_LENGTH) {
    return result.substring(0, MAX_PROMPT_LENGTH - 3) + '...';
  }
  
  return result;
}

/**
 * Compose avatar prompt using character references
 */
export function composeAvatarPrompt(
  characterName?: string,
  characterAppearance?: string,
  style: 'pixel' | 'chibi' | 'portrait' | 'icon' = 'pixel'
): string {
  const stylePrompts: Record<string, string> = {
    pixel: `16-bit pixel art style RPG character portrait. Square frame, limited color palette, clean pixelated edges. Classic SNES/GBA era aesthetic. Small detailed sprite suitable for game UI.`,
    chibi: `Chibi style character portrait with exaggerated cute proportions. Large expressive head, small body. Soft rounded features, bright colors. Anime-inspired with friendly appeal.`,
    portrait: `Detailed character portrait bust, shoulders and head only. Painterly illustrated style with rich details. Focus on face and expression. Dramatic lighting, professional quality.`,
    icon: `Minimalist character icon design. Simplified geometric shapes, bold outlines. Limited color palette, easily recognizable silhouette. Suitable for UI elements and badges.`,
  };

  const parts: string[] = [stylePrompts[style]];

  if (characterName) {
    parts.push(`\n\nCharacter: ${characterName}.`);
  }

  if (characterAppearance) {
    parts.push(`Key features: ${characterAppearance}`);
  }

  parts.push(`\n\nMaintain visual consistency with reference images. Square 1:1 aspect ratio.`);

  return parts.join(' ');
}

export const AVATAR_STYLES = [
  { id: 'pixel', label: 'Pixel Art', icon: '👾', description: 'Retro 16-bit RPG style' },
  { id: 'chibi', label: 'Chibi', icon: '🎀', description: 'Cute anime-inspired' },
  { id: 'portrait', label: 'Portrait', icon: '🖼️', description: 'Detailed painted bust' },
  { id: 'icon', label: 'Icon', icon: '🔷', description: 'Simple minimalist badge' },
] as const;
