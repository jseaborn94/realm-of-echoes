/**
 * AssetIntegration.js
 * 
 * Handles loading and rendering sprites from CompleteAssetRegistry.
 * Acts as the single rendering interface for all game visuals using GitHub assets.
 */

import { 
  getPlayerSprite, getEnemySprite, getTerrainSprite, 
  TERRAIN_SPRITES, PLAYER_SPRITES, ENEMY_SPRITES 
} from './CompleteAssetRegistry.js';

export class AssetIntegration {
  constructor() {
    this.imageCache = new Map(); // url -> Image
    this.loadingPromises = new Map(); // url -> Promise
    this.unmappedAssets = new Set(); // Track what needs better mapping
  }

  /**
   * Load an image from a URL with caching
   */
  async loadImage(url) {
    if (!url) return null;
    
    if (this.imageCache.has(url)) {
      return this.imageCache.get(url);
    }

    if (this.loadingPromises.has(url)) {
      return this.loadingPromises.get(url);
    }

    const promise = new Promise((resolve, reject) => {
      const img = new Image();
      img.crossOrigin = 'anonymous';
      img.onload = () => {
        this.imageCache.set(url, img);
        resolve(img);
      };
      img.onerror = () => {
        console.warn(`Failed to load sprite: ${url}`);
        reject(new Error(`Failed to load: ${url}`));
      };
      img.src = url;
    });

    this.loadingPromises.set(url, promise);
    return promise.catch(err => {
      this.loadingPromises.delete(url);
      return null;
    });
  }

  /**
   * Draw a player sprite
   * @param {CanvasRenderingContext2D} ctx
   * @param {string} classId - Class identifier (warrior, archer, lancer, monk)
   * @param {number} screenX - Center X
   * @param {number} screenY - Bottom Y (feet)
   * @param {string} color - Color variant (blue, red, yellow, purple, black)
   * @param {string} action - Action (idle, run, attack, etc.)
   */
  async drawPlayerSprite(ctx, classId, screenX, screenY, color = 'blue', action = 'idle') {
    // Map action to available sprite (fallback to idle if action unavailable)
    const actionMap = { run: 'idle', attack: 'idle', death: 'idle' };
    const spriteAction = action && actionMap[action] ? actionMap[action] : 'idle';
    
    // Get sprite URL from registry
    const spriteUrl = getPlayerSprite(classId, color);
    if (!spriteUrl) {
      console.warn(`[ASSET] No player sprite for ${classId} ${color}`);
      this.unmappedAssets.add(`player_${classId}_${color}`);
      return;
    }

    try {
      const img = await this.loadImage(spriteUrl);
      if (!img) return;

      // Draw sprite centered at (screenX, screenY)
      const scale = 2; // Adjust as needed for world scale
      const w = img.width * scale;
      const h = img.height * scale;
      ctx.drawImage(img, screenX - w / 2, screenY - h, w, h);
    } catch (err) {
      // Silent fail, already logged in loadImage
    }
  }

  /**
   * Draw an enemy sprite
   * @param {CanvasRenderingContext2D} ctx
   * @param {string} enemyType - Enemy type (bear, gnoll, lizard, etc.)
   * @param {number} screenX - Center X
   * @param {number} screenY - Bottom Y (feet)
   * @param {string} action - Action (idle, run, attack, death)
   * @param {number} flipX - Flip horizontally (1 or -1)
   */
  async drawEnemySprite(ctx, enemyType, screenX, screenY, action = 'idle', flipX = 1) {
    const spriteUrl = getEnemySprite(enemyType, action);
    if (!spriteUrl) {
      // Fallback to idle if action not available
      const fallbackUrl = getEnemySprite(enemyType, 'idle');
      if (!fallbackUrl) {
        console.warn(`[ASSET] No enemy sprite for ${enemyType}`);
        this.unmappedAssets.add(`enemy_${enemyType}`);
        return;
      }
      return this.drawEnemySprite(ctx, enemyType, screenX, screenY, 'idle', flipX);
    }

    try {
      const img = await this.loadImage(spriteUrl);
      if (!img) return;

      const scale = 2;
      const w = img.width * scale;
      const h = img.height * scale;

      ctx.save();
      if (flipX === -1) {
        ctx.translate(screenX, screenY - h);
        ctx.scale(-1, 1);
        ctx.drawImage(img, 0, 0, w, h);
      } else {
        ctx.drawImage(img, screenX - w / 2, screenY - h, w, h);
      }
      ctx.restore();
    } catch (err) {
      // Silent fail
    }
  }

  /**
   * Draw a terrain/environment sprite
   * @param {CanvasRenderingContext2D} ctx
   * @param {string} category - Category (trees, rocks, water, resources)
   * @param {string} type - Specific sprite
   * @param {number} screenX
   * @param {number} screenY
   */
  async drawTerrainSprite(ctx, category, type, screenX, screenY) {
    const spriteUrl = getTerrainSprite(category, type);
    if (!spriteUrl) {
      console.warn(`[ASSET] No terrain sprite for ${category}/${type}`);
      return;
    }

    try {
      const img = await this.loadImage(spriteUrl);
      if (!img) return;

      const scale = 1.5;
      const w = img.width * scale;
      const h = img.height * scale;
      ctx.drawImage(img, screenX - w / 2, screenY - h / 2, w, h);
    } catch (err) {
      // Silent fail
    }
  }

  /**
   * Get reported unmapped assets (for debugging)
   */
  getUnmappedAssets() {
    return Array.from(this.unmappedAssets);
  }

  /**
   * Clear cache (useful for hot reloads)
   */
  clearCache() {
    this.imageCache.clear();
    this.loadingPromises.clear();
  }
}

export const assetIntegration = new AssetIntegration();