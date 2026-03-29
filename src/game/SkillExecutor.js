/**
 * SkillExecutor.js
 * 
 * Handles skill execution: damage calculation, area application, visual effects.
 * Decoupled from GameEngine so skills can be tested and reused independently.
 */

import { calculateSkillDamage } from './SkillSystem.js';
import { skillFX } from './SkillFX.js';

export class SkillExecutor {
  constructor(gameEngine) {
    this.engine = gameEngine;
  }

  /**
   * Execute a skill at a target location
   * Returns array of { enemy, x, y, dmg, killed }
   */
  execute(skill, playerX, playerY, targetX, targetY, playerStats, classId) {
    if (!skill) return [];

    const hits = [];

    switch (skill.castType) {
      case 'instant_melee':
        return this._executeInstantMelee(skill, playerX, playerY, targetX, targetY, playerStats);

      case 'projectile':
        return this._executeProjectile(skill, playerX, playerY, targetX, targetY, playerStats);

      case 'ground_target_aoe':
        return this._executeGroundAOE(skill, targetX, targetY, playerStats);

      case 'self_buff':
        return this._executeSelfBuff(skill, playerStats);

      case 'dash':
        return this._executeDash(skill, playerX, playerY, targetX, targetY, playerStats);

      default:
        return [];
    }
  }

  /**
   * Instant melee: damage in cone or line in front of player
   */
  _executeInstantMelee(skill, playerX, playerY, targetX, targetY, playerStats) {
    const hits = [];
    const dmg = calculateSkillDamage(skill, playerStats);
    const range = skill.range || 50;

    // Damage enemies in cone toward target
    for (const enemy of this.engine.enemyManager.enemies) {
      if (enemy.dead) continue;
      const dx = enemy.x - playerX, dy = enemy.y - playerY;
      const dist = Math.sqrt(dx * dx + dy * dy);
      if (dist > range) continue;

      // Apply damage
      const hpBefore = enemy.hp;
      enemy.hp = Math.max(0, enemy.hp - dmg);
      enemy.hitFlash = 0.15;

      hits.push({
        enemy,
        x: enemy.x,
        y: enemy.y,
        dmg,
        killed: enemy.hp <= 0 && hpBefore > 0,
      });

      if (enemy.hp <= 0) {
        enemy.dead = true;
        enemy.deathTimer = 0.6;
      }
    }

    // Visual effect
    skillFX.create(targetX, targetY, 'melee', skill.areaRadius || 25, 0.3, '#ff9999');

    return hits;
  }

  /**
   * Projectile: fire in direction of target, damage on contact or area
   */
  _executeProjectile(skill, playerX, playerY, targetX, targetY, playerStats) {
    const hits = [];
    const dmg = calculateSkillDamage(skill, playerStats);
    const range = skill.range || 200;

    // Direction from player to target
    const dx = targetX - playerX, dy = targetY - playerY;
    const dist = Math.sqrt(dx * dx + dy * dy);
    const dirX = dx / dist, dirY = dy / dist;

    // Check enemies along the projectile path
    for (const enemy of this.engine.enemyManager.enemies) {
      if (enemy.dead) continue;

      // Vector from player to enemy
      const edx = enemy.x - playerX, edy = enemy.y - playerY;
      const edist = Math.sqrt(edx * edx + edy * edy);

      // Skip if beyond range or behind player
      if (edist > range || edist < 0) continue;

      // Check if enemy is on the projectile line (within tolerance)
      const crossProduct = Math.abs(edx * dirY - edy * dirX);
      if (crossProduct > 30) continue; // Tolerance for hit detection

      // Hit!
      const hpBefore = enemy.hp;
      enemy.hp = Math.max(0, enemy.hp - dmg);
      enemy.hitFlash = 0.15;

      hits.push({
        enemy,
        x: enemy.x,
        y: enemy.y,
        dmg,
        killed: enemy.hp <= 0 && hpBefore > 0,
      });

      if (enemy.hp <= 0) {
        enemy.dead = true;
        enemy.deathTimer = 0.6;
      }
    }

    // Visual effect along projectile path
    skillFX.create(targetX, targetY, 'projectile', skill.areaRadius || 20, 0.4, '#ffcc00');

    return hits;
  }

  /**
   * Ground target AOE: damage all enemies in radius at target location
   */
  _executeGroundAOE(skill, targetX, targetY, playerStats) {
    const hits = [];
    const dmg = calculateSkillDamage(skill, playerStats);
    const radius = skill.areaRadius || 50;

    for (const enemy of this.engine.enemyManager.enemies) {
      if (enemy.dead) continue;

      const dx = enemy.x - targetX, dy = enemy.y - targetY;
      const dist = Math.sqrt(dx * dx + dy * dy);
      if (dist > radius) continue;

      // Apply damage
      const hpBefore = enemy.hp;
      enemy.hp = Math.max(0, enemy.hp - dmg);
      enemy.hitFlash = 0.15;

      hits.push({
        enemy,
        x: enemy.x,
        y: enemy.y,
        dmg,
        killed: enemy.hp <= 0 && hpBefore > 0,
      });

      if (enemy.hp <= 0) {
        enemy.dead = true;
        enemy.deathTimer = 0.6;
      }
    }

    // Visual effect at target
    skillFX.create(targetX, targetY, 'aoe', radius, 0.5, '#ffaa44');

    return hits;
  }

  /**
   * Self buff: apply temporary stat boost to player
   */
  _executeSelfBuff(skill, playerStats) {
    // Store buff state on gameEngine for UI display
    if (this.engine.gameState) {
      const buffs = this.engine.gameState._activeBuffs || {};
      buffs[skill.id] = {
        name: skill.name,
        duration: skill.duration || 3.0,
        maxDuration: skill.duration || 3.0,
      };
      this.engine.gameState._activeBuffs = buffs;
    }

    // Visual effect on player
    skillFX.create(this.engine.px, this.engine.py, 'buff', 40, 0.6, '#88ff88');

    return [];
  }

  /**
   * Dash: move player toward target, damage enemies along path
   */
  _executeDash(skill, playerX, playerY, targetX, targetY, playerStats) {
    const hits = [];
    const dmg = calculateSkillDamage(skill, playerStats);
    const range = skill.range || 100;

    // Move player toward target
    const dx = targetX - playerX, dy = targetY - playerY;
    const dist = Math.sqrt(dx * dx + dy * dy);
    const moveDistance = Math.min(range, dist);
    const dirX = dx / dist, dirY = dy / dist;

    const newX = playerX + dirX * moveDistance;
    const newY = playerY + dirY * moveDistance;

    // Clamp to world bounds
    const TILE_SIZE = 16;
    const WORLD_WIDTH = 16 * 16 * 16; // stub—should import from constants
    const WORLD_HEIGHT = 32 * 16 * 16;

    if (this.engine) {
      this.engine.px = Math.max(TILE_SIZE, Math.min(WORLD_WIDTH - TILE_SIZE, newX));
      this.engine.py = Math.max(TILE_SIZE, Math.min(WORLD_HEIGHT - TILE_SIZE, newY));
    }

    // Damage enemies along dash path
    for (const enemy of this.engine.enemyManager.enemies) {
      if (enemy.dead) continue;

      // Check if enemy was in the dash path
      const edx = enemy.x - playerX, edy = enemy.y - playerY;
      const crossProduct = Math.abs(edx * dirY - edy * dirX);
      if (crossProduct > 40) continue; // Tolerance

      const hpBefore = enemy.hp;
      enemy.hp = Math.max(0, enemy.hp - dmg);
      enemy.hitFlash = 0.15;

      hits.push({
        enemy,
        x: enemy.x,
        y: enemy.y,
        dmg,
        killed: enemy.hp <= 0 && hpBefore > 0,
      });

      if (enemy.hp <= 0) {
        enemy.dead = true;
        enemy.deathTimer = 0.6;
      }
    }

    // Visual effect
    skillFX.create(newX, newY, 'dash', 50, 0.4, '#4488ff');

    return hits;
  }
}

export default SkillExecutor;