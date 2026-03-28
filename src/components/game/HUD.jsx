import React from 'react';
import { getLevelTierColor, xpForLevel } from '../../game/constants.js';

function StatBar({ value, max, className, style }) {
  const pct = Math.max(0, Math.min(100, (value / max) * 100));
  return (
    <div className="relative h-3 rounded-full overflow-hidden" style={{ background: 'rgba(0,0,0,0.5)', border: '1px solid rgba(255,255,255,0.08)', ...style }}>
      <div className={`h-full rounded-full transition-all duration-300 ${className}`} style={{ width: `${pct}%` }} />
      <span className="absolute inset-0 flex items-center justify-center text-white"
        style={{ fontSize: '8px', fontFamily: 'Cinzel, serif', textShadow: '0 1px 2px black' }}>
        {Math.floor(value)}/{Math.floor(max)}
      </span>
    </div>
  );
}

function AbilitySlot({ keyLabel, ability, cooldown, maxCooldown, level, classColor, onClick }) {
  const pct = maxCooldown > 0 ? cooldown / maxCooldown : 0;
  const isOnCD = cooldown > 0;

  return (
    <div className="flex flex-col items-center gap-0.5" onClick={onClick} style={{ cursor: 'pointer' }}>
      <div className="relative w-12 h-12 rounded-lg overflow-hidden"
        style={{
          background: isOnCD ? 'rgba(0,0,0,0.7)' : `${classColor}22`,
          border: `2px solid ${isOnCD ? 'rgba(255,255,255,0.15)' : classColor}`,
          boxShadow: isOnCD ? 'none' : `0 0 8px ${classColor}44`,
        }}>
        {/* Ability icon area */}
        <div className="absolute inset-0 flex items-center justify-center">
          <span style={{ fontSize: '20px' }}>
            {ability?.type === 'single' ? '⚡' :
             ability?.type === 'utility' ? '🛡️' :
             ability?.type === 'aoe' ? '💥' : '🔥'}
          </span>
        </div>

        {/* Cooldown overlay */}
        {isOnCD && (
          <div className="absolute inset-0 flex items-end justify-center pb-1"
            style={{ background: `rgba(0,0,0,${pct * 0.7})` }}>
            <div className="absolute bottom-0 left-0 right-0"
              style={{ height: `${pct * 100}%`, background: 'rgba(0,0,0,0.5)' }} />
            <span className="relative z-10 text-white font-bold" style={{ fontSize: '10px', fontFamily: 'Cinzel, serif' }}>
              {Math.ceil(cooldown / 1000)}s
            </span>
          </div>
        )}

        {/* Skill level dots */}
        <div className="absolute top-0.5 right-0.5 flex gap-0.5">
          {Array.from({ length: Math.min(level, 5) }).map((_, i) => (
            <div key={i} className="w-1 h-1 rounded-full" style={{ background: classColor }} />
          ))}
        </div>
      </div>

      <span className="font-cinzel text-xs" style={{ color: classColor, fontWeight: 'bold' }}>{keyLabel}</span>
      <span className="text-center leading-none" style={{ color: '#6a5a3a', fontSize: '8px', maxWidth: '48px' }}>
        {ability?.name?.split(' ').slice(0, 2).join(' ')}
      </span>
    </div>
  );
}

export default function HUD({ gameState, onOpenInventory, onOpenSkills }) {
  if (!gameState || !gameState.classData) return null;

  const { level, hp, maxHp, mp, maxMp, xp, classData, skillPoints, cooldowns, skillLevels } = gameState;
  const tier = getLevelTierColor(level);
  const xpNeeded = xpForLevel(level);
  const xpPct = Math.min(100, (xp / xpNeeded) * 100);
  const color = classData.color;
  const abilities = classData.abilities;
  const cdMax = { Q: 3000, W: 5000, E: 7000, R: 20000 };

  return (
    <>
      {/* Top-left: Player info */}
      <div className="fixed top-3 left-3 z-40 panel-glass rounded-lg p-3 w-52">
        {/* Name + level */}
        <div className="flex items-center gap-2 mb-2">
          <div className="w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold font-cinzel"
            style={{ background: tier.color, color: '#000', fontSize: '12px' }}>
            {level}
          </div>
          <div>
            <div className="font-cinzel font-bold text-xs" style={{ color: tier.color }}>
              {gameState.playerName || 'Hero'}
            </div>
            <div className="text-xs" style={{ color: '#6a5a3a' }}>{classData.name}</div>
          </div>
          <div className="ml-auto text-lg">{classData.icon}</div>
        </div>

        {/* HP */}
        <div className="mb-1">
          <div className="flex justify-between mb-0.5">
            <span className="text-xs font-cinzel" style={{ color: '#e63946' }}>HP</span>
          </div>
          <StatBar value={hp} max={maxHp} className="bar-hp" />
        </div>

        {/* MP */}
        <div className="mb-1">
          <div className="flex justify-between mb-0.5">
            <span className="text-xs font-cinzel" style={{ color: '#4a9eff' }}>MP</span>
          </div>
          <StatBar value={mp} max={maxMp} className="bar-mp" />
        </div>

        {/* XP */}
        <div className="mt-2">
          <div className="flex justify-between mb-0.5">
            <span className="text-xs font-cinzel" style={{ color: '#ffe88a' }}>XP</span>
            <span className="text-xs" style={{ color: '#5a4a2a', fontSize: '9px' }}>{Math.floor(xp)}/{xpNeeded}</span>
          </div>
          <StatBar value={xp} max={xpNeeded} className="bar-xp" />
        </div>

        {/* Kills / combat stats */}
        {gameState.kills > 0 && (
          <div className="mt-2 flex items-center gap-1">
            <span className="text-xs font-cinzel" style={{ color: '#ff6644' }}>⚔ {gameState.kills}</span>
            <span className="text-xs" style={{ color: '#3a2a1a' }}>kills</span>
          </div>
        )}

        {/* Skill points */}
        {skillPoints > 0 && (
          <div className="mt-2 flex items-center gap-2 cursor-pointer" onClick={onOpenSkills}>
            <div className="skill-point-badge w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold text-black font-cinzel">
              {skillPoints}
            </div>
            <span className="text-xs font-cinzel" style={{ color: '#ffe88a' }}>Skill Points!</span>
          </div>
        )}
      </div>

      {/* Bottom center: Ability bar */}
      <div className="fixed bottom-5 left-1/2 -translate-x-1/2 z-40">
        <div className="panel-glass rounded-xl px-5 py-3 flex items-end gap-4">
          {['Q', 'W', 'E'].map((key, i) => (
            <AbilitySlot
              key={key}
              keyLabel={key}
              ability={abilities[i]}
              cooldown={cooldowns?.[key] || 0}
              maxCooldown={cdMax[key]}
              level={skillLevels?.[key] || 0}
              classColor={color}
            />
          ))}

          {/* Separator */}
          <div className="w-px h-10 self-center" style={{ background: 'rgba(255,255,255,0.1)' }} />

          {/* R ultimate */}
          <div className="flex flex-col items-center gap-0.5">
            {level < 6 ? (
              <div className="w-14 h-14 rounded-lg flex flex-col items-center justify-center gap-1"
                style={{ background: 'rgba(0,0,0,0.5)', border: '2px solid rgba(255,255,255,0.1)' }}>
                <span style={{ fontSize: '10px', color: '#4a4a4a' }}>🔒</span>
                <span style={{ fontSize: '8px', color: '#4a4a4a', fontFamily: 'Cinzel, serif' }}>Lv.6</span>
              </div>
            ) : (
              <AbilitySlot
                keyLabel="R"
                ability={abilities[3]}
                cooldown={cooldowns?.R || 0}
                maxCooldown={cdMax.R}
                level={skillLevels?.R || 1}
                classColor="#ff9800"
              />
            )}
          </div>

          {/* F interact */}
          <div className="flex flex-col items-center gap-0.5">
            <div className="w-12 h-12 rounded-lg flex items-center justify-center"
              style={{ background: 'rgba(255,255,255,0.04)', border: '2px solid rgba(255,255,255,0.12)' }}>
              <span style={{ fontSize: '18px' }}>🗣️</span>
            </div>
            <span className="font-cinzel text-xs" style={{ color: '#5a4a2a' }}>F</span>
            <span style={{ color: '#4a3a2a', fontSize: '8px' }}>Interact</span>
          </div>
        </div>
      </div>

      {/* Bottom right: Panel buttons */}
      <div className="fixed bottom-5 right-3 z-40 flex flex-col gap-2">
        <button onClick={onOpenInventory}
          className="panel-glass rounded-lg px-3 py-2 font-cinzel text-xs hover:border-yellow-500/50 transition-colors"
          style={{ color: '#ffe88a' }}>
          🎒 Inventory
        </button>
        <button onClick={onOpenSkills}
          className="panel-glass rounded-lg px-3 py-2 font-cinzel text-xs hover:border-yellow-500/50 transition-colors"
          style={{ color: '#ffe88a' }}>
          ✨ Skills
        </button>
      </div>

      {/* Mini-map placeholder (top right) */}
      <div className="fixed top-3 right-3 z-40 panel-glass rounded-lg p-2">
        <div className="text-xs font-cinzel mb-1 text-center" style={{ color: '#5a4a2a' }}>MAP</div>
        <div className="relative w-24 h-24 rounded"
          style={{ background: 'rgba(0,0,0,0.6)', border: '1px solid rgba(255,255,255,0.08)' }}>
          {/* Zone tints */}
          <div className="absolute top-0 left-0 w-1/2 h-1/2 opacity-60 rounded-tl" style={{ background: '#2d7a1a' }} />
          <div className="absolute top-0 right-0 w-1/2 h-1/2 opacity-60 rounded-tr" style={{ background: '#1a5c28' }} />
          <div className="absolute bottom-0 left-0 w-1/2 h-1/2 opacity-60 rounded-bl" style={{ background: '#7a6a18' }} />
          <div className="absolute bottom-0 right-0 w-1/2 h-1/2 opacity-60 rounded-br" style={{ background: '#1a4a7a' }} />
          <div className="absolute inset-1/4 opacity-80 rounded" style={{ background: '#2a0a3a' }} />
          {/* Player dot */}
          <div className="absolute w-2 h-2 rounded-full z-10 -translate-x-1 -translate-y-1"
            style={{
              background: tier.color,
              boxShadow: `0 0 4px ${tier.color}`,
              left: '38%',
              top: '38%',
            }} />
        </div>
        <div className="text-center mt-1 font-cinzel" style={{ fontSize: '8px', color: '#4a3a2a' }}>
          {gameState.currentZone?.name || 'Starter Plains'}
        </div>
      </div>
    </>
  );
}