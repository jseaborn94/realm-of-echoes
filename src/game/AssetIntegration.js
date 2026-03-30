/**
 * AssetIntegration.js
 * 
 * Handles loading and rendering sprites from CompleteAssetRegistry.
 * Acts as the single rendering interface for all game visuals using GitHub assets.
 */

import { 
  getPlayerSprite, getEnemySprite, getTerrainSprite, getProjectileSprite,
  PLAYER_SPRITES, ENEMY_SPRITES, PROJECTILE_SPRITES, NPC_SPRITES
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

    // Encode URL to handle spaces in asset paths (e.g. "Blue Units", "Enemy Pack")
    const encodedUrl = encodeURI(url);

    if (this.imageCache.has(encodedUrl)) {
      return this.imageCache.get(encodedUrl);
    }

    if (this.loadingPromises.has(encodedUrl)) {
      return this.loadingPromises.get(encodedUrl);
    }

    const promise = new Promise((resolve, reject) => {
      const img = new Image();
      img.crossOrigin = 'anonymous';
      img.onload = () => {
        console.log(`[IMG LOAD] ✓ onload: ${img.width}x${img.height} — ${encodedUrl}`);
        this.imageCache.set(encodedUrl, img);
        // Also cache by original url key so lookups by raw URL still work
        this.imageCache.set(url, img);
        resolve(img);
      };
      img.onerror = () => {
        console.error(`[IMG LOAD] ✗ onerror — ${encodedUrl}`);
        reject(new Error(`Failed to load: ${encodedUrl}`));
      };
      console.log(`[IMG LOAD] → requesting: ${encodedUrl}`);
      img.src = encodedUrl;
    });

    this.loadingPromises.set(encodedUrl, promise);
    return promise.catch(err => {
      this.loadingPromises.delete(encodedUrl);
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
    // No verified effect sprites yet — silent no-op
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
  /**
   * SYNCHRONOUS DRAW METHODS (for use in render loop after preload)
   */

  /**
   * Draw player sprite synchronously (must be preloaded first)
   * Maps: classId → registry category, animState → idle/move/attack
   */
  drawPlayerSpriteSync(ctx, classId, screenX, screenY, color = 'blue', animState = 'idle') {
    const normalizedClass = (classId || 'warrior').toLowerCase();
    const validStates = ['idle', 'move', 'attack'];
    const mappedState = validStates.includes(animState) ? animState : 'idle';
    const spriteUrl = getPlayerSprite(normalizedClass, color, mappedState);

    if (!spriteUrl) {
      if (!this._loggedMissing.has(`player_${normalizedClass}_${color}_${mappedState}`)) {
        console.warn(`[Render] Player sprite missing: class=${normalizedClass} state=${mappedState}`);
        this._loggedMissing.add(`player_${normalizedClass}_${color}_${mappedState}`);
      }
      return false;
    }

    const img = this.imageCache.get(spriteUrl) || this.imageCache.get(encodeURI(spriteUrl));
    if (!img || !img.complete || img.naturalWidth === 0) {
      if (!this._loggedMissing.has(spriteUrl)) {
        console.warn(`[Render] Sprite not preloaded: ${spriteUrl}`);
        this._loggedMissing.add(spriteUrl);
      }
      return false;
    }

    try {
      // Target height: 52px in world-space (visible at zoom 1.6 → ~83px on screen)
      const TARGET_H = 52;
      const aspect = img.naturalWidth / img.naturalHeight;
      const h = TARGET_H;
      const w = h * aspect;
      ctx.drawImage(img, screenX - w / 2, screenY - h, w, h);
      return true;
    } catch (err) {
      console.error(`[Render] Failed to draw player sprite: ${err.message}`);
      return false;
    }
  }

  /**
   * Draw enemy sprite synchronously (must be preloaded first)
   * Maps: enemyType → registry, animState → idle/run/attack/death
   */
  drawEnemySpriteSync(ctx, enemyType, screenX, screenY, animState = 'idle', flipX = 1, targetH = 48) {
    const normalizedType = (enemyType || 'bear').toLowerCase();
    const validStates = ['idle', 'run', 'attack', 'death'];
    const mappedState = validStates.includes(animState) ? animState : 'idle';
    const spriteUrl = getEnemySprite(normalizedType, mappedState);

    if (!spriteUrl) {
      if (!this._loggedMissing.has(`enemy_${normalizedType}_${mappedState}`)) {
        console.warn(`[Render] Enemy sprite missing: type=${normalizedType} state=${mappedState}`);
        this._loggedMissing.add(`enemy_${normalizedType}_${mappedState}`);
      }
      return false;
    }

    const img = this.imageCache.get(spriteUrl) || this.imageCache.get(encodeURI(spriteUrl));
    if (!img || !img.complete || img.naturalWidth === 0) {
      if (!this._loggedMissing.has(spriteUrl)) {
        console.warn(`[Render] Enemy sprite not preloaded: ${spriteUrl}`);
        this._loggedMissing.add(spriteUrl);
      }
      return false;
    }

    try {
      const TARGET_H = targetH || 48;
      const aspect = img.naturalWidth / img.naturalHeight;
      const h = TARGET_H;
      const w = h * aspect;

      ctx.save();
      if (flipX === -1) {
        ctx.translate(screenX + w / 2, screenY - h);
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
   * Draw projectile sprite synchronously from preloaded cache.
   * Returns true if drawn, false if not cached yet.
   */
  drawProjectileSync(ctx, screenX, screenY, angle = 0, projectileType = 'arrow') {
    const spriteUrl = getProjectileSprite(projectileType);
    if (!spriteUrl) return false;

    const img = this.imageCache.get(spriteUrl) || this.imageCache.get(encodeURI(spriteUrl));
    if (!img || !img.complete || img.naturalWidth === 0) return false;

    try {
      ctx.save();
      ctx.translate(screenX, screenY);
      ctx.rotate(angle);
      // Arrow: fixed 20px wide, aspect-correct height
      const TARGET_W = 20;
      const aspect = img.naturalHeight / img.naturalWidth;
      const w = TARGET_W;
      const h = w * aspect;
      ctx.drawImage(img, -w / 2, -h / 2, w, h);
      ctx.restore();
      return true;
    } catch (err) {
      return false;
    }
  }

  /**
   * Draw NPC avatar synchronously — crops first frame if sheet detected.
   * Avatars_01.png is treated as a sprite sheet (multiple columns).
   */
  drawNPCSpriteSync(ctx, screenX, screenY) {
    const url = NPC_SPRITES.default;
    const img = this.imageCache.get(url) || this.imageCache.get(encodeURI(url));
    if (!img || !img.complete || img.naturalWidth === 0) return false;

    try {
      // Avatars_01.png: if width >> height, treat as horizontal sheet, crop first frame
      const frameW = img.naturalHeight; // assume square frames
      const frameH = img.naturalHeight;
      const TARGET_H = 52;
      const scale = TARGET_H / frameH;
      const dw = frameW * scale;
      const dh = frameH * scale;

      ctx.drawImage(img,
        0, 0, frameW, frameH,           // source: first frame
        screenX - dw / 2, screenY - dh, // dest: centered, feet at screenY
        dw, dh
      );
      return true;
    } catch (err) {
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