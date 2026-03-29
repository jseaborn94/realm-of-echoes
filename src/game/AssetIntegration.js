/**
 * AssetIntegration.js
 * 
 * Handles loading and rendering sprites from CompleteAssetRegistry.
 * Acts as the single rendering interface for all game visuals using GitHub assets.
 */

import { 
  getPlayerSprite, getEnemySprite, getTerrainSprite, 
  TERRAIN_SPRITES, PLAYER_SPRITES, ENEMY_SPRITES, EFFECT_SPRITES, UI_SPRITES
} from './CompleteAssetRegistry.js';

export class AssetIntegration {
  constructor() {
    this.imageCache = new Map(); // url -> Image
    this.loadingPromises = new Map(); // url -> Promise
    this.unmappedAssets = new Set(); // Track what needs better mapping
    this._loggedMissing = new Set(); // Track logged missing assets to avoid spam
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
    // Get sprite URL from registry
    const spriteUrl = getPlayerSprite(classId, color);
    if (!spriteUrl) {
      console.error(`[Render] No sprite URL for player: class=${classId} color=${color}`);
      return;
    }

    try {
      const img = await this.loadImage(spriteUrl);
      if (!img) {
        console.error(`[Render] Sprite failed to load: ${spriteUrl}`);
        return;
      }

      // Draw sprite centered at (screenX, screenY)
      const scale = 2;
      const w = img.width * scale;
      const h = img.height * scale;
      
      // Log successful render once per session (avoid spam)
      if (!this._loggedPlayer) {
        console.log(`[Render] Player sprite loaded: ${classId} ${color} (${img.width}x${img.height}px)`);
        this._loggedPlayer = true;
      }
      
      ctx.drawImage(img, screenX - w / 2, screenY - h, w, h);
    } catch (err) {
      console.error(`[Render] Exception drawing player: ${err.message}`);
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
      const fallbackUrl = getEnemySprite(enemyType, 'idle');
      if (!fallbackUrl) {
        console.error(`[Render] No sprite URL for enemy: type=${enemyType}`);
        return;
      }
      return this.drawEnemySprite(ctx, enemyType, screenX, screenY, 'idle', flipX);
    }

    try {
      const img = await this.loadImage(spriteUrl);
      if (!img) {
        console.error(`[Render] Enemy sprite failed to load: ${spriteUrl}`);
        return;
      }

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
      console.error(`[Render] Exception drawing enemy: ${err.message}`);
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
   * Draw a visual effect sprite (explosion, fire, dust)
   * @param {CanvasRenderingContext2D} ctx
   * @param {string} effectType - Effect type (explosion, fire, dust1, dust2)
   * @param {number} screenX - Center X
   * @param {number} screenY - Center Y
   * @param {number} scale - Scale multiplier (default 1)
   * @param {number} alpha - Opacity (0-1)
   */
  async drawEffect(ctx, effectType, screenX, screenY, scale = 1, alpha = 1) {
    const spriteUrl = EFFECT_SPRITES[effectType];
    if (!spriteUrl) return;

    try {
      const img = await this.loadImage(spriteUrl);
      if (!img) return;

      ctx.save();
      ctx.globalAlpha = alpha;
      const w = img.width * scale;
      const h = img.height * scale;
      ctx.drawImage(img, screenX - w / 2, screenY - h / 2, w, h);
      ctx.restore();
    } catch (err) {
      // Silent fail
    }
  }

  /**
   * Draw a projectile sprite with direction-based rotation
   * @param {CanvasRenderingContext2D} ctx
   * @param {number} screenX - Center X
   * @param {number} screenY - Center Y
   * @param {number} angle - Direction in radians
   * @param {string} projectileType - Type (arrow, magic, flame, ice, spark, dark, default)
   */
  async drawProjectile(ctx, screenX, screenY, angle = 0, projectileType = 'magic') {
    // Import getProjectileSprite from registry
    const { getProjectileSprite } = await import('./CompleteAssetRegistry.js');
    const spriteUrl = getProjectileSprite(projectileType);
    if (!spriteUrl) return;

    try {
      const img = await this.loadImage(spriteUrl);
      if (!img) return;

      ctx.save();
      ctx.translate(screenX, screenY);
      ctx.rotate(angle);
      
      // Scale based on projectile type
      const scaleMap = { arrow: 0.6, magic: 0.7, flame: 0.8, ice: 0.7, spark: 0.6, dark: 0.75, default: 0.5 };
      const scale = scaleMap[projectileType] || 0.6;
      
      const w = img.width * scale;
      const h = img.height * scale;
      ctx.drawImage(img, -w / 2, -h / 2, w, h);
      ctx.restore();
    } catch (err) {
      // Silent fail, fallback to geometric rendering in enemy draw
    }
  }

  /**
   * Draw a UI button sprite
   * @param {CanvasRenderingContext2D} ctx
   * @param {string} buttonType - Type (blue, red, bluePressed, redPressed)
   * @param {number} screenX - Left X
   * @param {number} screenY - Top Y
   * @param {number} width - Button width
   * @param {number} height - Button height
   */
  async drawButton(ctx, buttonType, screenX, screenY, width = 100, height = 40) {
    const spriteUrl = UI_SPRITES.buttons[buttonType];
    if (!spriteUrl) return;

    try {
      const img = await this.loadImage(spriteUrl);
      if (!img) return;

      ctx.drawImage(img, screenX, screenY, width, height);
    } catch (err) {
      // Silent fail
    }
  }

  /**
   * Draw a stat bar (health, mana, xp)
   * @param {CanvasRenderingContext2D} ctx
   * @param {string} barSize - Size (big, small)
   * @param {number} screenX - Left X
   * @param {number} screenY - Top Y
   * @param {number} fillPercent - Fill amount (0-1)
   * @param {string} fillColor - Optional tint color
   */
  async drawBar(ctx, barSize, screenX, screenY, fillPercent, fillColor = null) {
    const baseUrl = UI_SPRITES.bars[`${barSize}Base`];
    const fillUrl = UI_SPRITES.bars[`${barSize}Fill`];
    if (!baseUrl || !fillUrl) return;

    try {
      const baseImg = await this.loadImage(baseUrl);
      const fillImg = await this.loadImage(fillUrl);
      if (!baseImg || !fillImg) return;

      const w = baseImg.width;
      const h = baseImg.height;

      // Draw base
      ctx.drawImage(baseImg, screenX, screenY, w, h);

      // Draw fill with clipping
      ctx.save();
      ctx.beginPath();
      ctx.rect(screenX, screenY, w * fillPercent, h);
      ctx.clip();
      if (fillColor) {
        ctx.globalTint = fillColor;
      }
      ctx.drawImage(fillImg, screenX, screenY, w, h);
      ctx.restore();
    } catch (err) {
      // Silent fail
    }
  }

  /**
   * SYNCHRONOUS DRAW METHODS (for use in render loop after preload)
   */

  /**
   * Draw player sprite synchronously (must be preloaded first)
   */
  drawPlayerSpriteSync(ctx, classId, screenX, screenY, color = 'blue', action = 'idle') {
    const { getPlayerSprite } = require('./CompleteAssetRegistry.js');
    const spriteUrl = getPlayerSprite(classId, color);
    
    if (!spriteUrl) {
      if (!this._loggedMissing.has(`player_${classId}_${color}`)) {
        console.warn(`[Render] No sprite URL for player: class=${classId} color=${color}`);
        this._loggedMissing.add(`player_${classId}_${color}`);
      }
      return false;
    }

    const img = this.imageCache.get(spriteUrl);
    if (!img) {
      if (!this._loggedMissing.has(spriteUrl)) {
        console.warn(`[Render] Sprite not preloaded: ${spriteUrl}`);
        this._loggedMissing.add(spriteUrl);
      }
      return false;
    }

    try {
      const scale = 2;
      const w = img.width * scale;
      const h = img.height * scale;
      ctx.drawImage(img, screenX - w / 2, screenY - h, w, h);
      return true;
    } catch (err) {
      console.error(`[Render] Failed to draw player sprite: ${err.message}`);
      return false;
    }
  }

  /**
   * Draw enemy sprite synchronously (must be preloaded first)
   */
  drawEnemySpriteSync(ctx, enemyType, screenX, screenY, action = 'idle', flipX = 1) {
    const { getEnemySprite } = require('./CompleteAssetRegistry.js');
    const spriteUrl = getEnemySprite(enemyType, action);
    
    if (!spriteUrl) {
      if (!this._loggedMissing.has(`enemy_${enemyType}`)) {
        console.warn(`[Render] No sprite URL for enemy: type=${enemyType}`);
        this._loggedMissing.add(`enemy_${enemyType}`);
      }
      return false;
    }

    const img = this.imageCache.get(spriteUrl);
    if (!img) {
      if (!this._loggedMissing.has(spriteUrl)) {
        console.warn(`[Render] Enemy sprite not preloaded: ${spriteUrl}`);
        this._loggedMissing.add(spriteUrl);
      }
      return false;
    }

    try {
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
      return true;
    } catch (err) {
      console.error(`[Render] Failed to draw enemy sprite: ${err.message}`);
      return false;
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
    this._loggedMissing.clear();
  }
}

export const assetIntegration = new AssetIntegration();