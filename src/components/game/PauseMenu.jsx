import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import SettingsPanel from './SettingsPanel.jsx';

export default function PauseMenu({ isOpen, onClose, onReturnToSelect, onLogout, playerName, level, className, classColor }) {
  const [showSettings, setShowSettings] = useState(false);

  // Reset to main menu view whenever pause is toggled off
  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[100] flex items-center justify-center"
        style={{ background: 'rgba(0,0,0,0.75)' }}
        onClick={e => e.target === e.currentTarget && onClose()}
      >
        <motion.div
          initial={{ scale: 0.85, y: -20, opacity: 0 }}
          animate={{ scale: 1, y: 0, opacity: 1 }}
          exit={{ scale: 0.85, y: -20, opacity: 0 }}
          transition={{ type: 'spring', stiffness: 300, damping: 24 }}
          className="panel-glass-gold rounded-2xl p-8 w-80"
        >
          <AnimatePresence mode="wait">
            {!showSettings ? (
              <motion.div
                key="main"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.18 }}
                className="flex flex-col items-center gap-5"
              >
                {/* Title */}
                <div className="text-center">
                  <div className="font-cinzel text-xl font-bold mb-1" style={{ color: '#ffe88a' }}>PAUSED</div>
                  <div className="font-cinzel text-xs" style={{ color: '#6a5a3a' }}>
                    {playerName} · Lv.{level} {className}
                  </div>
                </div>

                <div className="w-full h-px" style={{ background: 'rgba(255,232,138,0.15)' }} />

                {/* Resume */}
                <button
                  onClick={onClose}
                  className="w-full font-cinzel font-bold py-3 rounded-lg text-sm tracking-wider transition-all duration-200 hover:scale-[1.02]"
                  style={{
                    background: 'linear-gradient(135deg, #ffe88a, #c8a030)',
                    color: '#1a1000',
                    border: '1px solid #ffe88a',
                    boxShadow: '0 0 16px rgba(255,232,138,0.25)',
                  }}
                >
                  ▶ Resume
                </button>

                {/* Settings */}
                <button
                  onClick={() => setShowSettings(true)}
                  className="w-full font-cinzel font-bold py-3 rounded-lg text-sm tracking-wider transition-all duration-200 hover:scale-[1.02]"
                  style={{
                    background: 'rgba(255,255,255,0.05)',
                    color: '#c8b070',
                    border: '1px solid rgba(255,232,138,0.25)',
                  }}
                >
                  ⚙ Settings
                </button>

                {/* Character Select */}
                <button
                  onClick={onReturnToSelect}
                  className="w-full font-cinzel font-bold py-3 rounded-lg text-sm tracking-wider transition-all duration-200 hover:scale-[1.02]"
                  style={{
                    background: 'rgba(255,255,255,0.05)',
                    color: '#c8b070',
                    border: '1px solid rgba(255,232,138,0.25)',
                  }}
                >
                  👤 Character Select
                </button>

                {/* Logout */}
                <button
                  onClick={onLogout}
                  className="w-full font-cinzel font-bold py-3 rounded-lg text-sm tracking-wider transition-all duration-200 hover:scale-[1.02]"
                  style={{
                    background: 'rgba(255,60,60,0.08)',
                    color: '#ff6644',
                    border: '1px solid rgba(255,80,60,0.25)',
                  }}
                >
                  ⏻ Logout
                </button>

                <div className="font-cinzel text-xs" style={{ color: '#3a2a1a' }}>
                  Progress auto-saved
                </div>
              </motion.div>
            ) : (
              <motion.div
                key="settings"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                transition={{ duration: 0.18 }}
              >
                <SettingsPanel onBack={() => setShowSettings(false)} />
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}