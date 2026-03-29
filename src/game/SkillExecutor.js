/**
 * SkillExecutor.js
 * 
 * Handles skill execution: damage calculation, area application, visual effects.
 * Decoupled from GameEngine so skills can be tested and reused independently.
 */

import { calculateSkillDamage } from './SkillSystem.js';
import { skillFX } from './SkillFX.js';
import { combatFX } from './CombatFX.js';
import { buffSystem } from './BuffSystem.js';

export class SkillExecutor {
  constructor(gameEngine) {
    this.engine = gameEngine;
  }

  /**
    * Execute a skill at a target location
    * Returns array of { enemy, x, y, dmg, killed }
    */
  execute(skill, playerX, playerY, targetX, targetY, playerStats, classId) {
    if (!skill || !this.engine || !this.engine.enemyManager) {
      console.warn('[SkillExecutor] Invalid skill or engine state');
      return [];
    }

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
        console.warn(`[SkillExecutor] Unknown cast type: ${skill.castType}`);
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

    // Cast burst feedback
    combatFX.createCastBurst(playerX, playerY, 'melee');

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

      // Apply knockback
      const knockDir = Math.atan2(dy, dx);
      const knockForce = 30;
      enemy.knockbackX = Math.cos(knockDir) * knockForce;
      enemy.knockbackY = Math.sin(knockDir) * knockForce;
      enemy.knockbackDuration = 0.12;

      // Impact visuals
      combatFX.createMeleeImpact(enemy.x, enemy.y, 1.0);

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

    // Create visible projectile
    combatFX.createProjectile(playerX, playerY, targetX, targetY, 'magic', skill.projectileSpeed || 280);

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
      if (crossProduct > 30) continue;

      // Hit!
      const hpBefore = enemy.hp;
      enemy.hp = Math.max(0, enemy.hp - dmg);
      enemy.hitFlash = 0.15;

      // Knockback from projectile
      enemy.knockbackX = dirX * 25;
      enemy.knockbackY = dirY * 25;
      enemy.knockbackDuration = 0.1;

      // Impact visuals
      combatFX.createProjectileImpact(enemy.x, enemy.y, 'magic');

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

    return hits;
  }

  /**
   * Ground target AOE: damage all enemies in radius at target location
   */
  _executeGroundAOE(skill, targetX, targetY, playerStats) {
    const hits = [];
    const dmg = calculateSkillDamage(skill, playerStats);
    const radius = skill.areaRadius || 50;

    // Cast burst at target
    combatFX.createCastBurst(targetX, targetY, 'aoe');

    for (const enemy of this.engine.enemyManager.enemies) {
      if (enemy.dead) continue;

      const dx = enemy.x - targetX, dy = enemy.y - targetY;
      const dist = Math.sqrt(dx * dx + dy * dy);
      if (dist > radius) continue;

      // Apply damage
      const hpBefore = enemy.hp;
      enemy.hp = Math.max(0, enemy.hp - dmg);
      enemy.hitFlash = 0.15;

      // Radial knockback from center
      const angle = Math.atan2(dy, dx);
      enemy.knockbackX = Math.cos(angle) * 35;
      enemy.knockbackY = Math.sin(angle) * 35;
      enemy.knockbackDuration = 0.15;

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

    // Visual effect at target (sprite-based via skillFX)
    skillFX.create(targetX, targetY, 'aoe', radius, 0.5, '#ffaa44');

    return hits;
  }

  /**
   * Self buff: apply temporary stat boost to player
   */
  _executeSelfBuff(skill, playerStats) {
    // Determine buff type and modifiers
    let buffData = {
      name: skill.name,
      type: skill.id,
      duration: skill.duration || 3.0,
      statModifiers: {
        attackSpeed: 0,
        attackDamage: 0,
        defense: 0,
        speed: 0,
      },
      invulnerable: false,
    };

    // Inner Focus: +30% attack, +20% attack speed
    if (skill.id === 'inner_focus') {
      buffData.statModifiers.attackDamage = 0.30;
      buffData.statModifiers.attackSpeed = 0.20;
      buffData.statModifiers.speed = 0.15;
    }

    // Enlightenment: invulnerable
    if (skill.id === 'enlightenment') {
      buffData.invulnerable = true;
      buffData.statModifiers.defense = 999; // effectively invuln
    }

    // Apply buff via buff system (affects real stats)
    buffSystem.applyBuff(skill.id, buffData);

    // Visual feedback
    combatFX.createCastBurst(this.engine.px, this.engine.py, 'buff');
    combatFX.createBuffAura(this.engine.px, this.engine.py, skill.id, buffData.duration);

    // Store for UI tracking
    if (this.engine.gameState) {
      this.engine.gameState._activeBuffs = buffSystem.getVisibleBuffs();
    }

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
    const WORLD_WIDTH = 16 * 16 * 16;
    const WORLD_HEIGHT = 32 * 16 * 16;

    if (this.engine) {
      this.engine.px = Math.max(TILE_SIZE, Math.min(WORLD_WIDTH - TILE_SIZE, newX));
      this.engine.py = Math.max(TILE_SIZE, Math.min(WORLD_HEIGHT - TILE_SIZE, newY));
    }

    // Motion trail
    combatFX.createDashTrail(playerX, playerY, newX, newY, 0.25);

    // Damage enemies along dash path
    for (const enemy of this.engine.enemyManager.enemies) {
      if (enemy.dead) continue;

      // Check if enemy was in the dash path
      const edx = enemy.x - playerX, edy = enemy.y - playerY;
      const crossProduct = Math.abs(edx * dirY - edy * dirX);
      if (crossProduct > 40) continue;

      const hpBefore = enemy.hp;
      enemy.hp = Math.max(0, enemy.hp - dmg);
      enemy.hitFlash = 0.15;

      // Knockback from dash
      enemy.knockbackX = dirX * 50;
      enemy.knockbackY = dirY * 50;
      enemy.knockbackDuration = 0.2;

      // Impact visuals
      combatFX.createMeleeImpact(enemy.x, enemy.y, 1.2);

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

    // Impact burst at landing
    combatFX.createCastBurst(newX, newY, 'projectile');

    return hits;
  }
}

export default SkillExecutor;