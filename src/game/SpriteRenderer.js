/**
 * SpriteRenderer.js
 * 
 * Handles loading and rendering sprite assets from Tiny Swords packs.
 * Manages sprite sheets, frame extraction, and animation playback.
 */

export class SpriteRenderer {
  constructor() {
    this.loadedSheets = new Map(); // URL -> Image
    this.spriteCache = new Map(); // spriteKey -> sprite definition
    this.animationState = new Map(); // entityId -> { frame, elapsed, currentAnim }
  }

  /**
   * Register a sprite definition
   * @param {string} key - Unique sprite identifier
   * @param {object} definition - Sprite asset definition from AssetRegistry
   */
  registerSprite(key, definition) {
    this.spriteCache.set(key, definition);
  }

  /**
   * Get a registered sprite
   * @param {string} key - Sprite key
   * @returns {object} Sprite definition or null
   */
  getSprite(key) {
    return this.spriteCache.get(key) || null;
  }

  /**
   * Load a sprite sheet image (cached)
   * @param {string} url - Image URL
   * @returns {Promise<Image>}
   */
  async loadSpriteSheet(url) {
    if (this.loadedSheets.has(url)) {
      return this.loadedSheets.get(url);
    }

    return new Promise((resolve, reject) => {
      const img = new Image();
      img.crossOrigin = 'anonymous';
      img.onload = () => {
        this.loadedSheets.set(url, img);
        resolve(img);
      };
      img.onerror = () => reject(new Error(`Failed to load sprite sheet: ${url}`));
      img.src = url;
    });
  }

  /**
   * Initialize animation state for an entity
   * @param {string} entityId - Unique entity identifier
   * @param {string} spriteKey - Sprite asset key
   * @param {string} initialAnim - Initial animation name
   */
  initAnimation(entityId, spriteKey, initialAnim = 'idle') {
    const sprite = this.getSprite(spriteKey);
    if (!sprite || !sprite.animations) {
      console.warn(`Sprite ${spriteKey} has no animations`);
      return;
    }

    this.animationState.set(entityId, {
      frame: 0,
      elapsed: 0,
      currentAnim: initialAnim,
      spriteKey
    });
  }

  /**
   * Update animation state
   * @param {string} entityId - Entity identifier
   * @param {number} dt - Delta time in seconds
   * @param {string} newAnim - Optional new animation name
   */
  updateAnimation(entityId, dt, newAnim = null) {
    let state = this.animationState.get(entityId);
    if (!state) return;

    const sprite = this.getSprite(state.spriteKey);
    if (!sprite) return;

    // Change animation if requested
    if (newAnim && newAnim !== state.currentAnim) {
      state.currentAnim = newAnim;
      state.frame = 0;
      state.elapsed = 0;
    }

    const anim = sprite.animations?.[state.currentAnim];
    if (!anim) return;

    // Advance animation
    state.elapsed += dt;
    const frameDuration = 1 / (anim.speed || 6);
    if (state.elapsed >= frameDuration) {
      state.frame = (state.frame + 1) % anim.frames.length;
      state.elapsed -= frameDuration;
    }

    this.animationState.set(entityId, state);
  }

  /**
   * Draw a sprite frame on canvas
   * @param {CanvasRenderingContext2D} ctx - Canvas context
   * @param {string} entityId - Entity identifier
   * @param {number} screenX - Screen X position (center)
   * @param {number} screenY - Screen Y position (bottom)
   * @param {boolean} flipX - Flip horizontally
   */
  async drawSprite(ctx, entityId, screenX, screenY, flipX = false) {
    const state = this.animationState.get(entityId);
    if (!state) return;

    const sprite = this.getSprite(state.spriteKey);
    if (!sprite) return;

    const anim = sprite.animations?.[state.currentAnim];
    if (!anim) return;

    try {
      const sheet = await this.loadSpriteSheet(sprite.spriteSheet);
      const frameIndex = anim.frames[state.frame];
      const { frameWidth, frameHeight, scale } = sprite;

      // Calculate source rect on sprite sheet (assumes horizontal strip)
      const srcX = frameIndex * frameWidth;
      const srcY = 0;

      // Draw sprite centered
      const drawWidth = frameWidth * scale;
      const drawHeight = frameHeight * scale;
      const drawX = screenX - drawWidth / 2;
      const drawY = screenY - drawHeight;

      ctx.save();
      if (flipX) {
        ctx.translate(screenX, screenY);
        ctx.scale(-1, 1);
        ctx.drawImage(sheet, srcX, srcY, frameWidth, frameHeight, -drawWidth / 2, -drawHeight, drawWidth, drawHeight);
      } else {
        ctx.drawImage(sheet, srcX, srcY, frameWidth, frameHeight, drawX, drawY, drawWidth, drawHeight);
      }
      ctx.restore();
    } catch (err) {
      console.warn(`Failed to draw sprite ${state.spriteKey}:`, err);
    }
  }

  /**
   * Clear animation state for an entity (cleanup)
   * @param {string} entityId - Entity identifier
   */
  removeAnimation(entityId) {
    this.animationState.delete(entityId);
  }

  /**
   * Draw a static sprite (no animation)
   * @param {CanvasRenderingContext2D} ctx - Canvas context
   * @param {string} spriteKey - Sprite asset key
   * @param {number} screenX - Screen X position (center)
   * @param {number} screenY - Screen Y position (bottom)
   * @param {boolean} flipX - Flip horizontally
   */
  async drawStaticSprite(ctx, spriteKey, screenX, screenY, flipX = false) {
    const sprite = this.getSprite(spriteKey);
    if (!sprite) return;

    try {
      const sheet = await this.loadSpriteSheet(sprite.spriteSheet);
      const { frameWidth, frameHeight, scale } = sprite;

      const drawWidth = frameWidth * scale;
      const drawHeight = frameHeight * scale;
      const drawX = screenX - drawWidth / 2;
      const drawY = screenY - drawHeight;

      ctx.save();
      if (flipX) {
        ctx.translate(screenX, screenY);
        ctx.scale(-1, 1);
        ctx.drawImage(sheet, 0, 0, frameWidth, frameHeight, -drawWidth / 2, -drawHeight, drawWidth, drawHeight);
      } else {
        ctx.drawImage(sheet, 0, 0, frameWidth, frameHeight, drawX, drawY, drawWidth, drawHeight);
      }
      ctx.restore();
    } catch (err) {
      console.warn(`Failed to draw static sprite ${spriteKey}:`, err);
    }
  }
}

export const spriteRenderer = new SpriteRenderer();