/**
 * SkillFX.js
 *
 * Handles rendering of skill effect zones using sprite-based visuals from CompleteAssetRegistry
 * Replaces circle-based effect indicators with polished FX sprites
 */

import { assetIntegration } from './AssetIntegration.js';

export class SkillFX {
  constructor() {
    this.activeEffects = [];
  }

  /**
   * Create a skill effect zone
   * @param {number} x - World X
   * @param {number} y - World Y
   * @param {string} skillType - Skill type (aoe, line, ultimate, self_aoe)
   * @param {number} radius - Effect radius
   * @param {number} duration - Duration in seconds
   * @param {string} color - Tint color
   */
  create(x, y, skillType = 'aoe', radius = 100, duration = 0.5, color = '#4caf50') {
    const effect = {
      x,
      y,
      skillType,
      radius,
      duration,
      maxDuration: duration,
      color,
      id: `skill_fx_${Math.random()}`,
    };
    this.activeEffects.push(effect);
    return effect.id;
  }

  /**
   * Update all active skill effects
   */
  update(dt) {
    this.activeEffects = this.activeEffects.filter(e => {
      e.duration -= dt;
      return e.duration > 0;
    });
  }

  /**
   * Render all active skill effects
   * @param {CanvasRenderingContext2D} ctx - Canvas context (world-space, pre-scaled)
   * @param {number} camX - Camera X
   * @param {number} camY - Camera Y
   * @param {number} zoom - Zoom factor for screen-space scaling
   */
  draw(ctx, camX, camY, zoom = 1) {
    for (const e of this.activeEffects) {
      const screenX = (e.x - camX) * zoom;
      const screenY = (e.y - camY) * zoom;
      const alpha = e.duration / e.maxDuration;

      // Draw sprite-based effect
      if (e.skillType === 'aoe' || e.skillType === 'ultimate') {
        // Use explosion effect for area markers
        assetIntegration.drawEffect(ctx, 'explosion', screenX, screenY, e.radius / 40, alpha * 0.7).catch(() => {
          this._drawFallbackRing(ctx, screenX, screenY, e.radius * zoom, e.color, alpha);
        });
      } else if (e.skillType === 'self_aoe') {
        // Use fire effect for player-centered zones
        assetIntegration.drawEffect(ctx, 'fire', screenX, screenY, e.radius / 35, alpha * 0.6).catch(() => {
          this._drawFallbackRing(ctx, screenX, screenY, e.radius * zoom * 0.8, e.color, alpha);
        });
      } else {
        // Fallback: subtle glow ring
        this._drawFallbackRing(ctx, screenX, screenY, e.radius * zoom, e.color, alpha);
      }
    }
  }

  /**
   * Fallback ring indicator (used if sprite fails)
   */
  _drawFallbackRing(ctx, screenX, screenY, radius, color, alpha) {
    ctx.save();
    ctx.globalAlpha = alpha * 0.5;
    ctx.strokeStyle = color;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(screenX, screenY, radius, 0, Math.PI * 2);
    ctx.stroke();

    // Semi-transparent fill
    ctx.globalAlpha = alpha * 0.15;
    ctx.fillStyle = color;
    ctx.fill();
    ctx.restore();
  }

  /**
   * Clear all effects
   */
  clear() {
    this.activeEffects = [];
  }
}

export const skillFX = new SkillFX();