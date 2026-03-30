import {
  TILE_SIZE, WORLD_COLS, WORLD_ROWS, WORLD_WIDTH, WORLD_HEIGHT,
  PLAYER_SPEED, FOG_RADIUS, getLevelTierColor, getLevelBracketColor, xpForLevel, getZoneAt
} from './constants.js';
import { registryManager } from './RegistryManager.js';
import { SpriteDebugRenderer } from './SpriteDebugRenderer.js';
// FOG_RADIUS is in screen pixels (used for fog draw + visibility culling of labels)
import { WorldGenerator, TILE_COLORS, TILE, OBJ } from './WorldGenerator.js';
import { EnemyManager } from './EnemyManager.js';
import { GatheringSystem, addResourcesToInventory } from './GatheringSystem.js';
import { TargetingSystem } from './TargetingSystem.js'; // v2
import { assetIntegration } from './AssetIntegration.js';
import { AssetPreloader } from './AssetPreloader.js';
import { equipmentRenderer } from './EquipmentRenderer.js';
import { skillFX } from './SkillFX.js';
import { getSkillByKey, calculateSkillDamage, canCastSkill } from './SkillSystem.js';
import { SkillExecutor } from './SkillExecutor.js';
import { combatFX } from './CombatFX.js';
import { buffSystem } from './BuffSystem.js';
import questManager from './QuestManager.js';
import { getNPCById } from './NPCRegistry.js';

export class GameEngine {
  constructor(canvas, gameState, onStateUpdate) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.gameState = gameState;
    this.onStateUpdate = onStateUpdate;

    // Initialize all registries at game start
    registryManager.initAll();
    const status = registryManager.getStatus();
    console.log('[GameEngine] Registry Status:', status);

    this.world = new WorldGenerator();
    this.enemyManager = new EnemyManager(this.world);
    this.gatheringSystem = new GatheringSystem(this.world);
    this.skillExecutor = new SkillExecutor(this);
    this.buffSystem = buffSystem;
    this.keys = {};
    this.running = false;
    this.lastTime = 0;
    this.animFrame = null;
    this.isPaused = false; // pause state for menu

    // Camera & zoom
    this.camX = 0;
    this.camY = 0;
    this.zoom = 1.6; // world pixels → screen pixels scale factor

    // Player position (world px) — Evergreen Hollow spawn (organic layout: col 185, row 390)
    this.px = 185 * TILE_SIZE;
    this.py = 390 * TILE_SIZE;

    // Click-to-move
    this.destination = null;
    this.clickIndicator = null;
    this.facingAngle = 0; // radians, 0 = right

    // Auto-attack target
    this.autoAttackTarget = null;
    this.autoAttackCooldown = 0;
    this.AUTO_ATTACK_SPEED = 1.0;  // seconds between auto attacks

    // Visual effects
    this.effects = [];
    this.damageNumbers = [];
    this.zoneLabel = null;
    this.currentZone = null;

    // Skill cooldowns (ms)
    this.cooldowns = { Q: 0, W: 0, E: 0, R: 0 };
    this.skillCooldownMax = { Q: 3000, W: 5000, E: 7000, R: 20000 };

    // Potion cooldowns (ms)
    this.potionCooldowns = { hp: 0, mp: 0 };
    this.POTION_CD = 30000;

    // NPC interaction & quests
    this.nearNPC = null;
    this.nearChest = null;
    this.nearNode = null;       // gathering node
    this.isGathering = false;   // currently holding F to gather
    this.questManager = questManager;

    // Targeting / aiming system
    this.targeting = new TargetingSystem();
    this._mouseScreen = { x: 0, y: 0 }; // raw screen position

    // Animation state tracking
    this.attackAnimationTimer = 0; // Duration of attack visual state
    this.ATTACK_ANIM_DURATION = 0.15; // seconds

    // Debug sprite renderer — disabled in normal gameplay; set debugSprites=true to re-enable
    this.debugRenderer = null; // new SpriteDebugRenderer(assetIntegration);

    this._bindKeys();
    this._resize();
  }

  _bindKeys() {
    this._onKeyDown = (e) => {
      const k = e.key.toLowerCase();

      // While aiming — same key again cancels; Escape also cancels
      if (this.targeting.active) {
        if (e.key === 'Escape' ||
            (k === 'q' && this.targeting.skillKey === 'Q') ||
            (k === 'w' && this.targeting.skillKey === 'W') ||
            (k === 'e' && this.targeting.skillKey === 'E') ||
            (k === 'r' && this.targeting.skillKey === 'R')) {
          this.targeting.cancel();
          return;
        }
        // Block other skill keys while aiming
        if (['q','w','e','r'].includes(k)) return;
      }

      // Skill keys — enter aiming mode (cancel auto-attack first)
      if (k === 'q') { this.autoAttackTarget = null; this._beginSkill('Q'); }
      if (k === 'w') { this.autoAttackTarget = null; this._beginSkill('W'); }
      if (k === 'e') { this.autoAttackTarget = null; this._beginSkill('E'); }
      if (k === 'r') { this.autoAttackTarget = null; this._beginSkill('R'); }
      if (k === '1') this._usePotion('hp');
      if (k === '2') this._usePotion('mp');
      if (k === 'f') {
        if (this.nearNode && !this.nearNPC && !this.nearChest) {
          this.gatheringSystem.startHarvest(this.nearNode.id);
          this.isGathering = true;
        } else {
          this._interact();
        }
      }
    };

    this._mouseHeld = false;

    this._onMouseDown = (e) => {
      if (e.target !== this.canvas) return;

      // Right click — cancel aiming
      if (e.button === 2) {
        if (this.targeting.active) this.targeting.cancel();
        return;
      }

      if (e.button !== 0) return;

      // Left click while aiming — confirm cast
      if (this.targeting.active) {
        this.targeting.confirm();
        return;
      }

      // Check if clicking on an enemy — if so, auto-attack
      const worldX = (e.clientX + this.camX) / this.zoom;
      const worldY = (e.clientY + this.camY) / this.zoom;
      const clickedEnemy = this._getEnemyAt(worldX, worldY);
      if (clickedEnemy) {
        this.autoAttackTarget = clickedEnemy;
        this.destination = null; // cancel move
        return;
      }

      // Normal movement — cancel auto-attack
      this.autoAttackTarget = null;
      this._mouseHeld = true;
      this._setDestFromEvent(e);
    };

    this._onMouseMove = (e) => {
      // Always track mouse position for targeting preview
      this._mouseScreen = { x: e.clientX, y: e.clientY };
      const worldX = (e.clientX + this.camX) / this.zoom;
      const worldY = (e.clientY + this.camY) / this.zoom;
      this.targeting.updateMouse(worldX, worldY);

      if (!this._mouseHeld) return;
      if (e.target !== this.canvas && e.buttons === 0) { this._mouseHeld = false; return; }
      this._setDestFromEvent(e);
    };

    this._onMouseUp = (e) => {
      if (e.button !== 0) return;
      this._mouseHeld = false;
    };

    this._onContextMenu = (e) => {
      // Prevent right-click context menu on canvas
      e.preventDefault();
    };

    this._setDestFromEvent = (e) => {
      // Convert screen coords → world coords accounting for zoom
      const worldX = (e.clientX + this.camX) / this.zoom;
      const worldY = (e.clientY + this.camY) / this.zoom;
      const col = Math.floor(worldX / TILE_SIZE);
      const row = Math.floor(worldY / TILE_SIZE);
      if (col < 0 || col >= WORLD_COLS || row < 0 || row >= WORLD_ROWS) return;
      this.destination = { x: worldX, y: worldY };
      this.clickIndicator = { x: worldX, y: worldY, life: 0.4, maxLife: 0.4 };
    };

    this._onKeyUp = (e) => {
      if (e.key.toLowerCase() === 'f') {
        this.isGathering = false;
        this.gatheringSystem.cancelHarvest();
      }
    };
    window.addEventListener('keydown', this._onKeyDown);
    window.addEventListener('keyup', this._onKeyUp);
    window.addEventListener('mouseup', this._onMouseUp);
    this.canvas.addEventListener('mousedown', this._onMouseDown);
    this.canvas.addEventListener('mousemove', this._onMouseMove);
    this.canvas.addEventListener('contextmenu', this._onContextMenu);
  }

  _resize() {
    this.canvas.width = window.innerWidth;
    this.canvas.height = window.innerHeight;
  }

  start() {
    this.running = true;
    this.lastTime = performance.now();
    this._loop();
  }

  stop() {
    this.running = false;
    if (this.animFrame) cancelAnimationFrame(this.animFrame);
    window.removeEventListener('keydown', this._onKeyDown);
    window.removeEventListener('keyup', this._onKeyUp);
    window.removeEventListener('mouseup', this._onMouseUp);
    this.canvas.removeEventListener('mousedown', this._onMouseDown);
    this.canvas.removeEventListener('mousemove', this._onMouseMove);
    this.canvas.removeEventListener('contextmenu', this._onContextMenu);
  }

  // Called on skill key press — validates then either enters aiming or instant-casts
  _beginSkill(key) {
    const gs = this.gameState;
    const classId = gs.classData?.id || 'warrior';
    
    // Get skill from new data-driven system
    const skill = getSkillByKey(classId, key);
    if (!skill) return;

    // Check cooldown
    if (this.cooldowns[key] > 0) {
      this.damageNumbers.push({ 
        x: this.px, y: this.py - 30, 
        text: `${(this.cooldowns[key] / 1000).toFixed(1)}s cooldown`, 
        color: '#aaaaaa', life: 1.0 
      });
      return;
    }

    // Check mana
    if (!canCastSkill(skill, gs)) {
      this.damageNumbers.push({ 
        x: this.px, y: this.py - 30, 
        text: `${skill.manaCost} mana needed!`, 
        color: '#ff6688', life: 1.5 
      });
      return;
    }

    // Try to start aiming based on castType
    const config = this._getTargetingConfig(skill);
    const entered = this.targeting.startAiming(key, classId, config);

    if (entered) {
      // For self_buff: execute immediately
      if (skill.castType === 'self_buff') {
        this._castSkill(skill, key, this.px, this.py);
        this.targeting.consume();
      }
      // For other types: wait for user to click
    } else {
      // Fallback: cast at self
      this._castSkill(skill, key, this.px, this.py);
    }
  }

  /**
   * Map skill castType to targeting config
   */
  _getTargetingConfig(skill) {
    switch (skill.castType) {
      case 'instant_melee':
        return { type: 'instant', range: skill.range };
      case 'projectile':
        return { type: 'line', range: skill.range };
      case 'ground_target_aoe':
        return { type: 'aoe', range: skill.range, radius: skill.areaRadius || 50 };
      case 'self_buff':
        return { type: 'self_aoe', range: 0 };
      case 'dash':
        return { type: 'line', range: skill.range };
      default:
        return { type: 'instant', range: skill.range };
    }
  }

  /**
   * Cast a skill at target location
   */
  _castSkill(skill, key, targetX, targetY) {
    const gs = this.gameState;
    
    // Validate mana
    if (gs.mp < skill.manaCost) return;

    // Execute skill via SkillExecutor
    const hits = this.skillExecutor.execute(
      skill, 
      this.px, this.py, 
      targetX, targetY, 
      gs.classData?.baseStats || {}, 
      gs.classData?.id || 'warrior'
    );

    // Show damage numbers for hits
    for (const hit of hits) {
      this.damageNumbers.push({
        x: hit.x + (Math.random() - 0.5) * 30,
        y: hit.y - 20,
        text: `-${hit.dmg}`,
        color: skill.castType === 'self_buff' ? '#88ff88' : '#ffffff',
        life: 1.2,
        big: hit.killed,
      });
      
      if (hit.killed) {
        this.damageNumbers.push({
          x: hit.x,
          y: hit.y - 40,
          text: 'SLAIN!',
          color: '#ffe74a',
          life: 1.5,
          big: false,
        });
        this._gainXP(hit.enemy.xp);
        gs.kills = (gs.kills || 0) + 1;
      }
    }

    // Consume mana and set cooldown
    gs.mp = Math.max(0, Math.min(gs.maxMp, gs.mp - skill.manaCost));
    this.cooldowns[key] = skill.cooldown * 1000; // Convert to ms
    this.attackAnimationTimer = this.ATTACK_ANIM_DURATION;

    // Feedback
    if (skill.manaCost > 0) {
      this.damageNumbers.push({
        x: this.px,
        y: this.py - 50,
        text: `-${skill.manaCost} MP`,
        color: '#4a9eff',
        life: 0.8,
      });
    }

    this.onStateUpdate({ ...gs });
  }

  _loop() {
    if (!this.running) return;
    const now = performance.now();
    const dt = Math.min((now - this.lastTime) / 1000, 0.05);
    this.lastTime = now;

    this._update(dt);
    this._draw(); // Synchronous - no await needed

    this.animFrame = requestAnimationFrame(() => this._loop());
  }

  _update(dt) {
     const gs = this.gameState;
     // If paused, skip all gameplay updates but keep state sync
     if (this.isPaused) {
       this.onStateUpdate({ ...gs });
       return;
     }
     const spd = PLAYER_SPEED * (gs.classData?.baseStats?.speed || 1.0) * dt;

    // Click-to-move
    let moved = false;
    if (this.destination) {
      const ddx = this.destination.x - this.px;
      const ddy = this.destination.y - this.py;
      const dist = Math.sqrt(ddx * ddx + ddy * ddy);

      if (dist < 4) {
        // Reached destination
        this.destination = null;
      } else {
        const nx = this.px + (ddx / dist) * spd;
        const ny = this.py + (ddy / dist) * spd;

        this.facingAngle = Math.atan2(ddy, ddx);

        // Try direct movement; if blocked try sliding along axes
        if (!this._isBlocked(nx, ny)) {
          this.px = nx;
          this.py = ny;
        } else if (!this._isBlocked(nx, this.py)) {
          this.px = nx;
          this.destination = { x: this.destination.x, y: this.py };
        } else if (!this._isBlocked(this.px, ny)) {
          this.py = ny;
          this.destination = { x: this.px, y: this.destination.y };
        } else {
          // Fully blocked — cancel destination
          this.destination = null;
        }
        moved = true;
      }
    }

    this.px = Math.max(TILE_SIZE, Math.min(WORLD_WIDTH - TILE_SIZE, this.px));
    this.py = Math.max(TILE_SIZE, Math.min(WORLD_HEIGHT - TILE_SIZE, this.py));

    // Click indicator lifetime
    if (this.clickIndicator) {
      this.clickIndicator.life -= dt;
      if (this.clickIndicator.life <= 0) this.clickIndicator = null;
    }

    // Camera — keep player centered with zoom applied
    const z = this.zoom;
    this.camX = this.px * z - this.canvas.width / 2;
    this.camY = this.py * z - this.canvas.height / 2;
    this.camX = Math.max(0, Math.min(WORLD_WIDTH * z - this.canvas.width, this.camX));
    this.camY = Math.max(0, Math.min(WORLD_HEIGHT * z - this.canvas.height, this.camY));

    // Zone detection
    const col = Math.floor(this.px / TILE_SIZE);
    const row = Math.floor(this.py / TILE_SIZE);
    const zone = getZoneAt(col, row);
    if (!this.currentZone || this.currentZone.id !== zone.id) {
      this.currentZone = zone;
      this.zoneLabel = { name: zone.name, timer: 3.0 };
    }

    // Attack animation state (for gear positioning)
    if (this.attackAnimationTimer > 0) {
      this.attackAnimationTimer -= dt;
    }

    // Cooldowns
    Object.keys(this.cooldowns).forEach(k => {
      if (this.cooldowns[k] > 0) this.cooldowns[k] = Math.max(0, this.cooldowns[k] - dt * 1000);
    });
    // Potion cooldowns
    if (this.potionCooldowns.hp > 0) this.potionCooldowns.hp = Math.max(0, this.potionCooldowns.hp - dt * 1000);
    if (this.potionCooldowns.mp > 0) this.potionCooldowns.mp = Math.max(0, this.potionCooldowns.mp - dt * 1000);

    // HP regen — ensure values stay clamped [0, max]
    if (gs.hp > 0 && gs.hp < gs.maxHp) {
      gs.hp = Math.max(0, Math.min(gs.maxHp, gs.hp + 2 * dt));
    }
    if (gs.mp < gs.maxMp) {
      gs.mp = Math.max(0, Math.min(gs.maxMp, gs.mp + 5 * dt));
    }

    // Effects - use sprite-based rendering with defensive filtering
    this.effects = this.effects.filter(e => {
      // Defensive: skip null/undefined effects
      if (!e || typeof e.life !== 'number') return false;
      e.life -= dt;
      return e.life > 0;
    });
    
    // Debug logging in dev mode (optional)
    if (gs?._debugEffects && this.effects.length > 0) {
      console.log(`[DEBUG] Active effects: ${this.effects.length}`);
    }

    // Update skill FX zones
    skillFX.update(dt);
    
    // Update combat effects
    combatFX.update(dt);
    
    // Update buff system
    buffSystem.update(dt);
    this.damageNumbers = this.damageNumbers.filter(d => {
      // Defensive: skip null/undefined damage numbers
      if (!d || typeof d.life !== 'number') return false;
      d.life -= dt;
      return d.life > 0;
    });

    // Zone label
    if (this.zoneLabel) {
      this.zoneLabel.timer -= dt;
      if (this.zoneLabel.timer <= 0) this.zoneLabel = null;
    }

    // NPC proximity
    this.nearNPC = null;
    this.nearChest = null;
    const playerCol = Math.floor(this.px / TILE_SIZE);
    const playerRow = Math.floor(this.py / TILE_SIZE);

    for (const npc of this.world.npcs) {
      const dist = Math.abs(npc.col - playerCol) + Math.abs(npc.row - playerRow);
      if (dist <= 2) { this.nearNPC = npc; break; }
    }

    for (const chest of this.world.chests) {
      if (chest.looted) continue;
      const dist = Math.abs(chest.col - playerCol) + Math.abs(chest.row - playerRow);
      if (dist <= 2) { this.nearChest = chest; break; }
    }

    // Gathering node proximity
    this.nearNode = this.gatheringSystem.getNearNode(this.px, this.py);
    // Cancel gathering if player moves away from node
    if (this.isGathering && !this.nearNode) {
      this.isGathering = false;
      this.gatheringSystem.cancelHarvest();
    }

    // Update gathering system
    const harvested = this.gatheringSystem.update(dt);
    if (harvested.length > 0) {
      this.isGathering = false;
      for (const { node, drops } of harvested) {
        gs.inventory = addResourcesToInventory(gs.inventory || [], drops);
        const label = drops.map(d => `${d.icon} ${d.name} x${d.qty}`).join(', ');
        this.damageNumbers.push({
          x: node.x, y: node.y - 20,
          text: `+${label}`,
          color: '#4caf50', life: 2.0, big: false,
        });
        
        // Update gather quests
        this.questManager.getActiveQuests().forEach(quest => {
          if (quest.objectiveType === 'gather' && quest.target === node.type) {
            drops.forEach(drop => {
              this.questManager.updateProgress(quest.id, drop.qty || 1);
            });
          }
        });
      }
    }

    // Update enemy knockback and reactions
    for (const e of this.enemyManager.enemies) {
      if (e.knockbackDuration && e.knockbackDuration > 0) {
        e.x += e.knockbackX * dt;
        e.y += e.knockbackY * dt;
        e.knockbackDuration -= dt;
        e.knockbackX *= 0.85; // friction
        e.knockbackY *= 0.85;
      }
    }

    // ── Auto-attack ──
    this._updateAutoAttack(dt);

    // ── Targeting confirmation ──
    if (this.targeting.confirmed || this.targeting.cancelled) {
      const key = this.targeting.skillKey;
      const classId = this.gameState.classData?.id || 'warrior';
      const skill = getSkillByKey(classId, key);
      const target = this.targeting.mouseWorld
        ? this.targeting.getTarget(this.px, this.py)
        : { x: this.px, y: this.py };
      const wasConfirmed = this.targeting.confirmed;
      this.targeting.consume(); // clears flags + active state if cancelled
      if (wasConfirmed && key && skill) {
        this._castSkill(skill, key, target.x, target.y);
      }
    }

    // ── Enemy AI & Combat ──
    const pushDmgNum = (x, y, text, color, big) => {
      this.damageNumbers.push({ x, y, text, color, life: 1.2, big: !!big });
    };
    const pushEff = (x, y, radius, life, color) => {
      this.effects.push({ x, y, radius, life, maxLife: life, color });
    };

    const enemyResult = this.enemyManager.update(dt, this.px, this.py, gs, pushDmgNum, pushEff);

    // Player takes damage from enemies (unless invulnerable from buff)
    if (enemyResult.playerDmgTotal > 0 && !buffSystem.isInvulnerable()) {
      const dmgBefore = gs.hp;
      gs.hp = Math.max(0, Math.min(gs.maxHp, gs.hp - enemyResult.playerDmgTotal));
      console.log(`[DAMAGE] Enemy hit: ${enemyResult.playerDmgTotal} | ${dmgBefore.toFixed(1)} → ${gs.hp.toFixed(1)} | Dead: ${gs.hp <= 0}`);
    } else if (buffSystem.isInvulnerable() && enemyResult.playerDmgTotal > 0) {
      combatFX.hit_flashes.push({
        id: `invuln_${Math.random()}`,
        x: this.px, y: this.py - 30,
        duration: 0.12,
        maxDuration: 0.12,
        intensity: 0.8,
      });
    }

    // XP from kills
    if (enemyResult.xpGained > 0) {
      this._gainXP(enemyResult.xpGained);
      gs.kills = (gs.kills || 0) + enemyResult.killCount;
      
      // Update kill quests
      for (const dead of enemyResult.deadEnemies || []) {
        this.questManager.getActiveQuests().forEach(quest => {
          if (quest.objectiveType === 'kill' && quest.target === dead.type) {
            this.questManager.updateProgress(quest.id);
          }
        });
      }
    }

    // Loot drops from kills
    if (enemyResult.lootDrops.length > 0) {
      const loot = enemyResult.lootDrops[0]; // show first loot item
      gs.inventory = [...(gs.inventory || []), ...enemyResult.lootDrops];
      gs.lootFound = loot;
    }

    // Player death check — ONLY trigger when hp <= 0
    if (gs.hp <= 0) {
      console.log(`[DEATH] Player defeated. Respawning with ${(gs.maxHp * 0.3).toFixed(1)} HP`);
      gs.hp = Math.max(0, Math.min(gs.maxHp, gs.maxHp * 0.3));
      this.px = 185 * TILE_SIZE;
      this.py = 390 * TILE_SIZE;
      this.destination = null;
      this.damageNumbers.push({ x: this.px, y: this.py - 40, text: 'DEFEATED! Respawning...', color: '#ff4444', life: 3.0, big: true });
    }

    // SAFETY CLAMP: ensure health values are always within [0, max]
    gs.hp = Math.max(0, Math.min(gs.maxHp, gs.hp));
    gs.mp = Math.max(0, Math.min(gs.maxMp, gs.mp));
    
    this.onStateUpdate({ ...gs, cooldowns: { ...this.cooldowns }, potionCooldowns: { ...this.potionCooldowns }, nearNPC: this.nearNPC, nearChest: this.nearChest, nearNode: this.nearNode, playerWorldX: this.px, playerWorldY: this.py });
  }

  // Find an enemy near a world-space click point
  _getEnemyAt(wx, wy) {
    for (const e of this.enemyManager.enemies) {
      if (e.dead) continue;
      const ddx = e.x - wx, ddy = e.y - wy;
      if (Math.sqrt(ddx * ddx + ddy * ddy) < 20) return e;
    }
    return null;
  }

  // Returns { attackRange, stopRange } in world-px based on class
  // attackRange = max distance to deal damage
  // stopRange   = distance at which the player stops approaching (slightly inside attackRange for buffer)
  _getAutoAttackRange() {
    const classId = this.gameState.classData?.id || 'warrior';
    // Check equipped weapon for potential range override
    const weapon = this.gameState.equipped?.weapon;
    
    // Apply buff attack speed bonus as range increase (slight)
    const buffMods = buffSystem.getAggregatedModifiers();
    const speedBonus = buffMods.attackSpeed || 0;
    
    switch (classId) {
      case 'archer': return { attackRange: 240 + speedBonus * 40, stopRange: 210 + speedBonus * 40 };
      case 'monk':   return { attackRange: 140 + speedBonus * 30, stopRange: 120 + speedBonus * 30 };
      case 'lancer': return { attackRange: 62 + speedBonus * 20,  stopRange: 54 + speedBonus * 20 };
      case 'warrior':
      default:       return { attackRange: 50 + speedBonus * 15,  stopRange: 44 + speedBonus * 15 };
    }
  }

  // Process auto-attack tick
  _updateAutoAttack(dt) {
    if (!this.autoAttackTarget) return;
    const e = this.autoAttackTarget;

    // Clear if dead or removed from enemies list
    if (e.dead || !this.enemyManager.enemies.includes(e)) {
      this.autoAttackTarget = null;
      return;
    }

    const dx = e.x - this.px, dy = e.y - this.py;
    const dist = Math.sqrt(dx * dx + dy * dy);
    const { attackRange, stopRange } = this._getAutoAttackRange();

    if (dist > stopRange) {
      // Move toward target — stop at stopRange, not all the way in
      const spd = PLAYER_SPEED * (this.gameState.classData?.baseStats?.speed || 1.0) * dt;
      // Only move the remaining distance needed to reach stopRange
      const moveNeeded = dist - stopRange;
      const step = Math.min(spd, moveNeeded);
      const nx = this.px + (dx / dist) * step;
      const ny = this.py + (dy / dist) * step;
      this.facingAngle = Math.atan2(dy, dx);
      if (!this._isBlocked(nx, ny)) { this.px = nx; this.py = ny; }
      else if (!this._isBlocked(nx, this.py)) { this.px = nx; }
      else if (!this._isBlocked(this.px, ny)) { this.py = ny; }
    } else if (dist <= attackRange) {
      // In range — stop movement and attack
      this.facingAngle = Math.atan2(dy, dx);
      this.destination = null;

      if (this.autoAttackCooldown <= 0) {
        const gs = this.gameState;
        const baseAtk = (gs.classData?.baseStats?.attack || 22) + (gs.equipStats?.attack || 0);
        const buffMods = buffSystem.getAggregatedModifiers();
        const atkWithBuff = baseAtk * (1 + buffMods.attackDamage);
        const dmg = Math.max(1, Math.floor(atkWithBuff * (0.25 + Math.random() * 0.1)) - Math.floor(e.def * 0.5));
        const hpBefore = e.hp;
        e.hp = Math.max(0, e.hp - dmg);
        e.hitFlash = 0.15;
        console.log(`[PLAYER_ATTACK] vs ${e.name}: ${dmg} dmg | ${hpBefore.toFixed(1)} → ${e.hp.toFixed(1)} | Dead: ${e.hp <= 0}`);
        this.damageNumbers.push({ x: e.x + (Math.random() - 0.5) * 20, y: e.y - 20, text: `-${dmg}`, color: '#ffffff', life: 1.0 });
        this.effects.push({ x: e.x, y: e.y, radius: 16, life: 0.25, maxLife: 0.25, color: gs.classData?.color || '#ffffff' });
        this.attackAnimationTimer = this.ATTACK_ANIM_DURATION; // Trigger attack gear animation
        if (e.hp <= 0) {
          e.dead = true;
          e.deathTimer = 0.6; // fade-out timer
          this.autoAttackTarget = null;
          this._gainXP(e.xp);
          this.gameState.kills = (this.gameState.kills || 0) + 1;
        }
        this.autoAttackCooldown = this.AUTO_ATTACK_SPEED;
      }
    }

    if (this.autoAttackCooldown > 0) this.autoAttackCooldown -= dt;
  }

  _isBlocked(wx, wy) {
    // Check 4 corners
    const margin = 12;
    const corners = [
      [wx - margin, wy - margin],
      [wx + margin, wy - margin],
      [wx - margin, wy + margin],
      [wx + margin, wy + margin],
    ];
    return corners.some(([cx, cy]) => {
      const col = Math.floor(cx / TILE_SIZE);
      const row = Math.floor(cy / TILE_SIZE);
      if (this.world.getTile(col, row) === TILE.WATER) return true;
      return this.world.isBlocked(col, row);
    });
  }



  _interact() {
    const gs = this.gameState;
    if (this.nearNPC) {
      this.onStateUpdate({ ...gs, dialogueNPC: this.nearNPC, dialogueIndex: 0 });
    } else if (this.nearChest) {
      this.nearChest.looted = true;
      const loot = this._generateLoot(gs.level);
      this.onStateUpdate({ ...gs, lootFound: loot, inventory: [...(gs.inventory || []), loot] });
    }
  }

  _generateLoot(level) {
    const classId = this.gameState?.classData?.id || 'warrior';
    const rarities = ['common', 'common', 'common', 'uncommon', 'uncommon', 'rare', 'epic'];
    const rarity   = rarities[Math.floor(Math.random() * rarities.length)];
    return this._buildClassLoot(classId, level, rarity);
  }

  // Class-aware loot builder (mirrors EnemyManager.buildLootItem for chest drops)
  _buildClassLoot(classId, level, rarity) {
    const PREFIXES   = ['Iron','Shadow','Frost','Divine','Ancient','Cursed','Radiant','Void','Storm','Ember'];
    const RARITY_MULT = { common:1, uncommon:1.5, rare:2.2, epic:3.5, legendary:6 };
    const CLASS_WEAPONS = {
      warrior: [
        { slot:'weapon', icon:'⚔️', names:['Sword','Blade','Longsword','Claymore'] },
        { slot:'shield', icon:'🛡️', names:['Shield','Buckler','Aegis','Bulwark'] },
      ],
      lancer:  [{ slot:'weapon', icon:'🗡️', names:['Spear','Lance','Pike','Glaive'] }],
      archer:  [{ slot:'weapon', icon:'🏹', names:['Bow','Longbow','Recurve','Greatbow'] }],
      monk:    [{ slot:'weapon', icon:'🪄', names:['Staff','Rod','Wand','Scepter'] }],
    };
    const ARMOR_SLOTS = ['helmet','chest','pants','gloves','boots'];
    const ARMOR_NAMES = {
      helmet:['Helm','Crown','Hood','Coif'], chest:['Plate','Hauberk','Cuirass','Chestpiece'],
      pants:['Greaves','Legguards','Chausses'], gloves:['Gauntlets','Grips','Vambraces'],
      boots:['Boots','Sabatons','Treads'],
    };
    const NEUTRAL = [
      { slot:'ring',    icon:'💍', names:['Ring','Band','Signet'],   stats:(l,m)=>({ attack:Math.floor((2+l)*m),  defense:Math.floor((1+l*0.5)*m) }) },
      { slot:'amulet',  icon:'📿', names:['Amulet','Pendant','Charm'], stats:(l,m)=>({ attack:Math.floor((1+l)*m),  defense:Math.floor((2+l)*m) }) },
      { slot:'trinket', icon:'🔮', names:['Orb','Gem','Shard'],       stats:(l,m)=>({ attack:Math.floor((3+l*1.2)*m), defense:0 }) },
    ];

    const prefix = PREFIXES[Math.floor(Math.random() * PREFIXES.length)];
    const mult   = RARITY_MULT[rarity] || 1;
    const rnd    = () => Math.floor(Math.random() * 1000);

    if (Math.random() < 0.70) {
      const weaponPool = CLASS_WEAPONS[classId] || CLASS_WEAPONS.warrior;
      if (Math.random() < 0.35) {
        const w = weaponPool[rnd() % weaponPool.length];
        const n = w.names[rnd() % w.names.length];
        const isShield = w.slot === 'shield';
        return { id:`loot_${Date.now()}_${Math.random()}`, name:`${prefix} ${n}`, slot:w.slot, rarity, icon:w.icon,
          weaponClass:classId, classRestriction:classId,
          stats:{ attack:isShield?0:Math.floor((4+level*2)*mult), defense:isShield?Math.floor((3+level*1.5)*mult):0 } };
      } else {
        const s = ARMOR_SLOTS[rnd() % ARMOR_SLOTS.length];
        const n = ARMOR_NAMES[s][rnd() % ARMOR_NAMES[s].length];
        return { id:`loot_${Date.now()}_${Math.random()}`, name:`${prefix} ${n}`, slot:s, rarity,
          icon:{helmet:'⛑️',chest:'🧥',pants:'👖',gloves:'🧤',boots:'👢'}[s],
          classRestriction:'all', stats:{ attack:0, defense:Math.floor((2+level)*mult) } };
      }
    } else {
      const nd = NEUTRAL[rnd() % NEUTRAL.length];
      const n  = nd.names[rnd() % nd.names.length];
      return { id:`loot_${Date.now()}_${Math.random()}`, name:`${prefix} ${n}`, slot:nd.slot, rarity,
        icon:nd.icon, classRestriction:'all', stats:nd.stats(level, mult) };
    }
  }

  _usePotion(type) {
    const gs = this.gameState;
    if (this.potionCooldowns[type] > 0) {
      this.damageNumbers.push({ x: this.px, y: this.py - 30, text: `${Math.ceil(this.potionCooldowns[type] / 1000)}s`, color: type === 'hp' ? '#ff4444' : '#4a9eff', life: 1.0 });
      return;
    }
    if (type === 'hp') {
      const restore = Math.floor(gs.maxHp * 0.35);
      const hpBefore = gs.hp;
      gs.hp = Math.max(0, Math.min(gs.maxHp, gs.hp + restore));
      console.log(`[HEAL] HP Potion: +${restore} | ${hpBefore.toFixed(1)} → ${gs.hp.toFixed(1)}`);
      this.damageNumbers.push({ x: this.px, y: this.py - 40, text: `+${restore} HP`, color: '#ff4444', life: 1.5, big: false });
    } else {
      const restore = Math.floor(gs.maxMp * 0.50);
      const mpBefore = gs.mp;
      gs.mp = Math.max(0, Math.min(gs.maxMp, gs.mp + restore));
      console.log(`[HEAL] MP Potion: +${restore} | ${mpBefore.toFixed(1)} → ${gs.mp.toFixed(1)}`);
      this.damageNumbers.push({ x: this.px, y: this.py - 40, text: `+${restore} MP`, color: '#4a9eff', life: 1.5, big: false });
    }
    this.potionCooldowns[type] = this.POTION_CD;
    this.onStateUpdate({ ...gs });
  }

  _gainXP(amount) {
    const gs = this.gameState;
    gs.xp += amount;
    const needed = xpForLevel(gs.level);
    if (gs.xp >= needed && gs.level < 60) {
      gs.xp -= needed;
      gs.level += 1;
      gs.skillPoints = (gs.skillPoints || 0) + 1;
      gs.maxHp = (gs.classData?.baseStats?.hp || 200) + gs.level * 15;
      gs.maxMp = (gs.classData?.baseStats?.mp || 100) + gs.level * 8;
      gs.hp = gs.maxHp;
      gs.mp = gs.maxMp;
      this.damageNumbers.push({ x: this.px, y: this.py - 50, text: `LEVEL ${gs.level}!`, color: '#ffe74a', life: 2.5, big: true });
    }
  }

  _draw() {
    const ctx = this.ctx;
    const W = this.canvas.width;
    const H = this.canvas.height;
    const z = this.zoom;
    // World-space camera offset (in world pixels) used by zoomed draw methods
    const wcamX = this.camX / z;
    const wcamY = this.camY / z;

    ctx.clearRect(0, 0, W, H);

    // Apply zoom — all world drawing uses scaled coordinates
    ctx.save();
    ctx.scale(z, z);

    // LAYER 1: TERRAIN (BACKGROUND)
    this._drawWorld(ctx, W, H, wcamX, wcamY);
    this._drawObjects(ctx, wcamX, wcamY);

    // LAYER 2: ENVIRONMENTAL EFFECTS
    this._drawEffects(ctx, wcamX, wcamY);
    skillFX.draw(ctx, wcamX, wcamY, z);
    combatFX.draw(ctx, wcamX, wcamY, z);
    this.gatheringSystem.draw(ctx, wcamX, wcamY);

    // LAYER 3: ACTORS (MUST BE LAST IN WORLD SPACE)
    // Draw targeting preview first (behind actors)
    if (this.targeting.active && this.targeting.config?.type !== 'self_aoe') {
      this.targeting.draw(ctx, W / z / 2, H / z / 2, wcamX, wcamY, z);
    }

    // Draw NPCs (pass player screen pos for fog visibility check)
    this._drawNPCs(ctx, wcamX, wcamY, W / z / 2, H / z / 2);

    // Draw enemies (ctx is already scaled by z, pass world-space cam + player screen pos for fog check)
    this.enemyManager.draw(ctx, wcamX, wcamY, W / z / 2, H / z / 2, FOG_RADIUS / this.zoom);

    // Draw player (always screen-center in world-space)
    this._drawPlayer(ctx, W / z, H / z, wcamX, wcamY);

    // Draw self-aoe preview around player (also world-space)
    if (this.targeting.active && this.targeting.config?.type === 'self_aoe') {
      this.targeting.drawSelfAoe(ctx, W / z / 2, H / z / 2);
    }

    ctx.restore(); // end zoom transform — RETURN TO SCREEN SPACE

    // LAYER 4: SCREEN-SPACE OVERLAYS (AFTER ALL WORLD DRAWING)
    
    // Debug test sprites (fixed screen position, no camera)
    if (this.debugRenderer) {
      this.debugRenderer.drawTestSpritesCentered(ctx, W, H);
    }

    // Fog of war — drawn in screen space on top
    this._drawFog(ctx, W, H);

    // Damage numbers — screen space
    this._drawDamageNumbers(ctx, wcamX, wcamY, z);

    // Zone tint
    this._drawZoneTint(ctx, W, H);

    // Zone label
    if (this.zoneLabel) this._drawZoneLabel(ctx, W, H);

    // Click indicator
    if (this.clickIndicator) this._drawClickIndicator(ctx, wcamX, wcamY, z);

    // Interact prompt
    if (this.nearNPC || this.nearChest || this.nearNode) this._drawInteractPrompt(ctx, W, H);
  }

  _drawWorld(ctx, W, H, wcamX, wcamY) {
    const visW = W / this.zoom;
    const visH = H / this.zoom;
    const startCol = Math.max(0, Math.floor(wcamX / TILE_SIZE));
    const endCol   = Math.min(WORLD_COLS, Math.ceil((wcamX + visW) / TILE_SIZE) + 1);
    const startRow = Math.max(0, Math.floor(wcamY / TILE_SIZE));
    const endRow   = Math.min(WORLD_ROWS, Math.ceil((wcamY + visH) / TILE_SIZE) + 1);

    for (let row = startRow; row < endRow; row++) {
      for (let col = startCol; col < endCol; col++) {
        const tile = this.world.getTile(col, row);
        const config = TILE_COLORS[tile] || TILE_COLORS[0];
        const sx = col * TILE_SIZE - wcamX;
        const sy = row * TILE_SIZE - wcamY;
        ctx.fillStyle = config.fill;
        ctx.fillRect(sx, sy, TILE_SIZE, TILE_SIZE);
      }
    }
  }

  _drawObjects(ctx, wcamX, wcamY) {
    const visW = this.canvas.width / this.zoom;
    const visH = this.canvas.height / this.zoom;
    const startCol = Math.max(0, Math.floor(wcamX / TILE_SIZE));
    const endCol   = Math.min(WORLD_COLS, Math.ceil((wcamX + visW) / TILE_SIZE) + 1);
    const startRow = Math.max(0, Math.floor(wcamY / TILE_SIZE));
    const endRow   = Math.min(WORLD_ROWS, Math.ceil((wcamY + visH) / TILE_SIZE) + 1);

    for (let row = startRow; row < endRow; row++) {
      for (let col = startCol; col < endCol; col++) {
        const obj = this.world.getObj(col, row);
        if (obj === OBJ.NONE) continue;
        const sx = col * TILE_SIZE - wcamX + TILE_SIZE / 2;
        const sy = row * TILE_SIZE - wcamY + TILE_SIZE / 2;
        this._drawObject(ctx, obj, sx, sy, col, row);
      }
    }
  }

  _drawObject(ctx, type, cx, cy, col, row) {
    ctx.save();
    
    // Map object types to terrain sprite categories
    const spriteMap = {
      [OBJ.TREE]: { category: 'trees', type: 'tree1' },
      [OBJ.PINE]: { category: 'trees', type: 'tree2' },
      [OBJ.ROCK]: { category: 'rocks', type: 'rock1' },
      [OBJ.BOULDER]: { category: 'rocks', type: 'rock2' },
      [OBJ.RUIN]: { category: 'ruins', type: 'ruin1' },
      [OBJ.CRYSTAL]: { category: 'crystals', type: 'crystal1' },
      [OBJ.CHEST]: { category: 'chest', type: 'chest' }
    };

    const spriteInfo = spriteMap[type];
    if (spriteInfo && assetIntegration) {
      // Try to draw sprite from registry
      assetIntegration.drawTerrainSprite(ctx, spriteInfo.category, spriteInfo.type, cx, cy).catch(() => {
        // Fallback to placeholder shapes if sprite fails
        this._drawObjectFallback(ctx, type, cx, cy, col, row);
      });
    } else {
      // No sprite mapping - use fallback
      this._drawObjectFallback(ctx, type, cx, cy, col, row);
    }

    ctx.restore();
  }

  _drawObjectFallback(ctx, type, cx, cy, col, row) {
    // Placeholder shapes for objects without sprites
    switch (type) {
      case OBJ.TREE:
        ctx.fillStyle = '#1a5c0a';
        ctx.beginPath();
        ctx.arc(cx, cy - 6, 12, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#5c3a1e';
        ctx.fillRect(cx - 2, cy + 2, 4, 8);
        break;
      case OBJ.ROCK:
        ctx.fillStyle = '#555';
        ctx.beginPath();
        ctx.ellipse(cx, cy, 9, 7, 0.3, 0, Math.PI * 2);
        ctx.fill();
        break;
      case OBJ.CHEST:
        const chest = this.world.chests.find(c => c.col === col && c.row === row);
        ctx.fillStyle = chest?.looted ? '#444' : '#8b6914';
        ctx.fillRect(cx - 8, cy - 4, 16, 12);
        if (!chest?.looted) {
          ctx.fillStyle = '#ffd700';
          ctx.fillRect(cx - 2, cy - 1, 4, 4);
        }
        break;
      default:
        ctx.fillStyle = 'rgba(100,100,100,0.5)';
        ctx.fillRect(cx - 6, cy - 6, 12, 12);
        break;
    }
  }

  _drawNPCs(ctx, wcamX, wcamY, playerSX, playerSY) {
    const fogRadiusWorld = FOG_RADIUS / this.zoom;
    for (const npc of this.world.npcs) {
      const sx = npc.col * TILE_SIZE - wcamX + TILE_SIZE / 2;
      const sy = npc.row * TILE_SIZE - wcamY + TILE_SIZE / 2;

      const distFromPlayer = Math.sqrt((sx - playerSX) ** 2 + (sy - playerSY) ** 2);
      const visAlpha = Math.max(0, Math.min(1, 1 - (distFromPlayer - fogRadiusWorld * 0.7) / (fogRadiusWorld * 0.3)));

      // Draw NPC using Avatars_01.png (first frame, properly cropped)
      const spriteDrawn = assetIntegration.drawNPCSpriteSync(ctx, sx, sy);

      // Fallback: simple humanoid placeholder if sprite not cached yet
      if (!spriteDrawn) {
        ctx.fillStyle = '#c8a060';
        ctx.beginPath();
        ctx.arc(sx, sy - 4, 8, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#6a3a1a';
        ctx.fillRect(sx - 6, sy + 2, 12, 10);
      }

      // Labels — only when inside vision
      if (visAlpha > 0) {
        ctx.save();
        ctx.globalAlpha = visAlpha;
        ctx.font = 'bold 10px Cinzel, serif';
        ctx.fillStyle = '#ffe88a';
        ctx.textAlign = 'center';
        ctx.fillText(npc.name, sx, sy - 20);
        ctx.restore();
      }
    }
  }

  _drawPlayer(ctx, W, H, wcamX, wcamY) {
    const gs = this.gameState;
    const px = W / 2;
    const py = H / 2;
    const tier = getLevelTierColor(gs.level);

    // Shadow
    ctx.fillStyle = 'rgba(0,0,0,0.4)';
    ctx.beginPath();
    ctx.ellipse(px, py + 16, 14, 6, 0, 0, Math.PI * 2);
    ctx.fill();

    // Get animation state and facing direction
    const classId = (gs.classData?.id || 'warrior').toLowerCase();
    // Use level-bracket color for visual progression
    const color = getLevelBracketColor(gs.level);
    // Determine animation state: attack takes priority, then movement, else idle
    let animState = 'idle';
    if (this.attackAnimationTimer > 0) {
      animState = 'attack';
    } else if (this.destination) {
      animState = 'move';
    }
    const facingAngle = this.facingAngle; // Already in radians from movement

    // ─── Layered draw order ───────────────────────────────────────────
    // 1. Back accessories (capes, etc.) - synchronous (equipment renderer handles its own drawing)
    try {
      equipmentRenderer.drawEquipmentLayer(ctx, px, py, gs.equipped, classId, animState, 'back', facingAngle);
    } catch (err) {}

    // 2. Base character sprite - synchronous (with proper animation state)
    const spriteDrawn = assetIntegration.drawPlayerSpriteSync(ctx, classId, px, py, color, animState);
    if (!spriteDrawn) {
      // Fallback: simple rectangle placeholder
      ctx.fillStyle = gs.classData?.color || '#888';
      ctx.fillRect(px - 10, py - 20, 20, 28);
    }

    // 3. Chest armor - synchronous
    try {
      equipmentRenderer.drawEquipmentLayer(ctx, px, py, gs.equipped, classId, animState, 'chest', facingAngle);
    } catch (err) {}

    // 4. Helmet - synchronous
    try {
      equipmentRenderer.drawEquipmentLayer(ctx, px, py, gs.equipped, classId, animState, 'helmet', facingAngle);
    } catch (err) {}

    // 5. Held weapon / front accessories (drawn on top for readability) - synchronous
    try {
      equipmentRenderer.drawEquipmentLayer(ctx, px, py, gs.equipped, classId, animState, 'weapon', facingAngle);
    } catch (err) {}

    // Nameplate
    ctx.font = 'bold 11px Cinzel, serif';
    ctx.textAlign = 'center';
    ctx.fillStyle = tier.color;
    ctx.fillText(gs.playerName || 'Hero', px, py - 32);

    // Level badge
    ctx.font = 'bold 9px Cinzel, serif';
    ctx.fillStyle = tier.color;
    ctx.beginPath();
    ctx.arc(px + 14, py - 28, 8, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#000';
    ctx.fillText(gs.level, px + 14, py - 25);
  }

  _drawEffects(ctx, wcamX, wcamY) {
    for (const e of this.effects) {
      // Defensive: skip invalid effects
      if (!e || !e.life || !e.maxLife || !e.x || !e.y) continue;
      const alpha = e.life / e.maxLife;
      const screenX = (e.x - wcamX) * this.zoom;
      const screenY = (e.y - wcamY) * this.zoom;
      
      // Use sprite-based effects from registry
      if (e.type === 'explosion' || e.type === 'death') {
        assetIntegration.drawEffect(ctx, 'explosion', screenX, screenY, e.radius / 30, alpha);
      } else if (e.type === 'fire' || e.type === 'magic') {
        assetIntegration.drawEffect(ctx, 'fire', screenX, screenY, e.radius / 25, alpha);
      } else if (e.type === 'dust' || e.type === 'movement') {
        assetIntegration.drawEffect(ctx, 'dust1', screenX, screenY, e.radius / 20, alpha * 0.6);
      } else {
        // Fallback: glow ring for unknown effect types
        ctx.save();
        ctx.globalAlpha = alpha * 0.6;
        ctx.strokeStyle = e.color || '#fff';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(screenX, screenY, e.radius * (1 - alpha + 0.3), 0, Math.PI * 2);
        ctx.stroke();
        ctx.restore();
      }
    }
  }

  _drawFog(ctx, W, H) {
    const px = W / 2;
    const py = H / 2;
    const radius = FOG_RADIUS;
    const zone = this.currentZone;
    const fogColor = zone?.fogColor || 'rgba(0,0,0,0.93)';

    // Use an offscreen canvas so destination-out only affects the fog layer,
    // not the world already drawn on the main canvas.
    if (!this._fogCanvas || this._fogCanvas.width !== W || this._fogCanvas.height !== H) {
      this._fogCanvas = document.createElement('canvas');
      this._fogCanvas.width = W;
      this._fogCanvas.height = H;
    }
    const fc = this._fogCanvas;
    const fctx = fc.getContext('2d');
    fctx.clearRect(0, 0, W, H);

    // Fill the whole offscreen canvas with fog
    fctx.fillStyle = fogColor;
    fctx.fillRect(0, 0, W, H);

    // Punch a soft transparent circle where the player can see
    fctx.globalCompositeOperation = 'destination-out';
    const grad = fctx.createRadialGradient(px, py, 0, px, py, radius);
    grad.addColorStop(0,    'rgba(0,0,0,1)');    // fully clear at center
    grad.addColorStop(0.55, 'rgba(0,0,0,1)');    // stays clear well into vision
    grad.addColorStop(0.72, 'rgba(0,0,0,0.88)'); // begin soft fade
    grad.addColorStop(0.84, 'rgba(0,0,0,0.55)'); // mid fade
    grad.addColorStop(0.93, 'rgba(0,0,0,0.18)'); // nearly fog
    grad.addColorStop(1,    'rgba(0,0,0,0)');     // fog fully returns at edge
    fctx.fillStyle = grad;
    fctx.fillRect(0, 0, W, H);
    fctx.globalCompositeOperation = 'source-over';

    // Composite the fog layer on top of the main canvas
    ctx.drawImage(fc, 0, 0);
  }

  _drawZoneTint(ctx, W, H) {
    const zone = this.currentZone;
    if (!zone) return;
    ctx.save();
    ctx.globalCompositeOperation = 'multiply';
    ctx.fillStyle = zone.color;
    ctx.fillRect(0, 0, W, H);
    ctx.restore();
  }

  _drawDamageNumbers(ctx, wcamX, wcamY, z) {
    for (const d of this.damageNumbers) {
      const sx = (d.x - wcamX) * z;
      const sy = (d.y - wcamY) * z - (1 - d.life) * 40;
      ctx.save();
      ctx.globalAlpha = d.life;
      ctx.font = `${d.big ? 'bold 20px' : 'bold 14px'} Cinzel, serif`;
      ctx.fillStyle = d.color;
      ctx.textAlign = 'center';
      ctx.shadowColor = '#000';
      ctx.shadowBlur = 4;
      ctx.fillText(d.text, sx, sy);
      ctx.restore();
    }
  }

  _drawZoneLabel(ctx, W, H) {
    const alpha = Math.min(1, this.zoneLabel.timer, (3 - this.zoneLabel.timer) * 3);
    ctx.save();
    ctx.globalAlpha = alpha;
    ctx.font = 'bold 28px Cinzel, serif';
    ctx.fillStyle = '#ffe88a';
    ctx.textAlign = 'center';
    ctx.shadowColor = '#000';
    ctx.shadowBlur = 8;
    ctx.fillText(this.zoneLabel.name, W / 2, H * 0.18);
    ctx.restore();
  }

  _drawClickIndicator(ctx, wcamX, wcamY, z) {
    const ci = this.clickIndicator;
    const sx = (ci.x - wcamX) * z;
    const sy = (ci.y - wcamY) * z;
    const alpha = ci.life / ci.maxLife;
    
    // Use dust effect as ground marker
    assetIntegration.drawEffect(ctx, 'dust2', sx, sy, 1.2, alpha * 0.8);
    
    // Subtle fade ring for polish
    ctx.save();
    ctx.globalAlpha = alpha * 0.4;
    ctx.strokeStyle = '#ffe88a';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.arc(sx, sy, 14, 0, Math.PI * 2);
    ctx.stroke();
    ctx.restore();
  }

  _drawInteractPrompt(ctx, W, H) {
    let label;
    if (this.nearNPC) label = `[F] Talk to ${this.nearNPC.name}`;
    else if (this.nearChest) label = '[F] Open Chest';
    else if (this.nearNode) {
      const nodeLabels = { tree: '[Hold F] Chop Tree 🪵', rock: '[Hold F] Mine Rock 🪨', sheep: '[Hold F] Gather Sheep 🐑' };
      label = nodeLabels[this.nearNode.type] || '[Hold F] Gather';
    }
    ctx.save();
    ctx.fillStyle = 'rgba(0,0,0,0.7)';
    ctx.beginPath();
    ctx.roundRect(W / 2 - 110, H * 0.62 - 18, 220, 30, 6);
    ctx.fill();
    ctx.font = '13px Cinzel, serif';
    ctx.fillStyle = '#ffe88a';
    ctx.textAlign = 'center';
    ctx.fillText(label, W / 2, H * 0.62 + 4);
    ctx.restore();
  }
}