import React, { useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { RARITY_COLORS } from '../../game/constants.js';

export default function LootNotification({ item, onClose }) {
  useEffect(() => {
    if (!item) return;
    const t = setTimeout(onClose, 3000);
    return () => clearTimeout(t);
  }, [item, onClose]);

  return (
    <AnimatePresence>
      {item && (
        <motion.div
          initial={{ opacity: 0, x: 60 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: 60 }}
          className="fixed top-16 right-4 z-50"
        >
          <div className="panel-glass-gold rounded-lg p-3 flex items-center gap-3"
            style={{
              border: `1px solid ${RARITY_COLORS[item.rarity]}66`,
              boxShadow: `0 0 12px ${RARITY_COLORS[item.rarity]}33`,
              minWidth: '200px',
            }}>
            <span style={{ fontSize: '28px' }}>{item.icon}</span>
            <div>
              <div className="font-cinzel text-xs" style={{ color: '#8a7a5a' }}>Item Found!</div>
              <div className="font-cinzel font-bold text-sm" style={{ color: RARITY_COLORS[item.rarity] }}>
                {item.name}
              </div>
              <div className="font-cinzel text-xs capitalize" style={{ color: RARITY_COLORS[item.rarity], opacity: 0.7 }}>
                {item.rarity}
              </div>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}