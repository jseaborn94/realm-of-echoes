import React, { useEffect, useRef, useState } from 'react';
import { getItemIconSprite } from '../../game/IconMapping.js';

/**
 * IconRenderer
 * 
 * Renders sprite-based item icons on a canvas.
 * Replaces emoji with actual game sprites from the asset registry.
 */
export default function IconRenderer({ item, size = 32, className = '' }) {
  const canvasRef = useRef(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Set canvas size
    canvas.width = size;
    canvas.height = size;

    // Get sprite URL
    const spriteUrl = getItemIconSprite(item);
    if (!spriteUrl) {
      setIsLoading(false);
      return;
    }

    // Load and draw sprite
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      // Clear canvas
      ctx.clearRect(0, 0, size, size);
      
      // Draw sprite centered and scaled to fit
      const scale = Math.min(size / img.width, size / img.height) * 0.9; // 0.9 for padding
      const scaledW = img.width * scale;
      const scaledH = img.height * scale;
      const x = (size - scaledW) / 2;
      const y = (size - scaledH) / 2;
      
      ctx.drawImage(img, x, y, scaledW, scaledH);
      setIsLoading(false);
    };
    img.onerror = () => {
      setIsLoading(false);
    };
    img.src = spriteUrl;
  }, [item, size]);

  return (
    <canvas
      ref={canvasRef}
      className={`inline-block ${className}`}
      style={{
        width: `${size}px`,
        height: `${size}px`,
        backgroundColor: 'rgba(0,0,0,0.1)',
        borderRadius: '2px',
        imageRendering: 'pixelated',
      }}
    />
  );
}