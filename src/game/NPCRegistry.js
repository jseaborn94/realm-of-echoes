/**
 * NPCRegistry.js
 * 
 * Centralized NPC data and access functions.
 * All NPCs must be defined here.
 */

import { registryManager } from './RegistryManager.js';

export const NPCS = {
  warrior_trainer: {
    id: 'warrior_trainer',
    name: 'Kael the Warrior',
    role: 'quest_giver',
    col: 185,
    row: 405,
    color: '#d4a373',
    icon: '⚔️',
    dialogue: [
      'Greetings, adventurer. These lands grow more dangerous by the day.',
      'The gnolls have been raiding our settlements. Will you help cull their numbers?',
      'And there\'s word of a troll terrorizing the northern realm. Few have the strength to face it.',
      'Return to me when your task is complete, and I\'ll reward you handsomely.',
    ],
    availableQuests: ['kill_gnolls', 'kill_elite_troll'],
  },

  ranger_trainer: {
    id: 'ranger_trainer',
    name: 'Elara the Ranger',
    role: 'quest_giver',
    col: 190,
    row: 410,
    color: '#2ecc71',
    icon: '🏹',
    dialogue: [
      'Welcome, traveler. The forests are infested with giant spiders.',
      'They prey on anyone foolish enough to wander unprepared.',
      'Bring me evidence of 5 spider kills, and I\'ll ensure you\'re well-rewarded.',
      'Nature must be kept in balance.',
    ],
    availableQuests: ['kill_spiders'],
  },

  merchant_npc: {
    id: 'merchant_npc',
    name: 'Torven the Merchant',
    role: 'quest_giver',
    col: 195,
    row: 400,
    color: '#f39c12',
    icon: '🏪',
    dialogue: [
      'Good day to you! Business is booming, but I need supplies.',
      'I\'ve need of timber and stone for my construction projects.',
      'Bring me these materials, and I\'ll pay a fair price.',
      'The wood comes from the northern forests, stone from the eastern quarries.',
    ],
    availableQuests: ['gather_wood', 'gather_stone'],
  },

  guard_npc: {
    id: 'guard_npc',
    name: 'Captain Aldric',
    role: 'quest_giver',
    col: 180,
    row: 395,
    color: '#3498db',
    icon: '🛡️',
    dialogue: [
      'Hail! You seem capable enough.',
      'The village elder has been requesting aid from the strongest adventurers.',
      'Seek her out in the tower to the north. She has much to tell you.',
      'Go now, and prove your worth.',
    ],
    availableQuests: ['talk_to_elder'],
  },

  elder_npc: {
    id: 'elder_npc',
    name: 'Elder Lyssa',
    role: 'quest_giver',
    col: 185,
    row: 380,
    color: '#9b59b6',
    icon: '🧙',
    dialogue: [
      'Ah, a visitor! I sense great potential within you.',
      'The world is in need of heroes like yourself.',
      'Train well, defeat the threats that plague our lands, and perhaps you\'ll become a legend.',
      'Fortune favors the bold.',
    ],
    availableQuests: [],
  },
};

// Register with validation
registryManager.register('NPCS', NPCS, {
  type: 'object',
  requiredFields: ['id', 'name', 'role', 'col', 'row'],
});

/**
 * Get NPC by ID
 */
export function getNPCById(npcId) {
  return registryManager.getItem('NPCS', npcId);
}

/**
 * Get all NPCs
 */
export function getAllNPCs() {
  return registryManager.getAll('NPCS');
}

/**
 * Get NPCs by role
 */
export function getNPCsByRole(role) {
  return registryManager.filter('NPCS', npc => npc.role === role);
}