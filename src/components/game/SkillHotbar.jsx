/**
 * SkillHotbar.jsx
 * 
 * Displays 4 skill slots with icons, cooldowns, mana cost, and tooltips.
 * Triggers skills via 1,2,3,4 keybinds.
 */

import React, { useState } from 'react';
import { getSkillsByClass, canCastSkill } from '@/game/SkillSystem.js';

export default function SkillHotbar({ gameState, gameEngine }) {
  const [hoveredSlot, setHoveredSlot] = useState(null);

  if (!gameState || !gameEngine) return null;

  const classId = gameState.classData?.id || 'warrior';
  const skills = getSkillsByClass(classId);
  const slotKeys = [1, 2, 3, 4];

  const handleSkillClick = (slotIndex) => {
    const skill = skills[slotIndex];
    if (!skill) return;

    // Trigger skill in game engine
    const keyMap = { Q: 0, W: 1, E: 2, R: 3 };
    const key = Object.entries(keyMap).find(([_, idx]) => idx === slotIndex)?.[0];
    if (!key || !gameEngine) return;

    // Try to begin skill (aiming or instant)
    gameEngine._beginSkill(key);
  };

  return (
    <div className="fixed bottom-4 left-1/2 transform -translate-x-1/2 z-20">
      {/* Hotbar background */}
      <div className="flex gap-2 p-3 rounded-lg panel-glass border border-yellow-600/30">
        {slotKeys.map((slotNum, idx) => {
          const skill = skills[idx];
          if (!skill) return null;

          const cooldown = gameState.cooldowns?.[skill.key] || 0;
          const isCoolingDown = cooldown > 0;
          const canAfford = gameState.mp >= skill.manaCost;
          const canCast = canCastSkill(skill, gameState);

          const cooldownPercent = isCoolingDown
            ? Math.min(100, (cooldown / (gameState.cooldowns?.max || skill.cooldown || 1)) * 100)
            : 0;

          return (
            <div
              key={skill.id}
              className="relative w-16 h-16 rounded-lg border-2 border-yellow-600/50 cursor-pointer transition-all hover:border-yellow-400/70"
              style={{
                background: canCast ? 'rgba(100, 80, 20, 0.4)' : 'rgba(40, 40, 40, 0.6)',
                opacity: canCast ? 1 : 0.6,
              }}
              onMouseEnter={() => setHoveredSlot(idx)}
              onMouseLeave={() => setHoveredSlot(null)}
              onClick={() => handleSkillClick(idx)}
            >
              {/* Skill Icon */}
              <div className="absolute inset-0 flex items-center justify-center text-3xl font-bold">
                {skill.icon}
              </div>

              {/* Cooldown Overlay */}
              {isCoolingDown && (
                <div
                  className="absolute inset-0 rounded-lg bg-black/70 flex items-center justify-center text-yellow-300 font-bold text-sm"
                  style={{ height: `${100 - cooldownPercent}%` }}
                >
                  {(cooldown).toFixed(1)}s
                </div>
              )}

              {/* Mana Cost Indicator */}
              {!isCoolingDown && !canAfford && (
                <div className="absolute inset-0 rounded-lg bg-black/50 flex items-center justify-center">
                  <div className="text-xs text-center">
                    <div className="text-red-400 font-bold">{skill.manaCost}</div>
                    <div className="text-red-300 text-xs">MP</div>
                  </div>
                </div>
              )}

              {/* Keybind Label */}
              <div className="absolute top-0.5 right-0.5 bg-yellow-700/60 px-1 rounded text-xs font-bold text-yellow-100">
                {slotNum}
              </div>

              {/* Tooltip */}
              {hoveredSlot === idx && (
                <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 w-48 bg-gray-900 border border-yellow-600/50 rounded-lg p-2 text-xs z-30 pointer-events-none">
                  <div className="text-yellow-400 font-bold">{skill.name}</div>
                  <div className="text-gray-300 text-xs mt-1">{skill.description}</div>
                  <div className="text-gray-400 text-xs mt-2 space-y-1">
                    {skill.manaCost > 0 && (
                      <div>
                        Mana: <span className={canAfford ? 'text-blue-300' : 'text-red-400'}>
                          {skill.manaCost}
                        </span>
                      </div>
                    )}
                    {skill.cooldown > 0 && (
                      <div>Cooldown: {skill.cooldown}s</div>
                    )}
                    {skill.range > 0 && (
                      <div>Range: {skill.range}</div>
                    )}
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Legend */}
      <div className="text-center mt-2 text-xs font-cinzel text-yellow-700/60">
        Press 1-4 or Click to Cast
      </div>
    </div>
  );
}