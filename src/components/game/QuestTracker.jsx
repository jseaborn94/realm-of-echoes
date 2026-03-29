import React from 'react';
import { ChevronDown } from 'lucide-react';

/**
 * QuestTracker — Displays active and completed quests
 */
export default function QuestTracker({ activeQuests, completedQuests, onTurnIn }) {
  const [collapsed, setCollapsed] = React.useState(false);

  if (!activeQuests && !completedQuests) return null;

  const hasQuests = (activeQuests?.length || 0) + (completedQuests?.length || 0) > 0;
  if (!hasQuests) return null;

  return (
    <div className="fixed top-20 right-3 z-30 w-72 max-h-96">
      {/* Header */}
      <div
        onClick={() => setCollapsed(!collapsed)}
        className="bg-secondary border border-yellow-600/30 rounded-t-lg px-3 py-2 cursor-pointer hover:bg-secondary/90 transition flex items-center justify-between"
      >
        <span className="font-cinzel font-bold text-yellow-400 text-sm">📜 Quests</span>
        <ChevronDown
          size={16}
          style={{
            transform: collapsed ? 'rotate(180deg)' : 'rotate(0deg)',
            transition: 'transform 0.2s',
            color: '#ffe88a',
          }}
        />
      </div>

      {/* Content */}
      {!collapsed && (
        <div className="panel-glass border border-yellow-600/20 rounded-b-lg p-3 space-y-2 overflow-y-auto max-h-80">
          {/* Active Quests */}
          {activeQuests && activeQuests.length > 0 && (
            <div>
              <div className="text-xs font-cinzel text-yellow-500 mb-1">ACTIVE</div>
              {activeQuests.map(quest => (
                <div
                  key={quest.id}
                  className="bg-gray-900/50 rounded p-2 mb-2 border-l-2 border-yellow-600/50 text-xs"
                >
                  <div className="font-bold text-yellow-300">{quest.name}</div>
                  <div className="text-gray-400 text-xs mt-1">
                    {quest.objectiveType === 'kill' && `${quest.progress}/${quest.requiredAmount} defeated`}
                    {quest.objectiveType === 'gather' && `${quest.progress}/${quest.requiredAmount} collected`}
                    {quest.objectiveType === 'talk' && `${quest.progress ? '✓' : '○'} Talk to ${quest.target}`}
                  </div>
                  {/* Progress bar */}
                  <div className="w-full h-1 bg-gray-800 rounded mt-1 overflow-hidden">
                    <div
                      className="h-full bg-yellow-600/70"
                      style={{ width: `${(quest.progress / quest.requiredAmount) * 100}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Completed Quests */}
          {completedQuests && completedQuests.length > 0 && (
            <div>
              <div className="text-xs font-cinzel text-green-500 mb-1">COMPLETED</div>
              {completedQuests.map(quest => (
                <div
                  key={quest.id}
                  className="bg-gray-900/50 rounded p-2 mb-2 border-l-2 border-green-600/50 text-xs"
                >
                  <div className="font-bold text-green-300">✓ {quest.name}</div>
                  <button
                    onClick={() => onTurnIn(quest.id)}
                    className="mt-1 w-full px-2 py-1 bg-green-600/60 hover:bg-green-600/80 text-white rounded text-xs transition font-cinzel font-bold"
                  >
                    Turn In
                  </button>
                </div>
              ))}
            </div>
          )}

          {!activeQuests?.length && !completedQuests?.length && (
            <div className="text-gray-400 text-xs text-center py-2">No active quests</div>
          )}
        </div>
      )}
    </div>
  );
}