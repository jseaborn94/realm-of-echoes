import React, { useState } from 'react';

/**
 * UISpriteButton
 * 
 * Simple button with pressed state styling.
 * Uses CSS-only styling (no sprite canvas).
 */
export default function UISpriteButton({ 
  children, 
  onClick, 
  variant = 'blue', 
  className = '',
  style = {},
  disabled = false,
  title = '',
}) {
  const [isPressed, setIsPressed] = useState(false);

  const bgColor = variant === 'blue' ? '#4a90d9' : '#e63946';
  const pressBgColor = variant === 'blue' ? '#357abf' : '#c8304a';

  return (
    <button
      onClick={onClick}
      onMouseDown={() => setIsPressed(true)}
      onMouseUp={() => setIsPressed(false)}
      onMouseLeave={() => setIsPressed(false)}
      disabled={disabled}
      title={title}
      className={`relative inline-flex items-center justify-center font-cinzel font-bold text-sm transition-all ${className}`}
      style={{
        ...style,
        background: isPressed ? pressBgColor : bgColor,
        border: '1px solid rgba(255,255,255,0.2)',
        color: '#ffe88a',
        padding: '8px 16px',
        borderRadius: '4px',
        opacity: disabled ? 0.5 : 1,
        cursor: disabled ? 'not-allowed' : 'pointer',
        transform: isPressed ? 'scale(0.98)' : 'scale(1)',
      }}
    >
      {children}
    </button>
  );
}