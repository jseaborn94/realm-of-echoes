/**
 * SpriteDebugRenderer.js
 * 
 * Forces test sprite rendering at fixed screen positions with full diagnostics.
 * Draws directly in screen space (no camera/zoom transforms).
 * Designed to verify PNG load and render paths work.
 */

export class SpriteDebugRenderer {
  constructor(assetIntegration) {
    this.assetIntegration = assetIntegration;
    this.testResults = {
      playerLoaded: false,
      npcLoaded: false,
      enemyLoaded: false,
      playerDrawn: false,
      npcDrawn: false,
      enemyDrawn: false,
    };
  }

  /**
   * MAIN METHOD: Draw all test sprites in screen space (fixed positions, no camera)
   * Called AFTER ctx.restore() so no zoom transform is active
   */
  drawTestSpritesCentered(ctx, screenWidth, screenHeight) {
    if (!ctx) return;

    // Throttled frame log — confirm this function executes every frame
    this._frameCount = (this._frameCount || 0) + 1;
    if (this._frameCount === 1 || this._frameCount % 120 === 0) {
      console.log(`[TEST DRAW EXECUTED] frame=${this._frameCount} canvas=${screenWidth}x${screenHeight} cacheSize=${this.assetIntegration.imageCache.size}`);
    }

    // Save canvas state
    ctx.save();

    // Ensure no transforms are active — critical after zoom ctx.restore()
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.globalAlpha = 1;
    ctx.globalCompositeOperation = 'source-over';

    // TEST 0: KNOWN-GOOD PUBLIC IMAGE (Wikipedia — confirms any image can render)
    this._drawFallbackTest(ctx, screenWidth, screenHeight);

    // TEST 1: PLAYER SPRITE (CENTER SCREEN)
    this._drawTestPlayerCentered(ctx, screenWidth, screenHeight);

    // TEST 2: NPC SPRITE (LEFT SIDE)
    this._drawTestNPCCentered(ctx, screenWidth, screenHeight);

    // TEST 3: ENEMY SPRITE (RIGHT SIDE)
    this._drawTestEnemyCentered(ctx, screenWidth, screenHeight);

    // DIAGNOSTIC LABELS
    this._drawDiagnosticLabels(ctx, screenWidth, screenHeight);

    ctx.restore();
  }

  _drawFallbackTest(ctx, screenWidth, screenHeight) {
    const size = 80;
    const x = screenWidth / 2 - size / 2;
    const y = 20;
    const url = 'https://upload.wikimedia.org/wikipedia/commons/thumb/4/47/PNG_transparency_demonstration_1.png/240px-PNG_transparency_demonstration_1.png';

    // Draw background so position is always visible
    ctx.fillStyle = '#333333';
    ctx.fillRect(x, y, size, size);
    ctx.strokeStyle = '#00ffff';
    ctx.lineWidth = 2;
    ctx.strokeRect(x, y, size, size);

    const img = this.assetIntegration.imageCache.get(url);
    if (img && img.complete && img.naturalWidth > 0) {
      ctx.drawImage(img, x, y, size, size);
      if (!this._loggedFallback) {
        console.log(`[FALLBACK TEST] ✓ Wikipedia image rendered: ${img.naturalWidth}x${img.naturalHeight}`);
        this._loggedFallback = true;
      }
    } else if (!this._fallbackRequested) {
      console.log(`[FALLBACK TEST] Requesting public test image: ${url}`);
      this._fallbackRequested = true;
      this.assetIntegration.loadImage(url).then(img => {
        if (img) console.log(`[FALLBACK TEST] ✓ Loaded: ${img.naturalWidth}x${img.naturalHeight}`);
        else console.error(`[FALLBACK TEST] ✗ Failed to load`);
      });
    }
  }

  _tryGetImage(rawUrl) {
    // Try both encoded and raw URL since loadImage caches under both
    const encoded = encodeURI(rawUrl);
    return this.assetIntegration.imageCache.get(encoded)
        || this.assetIntegration.imageCache.get(rawUrl)
        || null;
  }

  _drawTestSprite(ctx, rawUrl, label, x, y, size, bgColor) {
    const encodedUrl = encodeURI(rawUrl);

    // ALWAYS draw background rect first — if this is visible but image is not → image issue
    ctx.fillStyle = bgColor;
    ctx.fillRect(x, y, size, size);
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 2;
    ctx.strokeRect(x, y, size, size);

    // Label on the box
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 10px monospace';
    ctx.textAlign = 'center';
    ctx.fillText(label, x + size / 2, y + size - 6);

    // Get image
    const img = this._tryGetImage(rawUrl);
    if (!img) {
      console.error(`[${label}] ✗ NOT IN CACHE — url: ${encodedUrl}`);
      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 9px monospace';
      ctx.fillText('MISSING', x + size / 2, y + size / 2);
      return false;
    }

    if (!img.complete || img.naturalWidth === 0) {
      console.error(`[${label}] ✗ IMG NOT READY: complete=${img.complete} naturalW=${img.naturalWidth}`);
      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 9px monospace';
      ctx.fillText('NOT READY', x + size / 2, y + size / 2);
      return false;
    }

    // Only log on first success to avoid spam
    const cacheKey = `logged_${label}`;
    if (!this[cacheKey]) {
      console.log(`[${label}] ✓ In cache: ${img.naturalWidth}x${img.naturalHeight} — drawing at (${x},${y}) ${size}x${size}`);
      this[cacheKey] = true;
    }

    try {
      ctx.drawImage(img, x, y, size, size);
      // Yellow border on success to distinguish from error state
      ctx.strokeStyle = '#ffff00';
      ctx.lineWidth = 2;
      ctx.strokeRect(x, y, size, size);
      return true;
    } catch (err) {
      console.error(`[${label}] ✗ drawImage threw: ${err.message}`);
      return false;
    }
  }

  _drawTestPlayerCentered(ctx, screenWidth, screenHeight) {
    const size = 96;
    const x = screenWidth / 2 - size / 2;
    const y = screenHeight / 2 - size / 2;
    const url = 'https://raw.githubusercontent.com/jseaborn94/Realm-of-Echoes-Assets/main/assets/Units/Blue Units/Warrior/Warrior_Idle.png';
    this.testResults.playerDrawn = this._drawTestSprite(ctx, url, 'PLAYER', x, y, size, '#0044cc');
    this.testResults.playerLoaded = this.testResults.playerDrawn;
  }

  _drawTestNPCCentered(ctx, screenWidth, screenHeight) {
    const size = 96;
    const x = 16;
    const y = screenHeight / 2 - size / 2;
    const url = 'https://raw.githubusercontent.com/jseaborn94/Realm-of-Echoes-Assets/main/assets/Units/Black Units/Warrior/Warrior_Idle.png';
    this.testResults.npcDrawn = this._drawTestSprite(ctx, url, 'NPC', x, y, size, '#006622');
    this.testResults.npcLoaded = this.testResults.npcDrawn;
  }

  _drawTestEnemyCentered(ctx, screenWidth, screenHeight) {
    const size = 96;
    const x = screenWidth - size - 16;
    const y = screenHeight / 2 - size / 2;
    const url = 'https://raw.githubusercontent.com/jseaborn94/Realm-of-Echoes-Assets/main/assets/Enemy Pack/Bear/Bear_Idle.png';
    this.testResults.enemyDrawn = this._drawTestSprite(ctx, url, 'ENEMY', x, y, size, '#880000');
    this.testResults.enemyLoaded = this.testResults.enemyDrawn;
  }

  _drawErrorBox(ctx, x, y, size, color, label) {
    ctx.fillStyle = color;
    ctx.fillRect(x, y, size, size);
    ctx.strokeStyle = '#ffff00';
    ctx.lineWidth = 2;
    ctx.strokeRect(x, y, size, size);

    // Label
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 12px monospace';
    ctx.textAlign = 'center';
    ctx.fillText(label, x + size / 2, y + size / 2);
  }

  _drawDiagnosticLabels(ctx, screenWidth, screenHeight) {
    const padding = 16;
    const lineHeight = 20;
    let y = padding;

    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 12px monospace';
    ctx.textAlign = 'left';

    const labels = [
      `SPRITE DEBUG TEST`,
      `Player: ${this.testResults.playerLoaded ? '✓ loaded' : '✗ missing'} ${this.testResults.playerDrawn ? '→ drawn' : ''}`,
      `NPC: ${this.testResults.npcLoaded ? '✓ loaded' : '✗ missing'} ${this.testResults.npcDrawn ? '→ drawn' : ''}`,
      `Enemy: ${this.testResults.enemyLoaded ? '✓ loaded' : '✗ missing'} ${this.testResults.enemyDrawn ? '→ drawn' : ''}`,
    ];

    labels.forEach(label => {
      // Draw background for readability
      ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
      ctx.fillRect(padding - 4, y - 14, 280, lineHeight);

      // Draw text
      ctx.fillStyle = '#ffffff';
      ctx.fillText(label, padding, y);
      y += lineHeight;
    });

    // Draw instruction at bottom
    ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
    ctx.fillRect(padding - 4, screenHeight - 50, 400, 40);

    ctx.fillStyle = '#ffff00';
    ctx.font = 'bold 11px monospace';
    ctx.fillText('If you see 3 sprites above: render pipeline works ✓', padding, screenHeight - 28);
    ctx.fillStyle = '#ff6644';
    ctx.fillText('If boxes only: image loading issue', padding, screenHeight - 10);
  }
}