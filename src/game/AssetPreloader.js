/**
 * AssetPreloader.js
 * 
 * Preloads all required game sprites before gameplay starts.
 * Ensures the render loop is 100% synchronous with no async dependencies.
 */

import { PLAYER_SPRITES, ENEMY_SPRITES } from './CompleteAssetRegistry.js';

export class AssetPreloader {
  constructor(assetIntegration) {
    this.assetIntegration = assetIntegration;
    this.preloadedCount = 0;
    this.failedCount = 0;
  }

  /**
   * Preload all required sprites
   * Returns a promise that resolves when all assets are ready
   */
  async preloadAll() {
    console.log('[PRELOAD] Starting asset preload...');
    
    const startTime = performance.now();
    const urls = this._getRequiredUrls();

    // Load all URLs in parallel
    const promises = urls.map(url => this._preloadUrl(url));
    await Promise.all(promises);

    const elapsed = performance.now() - startTime;
    console.log(`[PRELOAD] Complete: ${this.preloadedCount} loaded, ${this.failedCount} failed (${elapsed.toFixed(1)}ms)`);

    return {
      success: this.failedCount === 0,
      preloaded: this.preloadedCount,
      failed: this.failedCount,
    };
  }

  /**
   * Get all unique sprite URLs needed for gameplay
   */
  _getRequiredUrls() {
    const urls = new Set();

    // Player sprites - all class/color combinations
    for (const [classKey, classSprites] of Object.entries(PLAYER_SPRITES)) {
      if (typeof classSprites === 'object') {
        for (const spriteUrl of Object.values(classSprites)) {
          if (typeof spriteUrl === 'string') urls.add(spriteUrl);
        }
      }
    }

    // Enemy sprites - common enemy types
    const commonEnemies = [
      'bear', 'gnoll', 'spider', 'snake', 'lancer', 'thief', 'skeleton',
      'viper', 'turtle', 'lizard', 'shaman', 'panda', 'alpha_skull',
      'harpoonfish', 'gnome', 'troll', 'wraith', 'golem', 'warlord',
      'frost_witch', 'frost_bear', 'shadow_panda', 'ogre', 'dummy'
    ];

    for (const enemyType of commonEnemies) {
      if (ENEMY_SPRITES[enemyType]) {
        const spriteUrl = ENEMY_SPRITES[enemyType];
        if (typeof spriteUrl === 'string') urls.add(spriteUrl);
      }
    }

    return Array.from(urls);
  }

  /**
   * Preload a single URL
   */
  async _preloadUrl(url) {
    if (!url) return;
    
    try {
      const img = await this.assetIntegration.loadImage(url);
      if (img) {
        this.preloadedCount++;
      } else {
        this.failedCount++;
      }
    } catch (err) {
      this.failedCount++;
      // Log failures but don't crash
      console.warn(`[PRELOAD] Failed: ${url}`);
    }
  }

  /**
   * Check if an image is in the cache (synchronous check)
   */
  isLoaded(url) {
    return this.assetIntegration.imageCache.has(url);
  }

  /**
   * Get cached image synchronously (returns null if not loaded)
   */
  getImage(url) {
    if (!url) return null;
    return this.assetIntegration.imageCache.get(url) || null;
  }
}