/**
 * EnemyRegistry.js
 * 
 * Centralized enemy type definitions.
 * All enemy stats and properties defined here.
 */

import { registryManager } from './RegistryManager.js';

export const ENEMY_TYPES = {
  // ── MELEE ──
  skull:       { name: 'Skull',        tier: 'melee',    color: '#c8c8c8', icon: '💀', hp: 160,  atk: 10, def: 2,  speed: 60, xp: 15,  range: 28, lootMult: 1.0 },
  lancer:      { name: 'Lancer',       tier: 'melee',    color: '#4a90d9', icon: '🗡️', hp: 200,  atk: 14, def: 4,  speed: 65, xp: 22,  range: 30, lootMult: 1.1 },
  thief:       { name: 'Thief',        tier: 'melee',    color: '#9b59b6', icon: '🔪', hp: 140,  atk: 16, def: 2,  speed: 90, xp: 20,  range: 26, lootMult: 1.1 },
  snake:       { name: 'Snake',        tier: 'melee',    color: '#27ae60', icon: '🐍', hp: 130,  atk: 12, def: 1,  speed: 75, xp: 14,  range: 24, lootMult: 1.0 },
  spider:      { name: 'Spider',       tier: 'melee',    color: '#8e44ad', icon: '🕷️', hp: 120,  atk: 11, def: 1,  speed: 80, xp: 13,  range: 24, lootMult: 1.0 },
  bear:        { name: 'Bear',         tier: 'melee',    color: '#795548', icon: '🐻', hp: 380,  atk: 22, def: 8,  speed: 55, xp: 35,  range: 36, lootMult: 1.3 },
  gnome:       { name: 'Gnome',        tier: 'melee',    color: '#e74c3c', icon: '🧙', hp: 180,  atk: 15, def: 3,  speed: 62, xp: 18,  range: 28, lootMult: 1.0 },
  panda:       { name: 'Panda',        tier: 'melee',    color: '#ecf0f1', icon: '🐼', hp: 320,  atk: 20, def: 7,  speed: 50, xp: 30,  range: 34, lootMult: 1.2 },

  // ── RANGED ──
  harpoonfish: { name: 'Harpoon Fish', tier: 'ranged',   color: '#1abc9c', icon: '🐠', hp: 160,  atk: 16, def: 2,  speed: 52, xp: 24,  range: 160, lootMult: 1.1, projectileColor: '#1abc9c' },
  shaman:      { name: 'Shaman',       tier: 'ranged',   color: '#e67e22', icon: '🔮', hp: 190,  atk: 18, def: 3,  speed: 48, xp: 28,  range: 180, lootMult: 1.2, projectileColor: '#e67e22' },
  gnoll:       { name: 'Gnoll',        tier: 'ranged',   color: '#f39c12', icon: '🦴', hp: 200,  atk: 17, def: 4,  speed: 50, xp: 26,  range: 170, lootMult: 1.2, projectileColor: '#f39c12' },

  // ── ELITE ──
  turtle:      { name: 'Turtle',       tier: 'elite',    color: '#16a085', icon: '🐢', hp: 320,  atk: 30, def: 18, speed: 34, xp: 80,  range: 32, lootMult: 2.2 },
  lizard:      { name: 'Lizard',       tier: 'elite',    color: '#2ecc71', icon: '🦎', hp: 280,  atk: 38, def: 12, speed: 60, xp: 90,  range: 34, lootMult: 2.2 },
  minotaur:    { name: 'Minotaur',     tier: 'elite',    color: '#c0392b', icon: '🐂', hp: 400,  atk: 45, def: 15, speed: 48, xp: 110, range: 40, lootMult: 2.8 },
  alpha_skull: { name: 'Alpha Skull',  tier: 'elite',    color: '#ff4444', icon: '☠️', hp: 180,  atk: 28, def: 6,  speed: 70, xp: 55,  range: 30, lootMult: 2.0 },
  viper:       { name: 'Viper',        tier: 'elite',    color: '#00e676', icon: '🐍', hp: 150,  atk: 32, def: 5,  speed: 90, xp: 50,  range: 28, lootMult: 2.0 },
  frost_bear:  { name: 'Frost Bear',   tier: 'elite',    color: '#80deea', icon: '🐻', hp: 380,  atk: 40, def: 16, speed: 44, xp: 95,  range: 38, lootMult: 2.3 },
  shadow_panda:{ name: 'Shadow Panda', tier: 'elite',    color: '#7c4dff', icon: '🐼', hp: 340,  atk: 42, def: 14, speed: 55, xp: 100, range: 36, lootMult: 2.4 },

  // ── MINI-BOSS ──
  troll:       { name: 'Troll',        tier: 'miniboss', color: '#4caf50', icon: '👾', hp: 600,  atk: 48, def: 14, speed: 42, xp: 200, range: 44, lootMult: 3.5 },
  wraith:      { name: 'Wraith',       tier: 'miniboss', color: '#9c27b0', icon: '👻', hp: 480,  atk: 55, def: 10, speed: 70, xp: 220, range: 38, lootMult: 3.5 },
  golem:       { name: 'Stone Golem',  tier: 'miniboss', color: '#78909c', icon: '🗿', hp: 800,  atk: 50, def: 22, speed: 30, xp: 250, range: 48, lootMult: 4.0 },
  warlord:     { name: 'Warlord',      tier: 'miniboss', color: '#ef5350', icon: '⚔️', hp: 700,  atk: 62, def: 16, speed: 48, xp: 280, range: 46, lootMult: 4.0 },
  frost_witch: { name: 'Frost Witch',  tier: 'miniboss', color: '#4fc3f7', icon: '🧙', hp: 550,  atk: 60, def: 12, speed: 55, xp: 260, range: 200, lootMult: 3.8, projectileColor: '#4fc3f7' },

  // ── BOSS ──
  ogre:        { name: 'Ogre',         tier: 'boss',     color: '#7f8c8d', icon: '👹', hp: 1200, atk: 70, def: 20, speed: 38, xp: 500, range: 50, lootMult: 5.0 },

  // ── TRAINING DUMMY (GM testing) ──
  dummy:       { name: 'Training Dummy', tier: 'dummy',   color: '#888888', icon: '🎯', hp: 1000, atk: 0, def: 0, speed: 0, xp: 0, range: 0, lootMult: 0 },
};

// Register with validation
registryManager.register('ENEMY_TYPES', ENEMY_TYPES, {
  type: 'object',
  requiredFields: ['name', 'tier', 'color', 'icon', 'hp', 'atk', 'def'],
});

/**
 * Get enemy type definition
 */
export function getEnemyType(typeId) {
  return registryManager.getItem('ENEMY_TYPES', typeId);
}

/**
 * Get all enemy types
 */
export function getAllEnemyTypes() {
  return registryManager.getAll('ENEMY_TYPES');
}

/**
 * Get enemies by tier
 */
export function getEnemiesByTier(tier) {
  return registryManager.filter('ENEMY_TYPES', e => e.tier === tier);
}