import React, { useState, useEffect, useRef } from 'react';
import { UI_SPRITES } from '../../game/CompleteAssetRegistry.js';

/**
 * UISpriteButton
 * 
 * Button with sprite background for pressed/unpressed states.
 * Falls back to CSS if sprites unavailable.
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
  const canvasRef = useRef(null);
  const [spriteUrl, setSpriteUrl] = useState(null);

  // Get sprite URL based on variant and pressed state
  useEffect(() => {
    const spriteKey = isPressed ? `${variant}Pressed` : variant;
    const url = UI_SPRITES.buttons?.[spriteKey];
    setSpriteUrl(url);
  }, [variant, isPressed]);

  // Draw sprite on canvas
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !spriteUrl) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      canvas.width = img.width;
      canvas.height = img.height;
      ctx.drawImage(img, 0, 0);
    };
    img.src = spriteUrl;
  }, [spriteUrl]);

  return (
    <button
      ref={canvasRef}
      onClick={onClick}
      onMouseDown={() => setIsPressed(true)}
      onMouseUp={() => setIsPressed(false)}
      onMouseLeave={() => setIsPressed(false)}
      disabled={disabled}
      title={title}
      className={`relative inline-flex items-center justify-center font-cinzel font-bold text-sm transition-opacity ${className}`}
      style={{
        ...style,
        opacity: disabled ? 0.5 : 1,
        cursor: disabled ? 'not-allowed' : 'pointer',
        imageRendering: 'pixelated',
        // Fallback styling if sprite fails
        background: !spriteUrl ? (variant === 'blue' ? '#4a90d9' : '#e63946') : 'transparent',
        border: !spriteUrl ? '1px solid rgba(255,255,255,0.2)' : 'none',
        color: '#ffe88a',
        padding: !spriteUrl ? '8px 16px' : undefined,
        borderRadius: !spriteUrl ? '4px' : undefined,
      }}
    >
      {children}
    </button>
  );
}