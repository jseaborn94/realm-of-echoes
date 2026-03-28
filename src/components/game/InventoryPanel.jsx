import React, { useState } from 'react';
import { EQUIP_SLOTS, RARITY_COLORS } from '../../game/constants.js';
import { motion, AnimatePresence } from 'framer-motion';

const SLOT_ICONS = {
  helmet: '⛑️',
  chest: '🧥',
  pants: '👖',
  gloves: '🧤',
  boots: '👢',
  weapon: '⚔️',
  shield: '🛡️',
};

function ItemTooltip({ item }) {
  if (!item) return null;
  return (
    <div className="absolute z-50 w-44 panel-glass-gold rounded-lg p-3 pointer-events-none"
      style={{ bottom: '110%', left: '50%', transform: 'translateX(-50%)' }}>
      <div className="font-cinzel font-bold text-sm mb-1" style={{ color: RARITY_COLORS[item.rarity] }}>
        {item.name}
      </div>
      <div className="text-xs mb-2 capitalize" style={{ color: '#6a5a3a' }}>
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

function EquipSlot({ slot, item, onDrop, onUnequip, isWarrior }) {
  const [showTip, setShowTip] = useState(false);
  const [dragOver, setDragOver] = useState(false);

  if (slot === 'shield' && !isWarrior) return <div className="w-14 h-14" />;

  return (
    <div
      className="relative w-14 h-14 inv-slot equip-slot rounded-lg flex items-center justify-center cursor-pointer transition-all"
      style={{
        borderColor: dragOver ? 'rgba(255,232,138,0.8)' : item ? RARITY_COLORS[item.rarity] + '60' : undefined,
        background: dragOver ? 'rgba(255,232,138,0.08)' : undefined,
      }}
      onMouseEnter={() => setShowTip(true)}
      onMouseLeave={() => { setShowTip(false); setDragOver(false); }}
      onDragOver={e => { e.preventDefault(); setDragOver(true); }}
      onDragLeave={() => setDragOver(false)}
      onDrop={e => {
        e.preventDefault();
        setDragOver(false);
        const itemData = JSON.parse(e.dataTransfer.getData('application/json'));
        if (itemData.slot === slot) onDrop(itemData, slot);
      }}
      onDoubleClick={() => item && onUnequip(item, slot)}
      title={item ? `Double-click to unequip ${item.name}` : `${slot} slot`}
    >
      {item ? (
        <>
          <span style={{ fontSize: '22px' }}>{item.icon}</span>
          {showTip && <ItemTooltip item={item} />}
          <div className="absolute bottom-0 right-0 left-0 text-center"
            style={{ fontSize: '7px', color: RARITY_COLORS[item.rarity], background: 'rgba(0,0,0,0.6)', borderRadius: '0 0 6px 6px' }}>
            {item.rarity.slice(0, 3).toUpperCase()}
          </div>
        </>
      ) : (
        <div className="flex flex-col items-center gap-0.5 opacity-30">
          <span style={{ fontSize: '16px' }}>{SLOT_ICONS[slot]}</span>
          <span className="font-cinzel capitalize" style={{ fontSize: '7px', color: '#5a4a2a' }}>{slot}</span>
        </div>
      )}
    </div>
  );
}

function InvItem({ item, onEquip, onUse }) {
  const [showTip, setShowTip] = useState(false);

  if (item.isResource) {
    // Resource / consumable stacked item
    const isConsumable = !!item.useEffect;
    return (
      <div
        className="relative inv-slot has-item rounded-lg flex flex-col items-center justify-center w-14 h-14 cursor-default"
        style={{ borderColor: RARITY_COLORS[item.rarity] + '60' }}
        onMouseEnter={() => setShowTip(true)}
        onMouseLeave={() => setShowTip(false)}
        onDoubleClick={() => isConsumable && onUse && onUse(item)}
        title={isConsumable ? 'Double-click to use' : item.name}
      >
        <span style={{ fontSize: '20px' }}>{item.icon}</span>
        {/* Stack count */}
        <div className="absolute top-0.5 right-1 font-cinzel font-bold"
          style={{ fontSize: '9px', color: '#ffe88a', textShadow: '0 1px 2px black' }}>
          {item.qty || 1}
        </div>
        {/* Label */}
        <div className="absolute bottom-0 right-0 left-0 text-center"
          style={{ fontSize: '7px', color: RARITY_COLORS[item.rarity], background: 'rgba(0,0,0,0.6)', borderRadius: '0 0 6px 6px' }}>
          {item.name.slice(0, 6)}
        </div>
        {showTip && (
          <div className="absolute z-50 w-36 panel-glass-gold rounded-lg p-2 pointer-events-none"
            style={{ bottom: '110%', left: '50%', transform: 'translateX(-50%)' }}>
            <div className="font-cinzel font-bold text-xs mb-1" style={{ color: '#ffe88a' }}>{item.name}</div>
            <div className="text-xs" style={{ color: '#5a4a2a' }}>Qty: {item.qty || 1}</div>
            {item.useEffect?.hp && <div className="text-xs" style={{ color: '#4caf50' }}>Restores {item.useEffect.hp} HP</div>}
            {isConsumable && <div className="text-xs mt-1" style={{ color: '#ffe88a' }}>Double-click to use</div>}
            {!isConsumable && <div className="text-xs mt-1" style={{ color: '#5a4a2a' }}>Crafting material</div>}
          </div>
        )}
      </div>
    );
  }

  return (
    <div
      className="relative inv-slot has-item rounded-lg flex items-center justify-center cursor-grab w-14 h-14"
      draggable
      onDragStart={e => {
        e.dataTransfer.setData('application/json', JSON.stringify(item));
      }}
      onDoubleClick={() => onEquip(item)}
      onMouseEnter={() => setShowTip(true)}
      onMouseLeave={() => setShowTip(false)}
      style={{ borderColor: RARITY_COLORS[item.rarity] + '60' }}
    >
      <span style={{ fontSize: '22px' }}>{item.icon}</span>
      {showTip && <ItemTooltip item={item} />}
      <div className="absolute bottom-0 right-0 left-0 text-center"
        style={{ fontSize: '7px', color: RARITY_COLORS[item.rarity], background: 'rgba(0,0,0,0.6)', borderRadius: '0 0 6px 6px' }}>
        {item.rarity.slice(0, 3).toUpperCase()}
      </div>
    </div>
  );
}

export default function InventoryPanel({ gameState, onClose, onEquip, onUnequip, onUseItem }) {
  const { inventory = [], equipped = {}, classData } = gameState;
  const isWarrior = classData?.id === 'warrior';

  // Stats from equipment
  const equipStats = Object.values(equipped).reduce((acc, item) => {
    if (!item) return acc;
    Object.entries(item.stats || {}).forEach(([k, v]) => { acc[k] = (acc[k] || 0) + v; });
    return acc;
  }, {});

  const baseStats = classData?.baseStats || {};
  const totalStats = {
    attack: (baseStats.attack || 0) + (equipStats.attack || 0),
    defense: (baseStats.defense || 0) + (equipStats.defense || 0),
    hp: (baseStats.hp || 0) + (gameState.level || 1) * 15,
    mp: (baseStats.mp || 0) + (gameState.level || 1) * 8,
  };

  // Unequipped inventory items (not currently equipped)
  // Resources are deduplicated by id for display
  const equippedIds = new Set(Object.values(equipped).filter(Boolean).map(i => i.id));
  const rawBag = inventory.filter(i => !equippedIds.has(i.id));
  // Merge stacked resources for display
  const resourceMap = {};
  const gearItems = [];
  for (const item of rawBag) {
    if (item.isResource) {
      if (!resourceMap[item.id]) resourceMap[item.id] = { ...item };
      else resourceMap[item.id].qty = (resourceMap[item.id].qty || 1) + (item.qty || 1);
    } else {
      gearItems.push(item);
    }
  }
  const bagItems = [...gearItems, ...Object.values(resourceMap)];

  const leftSlots  = ['helmet', 'chest', 'pants', 'gloves', 'boots'];
  const rightSlots = ['weapon', 'shield'];

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
          className="panel-glass-gold rounded-xl p-5 w-full max-w-2xl"
          style={{ maxHeight: '90vh', overflowY: 'auto' }}
        >
          {/* Header */}
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-cinzel font-bold text-xl" style={{ color: '#ffe88a' }}>
              🎒 Inventory & Equipment
            </h2>
            <button onClick={onClose} className="font-cinzel text-sm px-3 py-1 rounded"
              style={{ color: '#6a5a3a', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)' }}>
              ✕ Close
            </button>
          </div>

          <div className="grid grid-cols-3 gap-4">
            {/* Left: Equip slots */}
            <div className="space-y-2">
              <div className="font-cinzel text-xs mb-2" style={{ color: '#6a5a3a' }}>EQUIPMENT</div>
              {leftSlots.map(slot => (
                <EquipSlot
                  key={slot}
                  slot={slot}
                  item={equipped[slot]}
                  isWarrior={isWarrior}
                  onDrop={(item, s) => onEquip(item, s)}
                  onUnequip={onUnequip}
                />
              ))}
            </div>

            {/* Center: Character preview + stats */}
            <div className="flex flex-col items-center gap-3">
              <div className="relative w-28 h-40 rounded-xl flex items-center justify-center"
                style={{ background: 'rgba(0,0,0,0.4)', border: '1px solid rgba(255,232,138,0.15)' }}>
                <div className="text-center">
                  <div className="text-5xl mb-2">{classData?.icon}</div>
                  <div className="font-cinzel text-xs" style={{ color: classData?.color }}>{classData?.name}</div>
                  <div className="font-cinzel text-xs" style={{ color: '#5a4a2a' }}>Lv. {gameState.level}</div>
                </div>
              </div>

              {/* Stats */}
              <div className="w-full space-y-1.5 p-3 rounded-lg" style={{ background: 'rgba(0,0,0,0.3)' }}>
                <div className="font-cinzel text-xs mb-2" style={{ color: '#6a5a3a' }}>BASE STATS</div>
                {[
                  { label: 'ATK', val: totalStats.attack, color: '#e63946' },
                  { label: 'DEF', val: totalStats.defense, color: '#4a9eff' },
                  { label: 'HP',  val: totalStats.hp, color: '#4caf50' },
                  { label: 'MP',  val: totalStats.mp, color: '#9c27b0' },
                ].map(s => (
                  <div key={s.label} className="flex justify-between items-center">
                    <span className="font-cinzel text-xs" style={{ color: '#5a4a2a' }}>{s.label}</span>
                    <div className="flex items-center gap-1">
                      {equipStats[s.label?.toLowerCase()] > 0 && (
                        <span className="text-xs" style={{ color: '#4caf50', fontSize: '10px' }}>
                          +{equipStats[s.label?.toLowerCase()]}
                        </span>
                      )}
                      <span className="font-cinzel text-xs font-bold" style={{ color: s.color }}>{s.val}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Right: Weapon/Shield + inventory bag */}
            <div className="space-y-2">
              <div className="font-cinzel text-xs mb-2" style={{ color: '#6a5a3a' }}>WEAPONS</div>
              {rightSlots.map(slot => (
                <EquipSlot
                  key={slot}
                  slot={slot}
                  item={equipped[slot]}
                  isWarrior={isWarrior}
                  onDrop={(item, s) => onEquip(item, s)}
                  onUnequip={onUnequip}
                />
              ))}
            </div>
          </div>

          {/* Bag */}
          <div className="mt-4">
            <div className="font-cinzel text-xs mb-2" style={{ color: '#6a5a3a' }}>
              BAG ({bagItems.length} items)
            </div>
            <div className="grid grid-cols-6 gap-1.5 p-3 rounded-lg min-h-16"
              style={{ background: 'rgba(0,0,0,0.3)', border: '1px solid rgba(255,255,255,0.06)' }}>
              {bagItems.map(item => (
                <InvItem key={item.id} item={item} onEquip={i => onEquip(i, i.slot)} onUse={onUseItem} />
              ))}
              {bagItems.length === 0 && (
                <div className="col-span-6 text-center py-4 font-cinzel text-xs" style={{ color: '#3a2a1a' }}>
                  No items — explore and open chests!
                </div>
              )}
            </div>
            <p className="mt-2 text-xs" style={{ color: '#3a2a1a', fontFamily: 'Crimson Text, serif' }}>
              Drag items to equip slots, or double-click to auto-equip/unequip
            </p>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}