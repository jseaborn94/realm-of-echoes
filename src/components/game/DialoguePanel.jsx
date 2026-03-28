import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';

export default function DialoguePanel({ npc, dialogueIndex, onNext, onClose }) {
  if (!npc) return null;
  const lines = npc.dialogue || [];
  const line = lines[dialogueIndex] || '';
  const isLast = dialogueIndex >= lines.length - 1;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 30 }}
        className="fixed bottom-24 left-1/2 -translate-x-1/2 z-50 w-full max-w-lg px-4"
      >
        <div className="panel-glass-gold rounded-xl p-4"
          style={{ boxShadow: '0 0 30px rgba(255,232,138,0.15)' }}>
          {/* NPC name */}
          <div className="flex items-center gap-2 mb-3">
            <div className="w-8 h-8 rounded-full flex items-center justify-center"
              style={{ background: 'rgba(255,232,138,0.12)', border: '1px solid rgba(255,232,138,0.3)' }}>
              💬
            </div>
            <span className="font-cinzel font-bold text-sm" style={{ color: '#ffe88a' }}>{npc.name}</span>
          </div>

          {/* Dialogue line */}
          <p className="text-sm mb-4" style={{ color: '#c8b888', fontFamily: 'Crimson Text, serif', lineHeight: 1.7, fontSize: '15px' }}>
            "{line}"
          </p>

          {/* Controls */}
          <div className="flex justify-between items-center">
            <span className="text-xs font-cinzel" style={{ color: '#4a3a2a' }}>
              {dialogueIndex + 1}/{lines.length}
            </span>
            <div className="flex gap-2">
              <button onClick={onClose} className="font-cinzel text-xs px-3 py-1.5 rounded transition-all"
                style={{ color: '#5a4a2a', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}>
                [ESC] Close
              </button>
              <button
                onClick={isLast ? onClose : onNext}
                className="font-cinzel text-xs px-4 py-1.5 rounded font-bold transition-all"
                style={{
                  background: 'linear-gradient(135deg, #ffe88a, #c8a030)',
                  color: '#1a1000',
                  border: '1px solid #ffe88a',
                }}>
                {isLast ? '[F] Farewell' : '[F] Continue →'}
              </button>
            </div>
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}