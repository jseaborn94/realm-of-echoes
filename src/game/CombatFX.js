/**
 * CombatFX.js
 * 
 * Enhanced combat visual effects system
 * Replaces fallback rings with proper sprite-based or motion-based feedback
 * Handles melee impacts, projectile visuals, buff auras, knockback, and hit reactions
 */

import { assetIntegration } from './AssetIntegration.js';

export class CombatFX {
  constructor() {
    this.melee_impacts = [];
    this.projectiles = [];
    this.buffs = [];
    this.knockback_particles = [];
    this.hit_flashes = [];
    this.motion_trails = [];
    this.cast_bursts = [];
  }

  /**
   * Create melee impact effect at target location
   * Uses combined sprite effects for visual punch
   */
  createMeleeImpact(x, y, power = 1.0) {
    const id = `melee_${Math.random()}`;
    
    // Layered effects for impact
    // Use explosion + dust for sharp melee hit
    assetIntegration.drawEffect(null, 'explosion', x, y, 0.6 * power, 0.8).catch(() => {});
    
    // Add knockback visual burst
    this.knockback_particles.push({
      id,
      x, y,
      radius: 20 * power,
      duration: 0.15,
      maxDuration: 0.15,
      type: 'melee_burst',
    });

    // Brief impact flash for visual feedback
    this.hit_flashes.push({
      id: `flash_${Math.random()}`,
      x, y,
      duration: 0.08,
      maxDuration: 0.08,
      intensity: power,
    });

    return id;
  }

  /**
   * Create projectile visual traveling from source to target
   */
  createProjectile(startX, startY, targetX, targetY, projectileType = 'magic', speed = 200) {
    const dx = targetX - startX;
    const dy = targetY - startY;
    const dist = Math.sqrt(dx * dx + dy * dy);
    const angle = Math.atan2(dy, dx);

    const proj = {
      id: `proj_${Math.random()}`,
      x: startX,
      y: startY,
      targetX,
      targetY,
      angle,
      vx: (dx / dist) * speed,
      vy: (dy / dist) * speed,
      duration: dist / speed,
      maxDuration: dist / speed,
      type: projectileType,
      hitRadius: 15,
    };

    this.projectiles.push(proj);
    return proj.id;
  }

  /**
   * Create projectile impact effect
   */
  createProjectileImpact(x, y, projectileType = 'magic') {
    const typeMap = {
      magic: { color: '#9c27b0', sprite: 'explosion' },
      fire: { color: '#ff6b00', sprite: 'fire' },
      ice: { color: '#4fc3f7', sprite: 'explosion' },
      arrow: { color: '#d4a574', sprite: 'dust1' },
    };

    const config = typeMap[projectileType] || typeMap.magic;
    
    assetIntegration.drawEffect(null, config.sprite, x, y, 0.7, 0.6).catch(() => {});

    // Add colored glow for visual clarity
    this.knockback_particles.push({
      id: `proj_burst_${Math.random()}`,
      x, y,
      radius: 25,
      duration: 0.2,
      maxDuration: 0.2,
      type: 'projectile_burst',
      color: config.color,
    });
  }

  /**
   * Create buff aura around player
   * Persistent visual indicator of active buff
   */
  createBuffAura(x, y, buffType = 'generic', duration = 4.0) {
    const typeMap = {
      inner_focus: { color: '#ffaa00', sprite: 'fire' },
      enlightenment: { color: '#ff66ff', sprite: 'fire' },
      generic: { color: '#88ff88', sprite: 'fire' },
    };

    const config = typeMap[buffType] || typeMap.generic;

    const buff = {
      id: `buff_aura_${Math.random()}`,
      x, y,
      radius: 35,
      duration,
      maxDuration: duration,
      type: 'aura',
      color: config.color,
      buffType,
    };

    this.buffs.push(buff);
    return buff.id;
  }

  /**
   * Create dash motion trail
   */
  createDashTrail(startX, startY, endX, endY, duration = 0.3) {
    const trail = {
      id: `dash_trail_${Math.random()}`,
      startX, startY,
      endX, endY,
      duration,
      maxDuration: duration,
      type: 'dash_trail',
    };

    this.motion_trails.push(trail);

    // Dust effect along path
    const steps = 3;
    for (let i = 0; i <= steps; i++) {
      const t = i / steps;
      const px = startX + (endX - startX) * t;
      const py = startY + (endY - startY) * t;
      this.knockback_particles.push({
        id: `dust_${Math.random()}`,
        x: px,
        y: py,
        radius: 15,
        duration: duration * 0.7,
        maxDuration: duration * 0.7,
        type: 'dust_trail',
        color: '#aaaaaa',
      });
    }
  }

  /**
   * Create cast burst effect (pre-cast feedback)
   */
  createCastBurst(x, y, castType = 'generic') {
    const typeMap = {
      melee: { color: '#ff6666', sprite: 'explosion' },
      projectile: { color: '#ffaa44', sprite: 'fire' },
      aoe: { color: '#ff9900', sprite: 'explosion' },
      buff: { color: '#88ff88', sprite: 'fire' },
    };

    const config = typeMap[castType] || typeMap.generic;

    assetIntegration.drawEffect(null, config.sprite, x, y, 0.5, 0.4).catch(() => {});

    this.cast_bursts.push({
      id: `cast_${Math.random()}`,
      x, y,
      duration: 0.2,
      maxDuration: 0.2,
      color: config.color,
    });
  }

  /**
   * Update all active effects
   */
  update(dt) {
    // Update durations
    this.melee_impacts = this.melee_impacts.filter(e => {
      e.duration -= dt;
      return e.duration > 0;
    });

    this.projectiles = this.projectiles.filter(p => {
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      p.duration -= dt;
      return p.duration > 0;
    });

    this.buffs = this.buffs.filter(b => {
      b.duration -= dt;
      return b.duration > 0;
    });

    this.knockback_particles = this.knockback_particles.filter(p => {
      p.duration -= dt;
      return p.duration > 0;
    });

    this.hit_flashes = this.hit_flashes.filter(f => {
      f.duration -= dt;
      return f.duration > 0;
    });

    this.motion_trails = this.motion_trails.filter(t => {
      t.duration -= dt;
      return t.duration > 0;
    });

    this.cast_bursts = this.cast_bursts.filter(c => {
      c.duration -= dt;
      return c.duration > 0;
    });
  }

  /**
   * Render all combat effects (world-space, pre-zoomed)
   */
  draw(ctx, camX, camY, zoom = 1) {
    // Draw motion trails first (behind everything)
    for (const trail of this.motion_trails) {
      const alpha = trail.duration / trail.maxDuration;
      const sx1 = (trail.startX - camX) * zoom;
      const sy1 = (trail.startY - camY) * zoom;
      const sx2 = (trail.endX - camX) * zoom;
      const sy2 = (trail.endY - camY) * zoom;

      ctx.save();
      ctx.globalAlpha = alpha * 0.4;
      ctx.strokeStyle = '#cccccc';
      ctx.lineWidth = 8;
      ctx.lineCap = 'round';
      ctx.beginPath();
      ctx.moveTo(sx1, sy1);
      ctx.lineTo(sx2, sy2);
      ctx.stroke();
      ctx.restore();
    }

    // Draw projectiles
    for (const proj of this.projectiles) {
      const sx = (proj.x - camX) * zoom;
      const sy = (proj.y - camY) * zoom;
      assetIntegration.drawProjectile(ctx, sx, sy, proj.angle, proj.type).catch(() => {
        // Fallback: colored projectile glow
        ctx.save();
        const colorMap = { arrow: '#d4a574', magic: '#9c27b0', fire: '#ff6b00', ice: '#4fc3f7', default: '#fff' };
        ctx.fillStyle = colorMap[proj.type] || colorMap.default;
        ctx.globalAlpha = 0.8;
        ctx.beginPath();
        ctx.arc(sx, sy, 6, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      });
    }

    // Draw buff auras around player
    for (const buff of this.buffs) {
      const sx = (buff.x - camX) * zoom;
      const sy = (buff.y - camY) * zoom;
      const alpha = Math.sin(buff.duration * Math.PI * 2) * 0.3 + 0.4; // pulsing effect

      ctx.save();
      ctx.globalAlpha = alpha;
      ctx.strokeStyle = buff.color;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(sx, sy, buff.radius * zoom, 0, Math.PI * 2);
      ctx.stroke();

      // Subtle fill
      ctx.globalAlpha = alpha * 0.15;
      ctx.fillStyle = buff.color;
      ctx.fill();
      ctx.restore();
    }

    // Draw knockback particles (burst effects)
    for (const particle of this.knockback_particles) {
      const sx = (particle.x - camX) * zoom;
      const sy = (particle.y - camY) * zoom;
      const alpha = particle.duration / particle.maxDuration;
      const scale = (1 - alpha) * 1.5 + 0.5; // expand and fade

      ctx.save();
      ctx.globalAlpha = alpha * 0.6;
      ctx.strokeStyle = particle.color || '#ffffff';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(sx, sy, particle.radius * zoom * scale, 0, Math.PI * 2);
      ctx.stroke();
      ctx.restore();
    }

    // Draw hit flashes (brief white tint)
    for (const flash of this.hit_flashes) {
      const sx = (flash.x - camX) * zoom;
      const sy = (flash.y - camY) * zoom;
      const alpha = flash.duration / flash.maxDuration * flash.intensity;

      ctx.save();
      ctx.globalAlpha = alpha * 0.5;
      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.arc(sx, sy, 20 * zoom, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }

    // Draw cast bursts
    for (const burst of this.cast_bursts) {
      const sx = (burst.x - camX) * zoom;
      const sy = (burst.y - camY) * zoom;
      const alpha = burst.duration / burst.maxDuration;
      const scale = (1 - alpha) * 0.8 + 0.2;

      ctx.save();
      ctx.globalAlpha = alpha * 0.7;
      ctx.fillStyle = burst.color;
      ctx.beginPath();
      ctx.arc(sx, sy, 25 * zoom * scale, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }
  }

  clear() {
    this.melee_impacts = [];
    this.projectiles = [];
    this.buffs = [];
    this.knockback_particles = [];
    this.hit_flashes = [];
    this.motion_trails = [];
    this.cast_bursts = [];
  }
}

export const combatFX = new CombatFX();