import React, { useState } from 'react';
import { RARITY_COLORS } from '../../game/constants.js';
import { motion } from 'framer-motion';
import { canEquipIntoSlot, normalizeItem } from '../../game/ItemSystem.js';
import { calculatePlayerStats, getEquipmentBonuses, STAT_DISPLAY_INFO, formatStatValue } from '../../game/StatsCalculator.js';
import ItemTooltip from './ItemTooltip.jsx';
import IconRenderer from './IconRenderer.jsx';

const SLOT_POSITIONS = {
  weapon:  { top: '45%', left: '5%' },
  offhand: { top: '45%', right: '5%' },
  helmet:  { top: '8%', left: '50%', transform: 'translateX(-50%)' },
  chest:   { top: '35%', left: '50%', transform: 'translateX(-50%)' },
  gloves:  { top: '60%', left: '15%' },
  boots:   { top: '85%', left: '50%', transform: 'translateX(-50%)' },
  ring1:   { top: '65%', left: '30%' },
  ring2:   { top: '65%', right: '30%' },
  amulet:  { top: '22%', right: '12%' },
  belt:    { top: '55%', left: '50%', transform: 'translateX(-50%)' },
  cape:    { top: '45%', right: '2%' },
};

const SLOT_LABELS = {
  weapon: 'Weapon', offhand: 'Offhand', helmet: 'Helmet', chest: 'Chest',
  gloves: 'Gloves', boots: 'Boots', ring1: 'Ring 1', ring2: 'Ring 2',
  amulet: 'Amulet', belt: 'Belt', cape: 'Cape'
};



function EquipmentSlot({ slotKey, item, onDrop, onUnequip, classId }) {
  const [showTip, setShowTip] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const [isValidDrag, setIsValidDrag] = useState(false);

  const handleDragOver = (e) => {
    e.preventDefault();
    try {
      const itemData = JSON.parse(e.dataTransfer.getData('application/json'));
      const normalized = normalizeItem(itemData);
      const isValid = canEquipIntoSlot(normalized, slotKey);
      setDragOver(true);
      setIsValidDrag(isValid);
    } catch {
      setDragOver(false);
      setIsValidDrag(false);
    }
  };

  const handleDrop = (e) => {
   e.preventDefault();
   setDragOver(false);
   setIsValidDrag(false);
   try {
     const itemData = JSON.parse(e.dataTransfer.getData('application/json'));
     // Pass both the new item and any occupied slot item for atomic swap
     onDrop(itemData, slotKey);
   } catch (err) {
     console.error('Drop error:', err);
   }
  };

  return (
    <motion.div
      whileHover={{ scale: 1.08 }}
      className="relative w-16 h-16 inv-slot equip-slot rounded-lg flex items-center justify-center cursor-pointer transition-all"
      style={{
        borderColor: dragOver && isValidDrag ? '#4caf50' : dragOver && !isValidDrag ? '#ff6644' : item ? RARITY_COLORS[item.rarity] + '80' : 'rgba(255,232,138,0.2)',
        background: dragOver && isValidDrag ? 'rgba(76,175,80,0.15)' : dragOver && !isValidDrag ? 'rgba(255,100,68,0.1)' : item ? 'rgba(0,0,0,0.4)' : 'rgba(0,0,0,0.2)',
        boxShadow: dragOver && isValidDrag ? '0 0 16px rgba(76,175,80,0.4), inset 0 0 12px rgba(76,175,80,0.2)' : item ? `inset 0 0 12px ${RARITY_COLORS[item.rarity]}40` : 'none',
      }}
      onMouseEnter={() => setShowTip(true)}
      onMouseLeave={() => { setShowTip(false); setDragOver(false); setIsValidDrag(false); }}
      onDragOver={handleDragOver}
      onDragLeave={() => { setDragOver(false); setIsValidDrag(false); }}
      onDrop={handleDrop}
      onDoubleClick={() => item && onUnequip(item, slotKey)}
      title={item ? `Double-click to unequip` : `${SLOT_LABELS[slotKey]} slot`}
    >
      <motion.div
        animate={{ scale: dragOver && isValidDrag ? 1.1 : 1 }}
        transition={{ duration: 0.1 }}
      >
        {item ? (
          <>
            <IconRenderer item={item} size={44} />
            {showTip && <ItemTooltip item={item} position="right" />}
            <div className="absolute bottom-1 right-1 left-1 text-center"
              style={{ fontSize: '6px', color: RARITY_COLORS[item.rarity], textTransform: 'uppercase', fontWeight: 'bold' }}>
              {item.rarity.slice(0, 3)}
            </div>
          </>
        ) : (
          <div className="flex flex-col items-center gap-1 opacity-40">
            <IconRenderer item={{ slot: slotKey }} size={28} />
          </div>
        )}
      </motion.div>
    </motion.div>
  );
}

export default function EquipmentPanel({ gameState, equipped, onEquip, onUnequip }) {
  const classId = gameState.classData?.id || 'warrior';
  const classColor = gameState.classData?.color || '#888';

  // Get calculated stats from gameState
  const stats = gameState.stats || calculatePlayerStats(gameState);
  const bonuses = getEquipmentBonuses(equipped);

  // Primary display stats
  const displayStats = [
    { key: 'attackPower', label: 'ATK', color: '#e63946' },
    { key: 'defense', label: 'DEF', color: '#4a9eff' },
    { key: 'maxHealth', label: 'HP', color: '#4caf50' },
    { key: 'maxMana', label: 'MP', color: '#9c27b0' },
  ];

  const primarySlots = ['weapon', 'helmet', 'chest', 'gloves', 'boots'];
  const secondarySlots = ['offhand', 'ring1', 'ring2', 'amulet', 'belt', 'cape'].filter(s => equipped[s] || s !== 'offhand');

  return (
    <div className="flex flex-col gap-4 h-full">
      {/* Character Sheet */}
      <div className="p-4 rounded-lg" style={{ background: 'rgba(0,0,0,0.3)', border: '1px solid rgba(255,232,138,0.15)' }}>
        <div className="font-cinzel text-xs mb-3" style={{ color: '#6a5a3a' }}>CHARACTER</div>
        <div className="flex items-center gap-3">
          <div className="relative w-24 h-24 flex items-center justify-center rounded-lg"
            style={{ background: `linear-gradient(135deg, ${classColor}20, ${classColor}10)`, border: `2px solid ${classColor}` }}>
            <div className="text-5xl">{gameState.classData?.icon}</div>
          </div>
          <div>
            <div className="font-cinzel font-bold text-sm" style={{ color: '#ffe88a' }}>{gameState.playerName}</div>
            <div className="font-cinzel text-xs mb-2" style={{ color: '#6a5a3a' }}>Lv. {gameState.level} {gameState.classData?.name}</div>
            <div className="space-y-1">
              {displayStats.map(s => {
                const bonus = bonuses[s.key] || 0;
                return (
                  <div key={s.key} className="flex justify-between gap-4">
                    <span className="font-cinzel text-xs" style={{ color: '#5a4a2a' }}>{s.label}</span>
                    <div className="flex items-center gap-1">
                      {bonus > 0 && (
                        <span className="text-xs" style={{ color: '#4caf50' }}>+{bonus}</span>
                      )}
                      <span className="font-cinzel text-xs font-bold" style={{ color: s.color }}>
                        {formatStatValue(s.key, stats[s.key])}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {/* Equipment Slots Grid */}
      <div className="p-4 rounded-lg" style={{ background: 'rgba(0,0,0,0.2)', border: '1px solid rgba(255,232,138,0.1)' }}>
        <div className="font-cinzel text-xs mb-3" style={{ color: '#6a5a3a' }}>EQUIPMENT SLOTS</div>
        <div className="grid grid-cols-3 gap-3">
          {primarySlots.map(slot => (
            <div key={slot}>
              <div className="text-xs font-cinzel mb-1" style={{ color: '#6a5a3a' }}>{SLOT_LABELS[slot]}</div>
              <EquipmentSlot
                slotKey={slot}
                item={equipped[slot]}
                classId={classId}
                onDrop={onEquip}
                onUnequip={onUnequip}
              />
            </div>
          ))}
        </div>

        {/* Secondary Slots */}
        {secondarySlots.length > 0 && (
          <div className="mt-4 pt-4 border-t border-yellow-500/10">
            <div className="grid grid-cols-3 gap-3">
              {secondarySlots.map(slot => (
                <div key={slot}>
                  <div className="text-xs font-cinzel mb-1" style={{ color: '#6a5a3a' }}>{SLOT_LABELS[slot]}</div>
                  <EquipmentSlot
                    slotKey={slot}
                    item={equipped[slot]}
                    classId={classId}
                    onDrop={onEquip}
                    onUnequip={onUnequip}
                  />
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Additional Stats */}
      {(stats.moveSpeed !== 1.0 || stats.critChance > 0 || stats.critDamage !== 1.0) && (
        <div className="p-3 rounded-lg" style={{ background: 'rgba(0,0,0,0.2)' }}>
         <div className="font-cinzel text-xs mb-2" style={{ color: '#6a5a3a' }}>BONUSES</div>
         <div className="grid grid-cols-2 gap-2 text-xs">
           {stats.moveSpeed !== 1.0 && (
             <div className="flex justify-between">
               <span style={{ color: '#5a4a2a' }}>MSPD</span>
               <span style={{ color: '#8bc34a' }}>{(stats.moveSpeed * 100).toFixed(0)}%</span>
             </div>
           )}
           {stats.critChance > 0 && (
             <div className="flex justify-between">
               <span style={{ color: '#5a4a2a' }}>CRIT%</span>
               <span style={{ color: '#ff9800' }}>{(stats.critChance * 100).toFixed(1)}%</span>
             </div>
           )}
           {stats.critDamage !== 1.0 && (
             <div className="flex justify-between">
               <span style={{ color: '#5a4a2a' }}>CRIT DMG</span>
               <span style={{ color: '#ff5722' }}>{(stats.critDamage * 100).toFixed(0)}%</span>
             </div>
           )}
         </div>
        </div>
      )}
    </div>
  );
}