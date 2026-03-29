/**
 * QuestRegistry.js
 * 
 * Centralized quest data and access functions.
 * All quests must be defined here.
 */

import { registryManager } from './RegistryManager.js';

export const QUESTS = {
  // ─── Kill Quests ───────────────────────────────────────
  kill_gnolls: {
    id: 'kill_gnolls',
    name: 'Cull the Gnolls',
    description: 'The gnolls in the northern zones are becoming a threat. Slay 5 of them.',
    questGiver: 'warrior_trainer',
    objectiveType: 'kill',
    target: 'gnoll',
    requiredAmount: 5,
    rewards: {
      xp: 200,
      gold: 150,
    },
  },
  kill_spiders: {
    id: 'kill_spiders',
    name: 'Spider Extermination',
    description: 'Eliminate 5 spiders from the twisted forests. Their venom is a threat to travelers.',
    questGiver: 'ranger_trainer',
    objectiveType: 'kill',
    target: 'spider',
    requiredAmount: 5,
    rewards: {
      xp: 200,
      gold: 150,
    },
  },
  kill_elite_troll: {
    id: 'kill_elite_troll',
    name: 'Face the Troll',
    description: 'A powerful troll has been terrorizing the realm. Defeat this mighty foe.',
    questGiver: 'warrior_trainer',
    objectiveType: 'kill',
    target: 'troll',
    requiredAmount: 1,
    rewards: {
      xp: 500,
      gold: 400,
    },
  },

  // ─── Gather Quests ─────────────────────────────────────
  gather_wood: {
    id: 'gather_wood',
    name: 'Lumber Duty',
    description: 'Chop 3 trees to gather wood for the village construction.',
    questGiver: 'merchant_npc',
    objectiveType: 'gather',
    target: 'tree',
    requiredAmount: 3,
    rewards: {
      xp: 100,
      gold: 75,
    },
  },
  gather_stone: {
    id: 'gather_stone',
    name: 'Stone Supply',
    description: 'Mine 3 rocks from the quarries. Stone is needed for repairs.',
    questGiver: 'merchant_npc',
    objectiveType: 'gather',
    target: 'rock',
    requiredAmount: 3,
    rewards: {
      xp: 100,
      gold: 75,
    },
  },

  // ─── Talk/Discovery Quests ─────────────────────────────
  talk_to_elder: {
    id: 'talk_to_elder',
    name: 'Seek the Elder',
    description: 'Find and speak to the village elder. They have wisdom to share.',
    questGiver: 'guard_npc',
    objectiveType: 'talk',
    target: 'elder_npc',
    requiredAmount: 1,
    rewards: {
      xp: 50,
      gold: 0,
    },
  },
};

// Register with validation
registryManager.register('QUESTS', QUESTS, {
  type: 'object',
  requiredFields: ['id', 'name', 'questGiver', 'objectiveType', 'rewards'],
});

/**
 * Quest state definitions
 */
export const QUEST_STATE = {
  NOT_STARTED: 'not_started',
  ACTIVE: 'active',
  COMPLETED: 'completed',
  TURNED_IN: 'turned_in',
};

/**
 * Get quest by ID
 */
export function getQuestById(questId) {
  return registryManager.getItem('QUESTS', questId);
}

/**
 * Get all quests
 */
export function getAllQuests() {
  return registryManager.getAll('QUESTS');
}

/**
 * Get quests by quest giver
 */
export function getQuestsByGiver(giverName) {
  return registryManager.filter('QUESTS', q => q.questGiver === giverName);
}

/**
 * Check if objective is met
 */
export function isObjectiveMet(quest, currentProgress) {
  if (!quest) return false;
  return currentProgress >= quest.requiredAmount;
}