import {
  TILE_SIZE, WORLD_COLS, WORLD_ROWS, WORLD_WIDTH, WORLD_HEIGHT,
  PLAYER_SPEED, FOG_RADIUS, getLevelTierColor, xpForLevel, getZoneAt
} from './constants.js';
import { WorldGenerator, TILE_COLORS, TILE, OBJ } from './WorldGenerator.js';

export class GameEngine {
  constructor(canvas, gameState, onStateUpdate) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.gameState = gameState;
    this.onStateUpdate = onStateUpdate;

    this.world = new WorldGenerator();
    this.keys = {};
    this.running = false;
    this.lastTime = 0;
    this.animFrame = null;

    // Camera
    this.camX = 0;
    this.camY = 0;

    // Player position (world px)
    this.px = 40 * TILE_SIZE;
    this.py = 40 * TILE_SIZE;

    // Visual effects
    this.effects = [];
    this.damageNumbers = [];
    this.zoneLabel = null;
    this.currentZone = null;

    // Skill cooldowns (ms)
    this.cooldowns = { Q: 0, W: 0, E: 0, R: 0 };
    this.skillCooldownMax = { Q: 3000, W: 5000, E: 7000, R: 20000 };

    // NPC interaction
    this.nearNPC = null;
    this.nearChest = null;

    this._bindKeys();
    this._resize();
  }

  _bindKeys() {
    this._onKeyDown = (e) => {
      const k = e.key.toLowerCase();
      this.keys[k] = true;

      // Skill keys
      if (k === 'q') this._useSkill('Q');
      if (k === 'w') this._useSkill('W');
      if (k === 'e') this._useSkill('E');
      if (k === 'r') this._useSkill('R');
      if (k === 'f') this._interact();

      e.preventDefault();
    };
    this._onKeyUp = (e) => {
      this.keys[e.key.toLowerCase()] = false;
    };
    window.addEventListener('keydown', this._onKeyDown);
    window.addEventListener('keyup', this._onKeyUp);
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
  }

  _loop() {
    if (!this.running) return;
    const now = performance.now();
    const dt = Math.min((now - this.lastTime) / 1000, 0.05);
    this.lastTime = now;

    this._update(dt);
    this._draw();

    this.animFrame = requestAnimationFrame(() => this._loop());
  }

  _update(dt) {
    const gs = this.gameState;
    const spd = PLAYER_SPEED * (gs.classData?.baseStats?.speed || 1.0) * dt;

    // Movement
    let dx = 0, dy = 0;
    if (this.keys['a'] || this.keys['arrowleft'])  dx -= 1;
    if (this.keys['d'] || this.keys['arrowright']) dx += 1;
    if (this.keys['w'] || this.keys['arrowup'])    dy -= 1;
    if (this.keys['s'] || this.keys['arrowdown'])  dy += 1;

    if (dx !== 0 && dy !== 0) { dx *= 0.707; dy *= 0.707; }

    const nx = this.px + dx * spd;
    const ny = this.py + dy * spd;

    // Collision
    if (!this._isBlocked(nx, this.py)) this.px = nx;
    if (!this._isBlocked(this.px, ny)) this.py = ny;

    this.px = Math.max(TILE_SIZE, Math.min(WORLD_WIDTH - TILE_SIZE, this.px));
    this.py = Math.max(TILE_SIZE, Math.min(WORLD_HEIGHT - TILE_SIZE, this.py));

    // Camera
    this.camX = this.px - this.canvas.width / 2;
    this.camY = this.py - this.canvas.height / 2;
    this.camX = Math.max(0, Math.min(WORLD_WIDTH - this.canvas.width, this.camX));
    this.camY = Math.max(0, Math.min(WORLD_HEIGHT - this.canvas.height, this.camY));

    // Zone detection
    const col = Math.floor(this.px / TILE_SIZE);
    const row = Math.floor(this.py / TILE_SIZE);
    const zone = getZoneAt(col, row);
    if (!this.currentZone || this.currentZone.id !== zone.id) {
      this.currentZone = zone;
      this.zoneLabel = { name: zone.name, timer: 3.0 };
    }

    // Cooldowns
    Object.keys(this.cooldowns).forEach(k => {
      if (this.cooldowns[k] > 0) this.cooldowns[k] = Math.max(0, this.cooldowns[k] - dt * 1000);
    });

    // HP regen
    if (gs.hp < gs.maxHp) {
      gs.hp = Math.min(gs.maxHp, gs.hp + 2 * dt);
    }
    if (gs.mp < gs.maxMp) {
      gs.mp = Math.min(gs.maxMp, gs.mp + 5 * dt);
    }

    // Effects
    this.effects = this.effects.filter(e => {
      e.life -= dt;
      return e.life > 0;
    });
    this.damageNumbers = this.damageNumbers.filter(d => {
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

    // XP gain from moving (demo — replace with combat)
    if ((dx !== 0 || dy !== 0) && Math.random() < 0.002) {
      this._gainXP(Math.floor(5 + gs.level * 2));
    }

    this.onStateUpdate({ ...gs, cooldowns: { ...this.cooldowns }, nearNPC: this.nearNPC, nearChest: this.nearChest });
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

  _useSkill(key) {
    const gs = this.gameState;
    if (this.cooldowns[key] > 0) return;
    if (key === 'R' && gs.level < 6) {
      this.onStateUpdate({ ...gs, floatingMsg: 'Unlock R at Level 6!' });
      return;
    }

    const abilities = gs.classData?.abilities || [];
    const keyMap = { Q: 0, W: 1, E: 2, R: 3 };
    const ability = abilities[keyMap[key]];
    if (!ability) return;

    const cost = ability.mpCost || 0;
    if (gs.mp < cost) {
      this.damageNumbers.push({ x: this.px, y: this.py - 30, text: 'No MP!', color: '#4a9eff', life: 1.5 });
      return;
    }

    gs.mp -= cost;

    // Damage calc
    const lvlBonus = 1 + (gs.skillLevels?.[key] || 0) * 0.3;
    const atk = (gs.classData?.baseStats?.attack || 20) + (gs.equipStats?.attack || 0);
    let dmg = 0;

    if (ability.type === 'single') dmg = Math.floor((atk * (1.2 + Math.random() * 0.4)) * lvlBonus);
    if (ability.type === 'aoe') dmg = Math.floor((atk * (0.8 + Math.random() * 0.3)) * lvlBonus);
    if (ability.type === 'utility') dmg = 0;
    if (ability.type === 'ultimate') dmg = Math.floor((atk * (2.5 + Math.random() * 0.5)) * lvlBonus);

    // Effects
    const angle = Math.random() * Math.PI * 2;
    const range = ability.type === 'aoe' ? 120 : (ability.type === 'ultimate' ? 150 : 80);

    if (ability.type === 'aoe' || ability.type === 'ultimate') {
      for (let i = 0; i < (ability.type === 'ultimate' ? 8 : 5); i++) {
        const a = (i / (ability.type === 'ultimate' ? 8 : 5)) * Math.PI * 2;
        this.effects.push({
          x: this.px + Math.cos(a) * range * 0.6,
          y: this.py + Math.sin(a) * range * 0.6,
          radius: 20,
          life: 0.4,
          maxLife: 0.4,
          color: gs.classData.color,
        });
      }
    }

    this.effects.push({
      x: this.px + Math.cos(angle) * range,
      y: this.py + Math.sin(angle) * range,
      radius: ability.type === 'aoe' ? 50 : 25,
      life: 0.5,
      maxLife: 0.5,
      color: gs.classData?.color || '#ffffff',
    });

    if (dmg > 0) {
      this.damageNumbers.push({
        x: this.px + (Math.random() - 0.5) * 60,
        y: this.py - 20,
        text: `-${dmg}`,
        color: ability.type === 'ultimate' ? '#ff9800' : '#ffffff',
        life: 1.2,
        big: ability.type === 'ultimate',
      });
      this._gainXP(Math.floor(dmg * 0.5));
    }

    if (ability.type === 'utility') {
      this.damageNumbers.push({ x: this.px, y: this.py - 30, text: ability.name + '!', color: '#4caf50', life: 1.0 });
    }

    this.cooldowns[key] = this.skillCooldownMax[key];
    this.onStateUpdate({ ...gs });
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
    const rarities = ['common', 'common', 'common', 'uncommon', 'uncommon', 'rare', 'epic'];
    const slots = ['helmet', 'chest', 'pants', 'gloves', 'boots', 'weapon'];
    const slot = slots[Math.floor(Math.random() * slots.length)];
    const rarity = rarities[Math.floor(Math.random() * rarities.length)];
    const names = { helmet: 'Helm', chest: 'Chestplate', pants: 'Greaves', gloves: 'Gauntlets', boots: 'Boots', weapon: 'Blade' };
    const prefixes = ['Iron', 'Shadow', 'Frost', 'Divine', 'Ancient', 'Cursed', 'Radiant'];
    const prefix = prefixes[Math.floor(Math.random() * prefixes.length)];
    const icons = { helmet: '⛑️', chest: '🧥', pants: '👖', gloves: '🧤', boots: '👢', weapon: '⚔️' };
    return {
      id: `loot_${Date.now()}`,
      name: `${prefix} ${names[slot]}`,
      slot,
      rarity,
      icon: icons[slot],
      stats: {
        attack: slot === 'weapon' ? Math.floor((5 + level * 2) * (rarity === 'epic' ? 2 : rarity === 'rare' ? 1.5 : 1)) : 0,
        defense: slot !== 'weapon' ? Math.floor((3 + level) * (rarity === 'epic' ? 2 : rarity === 'rare' ? 1.5 : 1)) : 0,
      },
    };
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

    ctx.clearRect(0, 0, W, H);

    // Draw tiles
    this._drawWorld(ctx, W, H);

    // Draw objects
    this._drawObjects(ctx);

    // Draw NPCs
    this._drawNPCs(ctx);

    // Draw effects
    this._drawEffects(ctx);

    // Draw player
    this._drawPlayer(ctx, W, H);

    // Fog of war
    this._drawFog(ctx, W, H);

    // Damage numbers
    this._drawDamageNumbers(ctx);

    // Zone tint overlay
    this._drawZoneTint(ctx, W, H);

    // Zone label
    if (this.zoneLabel) {
      this._drawZoneLabel(ctx, W, H);
    }

    // Interact prompt
    if (this.nearNPC || this.nearChest) {
      this._drawInteractPrompt(ctx, W, H);
    }
  }

  _drawWorld(ctx, W, H) {
    const startCol = Math.max(0, Math.floor(this.camX / TILE_SIZE));
    const endCol   = Math.min(WORLD_COLS, Math.ceil((this.camX + W) / TILE_SIZE) + 1);
    const startRow = Math.max(0, Math.floor(this.camY / TILE_SIZE));
    const endRow   = Math.min(WORLD_ROWS, Math.ceil((this.camY + H) / TILE_SIZE) + 1);

    for (let row = startRow; row < endRow; row++) {
      for (let col = startCol; col < endCol; col++) {
        const tile = this.world.getTile(col, row);
        const config = TILE_COLORS[tile] || TILE_COLORS[0];
        const sx = col * TILE_SIZE - this.camX;
        const sy = row * TILE_SIZE - this.camY;

        ctx.fillStyle = config.fill;
        ctx.fillRect(sx, sy, TILE_SIZE, TILE_SIZE);

        // Subtle grid
        ctx.strokeStyle = config.stroke;
        ctx.lineWidth = 0.3;
        ctx.strokeRect(sx + 0.5, sy + 0.5, TILE_SIZE - 1, TILE_SIZE - 1);
      }
    }
  }

  _drawObjects(ctx) {
    const W = this.canvas.width;
    const H = this.canvas.height;
    const startCol = Math.max(0, Math.floor(this.camX / TILE_SIZE));
    const endCol   = Math.min(WORLD_COLS, Math.ceil((this.camX + W) / TILE_SIZE) + 1);
    const startRow = Math.max(0, Math.floor(this.camY / TILE_SIZE));
    const endRow   = Math.min(WORLD_ROWS, Math.ceil((this.camY + H) / TILE_SIZE) + 1);

    for (let row = startRow; row < endRow; row++) {
      for (let col = startCol; col < endCol; col++) {
        const obj = this.world.getObj(col, row);
        if (obj === OBJ.NONE) continue;
        const sx = col * TILE_SIZE - this.camX + TILE_SIZE / 2;
        const sy = row * TILE_SIZE - this.camY + TILE_SIZE / 2;
        this._drawObject(ctx, obj, sx, sy, col, row);
      }
    }
  }

  _drawObject(ctx, type, cx, cy, col, row) {
    ctx.save();
    switch (type) {
      case OBJ.TREE:
        // Trunk
        ctx.fillStyle = '#5c3a1e';
        ctx.fillRect(cx - 3, cy, 6, 12);
        // Canopy
        ctx.fillStyle = '#1a5c0a';
        ctx.beginPath();
        ctx.arc(cx, cy - 6, 13, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#267315';
        ctx.beginPath();
        ctx.arc(cx - 3, cy - 9, 8, 0, Math.PI * 2);
        ctx.fill();
        break;
      case OBJ.PINE:
        ctx.fillStyle = '#5c3a1e';
        ctx.fillRect(cx - 2, cy + 2, 5, 10);
        ctx.fillStyle = '#0d4a1e';
        for (let i = 0; i < 3; i++) {
          const s = 12 - i * 3;
          ctx.beginPath();
          ctx.moveTo(cx, cy - 14 + i * 4);
          ctx.lineTo(cx - s, cy - 4 + i * 4);
          ctx.lineTo(cx + s, cy - 4 + i * 4);
          ctx.closePath();
          ctx.fill();
        }
        break;
      case OBJ.ROCK:
        ctx.fillStyle = '#555';
        ctx.beginPath();
        ctx.ellipse(cx, cy, 9, 7, 0.3, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#777';
        ctx.beginPath();
        ctx.ellipse(cx - 2, cy - 2, 5, 4, 0.3, 0, Math.PI * 2);
        ctx.fill();
        break;
      case OBJ.BOULDER:
        ctx.fillStyle = '#444';
        ctx.beginPath();
        ctx.ellipse(cx, cy, 13, 10, 0.2, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#666';
        ctx.beginPath();
        ctx.ellipse(cx - 3, cy - 3, 7, 5, 0.2, 0, Math.PI * 2);
        ctx.fill();
        break;
      case OBJ.RUIN:
        ctx.fillStyle = '#3a2a1a';
        ctx.fillRect(cx - 10, cy - 4, 8, 12);
        ctx.fillRect(cx + 2, cy - 8, 8, 10);
        ctx.fillStyle = '#2a1a0a';
        ctx.fillRect(cx - 8, cy + 6, 18, 4);
        break;
      case OBJ.CRYSTAL:
        ctx.fillStyle = 'rgba(130,60,200,0.8)';
        ctx.beginPath();
        ctx.moveTo(cx, cy - 14);
        ctx.lineTo(cx - 5, cy);
        ctx.lineTo(cx, cy + 6);
        ctx.lineTo(cx + 5, cy);
        ctx.closePath();
        ctx.fill();
        ctx.fillStyle = 'rgba(180,100,255,0.5)';
        ctx.beginPath();
        ctx.moveTo(cx, cy - 14);
        ctx.lineTo(cx - 2, cy);
        ctx.lineTo(cx, cy - 4);
        ctx.closePath();
        ctx.fill();
        break;
      case OBJ.CHEST:
        const chest = this.world.chests.find(c => c.col === col && c.row === row);
        ctx.fillStyle = chest?.looted ? '#444' : '#8b6914';
        ctx.fillRect(cx - 9, cy - 5, 18, 13);
        ctx.fillStyle = chest?.looted ? '#333' : '#5c440a';
        ctx.fillRect(cx - 9, cy - 5, 18, 4);
        if (!chest?.looted) {
          ctx.fillStyle = '#ffd700';
          ctx.fillRect(cx - 2, cy - 2, 4, 4);
        }
        break;
    }
    ctx.restore();
  }

  _drawNPCs(ctx) {
    for (const npc of this.world.npcs) {
      const sx = npc.col * TILE_SIZE - this.camX + TILE_SIZE / 2;
      const sy = npc.row * TILE_SIZE - this.camY + TILE_SIZE / 2;

      // Body
      ctx.fillStyle = '#c8a060';
      ctx.beginPath();
      ctx.arc(sx, sy - 4, 9, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#6a3a1a';
      ctx.fillRect(sx - 8, sy + 4, 16, 14);

      // Name
      ctx.font = 'bold 10px Cinzel, serif';
      ctx.fillStyle = '#ffe88a';
      ctx.textAlign = 'center';
      ctx.fillText(npc.name, sx, sy - 18);

      // Talk bubble indicator
      ctx.fillStyle = '#ffffff';
      ctx.font = '10px serif';
      ctx.fillText('💬', sx + 8, sy - 18);
    }
  }

  _drawPlayer(ctx, W, H) {
    const gs = this.gameState;
    const px = W / 2;
    const py = H / 2;
    const tier = getLevelTierColor(gs.level);

    // Shadow
    ctx.fillStyle = 'rgba(0,0,0,0.3)';
    ctx.beginPath();
    ctx.ellipse(px, py + 14, 12, 5, 0, 0, Math.PI * 2);
    ctx.fill();

    // Glow
    const grd = ctx.createRadialGradient(px, py, 0, px, py, 28);
    grd.addColorStop(0, tier.glow);
    grd.addColorStop(1, 'transparent');
    ctx.fillStyle = grd;
    ctx.beginPath();
    ctx.arc(px, py, 28, 0, Math.PI * 2);
    ctx.fill();

    // Body (class-colored)
    const classColor = gs.classData?.color || '#888';
    ctx.fillStyle = classColor;
    ctx.fillRect(px - 8, py - 4, 16, 18);

    // Head
    ctx.fillStyle = '#d4a070';
    ctx.beginPath();
    ctx.arc(px, py - 10, 9, 0, Math.PI * 2);
    ctx.fill();

    // Outline with tier color
    ctx.strokeStyle = tier.color;
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.arc(px, py - 10, 9, 0, Math.PI * 2);
    ctx.stroke();
    ctx.strokeRect(px - 8, py - 4, 16, 18);

    // Weapon indicator
    const icon = gs.classData?.icon || '⚔️';
    ctx.font = '14px serif';
    ctx.textAlign = 'center';
    ctx.fillText(icon, px + 14, py + 2);

    // Nameplate
    ctx.font = 'bold 11px Cinzel, serif';
    ctx.textAlign = 'center';
    ctx.fillStyle = tier.color;
    ctx.fillText(gs.playerName || 'Hero', px, py - 26);

    // Level badge
    ctx.font = 'bold 9px Cinzel, serif';
    ctx.fillStyle = '#1a1a1a';
    ctx.beginPath();
    ctx.arc(px + 12, py - 24, 8, 0, Math.PI * 2);
    ctx.fillStyle = tier.color;
    ctx.fill();
    ctx.fillStyle = '#000';
    ctx.fillText(gs.level, px + 12, py - 21);
  }

  _drawEffects(ctx) {
    for (const e of this.effects) {
      const alpha = e.life / e.maxLife;
      ctx.save();
      ctx.globalAlpha = alpha * 0.7;
      ctx.strokeStyle = e.color;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(e.x - this.camX, e.y - this.camY, e.radius * (1 - alpha + 0.3), 0, Math.PI * 2);
      ctx.stroke();
      ctx.fillStyle = e.color;
      ctx.globalAlpha = alpha * 0.2;
      ctx.fill();
      ctx.restore();
    }
  }

  _drawFog(ctx, W, H) {
    const gs = this.gameState;
    const px = W / 2;
    const py = H / 2;
    const radius = FOG_RADIUS;

    const zone = this.currentZone;
    const fogColor = zone?.fogColor || 'rgba(0,0,0,0.93)';

    // Radial gradient mask
    const grad = ctx.createRadialGradient(px, py, radius * 0.5, px, py, radius);
    grad.addColorStop(0, 'rgba(0,0,0,0)');
    grad.addColorStop(0.7, 'rgba(0,0,0,0)');
    grad.addColorStop(1, fogColor);

    // Outer fog
    ctx.fillStyle = fogColor;
    ctx.fillRect(0, 0, W, H);

    // Clear center
    ctx.save();
    ctx.globalCompositeOperation = 'destination-out';
    ctx.fillStyle = grad;

    // Create circular clear area
    const clearGrad = ctx.createRadialGradient(px, py, 0, px, py, radius);
    clearGrad.addColorStop(0, 'rgba(0,0,0,1)');
    clearGrad.addColorStop(0.65, 'rgba(0,0,0,0.95)');
    clearGrad.addColorStop(0.85, 'rgba(0,0,0,0.5)');
    clearGrad.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = clearGrad;
    ctx.beginPath();
    ctx.arc(px, py, radius, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
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

  _drawDamageNumbers(ctx) {
    for (const d of this.damageNumbers) {
      const sx = d.x - this.camX;
      const sy = d.y - this.camY - (1 - d.life) * 40;
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

  _drawInteractPrompt(ctx, W, H) {
    const label = this.nearNPC ? `[F] Talk to ${this.nearNPC.name}` : '[F] Open Chest';
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