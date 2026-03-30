/**
 * GearVisualMapping.js
 * 
 * Maps equipped items to visual sprites based on slot, type, and class.
 * Provides class-aware variants and intelligent fallbacks.
 */

import { getTerrainSprite } from './CompleteAssetRegistry.js';

// No verified equipment sprites yet — all lookups return null gracefully
const EQUIPMENT_SPRITES = {};

/**
 * Anchor-point based gear positioning system
 * Per-class, per-slot, per-animation-state alignment
 * Prevents floating, clipping, and drift during movement
 * 
 * offsetX: horizontal offset (0 = center on character)
 * offsetY: vertical offset (negative = above character)
 * scale: size multiplier relative to character
 */
const GEAR_ANCHOR_POINTS = {
  archer: {
    helmet: {
      idle:   { offsetX: 0, offsetY: -24, scale: 0.55 },  // Very small, clear face visibility
      move:   { offsetX: 0, offsetY: -23, scale: 0.55 },
      attack: { offsetX: 2, offsetY: -25, scale: 0.55 },
    },
    chest: {
      idle:   { offsetX: 0, offsetY: -9, scale: 0.60 },   // Light, minimal armor
      move:   { offsetX: 0, offsetY: -8, scale: 0.60 },
      attack: { offsetX: 1, offsetY: -10, scale: 0.60 },
    },
    weapon: {
      idle:   { offsetX: 5, offsetY: 3, scale: 0.55, flipWithChar: true },     // Compact bow
      move:   { offsetX: 4, offsetY: 4, scale: 0.55, flipWithChar: true },
      attack: { offsetX: 6, offsetY: -2, scale: 0.60, flipWithChar: true },
    },
    shield: {
      idle:   { offsetX: -5, offsetY: 3, scale: 0.50, flipWithChar: true },    // Small shield
      move:   { offsetX: -4, offsetY: 4, scale: 0.50, flipWithChar: true },
      attack: { offsetX: -3, offsetY: 1, scale: 0.50, flipWithChar: true },
    },
    cape: {
      idle:   { offsetX: -2, offsetY: 12, scale: 0.65, flipWithChar: true },   // Back accessory
      move:   { offsetX: -2, offsetY: 12, scale: 0.65, flipWithChar: true },
      attack: { offsetX: 0, offsetY: 10, scale: 0.65, flipWithChar: true },
    },
    boots: {
      idle:   { offsetX: 0, offsetY: 18, scale: 0.55 },   // Subtle feet armor
      move:   { offsetX: 0, offsetY: 18, scale: 0.55 },
      attack: { offsetX: 0, offsetY: 18, scale: 0.55 },
    },
  },

  warrior: {
    helmet: {
      idle:   { offsetX: 0, offsetY: -22, scale: 0.70 },   // Visible face, armored feel
      move:   { offsetX: 0, offsetY: -21, scale: 0.70 },
      attack: { offsetX: 1, offsetY: -23, scale: 0.70 },
    },
    chest: {
      idle:   { offsetX: 0, offsetY: -5, scale: 1.0 },     // Full heavy armor presence
      move:   { offsetX: 0, offsetY: -4, scale: 1.0 },
      attack: { offsetX: 0, offsetY: -6, scale: 1.0 },
    },
    weapon: {
      idle:   { offsetX: 7, offsetY: 0, scale: 0.75, flipWithChar: true },     // Prominent sword
      move:   { offsetX: 6, offsetY: 2, scale: 0.75, flipWithChar: true },
      attack: { offsetX: 9, offsetY: -5, scale: 0.80, flipWithChar: true },
    },
    shield: {
      idle:   { offsetX: -8, offsetY: 0, scale: 0.85, flipWithChar: true },    // Large shield
      move:   { offsetX: -7, offsetY: 2, scale: 0.85, flipWithChar: true },
      attack: { offsetX: -6, offsetY: -3, scale: 0.85, flipWithChar: true },
    },
    cape: {
      idle:   { offsetX: -3, offsetY: 10, scale: 0.75, flipWithChar: true },   // Heavier back armor
      move:   { offsetX: -3, offsetY: 10, scale: 0.75, flipWithChar: true },
      attack: { offsetX: -1, offsetY: 8, scale: 0.75, flipWithChar: true },
    },
    boots: {
      idle:   { offsetX: 0, offsetY: 18, scale: 0.65 },   // Solid boot presence
      move:   { offsetX: 0, offsetY: 18, scale: 0.65 },
      attack: { offsetX: 0, offsetY: 18, scale: 0.65 },
    },
  },

  lancer: {
    helmet: {
      idle:   { offsetX: 0, offsetY: -23, scale: 0.62 },   // Show face, medium armor
      move:   { offsetX: 0, offsetY: -22, scale: 0.62 },
      attack: { offsetX: 1, offsetY: -24, scale: 0.62 },
    },
    chest: {
      idle:   { offsetX: 0, offsetY: -6, scale: 0.85 },    // Balanced plate
      move:   { offsetX: 0, offsetY: -5, scale: 0.85 },
      attack: { offsetX: 0, offsetY: -7, scale: 0.85 },
    },
    weapon: {
      idle:   { offsetX: 2, offsetY: 12, scale: 1.0, flipWithChar: true },     // Full-length spear visible
      move:   { offsetX: 1, offsetY: 14, scale: 1.0, flipWithChar: true },
      attack: { offsetX: 3, offsetY: 0, scale: 1.1, flipWithChar: true },      // Emphasize reach
    },
    shield: {
      idle:   { offsetX: -6, offsetY: 2, scale: 0.65, flipWithChar: true },    // Smaller shield
      move:   { offsetX: -5, offsetY: 3, scale: 0.65, flipWithChar: true },
      attack: { offsetX: -4, offsetY: 0, scale: 0.65, flipWithChar: true },
    },
    cape: {
      idle:   { offsetX: -2, offsetY: 12, scale: 0.70, flipWithChar: true },   // Flowing cape
      move:   { offsetX: -2, offsetY: 12, scale: 0.70, flipWithChar: true },
      attack: { offsetX: 0, offsetY: 10, scale: 0.70, flipWithChar: true },
    },
    boots: {
      idle:   { offsetX: 0, offsetY: 18, scale: 0.60 },   // Medium boot presence
      move:   { offsetX: 0, offsetY: 18, scale: 0.60 },
      attack: { offsetX: 0, offsetY: 18, scale: 0.60 },
    },
  },

  monk: {
    helmet: {
      idle:   { offsetX: 0, offsetY: -25, scale: 0.50 },   // Minimal, ceremonial
      move:   { offsetX: 0, offsetY: -24, scale: 0.50 },
      attack: { offsetX: 1, offsetY: -26, scale: 0.50 },
    },
    chest: {
      idle:   { offsetX: 0, offsetY: -11, scale: 0.55 },   // Very light armor
      move:   { offsetX: 0, offsetY: -10, scale: 0.55 },
      attack: { offsetX: 0, offsetY: -12, scale: 0.55 },
    },
    weapon: {
      idle:   { offsetX: 4, offsetY: 1, scale: 0.55, flipWithChar: true },     // Elegant staff
      move:   { offsetX: 3, offsetY: 2, scale: 0.55, flipWithChar: true },
      attack: { offsetX: 5, offsetY: -3, scale: 0.60, flipWithChar: true },
    },
    shield: {
      idle:   { offsetX: -4, offsetY: 3, scale: 0.45, flipWithChar: true },    // Minimal shield
      move:   { offsetX: -3, offsetY: 4, scale: 0.45, flipWithChar: true },
      attack: { offsetX: -2, offsetY: 1, scale: 0.45, flipWithChar: true },
    },
    cape: {
      idle:   { offsetX: -1, offsetY: 13, scale: 0.60, flipWithChar: true },   // Light ceremonial cape
      move:   { offsetX: -1, offsetY: 13, scale: 0.60, flipWithChar: true },
      attack: { offsetX: 1, offsetY: 11, scale: 0.60, flipWithChar: true },
    },
    boots: {
      idle:   { offsetX: 0, offsetY: 18, scale: 0.50 },   // Minimal foot gear
      move:   { offsetX: 0, offsetY: 18, scale: 0.50 },
      attack: { offsetX: 0, offsetY: 18, scale: 0.50 },
    },
  },
};

/**
 * Weapon type detection from item name or properties
 */
function getWeaponType(item) {
  if (!item) return 'sword';
  
  const name = item.name?.toLowerCase() || '';
  const desc = item.description?.toLowerCase() || '';
  const fullText = name + ' ' + desc;

  if (fullText.includes('bow')) return 'bow';
  if (fullText.includes('staff') || fullText.includes('wand') || fullText.includes('rod')) return 'staff';
  if (fullText.includes('spear') || fullText.includes('lance') || fullText.includes('pike') || fullText.includes('halberd')) return 'spear';
  if (fullText.includes('axe')) return 'axe';
  if (fullText.includes('dagger') || fullText.includes('knife')) return 'dagger';
  
  return 'sword'; // default
}

/**
 * Armor rarity detection
 */
function getItemRarity(item) {
  return item?.rarity || 'common';
}

/**
 * Generic slot visuals fallback registry
 * Uses unit-derived sprites and linear assets for believable gear appearance
 */
const GENERIC_SLOT_VISUALS = {
  weapon: {
    sword: () => `${GITHUB_RAW_BASE}/Terrain/Resources/Wood/Trees/Tree1.png`,      // Vertical blade shape
    bow: () => `${GITHUB_RAW_BASE}/Terrain/Resources/Gold/Gold Resource/Gold_Resource.png`, // Prod/limb shape
    staff: () => `${GITHUB_RAW_BASE}/Terrain/Resources/Gold/Gold Resource/Gold_Resource.png`, // Orb-tipped staff
    spear: () => `${GITHUB_RAW_BASE}/Terrain/Resources/Wood/Trees/Tree2.png`,      // Vertical shaft
    axe: () => `${GITHUB_RAW_BASE}/Terrain/Resources/Wood/Wood Resource/Wood Resource.png`,  // Head shape
    dagger: () => `${GITHUB_RAW_BASE}/Terrain/Water/Rocks/Rocks_01.png`,           // Compact blade
  },
  helmet: {
    common: () => `${GITHUB_RAW_BASE}/Units/Black Units/Warrior/Warrior_Idle.png`, // Dark helm
    uncommon: () => `${GITHUB_RAW_BASE}/Units/Blue Units/Warrior/Warrior_Idle.png`, // Blue helm
    rare: () => `${GITHUB_RAW_BASE}/Units/Red Units/Warrior/Warrior_Idle.png`,     // Red helm
    epic: () => `${GITHUB_RAW_BASE}/Units/Yellow Units/Warrior/Warrior_Idle.png`,  // Gold helm
  },
  chest: {
    common: () => `${GITHUB_RAW_BASE}/Units/Black Units/Lancer/Lancer_Idle.png`,   // Simple plate
    uncommon: () => `${GITHUB_RAW_BASE}/Units/Blue Units/Lancer/Lancer_Idle.png`,  // Blue armor
    rare: () => `${GITHUB_RAW_BASE}/Units/Red Units/Archer/Archer_Idle.png`,       // Red armor
    epic: () => `${GITHUB_RAW_BASE}/Units/Yellow Units/Monk/Idle.png`,             // Gold armor
  },
  shield: {
    common: () => `${GITHUB_RAW_BASE}/Terrain/Water/Rocks/Rocks_02.png`,           // Water rock
    uncommon: () => `${GITHUB_RAW_BASE}/Terrain/Resources/Wood/Trees/Stump 1.png`, // Wood stump
    rare: () => `${GITHUB_RAW_BASE}/Terrain/Decorations/Rocks/Rock3.png`,          // Large rock
    epic: () => `${GITHUB_RAW_BASE}/Terrain/Resources/Gold/Gold Resource/Gold_Resource.png`, // Gold ore
  },
};

const GITHUB_RAW_BASE = 'https://raw.githubusercontent.com/jseaborn94/Realm-of-Echoes-Assets/main/assets';

/**
 * Get sprite URL for a weapon with fallback priority:
 * 1. Exact item sprite from EQUIPMENT_SPRITES
 * 2. Weapon type family visual (generic bow, sword, staff, etc.)
 * 3. Resource-based fallback by type
 */
function getWeaponSprite(weaponType, rarity = 'common') {
  // Priority 1: Exact weapon sprite
  const weapons = EQUIPMENT_SPRITES?.weapons || {};
  if (weapons[weaponType]) return weapons[weaponType];
  
  // Priority 2: Generic weapon family visual
  const genericWeapon = GENERIC_SLOT_VISUALS.weapon[weaponType];
  if (genericWeapon) return genericWeapon();
  
  // Priority 3: Default sword-like fallback
  return getTerrainSprite('resources', 'wood');
}

/**
 * Get helmet sprite with fallback priority:
 * 1. Exact rarity sprite
 * 2. Generic rarity-based helmet visual
 * 3. Default helmet
 */
function getHelmetSprite(rarity = 'common') {
  // Priority 1: Exact rarity sprite
  const helmets = EQUIPMENT_SPRITES?.helmets || {};
  if (helmets[rarity]) return helmets[rarity];
  if (helmets.common) return helmets.common;
  
  // Priority 2: Generic rarity-based helmet
  const genericHelmet = GENERIC_SLOT_VISUALS.helmet[rarity] || GENERIC_SLOT_VISUALS.helmet.common;
  if (genericHelmet) return genericHelmet();
  
  // Priority 3: Fallback
  return getTerrainSprite('rocks', 'rock1');
}

/**
 * Get chest/armor sprite with fallback priority:
 * 1. Exact rarity sprite
 * 2. Generic rarity-based chest visual
 * 3. Default chest
 */
function getChestSprite(rarity = 'common') {
  // Priority 1: Exact rarity sprite
  const chest = EQUIPMENT_SPRITES?.chest || {};
  if (chest[rarity]) return chest[rarity];
  if (chest.common) return chest.common;
  
  // Priority 2: Generic rarity-based chest
  const genericChest = GENERIC_SLOT_VISUALS.chest[rarity] || GENERIC_SLOT_VISUALS.chest.common;
  if (genericChest) return genericChest();
  
  // Priority 3: Fallback
  return getTerrainSprite('rocks', 'rock2');
}

/**
 * Get shield sprite with rarity-based priority:
 * 1. Rarity-specific shield sprite
 * 2. Generic rarity-based shield visual
 * 3. Common rarity fallback
 */
function getShieldSprite(rarity = 'common') {
  // Priority 1: Rarity-specific sprite from registry
  const offhand = EQUIPMENT_SPRITES?.offhand || {};
  if (offhand[rarity]) return offhand[rarity];
  if (offhand.common) return offhand.common;
  
  // Priority 2: Generic rarity-based shield
  const genericShield = GENERIC_SLOT_VISUALS.shield[rarity] || GENERIC_SLOT_VISUALS.shield.common;
  if (genericShield) return genericShield();
  
  // Priority 3: Fallback to water rock
  return `https://raw.githubusercontent.com/jseaborn94/Realm-of-Echoes-Assets/main/assets/Terrain/Water/Rocks/Rocks_02.png`;
}

/**
 * Map an equipped item to a visual sprite and rendering config
 * Returns { spriteUrl, scale, offsetX, offsetY, flipWithChar }
 * Uses anchor points for per-class, per-state alignment
 */
export function mapGearVisual(slot, item, classId = 'warrior', animState = 'idle') {
  if (!item) return null;

  // Get anchor points for this class/slot/animation state
  const classAnchors = GEAR_ANCHOR_POINTS[classId] || GEAR_ANCHOR_POINTS.warrior;
  const slotAnchors = classAnchors[slot];
  
  if (!slotAnchors) return null; // Unsupported slot

  // Get anchor for this animation state (fallback to idle if not found)
  const anchor = slotAnchors[animState] || slotAnchors.idle;

  let spriteUrl = null;
  let flipWithChar = anchor.flipWithChar || false;

  // Determine sprite based on slot
  if (slot === 'weapon') {
    const weaponType = getWeaponType(item);
    const rarity = getItemRarity(item);
    spriteUrl = getWeaponSprite(weaponType, rarity);
  } else if (slot === 'helmet' || slot === 'head') {
    const rarity = getItemRarity(item);
    spriteUrl = getHelmetSprite(rarity);
  } else if (slot === 'chest' || slot === 'body' || slot === 'armor') {
    const rarity = getItemRarity(item);
    spriteUrl = getChestSprite(rarity);
  } else if (slot === 'shield' || slot === 'offhand') {
    const rarity = getItemRarity(item);
    spriteUrl = getShieldSprite(rarity);
  } else if (slot === 'boots' || slot === 'pants' || slot === 'greaves') {
    const rarity = getItemRarity(item);
    spriteUrl = getChestSprite(rarity); // Reuse armor sprite for boots
  } else if (slot === 'cape' || slot === 'back' || slot === 'cloak') {
    const rarity = getItemRarity(item);
    spriteUrl = getChestSprite(rarity); // Reuse armor sprite for cape
  }

  // Final fallback: generic rock if absolutely nothing else exists
  if (!spriteUrl) {
    spriteUrl = getTerrainSprite('rocks', 'rock1');
  }

  return {
    spriteUrl,
    scale: anchor.scale,
    offsetX: anchor.offsetX,
    offsetY: anchor.offsetY,
    flipWithChar,
    slot,
    itemName: item.name || 'Unknown',
  };
}

/**
 * Normalize an item object to ensure it has required properties
 */
export function normalizeItemForGear(item) {
  if (!item) return null;

  return {
    name: item.name || 'Item',
    description: item.description || '',
    rarity: item.rarity || 'common',
    slot: item.slot || 'misc',
    stats: item.stats || {},
  };
}

/**
 * Get all visual mappings for equipped items
 * Returns { weapon: {...}, helmet: {...}, chest: {...}, boots: {...}, cape: {...}, ... }
 */
export function getEquippedVisuals(equipped, classId = 'warrior', animState = 'idle') {
  if (!equipped) return {};

  const visuals = {};
  const slots = ['weapon', 'helmet', 'chest', 'shield', 'cape', 'boots'];

  for (const slot of slots) {
    const item = equipped[slot];
    if (!item) continue;

    const visual = mapGearVisual(slot, item, classId, animState);
    if (visual) {
      visuals[slot] = visual;
    }
  }

  return visuals;
}

export default {
  mapGearVisual,
  normalizeItemForGear,
  getEquippedVisuals,
  GEAR_ANCHOR_POINTS,
  GENERIC_SLOT_VISUALS,
};