import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const SKILL_KEYS = ['Q', 'W', 'E'];
const TYPE_COLORS = {
  single:  '#e63946',
  utility: '#4a9eff',
  aoe:     '#ff9800',
  ultimate:'#c44aff',
};
const TYPE_ICONS = {
  single:  '⚡',
  utility: '🛡️',
  aoe:     '💥',
  ultimate:'🔥',
};

function SkillRow({ keyLabel, ability, skillLevel, skillPoints, onUpgrade, classColor }) {
  const maxLevel = 5;
  const isLocked = skillLevel === 0;
  const canUpgrade = skillPoints > 0 && skillLevel < maxLevel;
  const borderColor = isLocked ? 'rgba(255,255,255,0.06)' : `${classColor}33`;
  const bgColor = isLocked ? 'rgba(0,0,0,0.45)' : 'rgba(0,0,0,0.3)';

  return (
    <div className="p-3 rounded-lg mb-2 transition-all" style={{ background: bgColor, border: `1px solid ${borderColor}` }}>
      <div className="flex items-start gap-3">
        {/* Key badge */}
        <div className="w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 font-cinzel font-black text-lg relative"
          style={{
            background: isLocked ? 'rgba(0,0,0,0.5)' : `${classColor}22`,
            border: `2px solid ${isLocked ? 'rgba(255,255,255,0.1)' : classColor}`,
            color: isLocked ? '#3a2a1a' : classColor,
          }}>
          {keyLabel}
          {isLocked && <div className="absolute inset-0 flex items-center justify-center text-sm rounded-lg" style={{ background: 'rgba(0,0,0,0.5)' }}>🔒</div>}
        </div>

        {/* Info */}
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-1">
            <span style={{ fontSize: '16px', opacity: isLocked ? 0.3 : 1 }}>{TYPE_ICONS[ability.type]}</span>
            <span className="font-cinzel font-bold text-sm" style={{ color: isLocked ? '#3a2a1a' : classColor }}>{ability.name}</span>
            {!isLocked && (
              <span className="text-xs px-1.5 py-0.5 rounded font-cinzel capitalize"
                style={{ background: TYPE_COLORS[ability.type] + '22', color: TYPE_COLORS[ability.type], fontSize: '9px' }}>
                {ability.type}
              </span>
            )}
            {isLocked && (
              <span className="text-xs px-1.5 py-0.5 rounded font-cinzel"
                style={{ background: 'rgba(255,255,255,0.05)', color: '#3a2a1a', fontSize: '9px' }}>
                LOCKED
              </span>
            )}
          </div>

          <p className="text-xs mb-2" style={{ color: isLocked ? '#2a1a0a' : '#6a5a3a', fontFamily: 'Crimson Text, serif', lineHeight: 1.5 }}>
            {isLocked ? 'Invest 1 skill point to unlock this ability.' : ability.description}
          </p>

          {!isLocked && (
            <div className="flex items-center gap-1 text-xs" style={{ color: '#5a4a2a' }}>
              <span className="font-cinzel">MP:</span>
              <span style={{ color: '#4a9eff' }}>{ability.mpCost}</span>
            </div>
          )}
        </div>

        {/* Level control */}
        <div className="flex flex-col items-center gap-1.5 flex-shrink-0">
          <div className="font-cinzel text-xs" style={{ color: isLocked ? '#2a1a0a' : '#5a4a2a' }}>
            Level <span style={{ color: isLocked ? '#3a2a1a' : classColor }}>{skillLevel}</span>/{maxLevel}
          </div>

          {/* Level dots */}
          <div className="flex gap-1">
            {Array.from({ length: maxLevel }).map((_, i) => (
              <div key={i} className="w-3 h-3 rounded-full border transition-all"
                style={{
                  background: i < skillLevel ? classColor : 'transparent',
                  borderColor: i < skillLevel ? classColor : 'rgba(255,255,255,0.08)',
                  boxShadow: i < skillLevel ? `0 0 4px ${classColor}` : 'none',
                }} />
            ))}
          </div>

          {!isLocked && (
            <div className="text-center">
              <div className="font-cinzel text-xs" style={{ color: '#4caf50', fontSize: '10px' }}>
                +{Math.round(skillLevel * 30)}% power
              </div>
            </div>
          )}

          {/* Upgrade / Unlock button */}
          <button
            onClick={() => canUpgrade && onUpgrade(keyLabel)}
            disabled={!canUpgrade}
            className="font-cinzel text-xs px-2 py-1 rounded transition-all"
            style={{
              background: canUpgrade ? `linear-gradient(135deg, ${classColor}, ${classColor}aa)` : 'rgba(255,255,255,0.05)',
              color: canUpgrade ? '#000' : '#3a2a1a',
              border: `1px solid ${canUpgrade ? classColor : 'rgba(255,255,255,0.08)'}`,
              cursor: canUpgrade ? 'pointer' : 'not-allowed',
              fontWeight: 'bold',
            }}
          >
            {skillLevel >= maxLevel ? 'MAX' : isLocked ? '🔓 Unlock' : '↑ Upgrade'}
          </button>
        </div>
      </div>
    </div>
  );
}

function UltimateRow({ ability, gameState, classColor }) {
  const isUnlocked = gameState.level >= 6;

  return (
    <div className="p-3 rounded-lg" style={{
      background: isUnlocked ? 'rgba(196,74,255,0.08)' : 'rgba(0,0,0,0.3)',
      border: isUnlocked ? '1px solid rgba(196,74,255,0.3)' : '1px solid rgba(255,255,255,0.05)',
    }}>
      <div className="flex items-start gap-3">
        <div className="w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 font-cinzel font-black text-lg relative"
          style={{
            background: isUnlocked ? 'rgba(196,74,255,0.2)' : 'rgba(0,0,0,0.5)',
            border: `2px solid ${isUnlocked ? '#c44aff' : 'rgba(255,255,255,0.1)'}`,
            color: isUnlocked ? '#c44aff' : '#3a2a1a',
          }}>
          R
          {!isUnlocked && <div className="absolute inset-0 flex items-center justify-center text-sm">🔒</div>}
        </div>

        <div className="flex-1">
          <div className="flex items-center gap-2 mb-1">
            <span style={{ fontSize: '16px' }}>{isUnlocked ? '🔥' : '🔒'}</span>
            <span className="font-cinzel font-bold text-sm" style={{ color: isUnlocked ? '#c44aff' : '#3a2a1a' }}>
              {ability.name}
            </span>
            <span className="text-xs px-1.5 py-0.5 rounded font-cinzel"
              style={{ background: 'rgba(196,74,255,0.15)', color: '#c44aff', fontSize: '9px' }}>
              ULTIMATE
            </span>
          </div>
          <p className="text-xs mb-1" style={{ color: isUnlocked ? '#6a5a3a' : '#2a1a1a', fontFamily: 'Crimson Text, serif', lineHeight: 1.5 }}>
            {ability.description}
          </p>
          {!isUnlocked && (
            <div className="font-cinzel text-xs" style={{ color: '#4a3a2a' }}>
              Unlocks at Level 6 (current: Lv. {gameState.level})
            </div>
          )}
          {isUnlocked && (
            <div className="text-xs" style={{ color: '#5a4a2a' }}>
              <span className="font-cinzel">MP:</span> <span style={{ color: '#4a9eff' }}>{ability.mpCost}</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default function SkillsPanel({ gameState, onClose, onUpgradeSkill }) {
  const { classData, skillPoints = 0, skillLevels = {} } = gameState;
  if (!classData) return null;

  const abilities = classData.abilities;
  const color = classData.color;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 flex items-center justify-center"
        style={{ background: 'rgba(0,0,0,0.7)' }}
        onClick={e => e.target === e.currentTarget && onClose()}
      >
        <motion.div
          initial={{ scale: 0.9, y: 20 }}
          animate={{ scale: 1, y: 0 }}
          exit={{ scale: 0.9, y: 20 }}
          className="panel-glass-gold rounded-xl p-5 w-full max-w-lg"
          style={{ maxHeight: '90vh', overflowY: 'auto' }}
        >
          {/* Header */}
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="font-cinzel font-bold text-xl" style={{ color: '#ffe88a' }}>
                ✨ Skills — {classData.name}
              </h2>
              <p className="text-xs font-cinzel mt-0.5" style={{ color: '#5a4a2a' }}>
                Level {gameState.level}
              </p>
            </div>
            <div className="flex items-center gap-3">
              {skillPoints > 0 && (
                <div className="flex items-center gap-1.5">
                  <div className="skill-point-badge w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold text-black font-cinzel">
                    {skillPoints}
                  </div>
                  <span className="font-cinzel text-xs" style={{ color: '#ffe88a' }}>pts</span>
                </div>
              )}
              <button onClick={onClose} className="font-cinzel text-sm px-3 py-1 rounded"
                style={{ color: '#6a5a3a', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)' }}>
                ✕
              </button>
            </div>
          </div>

          {/* Skill points info */}
          <div className="mb-4 p-2.5 rounded-lg" style={{ background: 'rgba(255,232,138,0.06)', border: '1px solid rgba(255,232,138,0.12)' }}>
            <p className="text-xs font-cinzel" style={{ color: '#8a7a5a' }}>
              Available Skill Points: <span style={{ color: '#ffe88a' }}>{skillPoints}</span>
              <span className="ml-2 opacity-60">· Skills must be unlocked before use · +1 pt per level · Q/W/E cap at Lv.5 · R unlocks at Lv.6</span>
            </p>
          </div>

          {/* Q, W, E skills */}
          {SKILL_KEYS.map((key, i) => (
            <SkillRow
              key={key}
              keyLabel={key}
              ability={abilities[i]}
              skillLevel={skillLevels[key] || 0}
              skillPoints={skillPoints}
              onUpgrade={onUpgradeSkill}
              classColor={color}
            />
          ))}

          {/* R ultimate */}
          <UltimateRow
            ability={abilities[3]}
            gameState={gameState}
            classColor={color}
          />
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}