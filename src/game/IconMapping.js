/**
 * IconMapping.js
 * 
 * Maps item types to sprite-based icons from the asset registry.
 * Replaces emoji with actual game sprites for a polished RPG look.
 */

import { getTerrainSprite, EFFECT_SPRITES } from './CompleteAssetRegistry.js';

// Icon mappings: item slot/type → sprite URL
export const ICON_MAPPING = {
  // Weapons
  weapon: getTerrainSprite('resources', 'wood'), // Placeholder - wood resource
  sword: getTerrainSprite('resources', 'wood'),
  bow: getTerrainSprite('resources', 'wood'),
  staff: getTerrainSprite('resources', 'gold'),
  spear: getTerrainSprite('resources', 'wood'),
  
  // Armor
  helmet: getTerrainSprite('rocks', 'rock1'),
  chest: getTerrainSprite('rocks', 'rock2'),
  pants: getTerrainSprite('rocks', 'rock3'),
  gloves: getTerrainSprite('rocks', 'rock4'),
  boots: getTerrainSprite('rocks', 'rock1'),
  
  // Accessories
  shield: getTerrainSprite('rocks', 'rock1'),
  ring: getTerrainSprite('resources', 'gold'),
  amulet: getTerrainSprite('resources', 'gold'),
  trinket: EFFECT_SPRITES.fire, // Magic-looking effect
  
  // Resources/Consumables
  wood: getTerrainSprite('resources', 'wood'),
  ore: getTerrainSprite('resources', 'gold'),
  meat: getTerrainSprite('resources', 'meat'),
  raw_meat: getTerrainSprite('resources', 'meat'),
  hide: getTerrainSprite('resources', 'meat'),
  wool: getTerrainSprite('resources', 'wood'),
  
  // Default
  default: getTerrainSprite('resources', 'gold'),
};

/**
 * Get icon sprite URL for an item
 * @param {object} item - Item object
 * @returns {string|null} Sprite URL
 */
export function getItemIconSprite(item) {
  if (!item) return ICON_MAPPING.default;
  
  // Try slot-based mapping first (weapon, helmet, chest, etc.)
  if (item.slot && ICON_MAPPING[item.slot]) {
    return ICON_MAPPING[item.slot];
  }
  
  // Try item ID mapping (wood, ore, meat, etc.)
  if (item.id && ICON_MAPPING[item.id]) {
    return ICON_MAPPING[item.id];
  }
  
  // Try item name mapping (lowercase)
  const nameLower = item.name?.toLowerCase() || '';
  if (nameLower.includes('sword') || nameLower.includes('blade')) return ICON_MAPPING.sword;
  if (nameLower.includes('bow')) return ICON_MAPPING.bow;
  if (nameLower.includes('staff') || nameLower.includes('wand')) return ICON_MAPPING.staff;
  if (nameLower.includes('spear') || nameLower.includes('lance')) return ICON_MAPPING.spear;
  if (nameLower.includes('shield')) return ICON_MAPPING.shield;
  if (nameLower.includes('helmet') || nameLower.includes('helm')) return ICON_MAPPING.helmet;
  if (nameLower.includes('chest') || nameLower.includes('plate')) return ICON_MAPPING.chest;
  if (nameLower.includes('pants') || nameLower.includes('leg')) return ICON_MAPPING.pants;
  if (nameLower.includes('glove') || nameLower.includes('gaunt')) return ICON_MAPPING.gloves;
  if (nameLower.includes('boot') || nameLower.includes('shoe')) return ICON_MAPPING.boots;
  if (nameLower.includes('ring')) return ICON_MAPPING.ring;
  if (nameLower.includes('amulet') || nameLower.includes('pendant')) return ICON_MAPPING.amulet;
  if (nameLower.includes('trinket') || nameLower.includes('orb') || nameLower.includes('gem')) return ICON_MAPPING.trinket;
  if (nameLower.includes('wood')) return ICON_MAPPING.wood;
  if (nameLower.includes('ore') || nameLower.includes('gold')) return ICON_MAPPING.ore;
  if (nameLower.includes('meat')) return ICON_MAPPING.meat;
  if (nameLower.includes('hide')) return ICON_MAPPING.hide;
  if (nameLower.includes('wool')) return ICON_MAPPING.wool;
  
  // Default fallback
  return ICON_MAPPING.default;
}

export default { ICON_MAPPING, getItemIconSprite };