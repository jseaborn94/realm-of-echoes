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

    // Save canvas state
    ctx.save();

    // Ensure no transforms are active
    ctx.resetTransform();
    ctx.globalAlpha = 1;
    ctx.globalCompositeOperation = 'source-over';

    console.log(`[DEBUG RENDER] Canvas: ${screenWidth}x${screenHeight}`);

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

  _drawTestPlayerCentered(ctx, screenWidth, screenHeight) {
    const x = screenWidth / 2 - 32;  // Center horizontally
    const y = screenHeight / 2 - 32; // Center vertically
    const size = 64;

    console.log(`[PLAYER TEST] Drawing at screen (${x}, ${y}) size=${size}x${size}`);

    // Get image from cache
    const playerUrl = 'https://raw.githubusercontent.com/jseaborn94/Realm-of-Echoes-Assets/main/assets/Units/Blue Units/Warrior/Warrior_Idle.png';
    const img = this.assetIntegration.imageCache.get(playerUrl);

    if (!img) {
      console.error(`[PLAYER TEST] ✗ NOT IN CACHE`);
      this._drawErrorBox(ctx, x, y, size, '#ff0000', 'NO IMG');
      this.testResults.playerLoaded = false;
      return;
    }

    // Verify image is loaded
    if (!img.complete || img.width === 0 || img.height === 0) {
      console.error(`[PLAYER TEST] ✗ IMAGE NOT READY: complete=${img.complete} ${img.width}x${img.height}`);
      this._drawErrorBox(ctx, x, y, size, '#ff6600', 'BAD IMG');
      this.testResults.playerLoaded = false;
      return;
    }

    console.log(`[PLAYER TEST] ✓ Image loaded: ${img.width}x${img.height}`);
    this.testResults.playerLoaded = true;

    // Draw the image
    try {
      ctx.drawImage(img, x, y, size, size);
      console.log(`[PLAYER TEST] ✓ drawImage executed`);
      this.testResults.playerDrawn = true;
    } catch (err) {
      console.error(`[PLAYER TEST] ✗ drawImage failed: ${err.message}`);
      this._drawErrorBox(ctx, x, y, size, '#ff0000', 'DRAW FAIL');
      return;
    }

    // Draw border to verify position
    ctx.strokeStyle = '#ffff00';
    ctx.lineWidth = 2;
    ctx.strokeRect(x, y, size, size);
  }

  _drawTestNPCCentered(ctx, screenWidth, screenHeight) {
    const x = 32;  // Left side
    const y = screenHeight / 2 - 32;
    const size = 64;

    console.log(`[NPC TEST] Drawing at screen (${x}, ${y}) size=${size}x${size}`);

    const npcUrl = 'https://raw.githubusercontent.com/jseaborn94/Realm-of-Echoes-Assets/main/assets/Units/Black Units/Warrior/Warrior_Idle.png';
    const img = this.assetIntegration.imageCache.get(npcUrl);

    if (!img) {
      console.error(`[NPC TEST] ✗ NOT IN CACHE`);
      this._drawErrorBox(ctx, x, y, size, '#ff0000', 'NO IMG');
      this.testResults.npcLoaded = false;
      return;
    }

    if (!img.complete || img.width === 0 || img.height === 0) {
      console.error(`[NPC TEST] ✗ IMAGE NOT READY: complete=${img.complete} ${img.width}x${img.height}`);
      this._drawErrorBox(ctx, x, y, size, '#ff6600', 'BAD IMG');
      this.testResults.npcLoaded = false;
      return;
    }

    console.log(`[NPC TEST] ✓ Image loaded: ${img.width}x${img.height}`);
    this.testResults.npcLoaded = true;

    try {
      ctx.drawImage(img, x, y, size, size);
      console.log(`[NPC TEST] ✓ drawImage executed`);
      this.testResults.npcDrawn = true;
    } catch (err) {
      console.error(`[NPC TEST] ✗ drawImage failed: ${err.message}`);
      this._drawErrorBox(ctx, x, y, size, '#ff0000', 'DRAW FAIL');
      return;
    }

    ctx.strokeStyle = '#ffff00';
    ctx.lineWidth = 2;
    ctx.strokeRect(x, y, size, size);
  }

  _drawTestEnemyCentered(ctx, screenWidth, screenHeight) {
    const x = screenWidth - 96;  // Right side
    const y = screenHeight / 2 - 32;
    const size = 64;

    console.log(`[ENEMY TEST] Drawing at screen (${x}, ${y}) size=${size}x${size}`);

    const enemyUrl = 'https://raw.githubusercontent.com/jseaborn94/Realm-of-Echoes-Assets/main/assets/Enemy Pack/Bear/Bear_Idle.png';
    const img = this.assetIntegration.imageCache.get(enemyUrl);

    if (!img) {
      console.error(`[ENEMY TEST] ✗ NOT IN CACHE`);
      this._drawErrorBox(ctx, x, y, size, '#ff0000', 'NO IMG');
      this.testResults.enemyLoaded = false;
      return;
    }

    if (!img.complete || img.width === 0 || img.height === 0) {
      console.error(`[ENEMY TEST] ✗ IMAGE NOT READY: complete=${img.complete} ${img.width}x${img.height}`);
      this._drawErrorBox(ctx, x, y, size, '#ff6600', 'BAD IMG');
      this.testResults.enemyLoaded = false;
      return;
    }

    console.log(`[ENEMY TEST] ✓ Image loaded: ${img.width}x${img.height}`);
    this.testResults.enemyLoaded = true;

    try {
      ctx.drawImage(img, x, y, size, size);
      console.log(`[ENEMY TEST] ✓ drawImage executed`);
      this.testResults.enemyDrawn = true;
    } catch (err) {
      console.error(`[ENEMY TEST] ✗ drawImage failed: ${err.message}`);
      this._drawErrorBox(ctx, x, y, size, '#ff0000', 'DRAW FAIL');
      return;
    }

    ctx.strokeStyle = '#ffff00';
    ctx.lineWidth = 2;
    ctx.strokeRect(x, y, size, size);
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