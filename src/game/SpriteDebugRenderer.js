/**
 * SpriteDebugRenderer.js
 *
 * Forces test sprite rendering at fixed screen positions with full diagnostics.
 * Draws directly in screen space (no camera/zoom transforms).
 * Uses VERIFIED flat-file URLs from /Assets in jseaborn94/realm-of-echoes.
 */

import {
  TEST_PLAYER_URL,
  TEST_NPC_URL,
  TEST_ENEMY_URL,
  TEST_PROJECTILE_URL,
} from './CompleteAssetRegistry.js';

export class SpriteDebugRenderer {
  constructor(assetIntegration) {
    this.assetIntegration = assetIntegration;
    this.testResults = {
      playerLoaded: false,
      npcLoaded: false,
      enemyLoaded: false,
      projectileLoaded: false,
      playerDrawn: false,
      npcDrawn: false,
      enemyDrawn: false,
      projectileDrawn: false,
    };
    this._frameCount = 0;
    this._requested = {};
    this._logged = {};
  }

  /**
   * MAIN METHOD: Draw all test sprites in screen space (fixed positions, no camera)
   * Called AFTER ctx.restore() so no zoom transform is active
   */
  drawTestSpritesCentered(ctx, screenWidth, screenHeight) {
    if (!ctx) return;

    this._frameCount++;
    if (this._frameCount === 1 || this._frameCount % 120 === 0) {
      console.log(`[DEBUG RENDER] frame=${this._frameCount} cacheSize=${this.assetIntegration.imageCache.size}`);
      console.log(`[DEBUG RENDER] Player URL: ${TEST_PLAYER_URL}`);
      console.log(`[DEBUG RENDER] NPC URL: ${TEST_NPC_URL}`);
      console.log(`[DEBUG RENDER] Enemy URL: ${TEST_ENEMY_URL}`);
      console.log(`[DEBUG RENDER] Projectile URL: ${TEST_PROJECTILE_URL}`);
    }

    ctx.save();
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.globalAlpha = 1;
    ctx.globalCompositeOperation = 'source-over';

    // Player — center screen
    const size = 96;
    const cx = screenWidth / 2;
    const cy = screenHeight / 2;

    this.testResults.playerDrawn = this._drawSprite(ctx, TEST_PLAYER_URL, 'PLAYER',
      cx - size / 2, cy - size / 2, size, '#0044cc');

    // NPC — left side
    this.testResults.npcDrawn = this._drawSprite(ctx, TEST_NPC_URL, 'NPC',
      16, cy - size / 2, size, '#006622');

    // Enemy — right side
    this.testResults.enemyDrawn = this._drawSprite(ctx, TEST_ENEMY_URL, 'ENEMY',
      screenWidth - size - 16, cy - size / 2, size, '#880000');

    // Projectile — small, top center
    this.testResults.projectileDrawn = this._drawSprite(ctx, TEST_PROJECTILE_URL, 'ARROW',
      cx - 20, 20, 40, '#444400');

    this._drawLabels(ctx, screenWidth, screenHeight);

    ctx.restore();
  }

  _drawSprite(ctx, url, label, x, y, size, bgColor) {
    // Always draw background box — visible even if image fails
    ctx.fillStyle = bgColor;
    ctx.fillRect(x, y, size, size);
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 2;
    ctx.strokeRect(x, y, size, size);

    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 9px monospace';
    ctx.textAlign = 'center';
    ctx.fillText(label, x + size / 2, y + size - 5);

    // Try cache (both raw and encoded key)
    const encodedUrl = encodeURI(url);
    const img = this.assetIntegration.imageCache.get(encodedUrl)
             || this.assetIntegration.imageCache.get(url);

    if (!img) {
      // Request load if not already requested
      if (!this._requested[url]) {
        this._requested[url] = true;
        console.log(`[DEBUG RENDER] Requesting: ${encodedUrl}`);
        this.assetIntegration.loadImage(url).then(loaded => {
          if (loaded) {
            console.log(`[DEBUG RENDER] ✓ Loaded ${label}: ${loaded.naturalWidth}x${loaded.naturalHeight} — ${encodedUrl}`);
          } else {
            console.error(`[DEBUG RENDER] ✗ FAILED to load ${label}: ${encodedUrl}`);
          }
        });
      }
      ctx.fillStyle = '#ff4444';
      ctx.font = 'bold 9px monospace';
      ctx.fillText('LOADING...', x + size / 2, y + size / 2);
      return false;
    }

    if (!img.complete || img.naturalWidth === 0) {
      ctx.fillStyle = '#ff8800';
      ctx.fillText('NOT READY', x + size / 2, y + size / 2);
      return false;
    }

    if (!this._logged[label]) {
      console.log(`[DEBUG RENDER] ✓ DRAWING ${label}: ${img.naturalWidth}x${img.naturalHeight} at (${x},${y}) ${size}x${size}`);
      this._logged[label] = true;
    }

    try {
      ctx.drawImage(img, x, y, size, size);
      // Yellow border = success
      ctx.strokeStyle = '#ffff00';
      ctx.lineWidth = 3;
      ctx.strokeRect(x, y, size, size);
      return true;
    } catch (err) {
      console.error(`[DEBUG RENDER] ✗ drawImage threw for ${label}: ${err.message}`);
      return false;
    }
  }

  _drawLabels(ctx, screenWidth, screenHeight) {
    const pad = 8;
    const lh = 18;
    let y = pad + 14;

    const lines = [
      '=== SPRITE DEBUG ===',
      `Player (Archer_Idle): ${this.testResults.playerDrawn ? '✓ DRAWN' : '✗ missing'}`,
      `NPC (Avatars_01):     ${this.testResults.npcDrawn ? '✓ DRAWN' : '✗ missing'}`,
      `Enemy (Bear_Idle):    ${this.testResults.enemyDrawn ? '✓ DRAWN' : '✗ missing'}`,
      `Arrow projectile:     ${this.testResults.projectileDrawn ? '✓ DRAWN' : '✗ missing'}`,
    ];

    lines.forEach(line => {
      ctx.fillStyle = 'rgba(0,0,0,0.75)';
      ctx.fillRect(pad - 2, y - 13, 310, lh);
      ctx.fillStyle = line.includes('✓') ? '#44ff88' : line.startsWith('=') ? '#ffdd44' : '#ffffff';
      ctx.font = 'bold 11px monospace';
      ctx.textAlign = 'left';
      ctx.fillText(line, pad, y);
      y += lh;
    });

    // Bottom instruction
    ctx.fillStyle = 'rgba(0,0,0,0.75)';
    ctx.fillRect(pad - 2, screenHeight - 44, 420, 38);
    ctx.fillStyle = '#ffff00';
    ctx.font = 'bold 10px monospace';
    ctx.fillText('Yellow border = image rendered from real /Assets PNG ✓', pad, screenHeight - 26);
    ctx.fillStyle = '#ff6644';
    ctx.fillText('No yellow border = image still loading or URL broken ✗', pad, screenHeight - 10);
  }
}