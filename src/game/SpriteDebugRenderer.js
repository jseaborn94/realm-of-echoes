/**
 * SpriteDebugRenderer.js
 * 
 * Force-draws known test sprites directly to prove PNG rendering works.
 * This is a diagnostic tool - bypasses all abstraction to test raw drawImage().
 */

export class SpriteDebugRenderer {
  constructor(assetIntegration) {
    this.assetIntegration = assetIntegration;
    this.testResults = {
      playerRendered: false,
      npcRendered: false,
      enemyRendered: false,
    };
  }

  /**
   * Hard-wired test: draw player sprite at screen center
   * PNG: Blue Warrior Idle
   */
  drawTestPlayerSprite(ctx, screenX, screenY) {
    const TEST_PLAYER_URL = 'https://raw.githubusercontent.com/jseaborn94/Realm-of-Echoes-Assets/main/assets/Units/Blue Units/Warrior/Warrior_Idle.png';
    
    console.log(`[DEBUG] Drawing test player sprite at (${screenX}, ${screenY})`);
    console.log(`[DEBUG] URL: ${TEST_PLAYER_URL}`);
    
    const img = this.assetIntegration.imageCache.get(TEST_PLAYER_URL);
    if (!img) {
      console.warn(`[DEBUG] Player sprite NOT in cache`);
      this.testResults.playerRendered = false;
      return false;
    }

    console.log(`[DEBUG] Player sprite found in cache: ${img.width}x${img.height}px, complete=${img.complete}`);

    if (!img.complete) {
      console.warn(`[DEBUG] Player sprite not fully loaded`);
      this.testResults.playerRendered = false;
      return false;
    }

    try {
      const scale = 2;
      const w = img.width * scale;
      const h = img.height * scale;
      
      ctx.save();
      ctx.globalAlpha = 1.0;
      ctx.drawImage(img, screenX - w / 2, screenY - h, w, h);
      ctx.restore();
      
      console.log(`[DEBUG] ✓ Player sprite drawn: ${w}x${h}px at (${screenX}, ${screenY})`);
      this.testResults.playerRendered = true;
      return true;
    } catch (err) {
      console.error(`[DEBUG] Failed to draw player sprite: ${err.message}`);
      this.testResults.playerRendered = false;
      return false;
    }
  }

  /**
   * Hard-wired test: draw NPC sprite at known position
   * PNG: Black Warrior Idle (for Captain Aldric)
   */
  drawTestNPCSprite(ctx, screenX, screenY) {
    const TEST_NPC_URL = 'https://raw.githubusercontent.com/jseaborn94/Realm-of-Echoes-Assets/main/assets/Units/Black Units/Warrior/Warrior_Idle.png';
    
    console.log(`[DEBUG] Drawing test NPC sprite at (${screenX}, ${screenY})`);
    console.log(`[DEBUG] URL: ${TEST_NPC_URL}`);
    
    const img = this.assetIntegration.imageCache.get(TEST_NPC_URL);
    if (!img) {
      console.warn(`[DEBUG] NPC sprite NOT in cache`);
      this.testResults.npcRendered = false;
      return false;
    }

    console.log(`[DEBUG] NPC sprite found in cache: ${img.width}x${img.height}px, complete=${img.complete}`);

    if (!img.complete) {
      console.warn(`[DEBUG] NPC sprite not fully loaded`);
      this.testResults.npcRendered = false;
      return false;
    }

    try {
      const scale = 2;
      const w = img.width * scale;
      const h = img.height * scale;
      
      ctx.save();
      ctx.globalAlpha = 1.0;
      ctx.drawImage(img, screenX - w / 2, screenY - h, w, h);
      ctx.restore();
      
      console.log(`[DEBUG] ✓ NPC sprite drawn: ${w}x${h}px at (${screenX}, ${screenY})`);
      this.testResults.npcRendered = true;
      return true;
    } catch (err) {
      console.error(`[DEBUG] Failed to draw NPC sprite: ${err.message}`);
      this.testResults.npcRendered = false;
      return false;
    }
  }

  /**
   * Hard-wired test: draw enemy sprite at known position
   * PNG: Bear Idle
   */
  drawTestEnemySprite(ctx, screenX, screenY) {
    const TEST_ENEMY_URL = 'https://raw.githubusercontent.com/jseaborn94/Realm-of-Echoes-Assets/main/assets/Enemy Pack/Bear/Bear_Idle.png';
    
    console.log(`[DEBUG] Drawing test enemy sprite at (${screenX}, ${screenY})`);
    console.log(`[DEBUG] URL: ${TEST_ENEMY_URL}`);
    
    const img = this.assetIntegration.imageCache.get(TEST_ENEMY_URL);
    if (!img) {
      console.warn(`[DEBUG] Enemy sprite NOT in cache`);
      this.testResults.enemyRendered = false;
      return false;
    }

    console.log(`[DEBUG] Enemy sprite found in cache: ${img.width}x${img.height}px, complete=${img.complete}`);

    if (!img.complete) {
      console.warn(`[DEBUG] Enemy sprite not fully loaded`);
      this.testResults.enemyRendered = false;
      return false;
    }

    try {
      const scale = 2;
      const w = img.width * scale;
      const h = img.height * scale;
      
      ctx.save();
      ctx.globalAlpha = 1.0;
      ctx.drawImage(img, screenX - w / 2, screenY - h, w, h);
      ctx.restore();
      
      console.log(`[DEBUG] ✓ Enemy sprite drawn: ${w}x${h}px at (${screenX}, ${screenY})`);
      this.testResults.enemyRendered = true;
      return true;
    } catch (err) {
      console.error(`[DEBUG] Failed to draw enemy sprite: ${err.message}`);
      this.testResults.enemyRendered = false;
      return false;
    }
  }

  /**
   * Draw debug labels for test results
   */
  drawDebugLabels(ctx, W, H) {
    const results = this.testResults;
    const labels = [
      `Player: ${results.playerRendered ? '✓' : '✗'}`,
      `NPC: ${results.npcRendered ? '✓' : '✗'}`,
      `Enemy: ${results.enemyRendered ? '✓' : '✗'}`,
    ];

    ctx.save();
    ctx.font = 'bold 12px monospace';
    ctx.fillStyle = results.playerRendered && results.npcRendered && results.enemyRendered ? '#00ff00' : '#ff4444';
    ctx.textAlign = 'right';
    
    labels.forEach((label, i) => {
      ctx.fillText(label, W - 20, 100 + i * 20);
    });

    ctx.restore();
  }

  getResults() {
    return this.testResults;
  }
}