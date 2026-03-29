import React from 'react';

/**
 * IconRenderer
 * 
 * Pure HTML/CSS item icon display.
 * Uses item.icon (emoji) directly with styled background.
 */
export default function IconRenderer({ item, size = 32, className = '' }) {
  return (
    <div
      className={`inline-flex items-center justify-center ${className}`}
      style={{
        width: `${size}px`,
        height: `${size}px`,
        backgroundColor: 'rgba(0, 0, 0, 0.3)',
        border: '1px solid rgba(255, 255, 255, 0.15)',
        borderRadius: '2px',
        fontSize: `${Math.floor(size * 0.75)}px`,
        lineHeight: '1',
      }}
    >
      {item?.icon || '?'}
    </div>
  );
}