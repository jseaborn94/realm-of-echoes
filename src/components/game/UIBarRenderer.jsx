import React, { useEffect, useRef } from 'react';
import { UI_SPRITES } from '../../game/CompleteAssetRegistry.js';

/**
 * UIBarRenderer
 * 
 * Renders stat bar sprites (HP, MP, XP) on a canvas overlay.
 * Enhances the visual look while maintaining existing layout.
 */
export default function UIBarRenderer({ fillPercent = 1, barType = 'big', style = {} }) {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const baseKey = barType === 'big' ? 'bigBase' : 'smallBase';
    const fillKey = barType === 'big' ? 'bigFill' : 'smallFill';
    
    const baseUrl = UI_SPRITES.bars[baseKey];
    const fillUrl = UI_SPRITES.bars[fillKey];
    
    if (!baseUrl || !fillUrl) return;

    // Load both images
    let baseImg, fillImg, loadedCount = 0;
    const onBothLoaded = () => {
      if (loadedCount === 2 && baseImg && fillImg) {
        // Set canvas to match image dimensions
        canvas.width = baseImg.width;
        canvas.height = baseImg.height;

        // Draw base background
        ctx.drawImage(baseImg, 0, 0);

        // Draw fill with clipping
        ctx.save();
        ctx.beginPath();
        ctx.rect(0, 0, baseImg.width * fillPercent, baseImg.height);
        ctx.clip();
        ctx.drawImage(fillImg, 0, 0);
        ctx.restore();
      }
    };

    baseImg = new Image();
    baseImg.crossOrigin = 'anonymous';
    baseImg.onload = () => { loadedCount++; onBothLoaded(); };
    baseImg.onerror = () => console.warn(`Failed to load bar base: ${baseUrl}`);
    baseImg.src = baseUrl;

    fillImg = new Image();
    fillImg.crossOrigin = 'anonymous';
    fillImg.onload = () => { loadedCount++; onBothLoaded(); };
    fillImg.onerror = () => console.warn(`Failed to load bar fill: ${fillUrl}`);
    fillImg.src = fillUrl;
  }, [fillPercent, barType]);

  return (
    <canvas
      ref={canvasRef}
      style={{
        ...style,
        imageRendering: 'pixelated',
        display: 'block',
      }}
    />
  );
}