import React, { useEffect, useRef } from 'react';
import { assetIntegration } from '../../game/AssetIntegration.js';
import { equipmentRenderer } from '../../game/EquipmentRenderer.js';

/**
 * CharacterPreview - Live character preview with equipped gear
 * Mirrors the in-game rendering for paper-doll style preview
 * 
 * @param {object} gameState - Current game state
 * @param {object} equipped - Equipped items { weapon, helmet, chest, ... }
 * @param {number} size - Canvas size in pixels (default 200)
 * @param {string} animState - Animation state: 'idle', 'move', 'attack' (default 'idle')
 */
export default function CharacterPreview({ gameState, equipped, size = 200, animState = 'idle' }) {
  const canvasRef = useRef(null);

  useEffect(() => {
    if (!canvasRef.current) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    const classId = gameState.classData?.id || 'warrior';
    const color = gameState.classData?.spriteColor || 'blue';

    // Clear canvas
    ctx.fillStyle = 'transparent';
    ctx.clearRect(0, 0, size, size);

    // Center position
    const cx = size / 2;
    const cy = size * 0.6; // Feet at 60% height for better composition

    // Draw in layers
    const renderLayers = async () => {
      try {
        // 1. Shadow
        ctx.fillStyle = 'rgba(0,0,0,0.3)';
        ctx.beginPath();
        ctx.ellipse(cx, cy + 12, 10, 4, 0, 0, Math.PI * 2);
        ctx.fill();

        // 2. Base character sprite
        await assetIntegration.drawPlayerSprite(ctx, classId, cx, cy, color, animState);

        // 3. Equipment layers (facing right) — render in order: back, chest, helmet, weapon
        const facingAngle = 0; // Always face right in preview

        // Back accessories (cape, etc.)
        await equipmentRenderer.drawEquipmentLayer(ctx, cx, cy, equipped, classId, animState, 'back', facingAngle);

        // Chest armor + boots
        await equipmentRenderer.drawEquipmentLayer(ctx, cx, cy, equipped, classId, animState, 'chest', facingAngle);

        // Helmet
        await equipmentRenderer.drawEquipmentLayer(ctx, cx, cy, equipped, classId, animState, 'helmet', facingAngle);

        // Weapon + shield (draw order handles facing)
        await equipmentRenderer.drawEquipmentLayer(ctx, cx, cy, equipped, classId, animState, 'weapon', facingAngle);
      } catch (err) {
        // Silent fail - preview will show base character
      }
    };

    renderLayers();
  }, [gameState, equipped, size, animState]);

  return (
    <canvas
      ref={canvasRef}
      width={size}
      height={size}
      className="rounded-lg"
      style={{
        background: 'radial-gradient(circle, rgba(100,100,100,0.1) 0%, rgba(0,0,0,0.3) 100%)',
        imageRendering: 'pixelated',
        imageRendering: 'crisp-edges',
      }}
    />
  );
}