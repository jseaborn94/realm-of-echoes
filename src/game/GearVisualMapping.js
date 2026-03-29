/**
 * GearVisualMapping.js
 * 
 * Maps equipped items to visual sprites based on slot, type, and class.
 * Provides class-aware variants and intelligent fallbacks.
 */

import { EQUIPMENT_SPRITES, getTerrainSprite } from './CompleteAssetRegistry.js';

/**
 * Class-specific gear positioning and scaling
 * Archer: lighter, more refined armor
 * Warrior: heavy, chunky armor
 * Lancer: elongated, pole-weapon focused
 * Monk: light, minimal gear
 */
const CLASS_GEAR_CONFIG = {
  archer: {
    helmet: { scale: 0.75, offsetY: -26 },
    chest: { scale: 0.85, offsetY: -10 },
    weapon: { scale: 0.8, offsetY: 0 },
  },
  warrior: {
    helmet: { scale: 0.95, offsetY: -24 },
    chest: { scale: 1.1, offsetY: -8 },
    weapon: { scale: 1.0, offsetY: -2 },
  },
  lancer: {
    helmet: { scale: 0.8, offsetY: -25 },
    chest: { scale: 0.9, offsetY: -9 },
    weapon: { scale: 1.15, offsetY: 4 }, // Spears are longer
  },
  monk: {
    helmet: { scale: 0.7, offsetY: -27 },
    chest: { scale: 0.75, offsetY: -12 },
    weapon: { scale: 0.85, offsetY: -1 },
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
 * Returns { spriteUrl, scale, offsetY, flipWithChar }
 */
export function mapGearVisual(slot, item, classId = 'warrior') {
  if (!item) return null;

  const classConfig = CLASS_GEAR_CONFIG[classId] || CLASS_GEAR_CONFIG.warrior;
  const config = classConfig[slot];
  
  if (!config) return null; // Unsupported slot

  let spriteUrl = null;
  let scale = config.scale;
  let offsetY = config.offsetY;
  let flipWithChar = false;

  // Determine sprite based on slot
  if (slot === 'weapon') {
    const weaponType = getWeaponType(item);
    const rarity = getItemRarity(item);
    spriteUrl = getWeaponSprite(weaponType, rarity);
    flipWithChar = true; // Weapons follow character facing
  } else if (slot === 'helmet' || slot === 'head') {
    const rarity = getItemRarity(item);
    spriteUrl = getHelmetSprite(rarity);
  } else if (slot === 'chest' || slot === 'body' || slot === 'armor') {
    const rarity = getItemRarity(item);
    spriteUrl = getChestSprite(rarity);
  } else if (slot === 'shield' || slot === 'offhand') {
    spriteUrl = getShieldSprite();
    flipWithChar = true;
  }

  // If no sprite found, try to find a reasonable fallback
  if (!spriteUrl) {
    spriteUrl = getTerrainSprite('rocks', 'rock1');
  }

  return {
    spriteUrl,
    scale,
    offsetY,
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
export function getEquippedVisuals(equipped, classId = 'warrior') {
  if (!equipped) return {};

  const visuals = {};
  const slots = ['weapon', 'helmet', 'chest', 'shield'];

  for (const slot of slots) {
    const item = equipped[slot];
    if (!item) continue;

    const visual = mapGearVisual(slot, item, classId);
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