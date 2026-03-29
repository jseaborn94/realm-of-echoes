import React from 'react';
import { getLevelTierColor, xpForLevel } from '../../game/constants.js';
import MiniMap from './MiniMap.jsx';
import UIBarRenderer from './UIBarRenderer.jsx';

function StatBar({ value, max, className, style, barType = 'small' }) {
  const pct = Math.max(0, Math.min(1, value / max));
  return (
    <div className="relative h-3 overflow-hidden" style={{ ...style }}>
      {/* Sprite bar overlay (if available, will render transparently on top) */}
      <div className="absolute inset-0 pointer-events-none">
        <UIBarRenderer fillPercent={pct} barType={barType} style={{ width: '100%', height: '100%' }} />
      </div>
      {/* Fallback CSS bar (shows if sprite fails) */}
      <div className={`h-full transition-all duration-300 ${className}`} style={{ width: `${pct * 100}%` }} />
      {/* Text overlay */}
      <span className="absolute inset-0 flex items-center justify-center text-white"
        style={{ fontSize: '8px', fontFamily: 'Cinzel, serif', textShadow: '0 1px 2px black', zIndex: 10 }}>
        {Math.floor(value)}/{Math.floor(max)}
      </span>
    </div>
  );
}

function AbilitySlot({ keyLabel, ability, cooldown, maxCooldown, level, classColor, onClick }) {
  const pct = maxCooldown > 0 ? cooldown / maxCooldown : 0;
  const isOnCD = cooldown > 0;
  const isLocked = level === 0; // 0/5 = locked, unusable

  return (
    <div className="flex flex-col items-center gap-0.5" onClick={onClick} style={{ cursor: isLocked ? 'default' : 'pointer' }}>
      <div className="relative w-12 h-12 rounded-lg overflow-hidden"
        style={{
          background: isLocked ? 'rgba(0,0,0,0.6)' : isOnCD ? 'rgba(0,0,0,0.7)' : `${classColor}22`,
          border: `2px solid ${isLocked ? 'rgba(255,255,255,0.08)' : isOnCD ? 'rgba(255,255,255,0.15)' : classColor}`,
          boxShadow: isLocked || isOnCD ? 'none' : `0 0 8px ${classColor}44`,
          opacity: isLocked ? 0.5 : 1,
        }}>
        {/* Ability icon or lock icon */}
        <div className="absolute inset-0 flex items-center justify-center">
          {isLocked ? (
            <span style={{ fontSize: '18px' }}>🔒</span>
          ) : (
            <span style={{ fontSize: '20px' }}>
              {ability?.type === 'single' ? '⚡' :
               ability?.type === 'utility' ? '🛡️' :
               ability?.type === 'aoe' ? '💥' : '🔥'}
            </span>
          )}
        </div>

        {/* Cooldown overlay */}
        {!isLocked && isOnCD && (
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
        {!isLocked && (
          <div className="absolute top-0.5 right-0.5 flex gap-0.5">
            {Array.from({ length: Math.min(level, 5) }).map((_, i) => (
              <div key={i} className="w-1 h-1 rounded-full" style={{ background: classColor }} />
            ))}
          </div>
        )}
      </div>

      <span className="font-cinzel text-xs" style={{ color: isLocked ? '#3a2a1a' : classColor, fontWeight: 'bold' }}>{keyLabel}</span>
      <span className="text-center leading-none" style={{ color: isLocked ? '#2a1a0a' : '#6a5a3a', fontSize: '8px', maxWidth: '48px' }}>
        {isLocked ? 'locked' : ability?.name?.split(' ').slice(0, 2).join(' ')}
      </span>
    </div>
  );
}

function PotionSlot({ keyLabel, icon, color, cooldown, maxCooldown }) {
  const pct = maxCooldown > 0 ? cooldown / maxCooldown : 0;
  const isOnCD = cooldown > 0;
  return (
    <div className="flex flex-col items-center gap-0.5">
      <div className="relative w-11 h-11 rounded-lg overflow-hidden"
        style={{
          background: isOnCD ? 'rgba(0,0,0,0.7)' : `${color}22`,
          border: `2px solid ${isOnCD ? 'rgba(255,255,255,0.12)' : color}`,
          boxShadow: isOnCD ? 'none' : `0 0 10px ${color}55`,
        }}>
        <div className="absolute inset-0 flex items-center justify-center">
          <span style={{ fontSize: '18px', filter: isOnCD ? 'grayscale(80%)' : 'none' }}>{icon}</span>
        </div>
        {isOnCD && (
          <div className="absolute inset-0 flex items-end justify-center pb-0.5"
            style={{ background: `rgba(0,0,0,${pct * 0.6})` }}>
            <div className="absolute bottom-0 left-0 right-0"
              style={{ height: `${pct * 100}%`, background: 'rgba(0,0,0,0.45)' }} />
            <span className="relative z-10 text-white font-bold" style={{ fontSize: '9px', fontFamily: 'Cinzel, serif' }}>
              {Math.ceil(cooldown / 1000)}s
            </span>
          </div>
        )}
      </div>
      <span className="font-cinzel text-xs font-bold" style={{ color: isOnCD ? '#3a3a3a' : color }}>{keyLabel}</span>
      <span style={{ color: '#4a3a2a', fontSize: '8px' }}>{icon === '🧪' ? 'HP' : 'MP'}</span>
    </div>
  );
}

export default function HUD({ gameState, onOpenInventory, onOpenSkills }) {
  if (!gameState || !gameState.classData) return null;

  const { level, hp, maxHp, mp, maxMp, xp, classData, skillPoints, cooldowns, skillLevels, potionCooldowns } = gameState;
  const tier = getLevelTierColor(level);
  const xpNeeded = xpForLevel(level);
  const xpPct = Math.min(100, (xp / xpNeeded) * 100);
  const color = classData.color;
  const abilities = classData.abilities;
  const cdMax = { Q: 3000, W: 5000, E: 7000, R: 20000 };
  const POTION_CD = 30000;

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

        {/* Active buffs */}
        {gameState._activeBuffs && Object.values(gameState._activeBuffs).length > 0 && (
          <div className="mt-3 pt-2 border-t border-yellow-600/30 space-y-1">
            <div className="text-xs font-cinzel" style={{ color: '#88ff88' }}>Active Buffs:</div>
            {Object.values(gameState._activeBuffs).map((buff, i) => {
              const pct = Math.max(0, (buff.duration / buff.maxDuration) * 100);
              return (
                <div key={i} className="flex items-center gap-1">
                  <span className="text-xs font-cinzel" style={{ color: '#88ff88' }}>{buff.name}</span>
                  <div className="flex-1 h-1.5 bg-gray-800 rounded overflow-hidden">
                    <div className="h-full" style={{ width: `${pct}%`, background: '#88ff88' }} />
                  </div>
                  <span className="text-xs" style={{ color: '#5a7a3a' }}>{buff.duration.toFixed(1)}s</span>
                </div>
              );
            })}
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

          {/* Separator */}
          <div className="w-px h-10 self-center" style={{ background: 'rgba(255,255,255,0.08)' }} />

          {/* Potions */}
          <PotionSlot keyLabel="1" icon="🧪" color="#e63946" cooldown={potionCooldowns?.hp || 0} maxCooldown={POTION_CD} />
          <PotionSlot keyLabel="2" icon="💧" color="#4a9eff" cooldown={potionCooldowns?.mp || 0} maxCooldown={POTION_CD} />

          {/* Separator */}
          <div className="w-px h-10 self-center" style={{ background: 'rgba(255,255,255,0.08)' }} />

          {/* F interact */}
          <div className="flex flex-col items-center gap-0.5">
            <div className="w-11 h-11 rounded-lg flex items-center justify-center"
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
      <button 
        onClick={onOpenInventory}
        className="px-3 py-2 rounded bg-blue-600 hover:bg-blue-700 text-yellow-100 font-cinzel font-bold text-sm transition-colors"
        style={{ minWidth: '100px' }}>
        🎒 Inventory
      </button>
      <button 
        onClick={onOpenSkills}
        className="px-3 py-2 rounded bg-blue-600 hover:bg-blue-700 text-yellow-100 font-cinzel font-bold text-sm transition-colors"
        style={{ minWidth: '100px' }}>
        ✨ Skills
      </button>
      </div>

      {/* Mini-map — organic zones canvas */}
      <MiniMap gameState={gameState} tier={tier} />
    </>
  );
}