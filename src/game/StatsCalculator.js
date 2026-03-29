// ─── Player Stats Calculation ─────────────────────────────────────────────────
// Calculates final player stats by combining base stats + equipped gear bonuses

// All possible stat fields (normalized)
const STAT_FIELDS = [
  'strength', 'dexterity', 'intelligence', 'vitality',
  'maxHealth', 'maxMana',
  'attackPower', 'magicPower', 'defense',
  'critChance', 'critDamage',
  'attackSpeed', 'moveSpeed', 'rangeBonus',
  // Legacy fields (mapped to primary)
  'attack', 'hp', 'mp',
];

/**
 * Normalize item stats to canonical field names
 * Maps legacy fields: attack→attackPower, hp→maxHealth, mp→maxMana, defense→defense
 */
function normalizeStatField(field, value) {
  const mapping = {
    'attack': 'attackPower',
    'hp': 'maxHealth',
    'mp': 'maxMana',
    'defense': 'defense',
  };
  
  const canonical = mapping[field] || field;
  return { [canonical]: value };
}

/**
 * Calculate total stats from base + equipment
 * Returns object with all stat fields calculated
 */
export function calculatePlayerStats(gameState) {
  if (!gameState) return getEmptyStats();
  
  const baseStats = gameState.classData?.baseStats || {};
  const equipped = gameState.equipped || {};
  const level = gameState.level || 1;

  // Initialize with base stats
  const stats = {
    // Primary attributes
    strength: baseStats.strength || 0,
    dexterity: baseStats.dexterity || 0,
    intelligence: baseStats.intelligence || 0,
    vitality: baseStats.vitality || 0,
    
    // Health & Mana (base + level scaling + gear)
    maxHealth: (baseStats.hp || baseStats.maxHealth || 200) + level * 15,
    maxMana: (baseStats.mp || baseStats.maxMana || 100) + level * 8,
    
    // Combat stats (base + gear)
    attackPower: baseStats.attack || baseStats.attackPower || 20,
    magicPower: baseStats.magicPower || 0,
    defense: baseStats.defense || baseStats.defense || 12,
    
    // Special modifiers
    critChance: 0,
    critDamage: 1.0,
    attackSpeed: 1.0,
    moveSpeed: baseStats.speed || 1.0,
    rangeBonus: 0,
  };

  // Apply equipment bonuses
  for (const item of Object.values(equipped)) {
    if (!item || !item.stats) continue;
    
    for (const [field, value] of Object.entries(item.stats)) {
      if (value === 0 || value === undefined) continue;
      
      // Normalize field names
      const normalized = normalizeStatField(field, value);
      for (const [key, val] of Object.entries(normalized)) {
        if (stats.hasOwnProperty(key)) {
          // Multiplicative for multipliers, additive for others
          if (key === 'critDamage' || key === 'attackSpeed' || key === 'moveSpeed') {
            stats[key] *= (1 + val * 0.01);
          } else {
            stats[key] += val;
          }
        }
      }
    }
  }

  // Ensure health/mana never go below min
  stats.maxHealth = Math.max(50, stats.maxHealth);
  stats.maxMana = Math.max(0, stats.maxMana);
  stats.attackPower = Math.max(1, stats.attackPower);
  stats.defense = Math.max(0, stats.defense);
  stats.moveSpeed = Math.max(0.3, stats.moveSpeed);
  
  return stats;
}

/**
 * Get empty/default stats
 */
export function getEmptyStats() {
  return {
    strength: 0,
    dexterity: 0,
    intelligence: 0,
    vitality: 0,
    maxHealth: 200,
    maxMana: 100,
    attackPower: 20,
    magicPower: 0,
    defense: 12,
    critChance: 0,
    critDamage: 1.0,
    attackSpeed: 1.0,
    moveSpeed: 1.0,
    rangeBonus: 0,
  };
}

/**
 * Get stat bonuses from equipped items only (for display)
 */
export function getEquipmentBonuses(equipped) {
  const bonuses = {};
  
  for (const item of Object.values(equipped)) {
    if (!item || !item.stats) continue;
    
    for (const [field, value] of Object.entries(item.stats)) {
      if (value === 0 || value === undefined) continue;
      
      const normalized = normalizeStatField(field, value);
      for (const [key, val] of Object.entries(normalized)) {
        bonuses[key] = (bonuses[key] || 0) + val;
      }
    }
  }
  
  return bonuses;
}

/**
 * Get stat display info (label, color, icon)
 */
export const STAT_DISPLAY_INFO = {
  strength: { label: 'STR', color: '#e63946', icon: '💪' },
  dexterity: { label: 'DEX', color: '#4caf50', icon: '⚡' },
  intelligence: { label: 'INT', color: '#2196f3', icon: '🧠' },
  vitality: { label: 'VIT', color: '#ff9800', icon: '❤️' },
  maxHealth: { label: 'HP', color: '#4caf50', icon: '❤️' },
  maxMana: { label: 'MP', color: '#2196f3', icon: '💫' },
  attackPower: { label: 'ATK', color: '#e63946', icon: '⚔️' },
  magicPower: { label: 'MATK', color: '#9c27b0', icon: '✨' },
  defense: { label: 'DEF', color: '#2196f3', icon: '🛡️' },
  critChance: { label: 'CRIT%', color: '#ff9800', icon: '🎯' },
  critDamage: { label: 'CRIT DMG', color: '#ff5722', icon: '💥' },
  attackSpeed: { label: 'ASPD', color: '#00bcd4', icon: '⚡' },
  moveSpeed: { label: 'MSPD', color: '#8bc34a', icon: '💨' },
  rangeBonus: { label: 'RANGE', color: '#3f51b5', icon: '📏' },
};

/**
 * Format stat value for display
 */
export function formatStatValue(stat, value) {
  if (stat === 'critDamage' || stat === 'attackSpeed' || stat === 'moveSpeed') {
    return `${(value * 100).toFixed(0)}%`;
  }
  if (stat === 'critChance') {
    return `${(value * 100).toFixed(1)}%`;
  }
  return Math.floor(value);
}