/**
 * QuestManager.js — Manages player quest state and progress
 * Tracks active quests, objectives, and turn-ins
 */

import { QUESTS, QUEST_STATE, getQuestById } from './QuestSystem.js';

export class QuestManager {
  constructor() {
    // questId -> { state, progress }
    this.questState = {};
    // Initialize all quests as NOT_STARTED
    Object.keys(QUESTS).forEach(questId => {
      this.questState[questId] = {
        state: QUEST_STATE.NOT_STARTED,
        progress: 0,
      };
    });
  }

  /**
   * Start a quest (player accepted)
   */
  startQuest(questId) {
    if (!this.questState[questId]) return false;
    this.questState[questId].state = QUEST_STATE.ACTIVE;
    this.questState[questId].progress = 0;
    return true;
  }

  /**
   * Update quest progress
   */
  updateProgress(questId, amount = 1) {
    const qs = this.questState[questId];
    if (!qs || qs.state !== QUEST_STATE.ACTIVE) return false;
    const quest = getQuestById(questId);
    if (!quest) return false;
    qs.progress = Math.min(qs.progress + amount, quest.requiredAmount);
    if (qs.progress >= quest.requiredAmount) {
      qs.state = QUEST_STATE.COMPLETED;
    }
    return true;
  }

  /**
   * Mark quest as turned in (claim rewards)
   */
  turnInQuest(questId) {
    const qs = this.questState[questId];
    if (!qs || qs.state !== QUEST_STATE.COMPLETED) return false;
    qs.state = QUEST_STATE.TURNED_IN;
    return true;
  }

  /**
   * Reset a quest (player can re-accept)
   */
  resetQuest(questId) {
    if (!this.questState[questId]) return false;
    this.questState[questId].state = QUEST_STATE.NOT_STARTED;
    this.questState[questId].progress = 0;
    return true;
  }

  /**
   * Get quest state by id
   */
  getQuestState(questId) {
    return this.questState[questId] || null;
  }

  /**
   * Get all active quests
   */
  getActiveQuests() {
    return Object.entries(this.questState)
      .filter(([_, qs]) => qs.state === QUEST_STATE.ACTIVE)
      .map(([id, qs]) => ({ id, ...qs, ...getQuestById(id) }));
  }

  /**
   * Get all completed quests (ready to turn in)
   */
  getCompletedQuests() {
    return Object.entries(this.questState)
      .filter(([_, qs]) => qs.state === QUEST_STATE.COMPLETED)
      .map(([id, qs]) => ({ id, ...qs, ...getQuestById(id) }));
  }

  /**
   * Get quests available to start (not started)
   */
  getAvailableQuests() {
    return Object.entries(this.questState)
      .filter(([_, qs]) => qs.state === QUEST_STATE.NOT_STARTED)
      .map(([id, qs]) => ({ id, ...qs, ...getQuestById(id) }));
  }

  /**
   * Get all turned-in quests
   */
  getTurnedInQuests() {
    return Object.entries(this.questState)
      .filter(([_, qs]) => qs.state === QUEST_STATE.TURNED_IN)
      .map(([id, qs]) => ({ id, ...qs, ...getQuestById(id) }));
  }

  /**
   * Complete all quests (GM tool)
   */
  completeAllQuests() {
    Object.keys(this.questState).forEach(questId => {
      this.questState[questId].state = QUEST_STATE.COMPLETED;
      this.questState[questId].progress = getQuestById(questId)?.requiredAmount || 1;
    });
  }

  /**
   * Reset all quests (GM tool)
   */
  resetAllQuests() {
    Object.keys(this.questState).forEach(questId => {
      this.questState[questId].state = QUEST_STATE.NOT_STARTED;
      this.questState[questId].progress = 0;
    });
  }
}

export default new QuestManager();