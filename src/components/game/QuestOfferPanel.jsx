import React, { useState } from 'react';
import { getQuestById } from '@/game/QuestSystem.js';

/**
 * QuestOfferPanel — Shows quest offer dialogue and accept/decline buttons
 */
export default function QuestOfferPanel({ npc, availableQuests, onAcceptQuest, onDecline }) {
  const [selectedQuestIndex, setSelectedQuestIndex] = useState(0);

  if (!npc || !availableQuests || availableQuests.length === 0) return null;

  const selectedQuestId = availableQuests[selectedQuestIndex];
  const quest = getQuestById(selectedQuestId);

  if (!quest) return null;

  const handleAccept = () => {
    onAcceptQuest(selectedQuestId);
  };

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50">
      <div className="panel-glass-gold rounded-lg p-6 max-w-md w-full mx-4 border-2 border-yellow-600/50">
        {/* NPC Name */}
        <div className="flex items-center gap-2 mb-4">
          <span style={{ fontSize: '24px' }}>{npc.icon}</span>
          <h2 className="text-lg font-cinzel font-bold" style={{ color: npc.color }}>
            {npc.name}
          </h2>
        </div>

        {/* Quest Offer */}
        <div className="bg-gray-950/50 rounded p-4 mb-4">
          <h3 className="font-cinzel font-bold text-yellow-400 mb-2">{quest.name}</h3>
          <p className="text-sm text-gray-300 leading-relaxed mb-4">{quest.description}</p>

          {/* Objective */}
          <div className="bg-gray-900/60 rounded p-2 mb-3 text-xs text-gray-400">
            <div className="font-bold text-yellow-600">Objective:</div>
            <div>
              {quest.objectiveType === 'kill' && `Slay ${quest.requiredAmount} ${quest.target}(s)`}
              {quest.objectiveType === 'gather' && `Gather ${quest.requiredAmount} ${quest.target}(s)`}
              {quest.objectiveType === 'talk' && `Speak to ${quest.target}`}
            </div>
          </div>

          {/* Rewards */}
          <div className="bg-gray-900/60 rounded p-2 text-xs text-gray-400">
            <div className="font-bold text-yellow-600">Rewards:</div>
            <div className="flex gap-4">
              <span>⭐ {quest.rewards.xp} XP</span>
              <span>💰 {quest.rewards.gold} Gold</span>
            </div>
          </div>
        </div>

        {/* Quest Selector (if multiple) */}
        {availableQuests.length > 1 && (
          <div className="mb-4 text-xs text-gray-400">
            <div className="font-cinzel font-bold text-yellow-600 mb-1">Other Quests:</div>
            <div className="flex gap-1">
              {availableQuests.map((qid, idx) => (
                <button
                  key={qid}
                  onClick={() => setSelectedQuestIndex(idx)}
                  className={`px-2 py-1 rounded text-xs transition ${
                    idx === selectedQuestIndex
                      ? 'bg-yellow-600/60 text-white'
                      : 'bg-gray-800 text-gray-300 hover:bg-gray-700'
                  }`}
                >
                  Quest {idx + 1}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Buttons */}
        <div className="flex gap-3 justify-end">
          <button
            onClick={onDecline}
            className="px-4 py-2 rounded font-cinzel text-sm bg-gray-700 text-gray-200 hover:bg-gray-600 transition"
          >
            Decline
          </button>
          <button
            onClick={handleAccept}
            className="px-4 py-2 rounded font-cinzel text-sm bg-yellow-600/70 text-white hover:bg-yellow-600 transition"
          >
            Accept Quest
          </button>
        </div>
      </div>
    </div>
  );
}