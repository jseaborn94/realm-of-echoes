/**
 * EquipmentRenderer.js
 * 
 * Renders equipped gear as layered sprites on top of the base character.
 * Follows character animation state and position.
 */

import { assetIntegration } from './AssetIntegration.js';
import { getEquippedVisuals } from './GearVisualMapping.js';

export class EquipmentRenderer {
  constructor() {
    this.imageCache = new Map();
  }

  /**
   * Load and cache equipment sprite image
   */
  async loadEquipmentImage(url) {
    if (!url) return null;
    if (this.imageCache.has(url)) return this.imageCache.get(url);

    return new Promise((resolve) => {
      const img = new Image();
      img.crossOrigin = 'anonymous';
      img.onload = () => {
        this.imageCache.set(url, img);
        resolve(img);
      };
      img.onerror = () => resolve(null);
      img.src = url;
    });
  }

  /**
   * Render equipment at a specific draw layer
   * Supports layered draw order:
   * - 'back': back accessories, capes (drawn before character)
   * - 'chest': chest armor (drawn after character, before helmet)
   * - 'helmet': helmet and head gear (drawn after chest)
   * - 'weapon': held weapons and shields (drawn last, on top)
   * 
   * @param {CanvasRenderingContext2D} ctx
   * @param {number} screenX - Center X
   * @param {number} screenY - Bottom Y (feet)
   * @param {object} equipped - { weapon, helmet, chest, shield, ... }
   * @param {string} classId - Character class (warrior, archer, lancer, monk)
   * @param {string} animState - Animation state (idle, move, attack)
   * @param {string} layer - Which layer to draw ('back', 'chest', 'helmet', 'weapon')
   * @param {number} facingAngle - Character facing angle in radians (0 = right, PI = left)
   */
  async drawEquipmentLayer(ctx, screenX, screenY, equipped, classId = 'warrior', animState = 'idle', layer = 'weapon', facingAngle = 0) {
    if (!equipped) return;

    // Determine flip based on facing angle
    const flipX = Math.cos(facingAngle) >= 0 ? 1 : -1;

    // Get all visual mappings using gear visual system with animation state
    const visuals = getEquippedVisuals(equipped, classId, animState);

    // Map layers to slots — weapon layer draws shield then weapon to prevent clipping
    const layerSlots = {
      back: ['cape'],       // Future: back accessories
      chest: ['chest'],     // Chest armor
      helmet: ['helmet'],   // Head gear
      weapon: flipX > 0 ? ['shield', 'weapon'] : ['weapon', 'shield'], // Reverse order when facing left for correct depth
    };

    const slots = layerSlots[layer] || [];

    for (const slot of slots) {
      const visual = visuals[slot];
      if (!visual) continue;

      try {
        const img = await this.loadEquipmentImage(visual.spriteUrl);
        if (!img) continue;

        ctx.save();

        // Calculate position: mirror offsetX when facing left to keep shield on left side
        let x = screenX + visual.offsetX * flipX;
        let y = screenY + visual.offsetY;
        const scale = visual.scale;
        const w = img.width * scale;
        const h = img.height * scale;

        // Flip horizontally with character if applicable
        if (visual.flipWithChar && flipX === -1) {
          // Mirror horizontally around the calculated center point
          ctx.translate(x, y);
          ctx.scale(-1, 1);
          ctx.drawImage(img, -w / 2, -h / 2, w, h);
        } else {
          ctx.drawImage(img, x - w / 2, y - h / 2, w, h);
        }

        ctx.restore();
      } catch (err) {
        // Silent fail — equipment sprite unavailable
      }
    }
  }

  /**
   * Legacy method: render all equipment at once (used when drawing in single pass)
   */
  async drawEquipment(ctx, screenX, screenY, equipped, classId = 'warrior', animState = 'idle', flipX = 1) {
    if (!equipped) return;

    // Get all visual mappings using gear visual system with animation state
    const visuals = getEquippedVisuals(equipped, classId, animState);

    // Render order: helmet → chest → weapon (overlays on top)
    const renderOrder = ['helmet', 'chest', 'weapon', 'shield'];

    for (const slot of renderOrder) {
      const visual = visuals[slot];
      if (!visual) continue;

      try {
        const img = await this.loadEquipmentImage(visual.spriteUrl);
        if (!img) continue;

        ctx.save();

        // Apply anchor-point positioning (offsetX, offsetY)
        let x = screenX + visual.offsetX;
        let y = screenY + visual.offsetY;
        const scale = visual.scale;

        // Flip horizontally with character if applicable
        if (visual.flipWithChar && flipX === -1) {
          // Mirror horizontally: negate offsetX for proper hand/side positioning
          x = screenX - visual.offsetX;
          ctx.translate(x, y);
          ctx.scale(-1, 1);
          ctx.drawImage(img, -img.width * scale / 2, -img.height * scale / 2, img.width * scale, img.height * scale);
        } else {
          const w = img.width * scale;
          const h = img.height * scale;
          ctx.drawImage(img, x - w / 2, y - h / 2, w, h);
        }

        ctx.restore();
      } catch (err) {
        // Silent fail — equipment sprite unavailable
      }
    }
  }

  /**
   * Clear image cache (for hot reloads)
   */
  clearCache() {
    this.imageCache.clear();
  }
}

export const equipmentRenderer = new EquipmentRenderer();