/**
 * SpriteDebugRenderer.js
 *
 * Strict in-game render proof for the 4 verified flat-file assets.
 * Draw path is fully SYNCHRONOUS — reads preloaded imageCache only.
 * No async, no fallback circles for the 4 test assets.
 *
 * Draws in SCREEN SPACE (after ctx.restore()) so no zoom/camera distortion.
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

    // Track render results for the report panel
    this.results = {
      player:     { url: TEST_PLAYER_URL,     rendered: false },
      npc:        { url: TEST_NPC_URL,         rendered: false },
      enemy:      { url: TEST_ENEMY_URL,       rendered: false },
      projectile: { url: TEST_PROJECTILE_URL, rendered: false },
    };

    // Trigger one async load attempt per asset on construction
    // so the cache gets populated if not already preloaded
    this._triggerLoads();
  }

  _triggerLoads() {
    for (const key of Object.keys(this.results)) {
      const url = this.results[key].url;
      if (!this._isCached(url)) {
        this.assetIntegration.loadImage(url).then(img => {
          if (img) console.log(`[SpriteDebug] ✓ loaded ${key}: ${img.naturalWidth}x${img.naturalHeight}`);
          else     console.error(`[SpriteDebug] ✗ failed to load ${key}: ${url}`);
        });
      }
    }
  }

  _isCached(url) {
    return this.assetIntegration.imageCache.has(url)
        || this.assetIntegration.imageCache.has(encodeURI(url));
  }

  _getImage(url) {
    return this.assetIntegration.imageCache.get(url)
        || this.assetIntegration.imageCache.get(encodeURI(url))
        || null;
  }

  /**
   * Main entry point — called each frame in screen space (after ctx.restore)
   */
  drawTestSpritesCentered(ctx, W, H) {
    if (!ctx) return;

    ctx.save();
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.globalAlpha = 1;
    ctx.globalCompositeOperation = 'source-over';

    // Layout: 4 large sprites in a row near the bottom of the screen
    const SIZE   = 128;
    const PAD    = 20;
    const totalW = SIZE * 4 + PAD * 3;
    const startX = (W - totalW) / 2;
    const Y      = H - SIZE - 60; // near bottom

    // 1 — Player (Archer_Idle.png)
    this.results.player.rendered = this._drawSlot(
      ctx, 'PLAYER\nArcher_Idle.png', this.results.player.url,
      startX, Y, SIZE, '#1a3a6e'
    );

    // 2 — NPC (Avatars_01.png)
    this.results.npc.rendered = this._drawSlot(
      ctx, 'NPC\nAvatars_01.png', this.results.npc.url,
      startX + (SIZE + PAD), Y, SIZE, '#1a5c1a'
    );

    // 3 — Enemy (Bear_Idle.png)
    this.results.enemy.rendered = this._drawSlot(
      ctx, 'ENEMY\nBear_Idle.png', this.results.enemy.url,
      startX + (SIZE + PAD) * 2, Y, SIZE, '#6e1a1a'
    );

    // 4 — Projectile (Arrow.png) — drawn at natural aspect inside slot
    this.results.projectile.rendered = this._drawSlot(
      ctx, 'ARROW\nArrow.png', this.results.projectile.url,
      startX + (SIZE + PAD) * 3, Y, SIZE, '#4a4a00'
    );

    // Summary panel top-left
    this._drawSummary(ctx);

    ctx.restore();
  }

  /**
   * Draw one test slot:
   *  - colored background box
   *  - sprite image (synchronous from cache) if available
   *  - yellow border = success, red border = not ready
   *  - label below
   */
  _drawSlot(ctx, label, url, x, y, size, bgColor) {
    // Background
    ctx.fillStyle = bgColor;
    ctx.fillRect(x, y, size, size);

    const img = this._getImage(url);
    let rendered = false;

    if (img && img.complete && img.naturalWidth > 0) {
      // Draw image stretched to fill slot
      ctx.drawImage(img, x, y, size, size);
      rendered = true;
      // Yellow border = confirmed render
      ctx.strokeStyle = '#ffff00';
      ctx.lineWidth = 4;
      ctx.strokeRect(x, y, size, size);
    } else {
      // Red border = not in cache yet
      ctx.strokeStyle = '#ff3333';
      ctx.lineWidth = 3;
      ctx.strokeRect(x, y, size, size);
      // Status text
      ctx.fillStyle = '#ff6666';
      ctx.font = 'bold 11px monospace';
      ctx.textAlign = 'center';
      ctx.fillText(img ? 'NOT READY' : 'LOADING...', x + size / 2, y + size / 2);
    }

    // Label below the box
    const lines = label.split('\n');
    ctx.fillStyle = rendered ? '#ffff88' : '#ff8888';
    ctx.font = 'bold 10px monospace';
    ctx.textAlign = 'center';
    ctx.fillText(lines[0], x + size / 2, y + size + 14);
    ctx.fillStyle = '#aaaaaa';
    ctx.font = '9px monospace';
    ctx.fillText(lines[1] || '', x + size / 2, y + size + 26);

    // rendered/false badge
    const badge = rendered ? '✓ rendered: true' : '✗ rendered: false';
    ctx.fillStyle = rendered ? '#44ff88' : '#ff4444';
    ctx.font = 'bold 9px monospace';
    ctx.fillText(badge, x + size / 2, y + size + 40);

    return rendered;
  }

  /**
   * Summary panel top-left — shows URL + render status for all 4 assets
   */
  _drawSummary(ctx) {
    const PAD = 8;
    const LH  = 16;
    const entries = [
      { label: 'Player  (Archer_Idle)',  key: 'player'     },
      { label: 'NPC     (Avatars_01)',   key: 'npc'        },
      { label: 'Enemy   (Bear_Idle)',    key: 'enemy'      },
      { label: 'Projectile (Arrow)',     key: 'projectile' },
    ];

    const panelW = 480;
    const panelH = PAD * 2 + LH * (entries.length + 2) + 4;
    const px = PAD;
    const py = PAD;

    ctx.fillStyle = 'rgba(0,0,0,0.82)';
    ctx.fillRect(px, py, panelW, panelH);
    ctx.strokeStyle = '#555';
    ctx.lineWidth = 1;
    ctx.strokeRect(px, py, panelW, panelH);

    ctx.font = 'bold 11px monospace';
    ctx.fillStyle = '#ffdd44';
    ctx.textAlign = 'left';
    ctx.fillText('=== SPRITE RENDER PROOF ===', px + PAD, py + PAD + LH);

    let ty = py + PAD + LH * 2;
    for (const e of entries) {
      const r = this.results[e.key];
      const status = r.rendered ? '✓ YES' : '✗ NO ';
      ctx.fillStyle = r.rendered ? '#44ff88' : '#ff5555';
      ctx.font = 'bold 10px monospace';
      ctx.fillText(`${status}  ${e.label}`, px + PAD, ty);
      ty += LH;
    }

    ty += 4;
    ctx.fillStyle = '#888';
    ctx.font = '9px monospace';
    ctx.fillText('Yellow border = image drawn from preloaded cache', px + PAD, ty);
  }
}