// Game constants
export const TILE_SIZE = 32;
export const WORLD_COLS = 200;
export const WORLD_ROWS = 200;
export const WORLD_WIDTH = WORLD_COLS * TILE_SIZE;
export const WORLD_HEIGHT = WORLD_ROWS * TILE_SIZE;

export const PLAYER_SPEED = 180; // px/sec
export const FOG_RADIUS = 220;

// Level tier colors
export const LEVEL_TIER_COLORS = {
  blue:   { min: 1,  max: 9,  color: '#4a9eff', glow: 'rgba(74,158,255,0.7)' },
  red:    { min: 10, max: 19, color: '#ff4a4a', glow: 'rgba(255,74,74,0.7)' },
  yellow: { min: 20, max: 39, color: '#ffe74a', glow: 'rgba(255,231,74,0.7)' },
  purple: { min: 40, max: 59, color: '#c44aff', glow: 'rgba(196,74,255,0.7)' },
  black:  { min: 60, max: 60, color: '#1a1a2e', glow: 'rgba(80,0,120,0.9)' },
};

export function getLevelTierColor(level) {
  if (level >= 60) return LEVEL_TIER_COLORS.black;
  if (level >= 40) return LEVEL_TIER_COLORS.purple;
  if (level >= 20) return LEVEL_TIER_COLORS.yellow;
  if (level >= 10) return LEVEL_TIER_COLORS.red;
  return LEVEL_TIER_COLORS.blue;
}

export function xpForLevel(level) {
  return Math.floor(100 * Math.pow(1.35, level - 1));
}

// Zones: [startCol, endCol, startRow, endRow]
export const ZONES = [
  { id: 1, name: 'Starter Plains',    color: 'rgba(60,180,60,0.18)',   fogColor: 'rgba(20,40,20,0.92)',  cols: [0,   80],  rows: [0,   80]  },
  { id: 2, name: 'Wildwood Frontier', color: 'rgba(30,100,40,0.22)',   fogColor: 'rgba(10,25,15,0.93)',  cols: [80,  160], rows: [0,   80]  },
  { id: 3, name: 'Ironvale Expanse',  color: 'rgba(160,150,60,0.18)', fogColor: 'rgba(30,25,10,0.93)',  cols: [0,   80],  rows: [80,  160] },
  { id: 4, name: 'Frostthorn Reach',  color: 'rgba(40,120,160,0.20)', fogColor: 'rgba(10,20,35,0.93)',  cols: [80,  160], rows: [80,  160] },
  { id: 5, name: 'Shadowfall Wastes', color: 'rgba(60,20,80,0.28)',   fogColor: 'rgba(10,5,20,0.95)',   cols: [60,  140], rows: [60,  140] },
];

export function getZoneAt(col, row) {
  // Zone 5 is in the center
  if (col >= 60 && col < 140 && row >= 60 && row < 140) return ZONES[4];
  if (col >= 80 && col < 160 && row >= 80 && row < 160) return ZONES[3];
  if (col >= 0  && col < 80  && row >= 80 && row < 160) return ZONES[2];
  if (col >= 80 && col < 160 && row >= 0  && row < 80)  return ZONES[1];
  return ZONES[0];
}

// Class definitions
export const CLASSES = {
  warrior: {
    id: 'warrior',
    name: 'Warrior',
    description: 'Stalwart tank who masters sword and shield, absorbing blows that would fell lesser fighters.',
    icon: '⚔️',
    color: '#e63946',
    baseStats: { hp: 280, mp: 80, attack: 22, defense: 18, speed: 1.0 },
    weaponType: ['sword', 'shield'],
    abilities: [
      { key: 'Q', name: 'Shield Strike',    type: 'single',  mpCost: 15, description: 'Strike with your shield, dealing damage and stunning.' },
      { key: 'W', name: 'Iron Guard',       type: 'utility', mpCost: 20, description: 'Raise your guard, blocking incoming damage.' },
      { key: 'E', name: 'Whirlwind Slash',  type: 'aoe',     mpCost: 35, description: 'Spin with sword, hitting all nearby enemies.' },
      { key: 'R', name: "Guardian's Wrath", type: 'ultimate',mpCost: 80, description: 'Channel rage into a devastating ground slam.' },
    ],
  },
  lancer: {
    id: 'lancer',
    name: 'Lancer',
    description: 'Swift spear master who charges through enemies with deadly precision.',
    icon: '🗡️',
    color: '#2196f3',
    baseStats: { hp: 200, mp: 110, attack: 30, defense: 12, speed: 1.2 },
    weaponType: ['spear'],
    abilities: [
      { key: 'Q', name: 'Piercing Thrust',   type: 'single',  mpCost: 18, description: 'Thrust spear forward, piercing through armor.' },
      { key: 'W', name: 'Charge',            type: 'utility', mpCost: 25, description: 'Dash forward at great speed.' },
      { key: 'E', name: 'Sweeping Crescent', type: 'aoe',     mpCost: 38, description: 'Wide arc sweep hitting all in front.' },
      { key: 'R', name: 'Dragon Lance',      type: 'ultimate',mpCost: 90, description: 'Legendary lance technique dealing massive damage.' },
    ],
  },
  archer: {
    id: 'archer',
    name: 'Archer',
    description: 'Deadly ranged hunter who rains arrows upon distant foes with unmatched precision.',
    icon: '🏹',
    color: '#4caf50',
    baseStats: { hp: 170, mp: 130, attack: 28, defense: 10, speed: 1.1 },
    weaponType: ['bow'],
    abilities: [
      { key: 'Q', name: 'Power Shot',         type: 'single',  mpCost: 14, description: 'Charged shot dealing heavy single-target damage.' },
      { key: 'W', name: 'Evasive Roll',       type: 'utility', mpCost: 20, description: 'Roll backwards, avoiding damage.' },
      { key: 'E', name: 'Arrow Rain',         type: 'aoe',     mpCost: 40, description: 'Fire a volley of arrows raining down on an area.' },
      { key: 'R', name: 'Hawkstorm Barrage',  type: 'ultimate',mpCost: 85, description: 'Unleash a storm of guided arrows at all enemies.' },
    ],
  },
  monk: {
    id: 'monk',
    name: 'Monk',
    description: 'Sacred healer who channels divine energy to protect and restore allies.',
    icon: '✨',
    color: '#ff9800',
    baseStats: { hp: 190, mp: 200, attack: 16, defense: 14, speed: 1.0 },
    weaponType: ['staff'],
    abilities: [
      { key: 'Q', name: 'Healing Palm',   type: 'single',  mpCost: 25, description: 'Touch an ally, restoring their health.' },
      { key: 'W', name: 'Sanctuary Step', type: 'utility', mpCost: 30, description: 'Create a sanctuary bubble absorbing damage.' },
      { key: 'E', name: 'Radiant Pulse',  type: 'aoe',     mpCost: 45, description: 'Emit a radiant burst, damaging enemies around you.' },
      { key: 'R', name: 'Divine Circle',  type: 'ultimate',mpCost: 95, description: 'Call down divine light, healing allies and smiting foes.' },
    ],
  },
};

// Equipment slots
export const EQUIP_SLOTS = ['helmet','chest','pants','gloves','boots','weapon','shield'];

// Starter items per class
export const STARTER_ITEMS = {
  warrior: [
    { id: 'iron_sword',   name: 'Iron Sword',   slot: 'weapon', stats: { attack: 8 },  icon: '⚔️', rarity: 'common' },
    { id: 'wooden_shield',name: 'Wooden Shield', slot: 'shield', stats: { defense: 6 }, icon: '🛡️', rarity: 'common' },
    { id: 'cloth_chest',  name: 'Cloth Chest',   slot: 'chest',  stats: { defense: 3 }, icon: '👕', rarity: 'common' },
  ],
  lancer: [
    { id: 'iron_spear',   name: 'Iron Spear',    slot: 'weapon', stats: { attack: 11 }, icon: '🗡️', rarity: 'common' },
    { id: 'leather_chest',name: 'Leather Chest', slot: 'chest',  stats: { defense: 4 }, icon: '🧥', rarity: 'common' },
  ],
  archer: [
    { id: 'short_bow',    name: 'Short Bow',     slot: 'weapon', stats: { attack: 9 },  icon: '🏹', rarity: 'common' },
    { id: 'ranger_chest', name: "Ranger's Vest", slot: 'chest',  stats: { defense: 3 }, icon: '🧥', rarity: 'common' },
  ],
  monk: [
    { id: 'oak_staff',    name: 'Oak Staff',     slot: 'weapon', stats: { attack: 6, mp: 20 }, icon: '🪄', rarity: 'common' },
    { id: 'robe_chest',   name: 'Monk Robe',     slot: 'chest',  stats: { defense: 2, mp: 15 }, icon: '👘', rarity: 'common' },
  ],
};

export const RARITY_COLORS = {
  common:    '#aaaaaa',
  uncommon:  '#4caf50',
  rare:      '#2196f3',
  epic:      '#9c27b0',
  legendary: '#ff9800',
};