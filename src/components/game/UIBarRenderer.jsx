import React from 'react';

/**
 * UIBarRenderer
 * 
 * Pure CSS stat bar renderer (HP, MP, XP).
 * No asset dependencies — styled with gradients.
 */
export default function UIBarRenderer({ fillPercent = 1, barType = 'big', style = {} }) {
  const pct = Math.max(0, Math.min(1, fillPercent));
  const isBig = barType === 'big';
  const height = isBig ? '12px' : '12px';

  return (
    <div
      style={{
        ...style,
        width: '100%',
        height,
        background: 'rgba(0, 0, 0, 0.4)',
        border: '1px solid rgba(255, 255, 255, 0.2)',
        borderRadius: '2px',
        overflow: 'hidden',
        position: 'relative',
      }}
    >
      <div
        style={{
          width: `${pct * 100}%`,
          height: '100%',
          background: 'linear-gradient(90deg, #4caf50 0%, #66bb6a 100%)',
          transition: 'width 0.15s ease-out',
          boxShadow: '0 0 4px rgba(76, 175, 80, 0.6)',
        }}
      />
    </div>
  );
}