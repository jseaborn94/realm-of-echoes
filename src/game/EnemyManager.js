import { TILE_SIZE, WORLD_COLS, WORLD_ROWS, getZoneAt } from './constants.js';
import { TILE } from './WorldGenerator.js';

// ─── Enemy Definitions ───────────────────────────────────────────────────────
export const ENEMY_TYPES = {
  // MELEE
  skull:       { name: 'Skull',       tier: 'melee',  color: '#c8c8c8', icon: '💀', hp: 60,   atk: 12, def: 2,  speed: 55, xp: 15,  range: 28, zone: [1], lootMult: 1.0 },
  lancer:      { name: 'Lancer',      tier: 'melee',  color: '#4a90d9', icon: '🗡️', hp: 80,   atk: 18, def: 4,  speed: 60, xp: 22,  range: 30, zone: [1,2], lootMult: 1.1 },
  thief:       { name: 'Thief',       tier: 'melee',  color: '#9b59b6', icon: '🔪', hp: 55,   atk: 22, def: 2,  speed: 80, xp: 20,  range: 26, zone: [1,2], lootMult: 1.1 },
  snake:       { name: 'Snake',       tier: 'melee',  color: '#27ae60', icon: '🐍', hp: 50,   atk: 15, def: 1,  speed: 70, xp: 14,  range: 24, zone: [2,3], lootMult: 1.0 },
  spider:      { name: 'Spider',      tier: 'melee',  color: '#8e44ad', icon: '🕷️', hp: 45,   atk: 14, def: 1,  speed: 75, xp: 13,  range: 24, zone: [2,3], lootMult: 1.0 },
  bear:        { name: 'Bear',        tier: 'melee',  color: '#795548', icon: '🐻', hp: 140,  atk: 28, def: 8,  speed: 50, xp: 35,  range: 36, zone: [3,4], lootMult: 1.3 },
  gnome:       { name: 'Gnome',       tier: 'melee',  color: '#e74c3c', icon: '🧙', hp: 70,   atk: 20, def: 3,  speed: 58, xp: 18,  range: 28, zone: [1,2], lootMult: 1.0 },
  panda:       { name: 'Panda',       tier: 'melee',  color: '#ecf0f1', icon: '🐼', hp: 120,  atk: 25, def: 7,  speed: 45, xp: 30,  range: 34, zone: [4,5], lootMult: 1.2 },

  // RANGED
  harpoonfish: { name: 'Harpoon Fish',tier: 'ranged', color: '#1abc9c', icon: '🐠', hp: 65,   atk: 20, def: 2,  speed: 48, xp: 24,  range: 160, zone: [2,3], lootMult: 1.1, projectileColor: '#1abc9c' },
  shaman:      { name: 'Shaman',      tier: 'ranged', color: '#e67e22', icon: '🔮', hp: 75,   atk: 24, def: 3,  speed: 42, xp: 28,  range: 180, zone: [3,4,5], lootMult: 1.2, projectileColor: '#e67e22' },
  gnoll:       { name: 'Gnoll',       tier: 'ranged', color: '#f39c12', icon: '🦴', hp: 80,   atk: 22, def: 4,  speed: 44, xp: 26,  range: 170, zone: [2,3,4], lootMult: 1.2, projectileColor: '#f39c12' },

  // ELITE
  turtle:      { name: 'Turtle',      tier: 'elite',  color: '#16a085', icon: '🐢', hp: 320,  atk: 30, def: 18, speed: 30, xp: 80,  range: 32, zone: [3,4], lootMult: 2.0 },
  lizard:      { name: 'Lizard',      tier: 'elite',  color: '#2ecc71', icon: '🦎', hp: 280,  atk: 38, def: 12, speed: 55, xp: 90,  range: 34, zone: [4,5], lootMult: 2.0 },
  minotaur:    { name: 'Minotaur',    tier: 'elite',  color: '#c0392b', icon: '🐂', hp: 400,  atk: 45, def: 15, speed: 42, xp: 110, range: 40, zone: [5],   lootMult: 2.5 },

  // BOSS
  ogre:        { name: 'Ogre',        tier: 'boss',   color: '#7f8c8d', icon: '👹', hp: 1200, atk: 70, def: 20, speed: 35, xp: 500, range: 50, zone: [5],   lootMult: 5.0 },
};

// ─── Zone enemy tables ────────────────────────────────────────────────────────
const ZONE_ENEMIES = {
  1: ['skull', 'thief', 'lancer', 'gnome'],
  2: ['lancer', 'thief', 'snake', 'spider', 'gnoll', 'harpoonfish'],
  3: ['snake', 'spider', 'bear', 'gnoll', 'harpoonfish', 'shaman', 'turtle'],
  4: ['bear', 'panda', 'gnoll', 'shaman', 'turtle', 'lizard'],
  5: ['panda', 'shaman', 'minotaur', 'lizard', 'ogre'],
};

// ─── Loot tables ─────────────────────────────────────────────────────────────
const RARITIES = ['common','common','common','uncommon','uncommon','rare','rare','epic','legendary'];
const SLOTS    = ['helmet','chest','pants','gloves','boots','weapon'];
const PREFIXES = ['Iron','Shadow','Frost','Divine','Ancient','Cursed','Radiant','Void','Storm','Ember'];
const NAMES    = { helmet:'Helm', chest:'Plate', pants:'Greaves', gloves:'Gauntlets', boots:'Boots', weapon:'Blade' };
const ICONS    = { helmet:'⛑️', chest:'🧥', pants:'👖', gloves:'🧤', boots:'👢', weapon:'⚔️' };

const RARITY_MULT = { common:1, uncommon:1.4, rare:2, epic:3, legendary:5 };

function rollLoot(enemyType, playerLevel) {
  const def = ENEMY_TYPES[enemyType];
  const dropChance = def.tier === 'boss' ? 1.0 : def.tier === 'elite' ? 0.6 : def.tier === 'ranged' ? 0.2 : 0.15;
  if (Math.random() > dropChance * def.lootMult) return null;

  const rarity = RARITIES[Math.floor(Math.random() * RARITIES.length)];
  const slot   = SLOTS[Math.floor(Math.random() * SLOTS.length)];
  const prefix = PREFIXES[Math.floor(Math.random() * PREFIXES.length)];
  const mult   = RARITY_MULT[rarity];

  return {
    id: `loot_${Date.now()}_${Math.random()}`,
    name: `${prefix} ${NAMES[slot]}`,
    slot,
    rarity,
    icon: ICONS[slot],
    stats: {
      attack:  slot === 'weapon' ? Math.floor((4 + playerLevel * 2) * mult) : 0,
      defense: slot !== 'weapon' ? Math.floor((2 + playerLevel) * mult) : 0,
    },
  };
}

// ─── EnemyManager ────────────────────────────────────────────────────────────
export class EnemyManager {
  constructor(world) {
    this.world = world;
    this.enemies = [];
    this.respawnQueue = [];  // { type, zoneId, spawnTime }
    this._nextId = 1;
    this._initialSpawn();
  }

  // Organic zone bounding boxes (loose search regions — getZoneAt validates actual zone)
  _getZoneSearchBounds(zoneId) {
    switch (zoneId) {
      case 1: return [  0, 280, 290, 499]; // Starter Plains — south-central
      case 2: return [260, 499, 240, 499]; // Wildwood Frontier — southeast
      case 3: return [  0, 210, 100, 340]; // Ironvale Expanse — west
      case 4: return [240, 499,  80, 290]; // Frostthorn Reach — northeast
      case 5: return [  0, 499,   0, 115]; // Shadowfall Wastes — north
      default: return [0, 499, 0, 499];
    }
  }

  _initialSpawn() {
    const ZONE_COUNT = { 1: 55, 2: 55, 3: 45, 4: 45, 5: 30 };

    for (const [zoneId, types] of Object.entries(ZONE_ENEMIES)) {
      const bounds = this._getZoneSearchBounds(parseInt(zoneId));
      const count  = ZONE_COUNT[zoneId];
      for (let i = 0; i < count; i++) {
        const type = types[Math.floor(Math.random() * types.length)];
        this._spawnEnemy(type, bounds, parseInt(zoneId));
      }
    }
  }

  _spawnEnemy(type, bounds, zoneId) {
    const def = ENEMY_TYPES[type];
    if (!def) return;

    // Try to find a valid spawn position that actually belongs to the zone
    let attempts = 0;
    let col, row;
    do {
      col = bounds[0] + Math.floor(Math.random() * (bounds[1] - bounds[0]));
      row = bounds[2] + Math.floor(Math.random() * (bounds[3] - bounds[2]));
      attempts++;
      // Validate it's actually in the right organic zone
      if (attempts < 30 && getZoneAt(col, row).id !== zoneId) continue;
    } while (attempts < 40 && this._isBadSpawn(col, row));

    if (attempts >= 20) return;

    const isBoss = def.tier === 'boss';
    const isElite = def.tier === 'elite';

    this.enemies.push({
      id: this._nextId++,
      type,
      zoneId,
      bounds,
      x: col * TILE_SIZE + TILE_SIZE / 2,
      y: row * TILE_SIZE + TILE_SIZE / 2,
      hp: def.hp,
      maxHp: def.hp,
      atk: def.atk,
      def: def.def,
      speed: def.speed,
      range: def.range,
      color: def.color,
      icon: def.icon,
      name: def.name,
      tier: def.tier,
      xp: def.xp,
      // State machine
      state: 'idle',         // idle | chase | attack | ranged_retreat | charge
      attackCooldown: 0,
      chargeCooldown: 0,
      alertRadius: isBoss ? 280 : isElite ? 220 : 180,
      // Ranged projectile state
      projectiles: def.tier === 'ranged' ? [] : undefined,
      projectileColor: def.projectileColor,
      // Death flash
      hitFlash: 0,
      dead: false,
    });
  }

  _isBadSpawn(col, row) {
    if (col < 1 || col >= WORLD_COLS - 1 || row < 1 || row >= WORLD_ROWS - 1) return true;
    if (this.world.getTile(col, row) === TILE.WATER) return true;
    if (this.world.isBlocked(col, row)) return true;
    // Don't spawn near player start (Evergreen Hollow col 185, row 390)
    if (Math.abs(col - 185) < 14 && Math.abs(row - 390) < 14) return true;
    return false;
  }

  update(dt, px, py, gameState, pushDamageNumber, pushEffect) {
    const now = performance.now();
    const playerLevel = gameState.level || 1;

    // Handle respawn queue
    this.respawnQueue = this.respawnQueue.filter(r => {
      if (now >= r.spawnTime) {
        this._spawnEnemy(r.type, r.bounds, r.zoneId);
        return false;
      }
      return true;
    });

    const dead = [];
    const lootDrops = [];
    let playerDmgTotal = 0;

    for (const e of this.enemies) {
      if (e.dead) continue;

      // Tick cooldowns
      if (e.attackCooldown > 0) e.attackCooldown -= dt;
      if (e.chargeCooldown > 0) e.chargeCooldown -= dt;
      if (e.hitFlash > 0) e.hitFlash -= dt;

      const dx = px - e.x;
      const dy = py - e.y;
      const dist = Math.sqrt(dx * dx + dy * dy);

      // Update projectiles
      if (e.projectiles) {
        e.projectiles = e.projectiles.filter(p => {
          p.x += p.vx * dt;
          p.y += p.vy * dt;
          p.life -= dt;
          // Hit player
          const pdx = p.x - px;
          const pdy = p.y - py;
          if (Math.sqrt(pdx*pdx + pdy*pdy) < 20) {
            playerDmgTotal += p.dmg;
            pushDamageNumber(px, py - 20, `-${p.dmg}`, '#ff4444', false);
            p.life = 0;
          }
          return p.life > 0;
        });
      }

      // AI state machine
      if (dist < e.alertRadius) {
        e.state = 'chase';
      } else if (e.state === 'chase' && dist > e.alertRadius + 60) {
        e.state = 'idle';
      }

      if (e.state === 'chase' || e.state === 'attack') {
        const def = ENEMY_TYPES[e.type];

        // ── BOSS: charge attack ──
        if (def.tier === 'boss') {
          if (e.chargeCooldown <= 0 && dist < 320) {
            // Initiate charge
            e.state = 'charge';
            e.chargeVx = (dx / dist) * 300;
            e.chargeVy = (dy / dist) * 300;
            e.chargeDuration = 0.5;
            e.chargeCooldown = 8;
            pushDamageNumber(e.x, e.y - 40, 'CHARGE!', '#ff9800', true);
          }
        }

        if (e.state === 'charge') {
          e.x += e.chargeVx * dt;
          e.y += e.chargeVy * dt;
          e.chargeDuration -= dt;
          if (e.chargeDuration <= 0) e.state = 'chase';

          // Charge hit
          const cdx = e.x - px; const cdy = e.y - py;
          if (Math.sqrt(cdx*cdx + cdy*cdy) < 30) {
            const dmg = Math.max(1, e.atk * 2 - (gameState.equipStats?.defense || 0));
            playerDmgTotal += dmg;
            pushDamageNumber(px, py - 20, `-${dmg}`, '#ff2222', true);
            e.state = 'idle';
          }

        } else if (def.tier === 'ranged') {
          // Ranged: maintain distance, shoot
          const preferredDist = e.range * 0.65;
          if (dist < preferredDist) {
            // Back away
            const nx = e.x - (dx / dist) * e.speed * dt;
            const ny = e.y - (dy / dist) * e.speed * dt;
            if (!this._blocked(nx, ny)) { e.x = nx; e.y = ny; }
          } else if (dist > e.range) {
            // Move closer
            const nx = e.x + (dx / dist) * e.speed * dt;
            const ny = e.y + (dy / dist) * e.speed * dt;
            if (!this._blocked(nx, ny)) { e.x = nx; e.y = ny; }
          }

          // Fire projectile
          if (e.attackCooldown <= 0 && dist < e.range) {
            const speed = 160;
            const angle = Math.atan2(dy, dx);
            const jitter = (Math.random() - 0.5) * 0.3;
            const dmg = Math.max(1, e.atk - Math.floor((gameState.equipStats?.defense || 0) * 0.5));
            e.projectiles.push({
              x: e.x, y: e.y,
              vx: Math.cos(angle + jitter) * speed,
              vy: Math.sin(angle + jitter) * speed,
              dmg,
              life: 2.0,
              color: e.projectileColor,
            });
            e.attackCooldown = def.tier === 'ranged' ? 2.2 : 1.5;
          }

        } else {
          // Melee: move toward player
          if (dist > e.range) {
            const nx = e.x + (dx / dist) * e.speed * dt;
            const ny = e.y + (dy / dist) * e.speed * dt;
            if (!this._blocked(nx, ny)) { e.x = nx; e.y = ny; }
          }

          // Melee attack
          if (dist <= e.range && e.attackCooldown <= 0) {
            const dmg = Math.max(1, e.atk - (gameState.equipStats?.defense || 0));
            playerDmgTotal += dmg;
            pushDamageNumber(px, py - 20, `-${dmg}`, '#ff4444', false);
            e.attackCooldown = def.tier === 'elite' ? 1.8 : 1.2;
            pushEffect(e.x, e.y, 18, 0.3, e.color);
          }
        }
      }
    }

    // Remove dead enemies
    for (const e of this.enemies) {
      if (e.dead) {
        dead.push(e);
        const loot = rollLoot(e.type, playerLevel);
        if (loot) lootDrops.push(loot);
      }
    }
    this.enemies = this.enemies.filter(e => !e.dead);

    // Queue respawns
    for (const e of dead) {
      const delay = ENEMY_TYPES[e.type]?.tier === 'boss' ? 120000 : 20000;
      this.respawnQueue.push({ type: e.type, bounds: e.bounds, zoneId: e.zoneId, spawnTime: now + delay });
    }

    return { playerDmgTotal, lootDrops, xpGained: dead.reduce((s, e) => s + e.xp, 0), killCount: dead.length };
  }

  _blocked(wx, wy) {
    const col = Math.floor(wx / TILE_SIZE);
    const row = Math.floor(wy / TILE_SIZE);
    if (this.world.getTile(col, row) === TILE.WATER) return true;
    if (this.world.isBlocked(col, row)) return true;
    if (col < 0 || col >= WORLD_COLS || row < 0 || row >= WORLD_ROWS) return true;
    return false;
  }

  // Called when player uses an ability
  applyAbilityDamage(px, py, abilityType, skillLevel, classAtk, equipAtk) {
    const totalAtk = classAtk + equipAtk;
    const lvlBonus = 1 + skillLevel * 0.3;
    const results = [];

    let hitRadius, baseMult;
    if (abilityType === 'single')   { hitRadius = 90;  baseMult = 1.2 + Math.random() * 0.4; }
    else if (abilityType === 'aoe') { hitRadius = 160; baseMult = 0.8 + Math.random() * 0.3; }
    else if (abilityType === 'ultimate') { hitRadius = 200; baseMult = 2.5 + Math.random() * 0.5; }
    else return results; // utility

    for (const e of this.enemies) {
      if (e.dead) continue;
      const dx = e.x - px;
      const dy = e.y - py;
      const dist = Math.sqrt(dx * dx + dy * dy);

      // Single target: hit closest enemy only
      if (abilityType === 'single') {
        if (dist > hitRadius) continue;
        // Only hit the closest one
        const closest = this.enemies
          .filter(x => !x.dead && Math.sqrt((x.x-px)**2 + (x.y-py)**2) < hitRadius)
          .sort((a,b) => Math.sqrt((a.x-px)**2+(a.y-py)**2) - Math.sqrt((b.x-px)**2+(b.y-py)**2))[0];
        if (e !== closest) continue;
      } else {
        if (dist > hitRadius) continue;
      }

      const raw = Math.floor(totalAtk * baseMult * lvlBonus);
      const dmg = Math.max(1, raw - Math.floor(e.def * 0.5));
      e.hp -= dmg;
      e.hitFlash = 0.15;

      results.push({ x: e.x, y: e.y, dmg, killed: e.hp <= 0 });
      if (e.hp <= 0) {
        e.dead = true;
      }
    }
    return results;
  }

  draw(ctx, camX, camY, playerSX, playerSY, fogRadiusWorld) {
    for (const e of this.enemies) {
      this._drawEnemy(ctx, e, camX, camY, playerSX, playerSY, fogRadiusWorld);
    }
    // Draw projectiles
    for (const e of this.enemies) {
      if (!e.projectiles) continue;
      for (const p of e.projectiles) {
        const sx = p.x - camX;
        const sy = p.y - camY;
        ctx.save();
        ctx.fillStyle = p.color || '#ff0';
        ctx.shadowColor = p.color || '#ff0';
        ctx.shadowBlur = 6;
        ctx.beginPath();
        ctx.arc(sx, sy, 5, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      }
    }
  }

  _drawEnemy(ctx, e, camX, camY, playerSX, playerSY, fogRadiusWorld) {
    const sx = e.x - camX;
    const sy = e.y - camY;

    // Culling
    if (sx < -60 || sx > ctx.canvas.width + 60 || sy < -60 || sy > ctx.canvas.height + 60) return;

    // Fog visibility for labels
    const distFromPlayer = fogRadiusWorld != null && playerSX != null
      ? Math.sqrt((sx - playerSX) ** 2 + (sy - playerSY) ** 2)
      : 0;
    const labelAlpha = fogRadiusWorld != null
      ? Math.max(0, Math.min(1, 1 - (distFromPlayer - fogRadiusWorld * 0.7) / (fogRadiusWorld * 0.3)))
      : 1;

    const isBoss  = e.tier === 'boss';
    const isElite = e.tier === 'elite';
    const scale   = isBoss ? 2.0 : isElite ? 1.5 : 1.0;
    const r       = 12 * scale;

    ctx.save();

    // Hit flash
    if (e.hitFlash > 0) {
      ctx.globalAlpha = 0.85;
    }

    // Shadow
    ctx.fillStyle = 'rgba(0,0,0,0.35)';
    ctx.beginPath();
    ctx.ellipse(sx, sy + r + 4, r * 0.9, r * 0.35, 0, 0, Math.PI * 2);
    ctx.fill();

    // Glow for elites/boss
    if (isElite || isBoss) {
      const grd = ctx.createRadialGradient(sx, sy, 0, sx, sy, r * 2);
      grd.addColorStop(0, e.color + '55');
      grd.addColorStop(1, 'transparent');
      ctx.fillStyle = grd;
      ctx.beginPath();
      ctx.arc(sx, sy, r * 2, 0, Math.PI * 2);
      ctx.fill();
    }

    // Body circle
    ctx.fillStyle = e.hitFlash > 0 ? '#ffffff' : e.color;
    ctx.beginPath();
    ctx.arc(sx, sy, r, 0, Math.PI * 2);
    ctx.fill();

    // Border
    ctx.strokeStyle = isBoss ? '#ff9800' : isElite ? '#ffd700' : 'rgba(0,0,0,0.4)';
    ctx.lineWidth = isBoss ? 3 : isElite ? 2 : 1;
    ctx.stroke();

    // Icon
    ctx.font = `${isBoss ? 20 : isElite ? 16 : 13}px serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(e.icon, sx, sy);

    // Labels + HP bar — only render when inside fog vision
    if (labelAlpha > 0) {
      ctx.save();
      ctx.globalAlpha = (ctx.globalAlpha || 1) * labelAlpha;

      // Name
      ctx.font = `bold ${isBoss ? 11 : 9}px Cinzel, serif`;
      ctx.fillStyle = isBoss ? '#ff9800' : isElite ? '#ffd700' : '#ddd';
      ctx.textBaseline = 'alphabetic';
      ctx.fillText(e.name, sx, sy - r - 10);

      // HP bar
      const barW = isBoss ? 80 : isElite ? 50 : 36;
      const barH = isBoss ? 7 : 5;
      const barX = sx - barW / 2;
      const barY = sy - r - 8;
      const hpPct = Math.max(0, e.hp / e.maxHp);

      ctx.fillStyle = 'rgba(0,0,0,0.6)';
      ctx.fillRect(barX, barY, barW, barH);
      ctx.fillStyle = hpPct > 0.5 ? '#4caf50' : hpPct > 0.25 ? '#ff9800' : '#f44336';
      ctx.fillRect(barX, barY, barW * hpPct, barH);

      // Boss / elite tier label
      if (isBoss) {
        ctx.font = 'bold 8px Cinzel, serif';
        ctx.fillStyle = '#ff9800';
        ctx.fillText('⚠ BOSS', sx, sy - r - 22);
      } else if (isElite) {
        ctx.font = 'bold 8px Cinzel, serif';
        ctx.fillStyle = '#ffd700';
        ctx.fillText('★ ELITE', sx, sy - r - 18);
      }

      ctx.restore();
    }

    ctx.restore();
  }
}