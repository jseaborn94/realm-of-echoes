/**
 * BuffIndicators.jsx
 * 
 * Displays active buffs with icons, timers, and visual feedback
 * Positioned above player in HUD or as floating indicators
 */

import React from 'react';

const BUFF_CONFIG = {
  inner_focus: {
    name: 'Inner Focus',
    icon: '✨',
    color: '#ffaa00',
    description: '+30% ATK, +20% Speed',
  },
  enlightenment: {
    name: 'Enlightenment',
    icon: '🌟',
    color: '#ff66ff',
    description: 'Invulnerable',
  },
};

export default function BuffIndicators({ buffs = [] }) {
  if (!buffs || buffs.length === 0) return null;

  return (
    <div className="fixed top-28 left-3 z-30 space-y-2">
      {buffs.map((buff, idx) => {
        const config = BUFF_CONFIG[buff.type] || { name: buff.name, icon: '✨', color: '#88ff88' };
        const pct = Math.max(0, (buff.duration / buff.maxDuration) * 100);
        const showTimer = buff.duration < 5;

        return (
          <div
            key={idx}
            className="flex items-center gap-2 px-2 py-1 rounded-lg"
            style={{
              background: 'rgba(0, 0, 0, 0.6)',
              border: `2px solid ${config.color}`,
              boxShadow: `0 0 8px ${config.color}44`,
            }}
          >
            {/* Icon */}
            <div
              className="w-6 h-6 rounded flex items-center justify-center text-sm font-bold"
              style={{ background: config.color, color: '#000' }}
            >
              {config.icon}
            </div>

            {/* Info */}
            <div className="flex-1">
              <div className="text-xs font-cinzel" style={{ color: config.color }}>
                {config.name}
              </div>
              {/* Duration bar */}
              <div className="w-20 h-1 bg-gray-800 rounded overflow-hidden mt-0.5">
                <div
                  className="h-full transition-all"
                  style={{
                    width: `${pct}%`,
                    background: config.color,
                  }}
                />
              </div>
            </div>

            {/* Timer */}
            {showTimer && (
              <span className="text-xs font-cinzel" style={{ color: config.color, minWidth: '18px' }}>
                {buff.duration.toFixed(1)}s
              </span>
            )}
          </div>
        );
      })}
    </div>
  );
}