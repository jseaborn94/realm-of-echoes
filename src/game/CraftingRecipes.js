// ─── Crafting Recipes ────────────────────────────────────────────────────────
// npcRole matches NPC names in WorldGenerator to identify which NPC handles what

export const NPC_ROLES = {
  blacksmith: ['Blacksmith Oryn'],
  cook:       ['Herbalist Fenn'],   // Herbalist acts as cook
  weaponsmith:['Merchant Yeva'],    // Merchant crafts weapons
  armorsmith: ['Ranger Hollis'],    // Ranger crafts armor
};

// Returns the crafting role for a given NPC name
export function getNPCRole(npcName) {
  for (const [role, names] of Object.entries(NPC_ROLES)) {
    if (names.some(n => npcName.includes(n.split(' ')[0]) || n.includes(npcName.split(' ')[0]))) {
      return role;
    }
  }
  // Fallback by keyword
  if (/smith|forge|oryn/i.test(npcName)) return 'blacksmith';
  if (/cook|herb|fenn|food/i.test(npcName)) return 'cook';
  if (/weapon|blade|merch|yeva/i.test(npcName)) return 'weaponsmith';
  if (/armor|armour|ranger|hollis/i.test(npcName)) return 'armorsmith';
  return null;
}

export const RECIPES = {
  blacksmith: [
    {
      id: 'smelt_ore',
      name: 'Metal Bar',
      icon: '🔩',
      description: 'Smelt ore into a metal bar',
      inputs: [{ id: 'ore', name: 'Ore', icon: '🪨', qty: 3 }],
      output: { id: 'metal_bar', name: 'Metal Bar', icon: '🔩', qty: 1, isResource: true, rarity: 'uncommon', slot: null, stats: {} },
    },
    {
      id: 'upgrade_weapon',
      name: 'Upgrade Weapon',
      icon: '⬆️',
      description: 'Upgrade equipped weapon (+8 ATK)',
      inputs: [
        { id: 'metal_bar', name: 'Metal Bar', icon: '🔩', qty: 2 },
        { id: 'ore',       name: 'Ore',       icon: '🪨', qty: 1 },
      ],
      output: null, // special: upgrades equipped weapon
      special: 'upgrade_weapon',
    },
    {
      id: 'upgrade_armor',
      name: 'Reinforce Armor',
      icon: '🛡️',
      description: 'Reinforce equipped chest (+6 DEF)',
      inputs: [
        { id: 'metal_bar', name: 'Metal Bar', icon: '🔩', qty: 2 },
        { id: 'hide',      name: 'Hide',      icon: '🟫', qty: 2 },
      ],
      output: null,
      special: 'upgrade_armor',
    },
  ],
  cook: [
    {
      id: 'cook_meat',
      name: 'Cooked Meat',
      icon: '🍖',
      description: 'Cook raw meat — restores 80 HP',
      inputs: [{ id: 'raw_meat', name: 'Raw Meat', icon: '🥩', qty: 1 }],
      output: {
        id: 'cooked_meat',
        name: 'Cooked Meat',
        icon: '🍖',
        qty: 1,
        isResource: true,
        rarity: 'common',
        slot: null,
        stats: {},
        useEffect: { hp: 80 },
      },
    },
    {
      id: 'hearty_stew',
      name: 'Hearty Stew',
      icon: '🍲',
      description: 'Rich stew — restores 180 HP',
      inputs: [
        { id: 'raw_meat', name: 'Raw Meat', icon: '🥩', qty: 2 },
        { id: 'wool',     name: 'Wool',     icon: '🧶', qty: 1 },
      ],
      output: {
        id: 'hearty_stew',
        name: 'Hearty Stew',
        icon: '🍲',
        qty: 1,
        isResource: true,
        rarity: 'uncommon',
        slot: null,
        stats: {},
        useEffect: { hp: 180 },
      },
    },
  ],
  weaponsmith: [
    {
      id: 'craft_sword',
      name: 'Iron Sword',
      icon: '⚔️',
      description: 'Craft a reliable iron sword',
      inputs: [
        { id: 'wood',      name: 'Wood',      icon: '🪵', qty: 2 },
        { id: 'metal_bar', name: 'Metal Bar', icon: '🔩', qty: 3 },
      ],
      output: {
        id: `crafted_sword_${Date.now()}`,
        name: 'Forged Sword',
        icon: '⚔️',
        slot: 'weapon',
        rarity: 'uncommon',
        isResource: false,
        stats: { attack: 20 },
      },
      outputTemplate: { name: 'Forged Sword', icon: '⚔️', slot: 'weapon', rarity: 'uncommon', stats: { attack: 20 } },
    },
    {
      id: 'craft_spear',
      name: 'Hunting Spear',
      icon: '🗡️',
      description: 'Craft a balanced hunting spear',
      inputs: [
        { id: 'wood',      name: 'Wood',      icon: '🪵', qty: 3 },
        { id: 'metal_bar', name: 'Metal Bar', icon: '🔩', qty: 2 },
      ],
      output: null,
      outputTemplate: { name: 'Hunting Spear', icon: '🗡️', slot: 'weapon', rarity: 'uncommon', stats: { attack: 18 } },
    },
    {
      id: 'craft_bow',
      name: 'Hunter\'s Bow',
      icon: '🏹',
      description: 'Craft a reliable hunter\'s bow',
      inputs: [
        { id: 'wood',      name: 'Wood',      icon: '🪵', qty: 4 },
        { id: 'wool',      name: 'Wool',      icon: '🧶', qty: 2 },
      ],
      output: null,
      outputTemplate: { name: "Hunter's Bow", icon: '🏹', slot: 'weapon', rarity: 'uncommon', stats: { attack: 17 } },
    },
  ],
  armorsmith: [
    {
      id: 'craft_chest',
      name: 'Hide Chestplate',
      icon: '🧥',
      description: 'Craft a sturdy chest piece',
      inputs: [
        { id: 'hide',      name: 'Hide',      icon: '🟫', qty: 3 },
        { id: 'metal_bar', name: 'Metal Bar', icon: '🔩', qty: 2 },
      ],
      output: null,
      outputTemplate: { name: 'Hide Chestplate', icon: '🧥', slot: 'chest', rarity: 'uncommon', stats: { defense: 14 } },
    },
    {
      id: 'craft_helmet',
      name: 'Iron Helm',
      icon: '⛑️',
      description: 'Craft a protective iron helm',
      inputs: [
        { id: 'metal_bar', name: 'Metal Bar', icon: '🔩', qty: 2 },
        { id: 'hide',      name: 'Hide',      icon: '🟫', qty: 1 },
      ],
      output: null,
      outputTemplate: { name: 'Iron Helm', icon: '⛑️', slot: 'helmet', rarity: 'uncommon', stats: { defense: 10 } },
    },
    {
      id: 'craft_boots',
      name: 'Wool Boots',
      icon: '👢',
      description: 'Craft warm, sturdy boots',
      inputs: [
        { id: 'wool',      name: 'Wool',      icon: '🧶', qty: 3 },
        { id: 'hide',      name: 'Hide',      icon: '🟫', qty: 2 },
      ],
      output: null,
      outputTemplate: { name: 'Wool Boots', icon: '👢', slot: 'boots', rarity: 'uncommon', stats: { defense: 8 } },
    },
  ],
};

// Count how many of a resource the player has in inventory
export function countResource(inventory, resourceId) {
  return inventory
    .filter(i => i.id === resourceId && i.isResource)
    .reduce((sum, i) => sum + (i.qty || 1), 0);
}

// Check if player can craft a recipe
export function canCraft(inventory, recipe) {
  return recipe.inputs.every(input => countResource(inventory, input.id) >= input.qty);
}

// Consume inputs from inventory, return new inventory array
export function consumeInputs(inventory, recipe) {
  let inv = [...inventory];
  for (const input of recipe.inputs) {
    let remaining = input.qty;
    inv = inv.map(item => {
      if (item.id !== input.id || !item.isResource || remaining <= 0) return item;
      const take = Math.min(remaining, item.qty || 1);
      remaining -= take;
      const newQty = (item.qty || 1) - take;
      return newQty <= 0 ? null : { ...item, qty: newQty };
    }).filter(Boolean);
  }
  return inv;
}