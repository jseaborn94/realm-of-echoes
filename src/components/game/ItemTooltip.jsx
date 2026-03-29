import React from 'react';
import { RARITY_COLORS } from '@/game/constants.js';
import { motion } from 'framer-motion';

/**
 * Polished item tooltip with stat breakdowns and comparison
 * Shows upgrades/downgrades when comparing against equipped gear
 */
export default function ItemTooltip({ item, equippedInSlot, position = 'top' }) {
  if (!item) return null;

  // Normalize stat field names
  const normalizeStatField = (field) => {
    const mapping = { 'attack': 'attackPower', 'hp': 'maxHealth', 'mp': 'maxMana' };
    return mapping[field] || field;
  };

  // Get stats with normalized names
  const itemStats = {};
  if (item.stats) {
    Object.entries(item.stats).forEach(([field, value]) => {
      const normalized = normalizeStatField(field);
      itemStats[normalized] = value;
    });
  }

  // Get equipped stats for comparison
  const equippedStats = {};
  if (equippedInSlot?.stats) {
    Object.entries(equippedInSlot.stats).forEach(([field, value]) => {
      const normalized = normalizeStatField(field);
      equippedStats[normalized] = value;
    });
  }

  // Stat display metadata
  const STAT_LABELS = {
    strength: 'Strength',
    dexterity: 'Dexterity',
    intelligence: 'Intelligence',
    vitality: 'Vitality',
    maxHealth: 'Health',
    maxMana: 'Mana',
    attackPower: 'Attack',
    magicPower: 'Magic Power',
    defense: 'Defense',
    critChance: 'Crit Chance',
    critDamage: 'Crit Damage',
    attackSpeed: 'Attack Speed',
    moveSpeed: 'Move Speed',
    rangeBonus: 'Range',
  };

  const STAT_COLORS = {
    strength: '#e63946',
    dexterity: '#4caf50',
    intelligence: '#2196f3',
    vitality: '#ff9800',
    maxHealth: '#4caf50',
    maxMana: '#2196f3',
    attackPower: '#e63946',
    magicPower: '#9c27b0',
    defense: '#2196f3',
    critChance: '#ff9800',
    critDamage: '#ff5722',
    attackSpeed: '#00bcd4',
    moveSpeed: '#8bc34a',
    rangeBonus: '#3f51b5',
  };

  // Format stat value
  const formatStat = (stat, value) => {
    if (stat === 'critDamage' || stat === 'attackSpeed' || stat === 'moveSpeed') {
      return `${(value * 100).toFixed(0)}%`;
    }
    if (stat === 'critChance') {
      return `${(value * 100).toFixed(1)}%`;
    }
    return Math.floor(value);
  };

  // Check if class restricted
  const classRestricted = item.classRestriction && item.classRestriction !== 'all';
  const isOffClass = item.weaponClass && item.weaponClass !== 'warrior'; // TODO: Get actual class

  // Get all stats to display
  const statsToDisplay = Object.keys(itemStats).sort();

  // Position styles
  const positionClass =
    position === 'bottom'
      ? 'bottom-full mb-2'
      : position === 'right'
      ? 'left-full ml-2'
      : 'top-full mt-2';

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95, y: -4 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.95 }}
      transition={{ duration: 0.15 }}
      className={`absolute z-50 w-72 panel-glass-gold rounded-lg p-3 pointer-events-none ${positionClass}`}
      style={{
        left: position === 'right' ? 'auto' : '50%',
        transform: position === 'right' ? 'translateY(-50%)' : 'translateX(-50%)',
      }}
    >
      {/* Header */}
      <div className="mb-2 pb-2 border-b border-yellow-600/20">
        <div
          className="font-cinzel font-bold text-base mb-0.5"
          style={{ color: RARITY_COLORS[item.rarity] || '#ffe88a' }}
        >
          {item.name}
        </div>
        <div className="flex items-center justify-between gap-2">
          <div className="flex gap-2 flex-wrap">
            <span className="text-xs px-2 py-0.5 rounded" style={{ background: RARITY_COLORS[item.rarity] + '30', color: RARITY_COLORS[item.rarity] }}>
              {item.rarity}
            </span>
            {item.slot && (
              <span className="text-xs px-2 py-0.5 rounded" style={{ background: 'rgba(255,232,138,0.15)', color: '#6a5a3a' }}>
                {item.slot}
              </span>
            )}
          </div>
          {item.icon && <span style={{ fontSize: '16px' }}>{item.icon}</span>}
        </div>
      </div>

      {/* Class Restriction */}
      {classRestricted && (
        <div className="mb-2 text-xs px-2 py-1 rounded" style={{ background: isOffClass ? 'rgba(255,100,68,0.15)' : 'rgba(76,175,80,0.15)', color: isOffClass ? '#ff6644' : '#4caf50' }}>
          {isOffClass ? `⚠ ${item.classRestriction} only` : `✓ ${item.classRestriction}`}
        </div>
      )}

      {/* Stats */}
      {statsToDisplay.length > 0 && (
        <div className="mb-2 space-y-1">
          {statsToDisplay.map((stat) => {
            const itemValue = itemStats[stat];
            const equippedValue = equippedStats[stat] || 0;
            const diff = itemValue - equippedValue;
            const isDiff = equippedInSlot && diff !== 0;

            return (
              <div key={stat} className="flex items-center justify-between gap-2 text-xs">
                <span style={{ color: '#5a4a2a' }}>{STAT_LABELS[stat]}</span>
                <div className="flex items-center gap-2">
                  <span style={{ color: STAT_COLORS[stat] || '#8a7a5a', fontWeight: 'bold' }}>
                    {formatStat(stat, itemValue)}
                  </span>
                  {isDiff && (
                    <span style={{ color: diff > 0 ? '#4caf50' : '#ff6644', fontSize: '10px' }}>
                      {diff > 0 ? `↑${formatStat(stat, Math.abs(diff))}` : `↓${formatStat(stat, Math.abs(diff))}`}
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Description */}
      {item.description && (
        <div className="text-xs italic pt-2 border-t border-yellow-600/20" style={{ color: '#7a6a4a' }}>
          {item.description}
        </div>
      )}

      {/* Comparison note */}
      {equippedInSlot && (
        <div className="mt-2 pt-2 border-t border-yellow-600/20 text-xs" style={{ color: '#6a5a3a' }}>
          Comparing with: <span style={{ color: RARITY_COLORS[equippedInSlot.rarity] || '#ffe88a' }}>{equippedInSlot.name}</span>
        </div>
      )}
    </motion.div>
  );
}