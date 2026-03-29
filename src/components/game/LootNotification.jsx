import React, { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { RARITY_COLORS } from '../../game/constants.js';

export default function LootNotification({ item, onClose }) {
  // Track the id of the item currently being displayed so the timer
  // only resets when a genuinely new item arrives, not on every re-render.
  const timerRef = useRef(null);
  const shownIdRef = useRef(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (!item) {
      setVisible(false);
      return;
    }

    const itemKey = item.id || item.name;

    // Same item already showing — don't restart the timer
    if (shownIdRef.current === itemKey && visible) return;

    // New item: clear any existing timer, show new popup
    if (timerRef.current) clearTimeout(timerRef.current);
    shownIdRef.current = itemKey;
    setVisible(true);

    timerRef.current = setTimeout(() => {
      setVisible(false);
      onClose();
    }, 3500);

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [item?.id, item?.name]); // eslint-disable-line react-hooks/exhaustive-deps

  if (!item) return null;

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          key={item.id || item.name}
          initial={{ opacity: 0, x: 60 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: 60, transition: { duration: 0.4 } }}
          className="fixed top-16 right-4 z-50"
        >
          <div
            className="panel-glass-gold rounded-lg p-3 flex items-center gap-3"
            style={{
              border: `1px solid ${RARITY_COLORS[item.rarity]}66`,
              boxShadow: `0 0 12px ${RARITY_COLORS[item.rarity]}33`,
              minWidth: '200px',
            }}
          >
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