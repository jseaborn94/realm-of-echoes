/**
 * GatherNodeRegistry.js
 * 
 * Centralized gathering node data.
 * All harvest node types and drops defined here.
 */

import { registryManager } from './RegistryManager.js';

export const NODE_TYPE = {
  TREE: 'tree',
  ROCK: 'rock',
  SHEEP: 'sheep',
};

export const NODE_DROPS = {
  [NODE_TYPE.TREE]:  [{ id: 'wood',     name: 'Wood',     icon: '🪵', qty: 2, rarity: 'common' }],
  [NODE_TYPE.ROCK]:  [{ id: 'ore',      name: 'Ore',      icon: '🪨', qty: 1, rarity: 'common' }],
  [NODE_TYPE.SHEEP]: [
    { id: 'raw_meat', name: 'Raw Meat', icon: '🥩', qty: 1, rarity: 'common' },
    { id: 'hide',     name: 'Hide',     icon: '🟫', qty: 1, rarity: 'common' },
    { id: 'wool',     name: 'Wool',     icon: '🧶', qty: 1, rarity: 'common' },
  ],
};

export const RESPAWN_DELAY = {
  [NODE_TYPE.TREE]:  30000, // 30s
  [NODE_TYPE.ROCK]:  45000, // 45s
  [NODE_TYPE.SHEEP]: 60000, // 60s
};

// Register node types
registryManager.register('NODE_TYPES', NODE_TYPE, {
  type: 'object',
});

// Register node drops
registryManager.register('NODE_DROPS', NODE_DROPS, {
  type: 'object',
});

/**
 * Get drops for a node type
 */
export function getNodeDrops(nodeType) {
  const drops = registryManager.get('NODE_DROPS')[nodeType];
  if (!drops) {
    console.warn(`[Registry] NODE_DROPS.${nodeType} not found, returning empty`);
    return [];
  }
  return drops;
}

/**
 * Get respawn delay for a node type
 */
export function getNodeRespawnDelay(nodeType) {
  return RESPAWN_DELAY[nodeType] || 30000; // default 30s
}