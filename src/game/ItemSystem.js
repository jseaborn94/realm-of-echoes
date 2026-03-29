// ─── Item Data Standardization ────────────────────────────────────────────────
// Every equippable item must conform to this standard structure:
// {
//   id: string (unique identifier)
//   name: string
//   icon: string (emoji)
//   itemType: 'equippable' | 'consumable' | 'material'
//   equipmentSlot: 'weapon' | 'helmet' | 'chest' | 'gloves' | 'boots' | 'ring' | 'amulet' | 'offhand' | 'belt' | 'cape' | null
//   classRestriction: 'Warrior' | 'Archer' | 'Lancer' | 'Mage' | 'All'
//   rarity: 'common' | 'uncommon' | 'rare' | 'epic' | 'legendary'
//   stats: { attack?: number, defense?: number }
//   isResource?: boolean (for stackable items)
//   qty?: number (for stacked items)
//   useEffect?: { hp?: number } (for consumables)
// }

// Legacy field mappings for backwards compatibility:
// 'slot' -> 'equipmentSlot'
// 'weaponClass' -> 'classRestriction'
// Non-resource items get 'itemType' = 'equippable'

const VALID_EQUIPMENT_SLOTS = ['weapon', 'helmet', 'chest', 'gloves', 'boots', 'ring', 'amulet', 'offhand', 'belt', 'cape'];
const VALID_CLASS_RESTRICTIONS = ['Warrior', 'Archer', 'Lancer', 'Mage', 'All'];
const VALID_RARITIES = ['common', 'uncommon', 'rare', 'epic', 'legendary'];

/**
 * Normalize item data to standard format
 * Converts legacy fields to new structure
 */
export function normalizeItem(item) {
  if (!item) return null;
  
  // Determine item type
  let itemType = item.itemType || (item.isResource ? 'consumable' : 'equippable');
  
  // Map legacy slot field
  const equipmentSlot = item.equipmentSlot || item.slot || null;
  
  // Map legacy weaponClass field to classRestriction
  let classRestriction = item.classRestriction || item.weaponClass || 'All';
  
  // Normalize class name to proper case
  if (typeof classRestriction === 'string') {
    classRestriction = classRestriction.charAt(0).toUpperCase() + classRestriction.slice(1).toLowerCase();
  }
  
  return {
    id: item.id,
    name: item.name,
    icon: item.icon,
    itemType: itemType,
    equipmentSlot: equipmentSlot,
    classRestriction: classRestriction,
    rarity: item.rarity || 'common',
    stats: item.stats || { attack: 0, defense: 0 },
    // Preserve resource/consumable fields
    ...(item.isResource && { isResource: true }),
    ...(item.qty && { qty: item.qty }),
    ...(item.useEffect && { useEffect: item.useEffect }),
  };
}

/**
 * Check if an item can be equipped into a slot
 */
export function canEquipIntoSlot(item, targetSlot) {
  if (!item || !targetSlot) return false;
  
  const normalized = normalizeItem(item);
  if (normalized.itemType !== 'equippable') return false;
  if (!normalized.equipmentSlot) return false;
  
  // Allow rings in either ring1 or ring2
  if (normalized.equipmentSlot === 'ring' && (targetSlot === 'ring1' || targetSlot === 'ring2')) {
    return true;
  }
  
  // Exact match for other slots
  return normalized.equipmentSlot === targetSlot;
}

/**
 * Check if an item meets class restriction
 */
export function meetsClassRestriction(item, playerClassId) {
  if (!item) return false;
  
  const normalized = normalizeItem(item);
  if (normalized.classRestriction === 'All') return true;
  
  // Map player class to proper case
  const playerClass = playerClassId.charAt(0).toUpperCase() + playerClassId.slice(1).toLowerCase();
  return normalized.classRestriction === playerClass;
}

/**
 * Validate equip operation: slot compatibility + class restriction
 */
export function canEquip(item, targetSlot, playerClassId) {
  if (!item || !targetSlot || !playerClassId) return false;
  
  const slotOk = canEquipIntoSlot(item, targetSlot);
  const classOk = meetsClassRestriction(item, playerClassId);
  
  return slotOk && classOk;
}

/**
 * Check if item is draggable (equippable only)
 */
export function isDraggable(item) {
  if (!item) return false;
  if (item.isResource) return false; // Resources stay in inventory
  
  const normalized = normalizeItem(item);
  return normalized.itemType === 'equippable' && normalized.equipmentSlot;
}

/**
 * Get human-readable slot name
 */
export function getSlotName(slot) {
  const names = {
    weapon: 'Weapon',
    offhand: 'Offhand',
    helmet: 'Helmet',
    chest: 'Chest',
    gloves: 'Gloves',
    boots: 'Boots',
    ring1: 'Ring 1',
    ring2: 'Ring 2',
    amulet: 'Amulet',
    belt: 'Belt',
    cape: 'Cape',
  };
  return names[slot] || slot;
}

/**
 * Validate entire item structure
 */
export function isValidEquippableItem(item) {
  if (!item || typeof item !== 'object') return false;
  
  const normalized = normalizeItem(item);
  
  if (!normalized.id || !normalized.name || !normalized.icon) return false;
  if (!VALID_EQUIPMENT_SLOTS.includes(normalized.equipmentSlot)) return false;
  if (!VALID_CLASS_RESTRICTIONS.includes(normalized.classRestriction)) return false;
  if (!VALID_RARITIES.includes(normalized.rarity)) return false;
  if (typeof normalized.stats !== 'object') return false;
  
  return true;
}