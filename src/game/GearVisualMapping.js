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
      idle:   { offsetX: 0, offsetY: -26, scale: 0.75 },
      move:   { offsetX: 0, offsetY: -25, scale: 0.75 },
      attack: { offsetX: 2, offsetY: -27, scale: 0.75 },
    },
    chest: {
      idle:   { offsetX: 0, offsetY: -10, scale: 0.85 },
      move:   { offsetX: 0, offsetY: -9, scale: 0.85 },
      attack: { offsetX: 1, offsetY: -11, scale: 0.85 },
    },
    weapon: {
      idle:   { offsetX: 6, offsetY: 2, scale: 0.8, flipWithChar: true },
      move:   { offsetX: 5, offsetY: 3, scale: 0.8, flipWithChar: true },
      attack: { offsetX: 8, offsetY: -4, scale: 0.85, flipWithChar: true },
    },
    shield: {
      idle:   { offsetX: -8, offsetY: 0, scale: 0.75, flipWithChar: true },
      move:   { offsetX: -7, offsetY: 1, scale: 0.75, flipWithChar: true },
      attack: { offsetX: -6, offsetY: -2, scale: 0.75, flipWithChar: true },
    },
  },

  warrior: {
    helmet: {
      idle:   { offsetX: 0, offsetY: -24, scale: 0.95 },
      move:   { offsetX: 0, offsetY: -23, scale: 0.95 },
      attack: { offsetX: 1, offsetY: -25, scale: 0.95 },
    },
    chest: {
      idle:   { offsetX: 0, offsetY: -8, scale: 1.1 },
      move:   { offsetX: 0, offsetY: -7, scale: 1.1 },
      attack: { offsetX: 0, offsetY: -9, scale: 1.1 },
    },
    weapon: {
      idle:   { offsetX: 8, offsetY: 0, scale: 1.0, flipWithChar: true },
      move:   { offsetX: 7, offsetY: 2, scale: 1.0, flipWithChar: true },
      attack: { offsetX: 10, offsetY: -6, scale: 1.05, flipWithChar: true },
    },
    shield: {
      idle:   { offsetX: -10, offsetY: 0, scale: 0.95, flipWithChar: true },
      move:   { offsetX: -9, offsetY: 2, scale: 0.95, flipWithChar: true },
      attack: { offsetX: -8, offsetY: -4, scale: 0.95, flipWithChar: true },
    },
  },

  lancer: {
    helmet: {
      idle:   { offsetX: 0, offsetY: -25, scale: 0.8 },
      move:   { offsetX: 0, offsetY: -24, scale: 0.8 },
      attack: { offsetX: 1, offsetY: -26, scale: 0.8 },
    },
    chest: {
      idle:   { offsetX: 0, offsetY: -9, scale: 0.9 },
      move:   { offsetX: 0, offsetY: -8, scale: 0.9 },
      attack: { offsetX: 0, offsetY: -10, scale: 0.9 },
    },
    weapon: {
      idle:   { offsetX: 4, offsetY: 8, scale: 1.15, flipWithChar: true }, // Spears are longer, positioned lower
      move:   { offsetX: 3, offsetY: 10, scale: 1.15, flipWithChar: true },
      attack: { offsetX: 6, offsetY: 0, scale: 1.2, flipWithChar: true }, // Extended for thrust
    },
    shield: {
      idle:   { offsetX: -8, offsetY: 0, scale: 0.85, flipWithChar: true },
      move:   { offsetX: -7, offsetY: 1, scale: 0.85, flipWithChar: true },
      attack: { offsetX: -6, offsetY: -3, scale: 0.85, flipWithChar: true },
    },
  },

  monk: {
    helmet: {
      idle:   { offsetX: 0, offsetY: -27, scale: 0.7 },
      move:   { offsetX: 0, offsetY: -26, scale: 0.7 },
      attack: { offsetX: 1, offsetY: -28, scale: 0.7 },
    },
    chest: {
      idle:   { offsetX: 0, offsetY: -12, scale: 0.75 },
      move:   { offsetX: 0, offsetY: -11, scale: 0.75 },
      attack: { offsetX: 0, offsetY: -13, scale: 0.75 },
    },
    weapon: {
      idle:   { offsetX: 5, offsetY: 0, scale: 0.85, flipWithChar: true },
      move:   { offsetX: 4, offsetY: 1, scale: 0.85, flipWithChar: true },
      attack: { offsetX: 7, offsetY: -3, scale: 0.9, flipWithChar: true },
    },
    shield: {
      idle:   { offsetX: -6, offsetY: 0, scale: 0.7, flipWithChar: true },
      move:   { offsetX: -5, offsetY: 1, scale: 0.7, flipWithChar: true },
      attack: { offsetX: -5, offsetY: -2, scale: 0.7, flipWithChar: true },
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
 * Get sprite URL for a weapon based on type and rarity
 */
function getWeaponSprite(weaponType, rarity = 'common') {
  // Prefer specific weapon type; fall back to wood/gold resources
  const weapons = EQUIPMENT_SPRITES?.weapons || {};
  
  if (weapons[weaponType]) return weapons[weaponType];
  
  // Fallback based on rarity and type
  if (weaponType === 'staff' || weaponType === 'wand') {
    return getTerrainSprite('resources', 'gold');
  }
  if (weaponType === 'bow') {
    return getTerrainSprite('resources', 'wood');
  }
  
  // Default to sword-like weapon
  return getTerrainSprite('resources', 'wood');
}

/**
 * Get helmet sprite based on rarity
 */
function getHelmetSprite(rarity = 'common') {
  const helmets = EQUIPMENT_SPRITES?.helmets || {};
  return helmets[rarity] || helmets.common || getTerrainSprite('rocks', 'rock1');
}

/**
 * Get chest/armor sprite based on rarity
 */
function getChestSprite(rarity = 'common') {
  const chest = EQUIPMENT_SPRITES?.chest || {};
  return chest[rarity] || chest.common || getTerrainSprite('rocks', 'rock2');
}

/**
 * Get shield sprite
 */
function getShieldSprite() {
  const offhand = EQUIPMENT_SPRITES?.offhand || {};
  return offhand.shield || getTerrainSprite('rocks', 'rock4');
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
    spriteUrl = getShieldSprite();
  }

  // If no sprite found, try to find a reasonable fallback
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
  CLASS_GEAR_CONFIG,
};