/**
 * AssetPreloader.js
 *
 * Preloads all required game sprites before gameplay starts.
 * Ensures the render loop is 100% synchronous with no async dependencies.
 * Uses VERIFIED flat-file URLs from CompleteAssetRegistry.
 */

import {
  PLAYER_SPRITES,
  ENEMY_SPRITES,
  PROJECTILE_SPRITES,
  NPC_SPRITES,
  TEST_PLAYER_URL,
  TEST_ENEMY_URL,
  TEST_PROJECTILE_URL,
} from './CompleteAssetRegistry.js';

export class AssetPreloader {
  constructor(assetIntegration) {
    this.assetIntegration = assetIntegration;
    this.preloadedCount = 0;
    this.failedCount = 0;
  }

  /**
   * Preload all required sprites.
   * Returns a promise that resolves when all assets are ready.
   */
  async preloadAll() {
    console.log('[PRELOAD] Starting asset preload from verified /Assets URLs...');

    const startTime = performance.now();
    const urls = this._getRequiredUrls();
    console.log(`[PRELOAD] ${urls.length} unique URLs to load`);

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
   * Collect all unique URLs from the verified registry.
   */
  _getRequiredUrls() {
    const urls = new Set();

    // Core sprites (always preload first)
    urls.add(TEST_PLAYER_URL);
    urls.add(TEST_ENEMY_URL);
    urls.add(TEST_PROJECTILE_URL);

    // All player sprite states
    for (const classEntry of Object.values(PLAYER_SPRITES)) {
      for (const url of Object.values(classEntry)) {
        if (typeof url === 'string') urls.add(url);
      }
    }

    // All enemy sprite states
    for (const enemyEntry of Object.values(ENEMY_SPRITES)) {
      for (const url of Object.values(enemyEntry)) {
        if (typeof url === 'string') urls.add(url);
      }
    }

    // Projectiles
    for (const url of Object.values(PROJECTILE_SPRITES)) {
      if (typeof url === 'string') urls.add(url);
    }

    // NPC avatars
    for (const url of Object.values(NPC_SPRITES)) {
      if (typeof url === 'string') urls.add(url);
    }

    return Array.from(urls);
  }

  async _preloadUrl(url) {
    if (!url) return;
    try {
      const img = await this.assetIntegration.loadImage(url);
      if (img) {
        this.preloadedCount++;
      } else {
        this.failedCount++;
        console.warn(`[PRELOAD] Failed (null): ${url}`);
      }
    } catch (err) {
      this.failedCount++;
      console.warn(`[PRELOAD] Failed (error): ${url} — ${err.message}`);
    }
  }

  isLoaded(url) {
    return this.assetIntegration.imageCache.has(url)
        || this.assetIntegration.imageCache.has(encodeURI(url));
  }

  getImage(url) {
    if (!url) return null;
    return this.assetIntegration.imageCache.get(encodeURI(url))
        || this.assetIntegration.imageCache.get(url)
        || null;
  }
}