import React, { useState } from 'react';
import { CLASSES } from '../../game/constants.js';
import { motion } from 'framer-motion';

export default function ClassSelect({ onSelect }) {
  const [hovered, setHovered] = useState(null);
  const [selected, setSelected] = useState(null);
  const [name, setName] = useState('');

  const classes = Object.values(CLASSES);

  function handleConfirm() {
    if (!selected) return;
    onSelect({ classId: selected, playerName: name.trim() || 'Hero' });
  }

  return (
    <div className="fixed inset-0 flex flex-col items-center justify-center"
      style={{ background: 'radial-gradient(ellipse at center, #0d1117 0%, #050608 100%)' }}>

      {/* Background particles */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {Array.from({ length: 30 }).map((_, i) => (
          <motion.div key={i}
            className="absolute rounded-full"
            style={{
              width: Math.random() * 3 + 1,
              height: Math.random() * 3 + 1,
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
              background: `hsl(${Math.random() * 60 + 30}, 80%, 60%)`,
            }}
            animate={{ opacity: [0.1, 0.8, 0.1], y: [0, -20, 0] }}
            transition={{ duration: 3 + Math.random() * 4, repeat: Infinity, delay: Math.random() * 3 }}
          />
        ))}
      </div>

      {/* Title */}
      <motion.div
        initial={{ opacity: 0, y: -30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8 }}
        className="text-center mb-8 relative z-10"
      >
        <h1 className="font-cinzel text-5xl font-black mb-2"
          style={{ color: '#ffe88a', textShadow: '0 0 30px rgba(255,232,138,0.4), 0 2px 4px rgba(0,0,0,0.8)' }}>
          REALM OF ECHOES
        </h1>
        <p className="text-lg" style={{ color: '#8a7a5a', fontFamily: 'Crimson Text, serif', fontStyle: 'italic' }}>
          Choose your path, champion
        </p>
      </motion.div>

      {/* Name input */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.3 }}
        className="mb-6 relative z-10"
      >
        <input
          type="text"
          value={name}
          onChange={e => setName(e.target.value)}
          placeholder="Enter your name..."
          maxLength={20}
          className="font-cinzel text-center px-5 py-2 rounded text-sm outline-none"
          style={{
            background: 'rgba(255,232,138,0.06)',
            border: '1px solid rgba(255,232,138,0.25)',
            color: '#ffe88a',
            width: '220px',
          }}
        />
      </motion.div>

      {/* Class cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 px-4 relative z-10 max-w-5xl w-full">
        {classes.map((cls, i) => (
          <motion.div
            key={cls.id}
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 + i * 0.1 }}
            onClick={() => setSelected(cls.id)}
            onMouseEnter={() => setHovered(cls.id)}
            onMouseLeave={() => setHovered(null)}
            className="cursor-pointer rounded-lg p-4 flex flex-col items-center text-center transition-all duration-300"
            style={{
              background: selected === cls.id
                ? `linear-gradient(135deg, ${cls.color}22, ${cls.color}11)`
                : 'rgba(255,255,255,0.03)',
              border: selected === cls.id
                ? `2px solid ${cls.color}`
                : hovered === cls.id
                  ? `2px solid ${cls.color}66`
                  : '2px solid rgba(255,255,255,0.08)',
              boxShadow: selected === cls.id ? `0 0 20px ${cls.color}40` : 'none',
              transform: hovered === cls.id || selected === cls.id ? 'translateY(-4px)' : 'none',
            }}
          >
            <div className="text-5xl mb-3">{cls.icon}</div>
            <h3 className="font-cinzel font-bold text-lg mb-1" style={{ color: cls.color }}>
              {cls.name}
            </h3>
            <p className="text-xs mb-3" style={{ color: '#7a6a4a', fontFamily: 'Crimson Text, serif', lineHeight: 1.5 }}>
              {cls.description}
            </p>

            {/* Stats mini-bar */}
            <div className="w-full space-y-1 text-left">
              {[
                { label: 'HP', val: cls.baseStats.hp, max: 300 },
                { label: 'ATK', val: cls.baseStats.attack, max: 35 },
                { label: 'DEF', val: cls.baseStats.defense, max: 20 },
              ].map(stat => (
                <div key={stat.label} className="flex items-center gap-2">
                  <span className="text-xs w-7" style={{ color: '#6a5a3a', fontFamily: 'Cinzel, serif' }}>{stat.label}</span>
                  <div className="flex-1 h-1.5 rounded-full" style={{ background: 'rgba(255,255,255,0.08)' }}>
                    <div className="h-full rounded-full transition-all" style={{
                      width: `${(stat.val / stat.max) * 100}%`,
                      background: cls.color,
                    }} />
                  </div>
                </div>
              ))}
            </div>

            {/* Abilities preview */}
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
      <motion.button
        initial={{ opacity: 0 }}
        animate={{ opacity: selected ? 1 : 0.4 }}
        onClick={handleConfirm}
        disabled={!selected}
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