import React, { useState } from 'react';
import { RARITY_COLORS } from '../../game/constants.js';
import { motion } from 'framer-motion';
import { canEquipIntoSlot, normalizeItem } from '../../game/ItemSystem.js';

const SLOT_ICONS = {
  weapon: '⚔️', offhand: '🛡️', helmet: '⛑️', chest: '🧥',
  gloves: '🧤', boots: '👢', ring1: '💍', ring2: '💍',
  amulet: '📿', belt: '🪡', cape: '🧛'
};

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

function ItemTooltip({ item, isOffClass }) {
  if (!item) return null;
  return (
    <div className="absolute z-50 w-48 panel-glass-gold rounded-lg p-3 pointer-events-none whitespace-normal"
      style={{ bottom: '110%', left: '50%', transform: 'translateX(-50%)' }}>
      <div className="font-cinzel font-bold text-sm mb-1" style={{ color: RARITY_COLORS[item.rarity] }}>
        {item.name}
      </div>
      <div className="text-xs mb-1 capitalize" style={{ color: '#6a5a3a' }}>
        {item.rarity} · {item.slot}
      </div>
      {Object.entries(item.stats || {}).map(([stat, val]) => val !== 0 && (
        <div key={stat} className="text-xs flex justify-between">
          <span style={{ color: '#8a7a5a' }}>{stat.toUpperCase()}</span>
          <span style={{ color: '#4caf50' }}>+{val}</span>
        </div>
      ))}
    </div>
  );
}

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
            <span style={{ fontSize: '28px' }}>{item.icon}</span>
            {showTip && <ItemTooltip item={item} />}
            <div className="absolute bottom-1 right-1 left-1 text-center"
              style={{ fontSize: '6px', color: RARITY_COLORS[item.rarity], textTransform: 'uppercase', fontWeight: 'bold' }}>
              {item.rarity.slice(0, 3)}
            </div>
          </>
        ) : (
          <div className="flex flex-col items-center gap-1 opacity-40">
            <span style={{ fontSize: '24px' }}>{SLOT_ICONS[slotKey]}</span>
          </div>
        )}
      </motion.div>
    </motion.div>
  );
}

export default function EquipmentPanel({ gameState, equipped, onEquip, onUnequip }) {
  const classId = gameState.classData?.id || 'warrior';
  const classColor = gameState.classData?.color || '#888';

  // Calculate total stats
  const baseStats = gameState.classData?.baseStats || {};
  const equipStats = Object.values(equipped).reduce((acc, item) => {
    if (!item) return acc;
    Object.entries(item.stats || {}).forEach(([k, v]) => { acc[k] = (acc[k] || 0) + v; });
    return acc;
  }, {});

  const totalStats = {
    attack: (baseStats.attack || 0) + (equipStats.attack || 0),
    defense: (baseStats.defense || 0) + (equipStats.defense || 0),
    hp: (baseStats.hp || 0) + (gameState.level || 1) * 15,
    mp: (baseStats.mp || 0) + (gameState.level || 1) * 8,
  };

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
              {[
                { label: 'ATK', val: totalStats.attack, color: '#e63946' },
                { label: 'DEF', val: totalStats.defense, color: '#4a9eff' },
              ].map(s => (
                <div key={s.label} className="flex justify-between gap-4">
                  <span className="font-cinzel text-xs" style={{ color: '#5a4a2a' }}>{s.label}</span>
                  <div className="flex items-center gap-1">
                    {equipStats[s.label?.toLowerCase()] > 0 && (
                      <span className="text-xs" style={{ color: '#4caf50' }}>+{equipStats[s.label?.toLowerCase()]}</span>
                    )}
                    <span className="font-cinzel text-xs font-bold" style={{ color: s.color }}>{s.val}</span>
                  </div>
                </div>
              ))}
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

      {/* Full Stats Summary */}
      <div className="p-3 rounded-lg" style={{ background: 'rgba(0,0,0,0.2)' }}>
        <div className="grid grid-cols-2 gap-2">
          {[
            { label: 'HP', val: totalStats.hp, color: '#4caf50' },
            { label: 'MP', val: totalStats.mp, color: '#9c27b0' },
          ].map(s => (
            <div key={s.label} className="flex justify-between gap-2">
              <span className="font-cinzel text-xs" style={{ color: '#5a4a2a' }}>{s.label}</span>
              <span className="font-cinzel text-xs font-bold" style={{ color: s.color }}>{s.val}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}