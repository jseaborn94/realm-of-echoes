/**
 * GearVisualMapping.js
 * 
 * Maps equipped items to visual sprites based on slot, type, and class.
 * Provides class-aware variants and intelligent fallbacks.
 */

import { EQUIPMENT_SPRITES, getTerrainSprite } from './CompleteAssetRegistry.js';

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
      idle:   { offsetX: 0, offsetY: -22, scale: 0.65 },  // Smaller, lower to show face
      move:   { offsetX: 0, offsetY: -21, scale: 0.65 },
      attack: { offsetX: 2, offsetY: -23, scale: 0.65 },
    },
    chest: {
      idle:   { offsetX: 0, offsetY: -8, scale: 0.75 },   // Slightly smaller for clarity
      move:   { offsetX: 0, offsetY: -7, scale: 0.75 },
      attack: { offsetX: 1, offsetY: -9, scale: 0.75 },
    },
    weapon: {
      idle:   { offsetX: 5, offsetY: 3, scale: 0.6, flipWithChar: true },      // Smaller weapon
      move:   { offsetX: 4, offsetY: 4, scale: 0.6, flipWithChar: true },
      attack: { offsetX: 6, offsetY: -2, scale: 0.65, flipWithChar: true },
    },
    shield: {
      idle:   { offsetX: -6, offsetY: 2, scale: 0.6, flipWithChar: true },     // Compact shield
      move:   { offsetX: -5, offsetY: 3, scale: 0.6, flipWithChar: true },
      attack: { offsetX: -4, offsetY: 0, scale: 0.6, flipWithChar: true },
    },
  },

  warrior: {
    helmet: {
      idle:   { offsetX: 0, offsetY: -20, scale: 0.75 },   // Show more face
      move:   { offsetX: 0, offsetY: -19, scale: 0.75 },
      attack: { offsetX: 1, offsetY: -21, scale: 0.75 },
    },
    chest: {
      idle:   { offsetX: 0, offsetY: -6, scale: 0.95 },    // Refined size
      move:   { offsetX: 0, offsetY: -5, scale: 0.95 },
      attack: { offsetX: 0, offsetY: -7, scale: 0.95 },
    },
    weapon: {
      idle:   { offsetX: 6, offsetY: 2, scale: 0.7, flipWithChar: true },      // Smaller weapon
      move:   { offsetX: 5, offsetY: 4, scale: 0.7, flipWithChar: true },
      attack: { offsetX: 8, offsetY: -4, scale: 0.75, flipWithChar: true },
    },
    shield: {
      idle:   { offsetX: -8, offsetY: 2, scale: 0.8, flipWithChar: true },     // Compact shield
      move:   { offsetX: -7, offsetY: 3, scale: 0.8, flipWithChar: true },
      attack: { offsetX: -6, offsetY: -2, scale: 0.8, flipWithChar: true },
    },
  },

  lancer: {
    helmet: {
      idle:   { offsetX: 0, offsetY: -21, scale: 0.7 },    // Show face better
      move:   { offsetX: 0, offsetY: -20, scale: 0.7 },
      attack: { offsetX: 1, offsetY: -22, scale: 0.7 },
    },
    chest: {
      idle:   { offsetX: 0, offsetY: -7, scale: 0.8 },     // Refined
      move:   { offsetX: 0, offsetY: -6, scale: 0.8 },
      attack: { offsetX: 0, offsetY: -8, scale: 0.8 },
    },
    weapon: {
      idle:   { offsetX: 3, offsetY: 10, scale: 0.9, flipWithChar: true },     // Scaled back spear
      move:   { offsetX: 2, offsetY: 12, scale: 0.9, flipWithChar: true },
      attack: { offsetX: 4, offsetY: 2, scale: 1.0, flipWithChar: true },
    },
    shield: {
      idle:   { offsetX: -6, offsetY: 2, scale: 0.7, flipWithChar: true },     // Smaller shield
      move:   { offsetX: -5, offsetY: 3, scale: 0.7, flipWithChar: true },
      attack: { offsetX: -4, offsetY: 0, scale: 0.7, flipWithChar: true },
    },
  },

  monk: {
    helmet: {
      idle:   { offsetX: 0, offsetY: -23, scale: 0.6 },    // Minimal helmet
      move:   { offsetX: 0, offsetY: -22, scale: 0.6 },
      attack: { offsetX: 1, offsetY: -24, scale: 0.6 },
    },
    chest: {
      idle:   { offsetX: 0, offsetY: -10, scale: 0.65 },   // Light armor
      move:   { offsetX: 0, offsetY: -9, scale: 0.65 },
      attack: { offsetX: 0, offsetY: -11, scale: 0.65 },
    },
    weapon: {
      idle:   { offsetX: 4, offsetY: 2, scale: 0.6, flipWithChar: true },      // Subtle staff
      move:   { offsetX: 3, offsetY: 3, scale: 0.6, flipWithChar: true },
      attack: { offsetX: 5, offsetY: -2, scale: 0.65, flipWithChar: true },
    },
    shield: {
      idle:   { offsetX: -4, offsetY: 2, scale: 0.55, flipWithChar: true },    // Minimal shield
      move:   { offsetX: -3, offsetY: 3, scale: 0.55, flipWithChar: true },
      attack: { offsetX: -3, offsetY: 0, scale: 0.55, flipWithChar: true },
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
 * Used when no exact item or family visual exists
 */
const GENERIC_SLOT_VISUALS = {
  weapon: {
    sword: () => getTerrainSprite('resources', 'wood'),
    bow: () => getTerrainSprite('resources', 'wood'),
    staff: () => getTerrainSprite('resources', 'gold'),
    spear: () => getTerrainSprite('resources', 'wood'),
    axe: () => getTerrainSprite('resources', 'wood'),
    dagger: () => getTerrainSprite('resources', 'wood'),
  },
  helmet: {
    common: () => getTerrainSprite('rocks', 'rock1'),
    uncommon: () => getTerrainSprite('rocks', 'rock2'),
    rare: () => getTerrainSprite('rocks', 'rock3'),
    epic: () => getTerrainSprite('rocks', 'rock4'),
  },
  chest: {
    common: () => getTerrainSprite('rocks', 'rock2'),
    uncommon: () => getTerrainSprite('rocks', 'rock3'),
    rare: () => getTerrainSprite('resources', 'gold'),
    epic: () => getTerrainSprite('resources', 'gold'),
  },
  shield: {
    common: () => getTerrainSprite('rocks', 'rock4'),
    uncommon: () => getTerrainSprite('rocks', 'rock3'),
    rare: () => getTerrainSprite('resources', 'gold'),
    epic: () => getTerrainSprite('resources', 'gold'),
  },
};

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
 * Get shield sprite with fallback priority:
 * 1. Exact shield sprite
 * 2. Generic rarity-based shield
 * 3. Default shield
 */
function getShieldSprite(rarity = 'common') {
  // Priority 1: Exact shield sprite
  const offhand = EQUIPMENT_SPRITES?.offhand || {};
  if (offhand.shield) return offhand.shield;
  
  // Priority 2: Generic rarity-based shield
  const genericShield = GENERIC_SLOT_VISUALS.shield[rarity] || GENERIC_SLOT_VISUALS.shield.common;
  if (genericShield) return genericShield();
  
  // Priority 3: Fallback
  return getTerrainSprite('rocks', 'rock4');
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
 * Returns { weapon: {...}, helmet: {...}, chest: {...}, ... }
 */
export function getEquippedVisuals(equipped, classId = 'warrior', animState = 'idle') {
  if (!equipped) return {};

  const visuals = {};
  const slots = ['weapon', 'helmet', 'chest', 'shield'];

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