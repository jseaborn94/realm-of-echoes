/**
 * EquipmentRenderer.js
 * 
 * Renders equipped gear as layered sprites on top of the base character.
 * Follows character animation state and position.
 */

import { assetIntegration } from './AssetIntegration.js';
import { EQUIPMENT_SPRITES } from './CompleteAssetRegistry.js';

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
   * Get equipment sprite URL based on item and rarity
   */
  getEquipmentSprite(slot, item) {
    if (!item) return null;
    
    const rarity = item.rarity || 'common';
    const category = this._getEquipmentCategory(slot);
    
    if (category === 'weapons') {
      // Determine weapon type from item name or slot
      const weaponType = this._getWeaponType(item);
      return EQUIPMENT_SPRITES.weapons[weaponType];
    } else if (category === 'helmets') {
      return EQUIPMENT_SPRITES.helmets[rarity];
    } else if (category === 'chest') {
      return EQUIPMENT_SPRITES.chest[rarity];
    } else if (category === 'offhand') {
      return EQUIPMENT_SPRITES.offhand[slot];
    }
    
    return null;
  }

  /**
   * Map slot name to equipment category
   */
  _getEquipmentCategory(slot) {
    if (slot === 'weapon') return 'weapons';
    if (slot === 'shield' || slot === 'offhand') return 'offhand';
    if (slot === 'helmet' || slot === 'head') return 'helmets';
    if (slot === 'chest' || slot === 'body') return 'chest';
    return null;
  }

  /**
   * Determine weapon type from item data
   */
  _getWeaponType(item) {
    const name = item.name?.toLowerCase() || '';
    if (name.includes('bow')) return 'bow';
    if (name.includes('staff') || name.includes('wand')) return 'staff';
    if (name.includes('spear') || name.includes('lance') || name.includes('pike')) return 'spear';
    return 'sword'; // default
  }

  /**
   * Render equipment layers on top of character
   * @param {CanvasRenderingContext2D} ctx
   * @param {number} screenX - Center X
   * @param {number} screenY - Bottom Y (feet)
   * @param {object} equipped - { weapon, helmet, chest, shield, ... }
   * @param {string} action - Animation state (idle, run, attack, death)
   * @param {number} flipX - Direction (1 or -1)
   */
  async drawEquipment(ctx, screenX, screenY, equipped, action = 'idle', flipX = 1) {
    if (!equipped) return;

    // Equipment render order: helmet → chest → weapon (overlays on top)
    const renderOrder = [
      { slot: 'helmet', offsetY: -24, scale: 0.8 },
      { slot: 'chest', offsetY: -8, scale: 1.0 },
      { slot: 'weapon', offsetY: -2, scale: 0.9, flipWithChar: true },
    ];

    for (const eq of renderOrder) {
      const item = equipped[eq.slot];
      if (!item) continue;

      const spriteUrl = this.getEquipmentSprite(eq.slot, item);
      if (!spriteUrl) continue;

      try {
        const img = await this.loadEquipmentImage(spriteUrl);
        if (!img) continue;

        ctx.save();

        // Position relative to character
        const x = screenX + eq.offsetY * 0.2;
        const y = screenY + eq.offsetY;
        const scale = eq.scale;

        // Flip with character if weapon
        if (eq.flipWithChar && flipX === -1) {
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