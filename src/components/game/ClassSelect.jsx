import React, { useState, useEffect } from 'react';
import { CLASSES } from '../../game/constants.js';
import { listCharacters, deleteCharacter } from '../../game/CharacterManager.js';
import { motion, AnimatePresence } from 'framer-motion';

export default function ClassSelect({ onSelect, onLoadCharacter, onLogout, isLoggingOut = false }) {
  const [mode, setMode] = useState('list'); // 'list' | 'new'
  const [savedChars, setSavedChars] = useState([]);
  const [hovered, setHovered] = useState(null);
  const [selected, setSelected] = useState(null);
  const [name, setName] = useState('');
  const [confirmDelete, setConfirmDelete] = useState(null);

  useEffect(() => {
    const chars = listCharacters();
    setSavedChars(chars);
    // If no saves, go straight to new character
    if (chars.length === 0) setMode('new');
  }, []);

  // Logout handler
  const handleLogout = () => {
    if (onLogout) onLogout();
  };

  function handleConfirmNew() {
    if (!selected) return;
    onSelect({ classId: selected, playerName: name.trim() || 'Hero' });
  }

  function handleLoadChar(charId) {
    onLoadCharacter(charId);
  }

  function handleDelete(charId) {
    deleteCharacter(charId);
    const updated = listCharacters();
    setSavedChars(updated);
    setConfirmDelete(null);
    if (updated.length === 0) setMode('new');
  }

  const classes = Object.values(CLASSES);

  // ── Saved character list ──────────────────────────────────────────────────
  if (mode === 'list') {
    return (
      <div className="fixed inset-0 flex flex-col items-center justify-center"
        style={{ background: 'radial-gradient(ellipse at center, #0d1117 0%, #050608 100%)' }}>

        {/* Particles */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          {Array.from({ length: 20 }).map((_, i) => (
            <motion.div key={i} className="absolute rounded-full"
              style={{ width: Math.random() * 3 + 1, height: Math.random() * 3 + 1, left: `${Math.random() * 100}%`, top: `${Math.random() * 100}%`, background: `hsl(${Math.random() * 60 + 30}, 80%, 60%)` }}
              animate={{ opacity: [0.1, 0.8, 0.1], y: [0, -20, 0] }}
              transition={{ duration: 3 + Math.random() * 4, repeat: Infinity, delay: Math.random() * 3 }}
            />
          ))}
        </div>

        {/* Title */}
        <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="text-center mb-8 relative z-10">
          <h1 className="font-cinzel text-5xl font-black mb-2"
            style={{ color: '#ffe88a', textShadow: '0 0 30px rgba(255,232,138,0.4), 0 2px 4px rgba(0,0,0,0.8)' }}>
            REALM OF ECHOES
          </h1>
          <p className="text-sm" style={{ color: '#6a5a3a', fontFamily: 'Cinzel, serif' }}>Choose your champion</p>
        </motion.div>

        {/* Character cards */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
          className="relative z-10 w-full max-w-xl px-4 space-y-3">
          {savedChars.map((char, i) => (
            <motion.div key={char.id} initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.08 }}
              className="relative rounded-xl p-4 flex items-center gap-4 cursor-pointer transition-all duration-200 hover:scale-[1.01]"
              style={{ background: 'rgba(255,255,255,0.03)', border: `1px solid ${char.classColor}40` }}
              onClick={() => confirmDelete !== char.id && handleLoadChar(char.id)}
            >
              {/* Icon + info */}
              <div className="text-4xl">{char.classIcon}</div>
              <div className="flex-1 min-w-0">
                <div className="font-cinzel font-bold text-base" style={{ color: char.classColor }}>{char.playerName}</div>
                <div className="font-cinzel text-xs" style={{ color: '#6a5a3a' }}>
                  Lv. {char.level} {char.className}
                </div>
                <div className="text-xs mt-0.5" style={{ color: '#3a2a1a', fontFamily: 'Cinzel, serif', fontSize: '9px' }}>
                  Last played: {new Date(char.lastSaved).toLocaleDateString()}
                </div>
              </div>

              {/* Play / Delete buttons */}
              <div className="flex flex-col gap-2 shrink-0">
                {confirmDelete === char.id ? (
                  <div className="flex gap-2">
                    <button onClick={e => { e.stopPropagation(); handleDelete(char.id); }}
                      className="font-cinzel text-xs px-2 py-1 rounded"
                      style={{ background: 'rgba(255,60,60,0.2)', color: '#ff6644', border: '1px solid rgba(255,80,60,0.35)' }}>
                      Confirm
                    </button>
                    <button onClick={e => { e.stopPropagation(); setConfirmDelete(null); }}
                      className="font-cinzel text-xs px-2 py-1 rounded"
                      style={{ background: 'rgba(255,255,255,0.05)', color: '#6a5a3a', border: '1px solid rgba(255,255,255,0.12)' }}>
                      Cancel
                    </button>
                  </div>
                ) : (
                  <>
                    <button onClick={e => { e.stopPropagation(); handleLoadChar(char.id); }}
                      className="font-cinzel text-xs px-3 py-1.5 rounded"
                      style={{ background: 'linear-gradient(135deg, #ffe88a, #c8a030)', color: '#1a1000', border: '1px solid #ffe88a' }}>
                      ▶ Play
                    </button>
                    <button onClick={e => { e.stopPropagation(); setConfirmDelete(char.id); }}
                      className="font-cinzel text-xs px-3 py-1.5 rounded text-center"
                      style={{ background: 'rgba(255,60,60,0.06)', color: '#ff6644', border: '1px solid rgba(255,80,60,0.2)' }}>
                      🗑
                    </button>
                  </>
                )}
              </div>
            </motion.div>
          ))}

          {/* New character button */}
          <motion.button initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.3 }}
            onClick={() => { setMode('new'); setSelected(null); setName(''); }}
            className="w-full font-cinzel text-sm py-3 rounded-xl transition-all duration-200 hover:scale-[1.01]"
            style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,232,138,0.2)', color: '#ffe88a' }}>
            + New Character
          </motion.button>
        </motion.div>

        {/* Logout */}
        <motion.button initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.4 }}
          onClick={handleLogout}
          disabled={isLoggingOut}
          className="mt-8 relative z-10 font-cinzel text-xs px-6 py-2 rounded-lg transition-all disabled:opacity-50"
          style={{ color: '#6a5a3a', border: '1px solid rgba(255,255,255,0.08)', background: 'rgba(255,255,255,0.02)' }}>
          {isLoggingOut ? '⏳ Logging out...' : '⏻ Logout'}
        </motion.button>
      </div>
    );
  }

  // ── New character creation ────────────────────────────────────────────────
  return (
    <div className="fixed inset-0 flex flex-col items-center justify-center"
      style={{ background: 'radial-gradient(ellipse at center, #0d1117 0%, #050608 100%)' }}>

      {/* Particles */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {Array.from({ length: 30 }).map((_, i) => (
          <motion.div key={i} className="absolute rounded-full"
            style={{ width: Math.random() * 3 + 1, height: Math.random() * 3 + 1, left: `${Math.random() * 100}%`, top: `${Math.random() * 100}%`, background: `hsl(${Math.random() * 60 + 30}, 80%, 60%)` }}
            animate={{ opacity: [0.1, 0.8, 0.1], y: [0, -20, 0] }}
            transition={{ duration: 3 + Math.random() * 4, repeat: Infinity, delay: Math.random() * 3 }}
          />
        ))}
      </div>

      {/* Back button (if there are saves) */}
      {savedChars.length > 0 && (
        <button onClick={() => setMode('list')} className="absolute top-5 left-5 z-10 font-cinzel text-xs px-4 py-2 rounded-lg"
          style={{ color: '#6a5a3a', border: '1px solid rgba(255,255,255,0.1)', background: 'rgba(255,255,255,0.02)' }}>
          ← Back
        </button>
      )}

      {/* Title */}
      <motion.div initial={{ opacity: 0, y: -30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8 }}
        className="text-center mb-8 relative z-10">
        <h1 className="font-cinzel text-5xl font-black mb-2"
          style={{ color: '#ffe88a', textShadow: '0 0 30px rgba(255,232,138,0.4), 0 2px 4px rgba(0,0,0,0.8)' }}>
          REALM OF ECHOES
        </h1>
        <p className="text-lg" style={{ color: '#8a7a5a', fontFamily: 'Crimson Text, serif', fontStyle: 'italic' }}>
          Choose your path, champion
        </p>
      </motion.div>

      {/* Name input */}
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.3 }} className="mb-6 relative z-10">
        <input type="text" value={name} onChange={e => setName(e.target.value)}
          placeholder="Enter your name..." maxLength={20}
          className="font-cinzel text-center px-5 py-2 rounded text-sm outline-none"
          style={{ background: 'rgba(255,232,138,0.06)', border: '1px solid rgba(255,232,138,0.25)', color: '#ffe88a', width: '220px' }}
        />
      </motion.div>

      {/* Class cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 px-4 relative z-10 max-w-5xl w-full">
        {classes.map((cls, i) => (
          <motion.div key={cls.id} initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 + i * 0.1 }}
            onClick={() => setSelected(cls.id)}
            onMouseEnter={() => setHovered(cls.id)}
            onMouseLeave={() => setHovered(null)}
            className="cursor-pointer rounded-lg p-4 flex flex-col items-center text-center transition-all duration-300"
            style={{
              background: selected === cls.id ? `linear-gradient(135deg, ${cls.color}22, ${cls.color}11)` : 'rgba(255,255,255,0.03)',
              border: selected === cls.id ? `2px solid ${cls.color}` : hovered === cls.id ? `2px solid ${cls.color}66` : '2px solid rgba(255,255,255,0.08)',
              boxShadow: selected === cls.id ? `0 0 20px ${cls.color}40` : 'none',
              transform: hovered === cls.id || selected === cls.id ? 'translateY(-4px)' : 'none',
            }}
          >
            <div className="text-5xl mb-3">{cls.icon}</div>
            <h3 className="font-cinzel font-bold text-lg mb-1" style={{ color: cls.color }}>{cls.name}</h3>
            <p className="text-xs mb-3" style={{ color: '#7a6a4a', fontFamily: 'Crimson Text, serif', lineHeight: 1.5 }}>
              {cls.description}
            </p>
            <div className="w-full space-y-1 text-left">
              {[{ label: 'HP', val: cls.baseStats.hp, max: 300 }, { label: 'ATK', val: cls.baseStats.attack, max: 35 }, { label: 'DEF', val: cls.baseStats.defense, max: 20 }].map(stat => (
                <div key={stat.label} className="flex items-center gap-2">
                  <span className="text-xs w-7" style={{ color: '#6a5a3a', fontFamily: 'Cinzel, serif' }}>{stat.label}</span>
                  <div className="flex-1 h-1.5 rounded-full" style={{ background: 'rgba(255,255,255,0.08)' }}>
                    <div className="h-full rounded-full transition-all" style={{ width: `${(stat.val / stat.max) * 100}%`, background: cls.color }} />
                  </div>
                </div>
              ))}
            </div>
            <div className="mt-3 w-full grid grid-cols-4 gap-1">
              {cls.abilities.map(ab => (
                <div key={ab.key} className="text-center">
                  <div className="text-xs font-cinzel mb-0.5" style={{ color: cls.color }}>{ab.key}</div>
                  <div className="text-xs" style={{ color: '#5a4a2a', fontSize: '9px' }}>{ab.name.split(' ')[0]}</div>
                </div>
              ))}
            </div>
          </motion.div>
        ))}
      </div>

      {/* Confirm button */}
      <motion.button initial={{ opacity: 0 }} animate={{ opacity: selected ? 1 : 0.4 }}
        onClick={handleConfirmNew} disabled={!selected}
        className="mt-8 relative z-10 font-cinzel font-bold px-10 py-3 rounded text-sm tracking-widest uppercase transition-all duration-300"
        style={{
          background: selected ? 'linear-gradient(135deg, #ffe88a, #c8a030)' : 'rgba(255,255,255,0.1)',
          color: selected ? '#1a1000' : '#4a4a4a',
          border: selected ? '1px solid #ffe88a' : '1px solid rgba(255,255,255,0.1)',
          boxShadow: selected ? '0 0 20px rgba(255,232,138,0.3)' : 'none',
          cursor: selected ? 'pointer' : 'not-allowed',
        }}
        whileHover={selected ? { scale: 1.05 } : {}}
        whileTap={selected ? { scale: 0.95 } : {}}
      >
        {selected ? `Begin as ${CLASSES[selected]?.name}` : 'Select a Class'}
      </motion.button>

      <p className="mt-4 text-xs relative z-10" style={{ color: '#3a3020', fontFamily: 'Cinzel, serif' }}>
        WASD to move · QWER for abilities · F to interact
      </p>
    </div>
  );
}