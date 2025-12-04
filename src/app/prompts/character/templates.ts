/**
 * Character Prompt Templates
 * Pre-defined prompt options for character image generation
 */

import type { CharacterPromptOption, CharacterDimension, CharacterPromptColumn } from './types'

// ============================================================================
// UI Configuration
// ============================================================================

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
]

export const AVATAR_STYLES = [
  { id: 'pixel', label: 'Pixel Art', icon: '👾', description: 'Retro 16-bit RPG style' },
  { id: 'chibi', label: 'Chibi', icon: '🎀', description: 'Cute anime-inspired' },
  { id: 'portrait', label: 'Portrait', icon: '🖼️', description: 'Detailed painted bust' },
  { id: 'rpg', label: 'RPG', icon: '⚔️', description: 'Modern videogame style' },
  { id: 'cartoon', label: 'Cartoon', icon: '🎯', description: 'Clean tactical animation' },
  { id: 'handdrawn', label: 'Hand-drawn', icon: '✒️', description: 'Elegant artisan sketch' },
  { id: 'gothic', label: 'Gothic', icon: '💀', description: 'Grimdark baroque style' },
  { id: 'story', label: 'Story Style', icon: '📖', description: 'Matches your story art' },
] as const

// ============================================================================
// Archetype Options
// ============================================================================

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
]

// ============================================================================
// Pose Options (Standard)
// ============================================================================

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
]

// ============================================================================
// Training Pose Options (Extended for AI model training)
// ============================================================================

export const TRAINING_POSE_OPTIONS: CharacterPromptOption[] = [
  // Front-facing poses
  {
    id: 'front-neutral',
    label: 'Front Neutral',
    description: 'Direct front view, neutral stance',
    tags: ['front', 'neutral', 'training', 'full-body'],
    icon: '🧍',
    prompt: `Zoomed out wide shot, full-body character illustration from head to feet. Front view, neutral standing pose facing camera directly. Arms relaxed at sides, feet shoulder-width apart. Character centered in frame with space around figure. Simple background, even lighting. Clear reference pose showing complete figure.`,
  },
  {
    id: 'front-arms-crossed',
    label: 'Arms Crossed',
    description: 'Front view with crossed arms',
    tags: ['front', 'confident', 'training', 'full-body'],
    icon: '💪',
    prompt: `Zoomed out wide shot, full-body character illustration from head to feet. Front view, confident stance with arms crossed over chest. Weight evenly distributed, slight lean back. Character fully visible in frame with breathing room. Assertive confident expression. Professional lighting, simple backdrop.`,
  },
  {
    id: 'front-hands-hips',
    label: 'Hands on Hips',
    description: 'Front view, assertive pose',
    tags: ['front', 'assertive', 'training', 'full-body'],
    icon: '🦹',
    prompt: `Zoomed out wide shot, full-body character illustration from head to feet. Front view, assertive stance with hands placed on hips. Elbows out, chest forward, confident bearing. Complete figure visible including feet. Direct eye contact with viewer. Strong silhouette against clean background.`,
  },
  // Three-quarter views
  {
    id: 'three-quarter-left',
    label: 'Three-Quarter Left',
    description: 'Angled view from left side',
    tags: ['three-quarter', 'angled', 'training', 'full-body'],
    icon: '↖️',
    prompt: `Zoomed out wide shot, full-body character illustration from head to feet. Three-quarter view from left side. Body angled 45 degrees, face turned toward camera. Natural relaxed pose showing full figure with depth. Character centered with space around. Clear facial features from angle.`,
  },
  {
    id: 'three-quarter-right',
    label: 'Three-Quarter Right',
    description: 'Angled view from right side',
    tags: ['three-quarter', 'angled', 'training', 'full-body'],
    icon: '↗️',
    prompt: `Zoomed out wide shot, full-body character illustration from head to feet. Three-quarter view from right side. Body angled 45 degrees opposite direction, face turned toward camera. Complete figure visible showing costume and equipment details. Natural stance with body depth visible.`,
  },
  // Profile views
  {
    id: 'profile-left',
    label: 'Profile Left',
    description: 'Side view facing left',
    tags: ['profile', 'side', 'training', 'full-body'],
    icon: '👤',
    prompt: `Zoomed out wide shot, full-body character illustration from head to feet. Profile view facing left, complete side silhouette visible. Distinct facial profile - nose, chin, forehead contour. Standing straight, arms visible from side. Full figure proportions clear. Simple background emphasizing silhouette.`,
  },
  {
    id: 'profile-right',
    label: 'Profile Right',
    description: 'Side view facing right',
    tags: ['profile', 'side', 'training', 'full-body'],
    icon: '👤',
    prompt: `Zoomed out wide shot, full-body character illustration from head to feet. Profile view facing right, complete side silhouette from opposite direction. Distinct facial features in profile. Natural stance, full body proportions visible from head to toe. Costume details from side angle.`,
  },
  // Back views
  {
    id: 'back-view',
    label: 'Back View',
    description: 'View from behind',
    tags: ['back', 'rear', 'training', 'full-body'],
    icon: '🔙',
    prompt: `Zoomed out wide shot, full-body character illustration from head to feet. Back view showing character from behind. Full rear silhouette visible, hair and costume back details clear. Head slightly turned showing partial profile. Complete figure including cape, pack, or equipment on back.`,
  },
  {
    id: 'over-shoulder',
    label: 'Over Shoulder',
    description: 'Looking back over shoulder',
    tags: ['back', 'dramatic', 'training', 'full-body'],
    icon: '↩️',
    prompt: `Zoomed out wide shot, full-body character illustration from head to feet. Back three-quarter view looking over shoulder toward camera. Dramatic twist in torso, face visible in partial profile. Full figure visible with hair or cape caught in movement. Mysterious intriguing angle.`,
  },
  // Dynamic poses
  {
    id: 'running',
    label: 'Running',
    description: 'Mid-run dynamic pose',
    tags: ['action', 'running', 'training', 'full-body'],
    icon: '🏃',
    prompt: `Zoomed out wide shot, full-body character illustration from head to feet. Dynamic running pose mid-stride, complete figure in motion. One leg forward, opposite arm swinging. Hair and clothing flowing with movement. Extra frame space to show full running motion. Athletic powerful movement captured.`,
  },
  {
    id: 'jumping',
    label: 'Jumping',
    description: 'Airborne leap pose',
    tags: ['action', 'jumping', 'training', 'full-body'],
    icon: '⬆️',
    prompt: `Zoomed out wide shot, full-body character illustration showing complete airborne figure. Dynamic jumping pose suspended in air. Legs bent or extended, arms positioned for balance. Cape and hair floating upward. Wide framing with space above and below figure. Peak of leap moment.`,
  },
  {
    id: 'crouching',
    label: 'Crouching',
    description: 'Low crouched position',
    tags: ['stealth', 'crouching', 'training', 'full-body'],
    icon: '🧎',
    prompt: `Zoomed out wide shot, full-body character illustration from head to feet. Low crouching position, complete compressed figure visible. Knees bent deeply, one hand may touch ground for balance. Alert ready expression. Stealthy or ready-to-spring posture. Full body visible despite compact pose.`,
  },
  {
    id: 'kneeling',
    label: 'Kneeling',
    description: 'One knee down pose',
    tags: ['kneeling', 'reverent', 'training', 'full-body'],
    icon: '🧎',
    prompt: `Zoomed out wide shot, full-body character illustration from head to feet. Kneeling pose with one knee on ground, other leg bent at 90 degrees. Complete figure visible including ground contact. Hands may rest on raised knee or hold item. Respectful or resting position.`,
  },
  // Expressive poses
  {
    id: 'pointing',
    label: 'Pointing',
    description: 'Pointing gesture pose',
    tags: ['gesture', 'commanding', 'training', 'full-body'],
    icon: '👉',
    prompt: `Zoomed out wide shot, full-body character illustration from head to feet. Commanding pose with arm fully extended pointing forward. Complete figure visible with extended arm in frame. Other arm at side or on hip. Determined directing expression. Strong authoritative body language.`,
  },
  {
    id: 'gesturing',
    label: 'Gesturing',
    description: 'Expressive hand gestures',
    tags: ['gesture', 'expressive', 'training', 'full-body'],
    icon: '🙌',
    prompt: `Zoomed out wide shot, full-body character illustration from head to feet. Expressive pose with hands raised in gesture, arms fully visible. Could be casting spell, giving speech, or emotional expression. Open palms, animated posture. Full figure showing complete gesture.`,
  },
  {
    id: 'leaning',
    label: 'Leaning',
    description: 'Casual leaning pose',
    tags: ['casual', 'leaning', 'training', 'full-body'],
    icon: '😎',
    prompt: `Zoomed out wide shot, full-body character illustration from head to feet. Casual leaning pose against implied wall or surface. One shoulder against support, arms crossed or thumbs in belt. Complete figure visible in relaxed posture. Cool approachable demeanor, weight shifted naturally.`,
  },
]

// ============================================================================
// Expression/Mood Options
// ============================================================================

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
]

// ============================================================================
// Dimension Mapping
// ============================================================================

export const characterDimensionOptions: Record<CharacterDimension, CharacterPromptOption[]> = {
  archetype: ARCHETYPE_OPTIONS,
  pose: POSE_OPTIONS,
  mood: EXPRESSION_OPTIONS,
}

// ============================================================================
// Avatar Style Prompts
// ============================================================================

export const AVATAR_STYLE_PROMPTS: Record<string, string> = {
  pixel: `16-bit pixel art character face portrait. Square 1:1 frame, head and shoulders only. Limited color palette, clean pixelated edges. Classic SNES/GBA aesthetic.`,
  chibi: `Chibi style character face portrait. Square 1:1 frame, large expressive head. Exaggerated cute proportions, big eyes. Soft rounded features, bright colors.`,
  portrait: `Detailed character face portrait bust. Square 1:1 frame, head and upper shoulders. Painterly illustrated style. Focus on face, eyes, and expression.`,
  rpg: `Modern RPG videogame character portrait. Square 1:1 frame, head and shoulders. High-quality digital art like Dragon Age or Baldur's Gate 3. Dramatic lighting, detailed facial features.`,
  cartoon: `Stylized tactical cartoon character face portrait. Square 1:1 frame, head and shoulders. Thick clean outlines, smooth cel-shaded coloring. Muted tactical colors, clean flat tones. Serious stylized proportions.`,
  handdrawn: `Elegantly detailed artisan sketch character face portrait. Square 1:1 frame, head and shoulders. Delicate pencil gradients with confident ink strokes. Layered cross-hatching, nuanced shading, subtle grainy paper texture. Traditional pencil-and-ink artistry.`,
  gothic: `Grimdark baroque digital painting character face portrait. Square 1:1 frame, head and shoulders. Heavy brushwork, dramatic chiaroscuro lighting. Warm candlelight glow, oppressive dark atmosphere. Gothic ornate detailing.`,
  story: `Character face portrait in the story's art style. Square 1:1 frame, head and shoulders. Consistent with the story's visual aesthetic.`,
}
