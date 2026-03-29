import { TILE_SIZE, WORLD_COLS, WORLD_ROWS, getZoneAt } from './constants.js';
import { TILE } from './WorldGenerator.js';

// ─── Enemy Definitions ───────────────────────────────────────────────────────
export const ENEMY_TYPES = {
  // ── MELEE ──
  skull:       { name: 'Skull',        tier: 'melee',     color: '#c8c8c8', icon: '💀', hp: 60,   atk: 12, def: 2,  speed: 55, xp: 15,  range: 28, lootMult: 1.0 },
  lancer:      { name: 'Lancer',       tier: 'melee',     color: '#4a90d9', icon: '🗡️', hp: 80,   atk: 18, def: 4,  speed: 60, xp: 22,  range: 30, lootMult: 1.1 },
  thief:       { name: 'Thief',        tier: 'melee',     color: '#9b59b6', icon: '🔪', hp: 55,   atk: 22, def: 2,  speed: 80, xp: 20,  range: 26, lootMult: 1.1 },
  snake:       { name: 'Snake',        tier: 'melee',     color: '#27ae60', icon: '🐍', hp: 50,   atk: 15, def: 1,  speed: 70, xp: 14,  range: 24, lootMult: 1.0 },
  spider:      { name: 'Spider',       tier: 'melee',     color: '#8e44ad', icon: '🕷️', hp: 45,   atk: 14, def: 1,  speed: 75, xp: 13,  range: 24, lootMult: 1.0 },
  bear:        { name: 'Bear',         tier: 'melee',     color: '#795548', icon: '🐻', hp: 140,  atk: 28, def: 8,  speed: 50, xp: 35,  range: 36, lootMult: 1.3 },
  gnome:       { name: 'Gnome',        tier: 'melee',     color: '#e74c3c', icon: '🧙', hp: 70,   atk: 20, def: 3,  speed: 58, xp: 18,  range: 28, lootMult: 1.0 },
  panda:       { name: 'Panda',        tier: 'melee',     color: '#ecf0f1', icon: '🐼', hp: 120,  atk: 25, def: 7,  speed: 45, xp: 30,  range: 34, lootMult: 1.2 },

  // ── RANGED ──
  harpoonfish: { name: 'Harpoon Fish', tier: 'ranged',    color: '#1abc9c', icon: '🐠', hp: 65,   atk: 20, def: 2,  speed: 48, xp: 24,  range: 160, lootMult: 1.1, projectileColor: '#1abc9c' },
  shaman:      { name: 'Shaman',       tier: 'ranged',    color: '#e67e22', icon: '🔮', hp: 75,   atk: 24, def: 3,  speed: 42, xp: 28,  range: 180, lootMult: 1.2, projectileColor: '#e67e22' },
  gnoll:       { name: 'Gnoll',        tier: 'ranged',    color: '#f39c12', icon: '🦴', hp: 80,   atk: 22, def: 4,  speed: 44, xp: 26,  range: 170, lootMult: 1.2, projectileColor: '#f39c12' },

  // ── ELITE ──
  turtle:      { name: 'Turtle',       tier: 'elite',     color: '#16a085', icon: '🐢', hp: 320,  atk: 30, def: 18, speed: 30, xp: 80,  range: 32, lootMult: 2.2 },
  lizard:      { name: 'Lizard',       tier: 'elite',     color: '#2ecc71', icon: '🦎', hp: 280,  atk: 38, def: 12, speed: 55, xp: 90,  range: 34, lootMult: 2.2 },
  minotaur:    { name: 'Minotaur',     tier: 'elite',     color: '#c0392b', icon: '🐂', hp: 400,  atk: 45, def: 15, speed: 42, xp: 110, range: 40, lootMult: 2.8 },
  // Zone-specific elites (beefed-up named variants)
  alpha_skull: { name: 'Alpha Skull',  tier: 'elite',     color: '#ff4444', icon: '☠️', hp: 180,  atk: 28, def: 6,  speed: 65, xp: 55,  range: 30, lootMult: 2.0 },
  viper:       { name: 'Viper',        tier: 'elite',     color: '#00e676', icon: '🐍', hp: 150,  atk: 32, def: 5,  speed: 85, xp: 50,  range: 28, lootMult: 2.0 },
  frost_bear:  { name: 'Frost Bear',   tier: 'elite',     color: '#80deea', icon: '🐻', hp: 380,  atk: 40, def: 16, speed: 40, xp: 95,  range: 38, lootMult: 2.3 },
  shadow_panda:{ name: 'Shadow Panda', tier: 'elite',     color: '#7c4dff', icon: '🐼', hp: 340,  atk: 42, def: 14, speed: 50, xp: 100, range: 36, lootMult: 2.4 },

  // ── MINI-BOSS ──
  troll:       { name: 'Troll',        tier: 'miniboss',  color: '#4caf50', icon: '👾', hp: 600,  atk: 48, def: 14, speed: 38, xp: 200, range: 44, lootMult: 3.5 },
  wraith:      { name: 'Wraith',       tier: 'miniboss',  color: '#9c27b0', icon: '👻', hp: 480,  atk: 55, def: 10, speed: 65, xp: 220, range: 38, lootMult: 3.5 },
  golem:       { name: 'Stone Golem',  tier: 'miniboss',  color: '#78909c', icon: '🗿', hp: 800,  atk: 50, def: 22, speed: 28, xp: 250, range: 48, lootMult: 4.0 },
  warlord:     { name: 'Warlord',      tier: 'miniboss',  color: '#ef5350', icon: '⚔️', hp: 700,  atk: 62, def: 16, speed: 44, xp: 280, range: 46, lootMult: 4.0 },
  frost_witch: { name: 'Frost Witch',  tier: 'miniboss',  color: '#4fc3f7', icon: '🧙', hp: 550,  atk: 60, def: 12, speed: 50, xp: 260, range: 200, lootMult: 3.8, projectileColor: '#4fc3f7' },

  // ── BOSS ──
  ogre:        { name: 'Ogre',         tier: 'boss',      color: '#7f8c8d', icon: '👹', hp: 1200, atk: 70, def: 20, speed: 35, xp: 500, range: 50, lootMult: 5.0 },
};

// ─── Zone enemy tables (normal mobs only) ────────────────────────────────────
const ZONE_NORMAL = {
  1: ['skull', 'thief', 'lancer', 'gnome'],
  2: ['lancer', 'thief', 'snake', 'spider', 'gnoll', 'harpoonfish'],
  3: ['snake', 'spider', 'bear', 'gnoll', 'harpoonfish', 'shaman'],
  4: ['bear', 'panda', 'gnoll', 'shaman'],
  5: ['panda', 'shaman'],
};

// Elite pool per zone (scattered, special spawns)
const ZONE_ELITES = {
  1: ['alpha_skull'],
  2: ['alpha_skull', 'viper', 'turtle'],
  3: ['turtle', 'viper', 'lizard'],
  4: ['frost_bear', 'lizard', 'minotaur'],
  5: ['shadow_panda', 'minotaur', 'frost_bear'],
};

// Mini-boss placements: { type, col, row } — fixed locations for strong encounters
const MINI_BOSS_SPAWNS = [
  // Zone 1 — Starter Plains
  { type: 'troll',       col: 65,  row: 350 },
  { type: 'wraith',      col: 220, row: 490 },
  // Zone 2 — Wildwood Frontier
  { type: 'troll',       col: 465, row: 350 },
  { type: 'golem',       col: 400, row: 285 },
  // Zone 3 — Ironvale Expanse
  { type: 'golem',       col: 160, row: 260 },
  { type: 'warlord',     col: 30,  row: 295 },
  // Zone 4 — Frostthorn Reach
  { type: 'frost_witch', col: 445, row: 265 },
  { type: 'golem',       col: 305, row: 250 },
  // Zone 5 — Shadowfall Wastes
  { type: 'warlord',     col: 150, row: 75  },
  { type: 'frost_witch', col: 310, row: 75  },
];

// ─── Loot tables ─────────────────────────────────────────────────────────────
// Tier-weighted rarity pools
const RARITY_POOL = {
  normal:   ['common','common','common','common','uncommon','uncommon','rare'],
  elite:    ['uncommon','uncommon','rare','rare','epic'],
  miniboss: ['rare','rare','epic','epic','legendary'],
  boss:     ['epic','epic','legendary','legendary'],
};
const SLOTS    = ['helmet','chest','pants','gloves','boots','weapon'];
const PREFIXES = ['Iron','Shadow','Frost','Divine','Ancient','Cursed','Radiant','Void','Storm','Ember','Bone','Arcane'];
const NAMES    = { helmet:'Helm', chest:'Plate', pants:'Greaves', gloves:'Gauntlets', boots:'Boots', weapon:'Blade' };
const ICONS    = { helmet:'⛑️', chest:'🧥', pants:'👖', gloves:'🧤', boots:'👢', weapon:'⚔️' };
const RARITY_MULT = { common:1, uncommon:1.5, rare:2.2, epic:3.5, legendary:6 };

function rollLoot(enemyType, playerLevel) {
  const def = ENEMY_TYPES[enemyType];
  const tier = def.tier;

  // Drop chances by tier
  const dropChance = { boss: 1.0, miniboss: 1.0, elite: 0.75, ranged: 0.22, melee: 0.16 }[tier] ?? 0.16;
  if (Math.random() > dropChance * def.lootMult) return null;

  const pool = RARITY_POOL[tier] || RARITY_POOL.normal;
  const rarity = pool[Math.floor(Math.random() * pool.length)];
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
    this.respawnQueue = [];
    this._nextId = 1;
    this._initialSpawn();
  }

  // Organic zone bounding boxes
  _getZoneSearchBounds(zoneId) {
    switch (zoneId) {
      case 1: return [  0, 280, 290, 499];
      case 2: return [260, 499, 240, 499];
      case 3: return [  0, 210, 100, 340];
      case 4: return [240, 499,  80, 290];
      case 5: return [  0, 499,   0, 115];
      default: return [0, 499, 0, 499];
    }
  }

  _initialSpawn() {
    // Pack spawning per zone — zone 1 is sparse, zone 5 is dense
    const ZONE_PACKS = { 1: 20, 2: 26, 3: 22, 4: 26, 5: 20 };
    const PACK_SIZE  = { 1: [3,5], 2: [3,5], 3: [3,6], 4: [4,6], 5: [4,6] };
    const ELITE_PACKS = { 1: 3, 2: 4, 3: 4, 4: 5, 5: 5 };

    // Spawn normal packs
    for (let zoneId = 1; zoneId <= 5; zoneId++) {
      const bounds = this._getZoneSearchBounds(zoneId);
      const packs  = ZONE_PACKS[zoneId];
      const [minPack, maxPack] = PACK_SIZE[zoneId];
      const types  = ZONE_NORMAL[zoneId];

      for (let p = 0; p < packs; p++) {
        // Pick a pack center
        const center = this._findValidSpot(bounds, zoneId, 60);
        if (!center) continue;
        const packType = types[Math.floor(Math.random() * types.length)];
        const count = minPack + Math.floor(Math.random() * (maxPack - minPack + 1));
        for (let i = 0; i < count; i++) {
          // Scatter around pack center (within ~5 tiles)
          const scatter = 5 * TILE_SIZE;
          const ox = (Math.random() - 0.5) * scatter * 2;
          const oy = (Math.random() - 0.5) * scatter * 2;
          const col = Math.floor((center.x + ox) / TILE_SIZE);
          const row = Math.floor((center.y + oy) / TILE_SIZE);
          if (!this._isBadSpawn(col, row)) {
            this._spawnAt(packType, col, row, bounds, zoneId);
          }
        }
      }

      // Spawn elite packs (smaller, 1-2 elites)
      const elitePacks = ELITE_PACKS[zoneId];
      const eliteTypes = ZONE_ELITES[zoneId];
      for (let p = 0; p < elitePacks; p++) {
        const center = this._findValidSpot(bounds, zoneId, 80);
        if (!center) continue;
        const eliteType = eliteTypes[Math.floor(Math.random() * eliteTypes.length)];
        const count = 1 + Math.floor(Math.random() * 2);
        for (let i = 0; i < count; i++) {
          const scatter = 3 * TILE_SIZE;
          const ox = (Math.random() - 0.5) * scatter * 2;
          const oy = (Math.random() - 0.5) * scatter * 2;
          const col = Math.floor((center.x + ox) / TILE_SIZE);
          const row = Math.floor((center.y + oy) / TILE_SIZE);
          if (!this._isBadSpawn(col, row)) {
            this._spawnAt(eliteType, col, row, bounds, zoneId);
          }
        }
      }
    }

    // Spawn fixed mini-bosses
    for (const mb of MINI_BOSS_SPAWNS) {
      if (!this._isBadSpawn(mb.col, mb.row)) {
        const zoneId = getZoneAt(mb.col, mb.row).id;
        const bounds = this._getZoneSearchBounds(zoneId);
        this._spawnAt(mb.type, mb.col, mb.row, bounds, zoneId);
      }
    }

    // Spawn boss (fixed)
    this._spawnAt('ogre', 210, 65, this._getZoneSearchBounds(5), 5);
  }

  // Find a valid world-px position inside a zone (with minimum spacing from others)
  _findValidSpot(bounds, zoneId, minSpacing) {
    for (let attempt = 0; attempt < 50; attempt++) {
      const col = bounds[0] + Math.floor(Math.random() * (bounds[1] - bounds[0]));
      const row = bounds[2] + Math.floor(Math.random() * (bounds[3] - bounds[2]));
      if (getZoneAt(col, row).id !== zoneId) continue;
      if (this._isBadSpawn(col, row)) continue;
      const x = col * TILE_SIZE + TILE_SIZE / 2;
      const y = row * TILE_SIZE + TILE_SIZE / 2;
      // Check spacing from existing packs
      const tooClose = this.enemies.some(e => Math.sqrt((e.x - x) ** 2 + (e.y - y) ** 2) < minSpacing * TILE_SIZE * 0.5);
      if (!tooClose) return { x, y };
    }
    return null;
  }

  _spawnAt(type, col, row, bounds, zoneId) {
    const def = ENEMY_TYPES[type];
    if (!def) return;

    const isBoss     = def.tier === 'boss';
    const isElite    = def.tier === 'elite';
    const isMiniboss = def.tier === 'miniboss';

    // Scale stats slightly by zone for progression feel
    const zoneScale = 1 + (zoneId - 1) * 0.12;
    const hp  = Math.floor(def.hp  * zoneScale);
    const atk = Math.floor(def.atk * zoneScale);

    this.enemies.push({
      id: this._nextId++,
      type,
      zoneId,
      bounds,
      x: col * TILE_SIZE + TILE_SIZE / 2,
      y: row * TILE_SIZE + TILE_SIZE / 2,
      hp,
      maxHp: hp,
      atk,
      def: def.def,
      speed: def.speed,
      range: def.range,
      color: def.color,
      icon: def.icon,
      name: def.name,
      tier: def.tier,
      xp: Math.floor(def.xp * zoneScale),
      state: 'idle',
      attackCooldown: 0,
      chargeCooldown: 0,
      alertRadius: isBoss ? 300 : isMiniboss ? 260 : isElite ? 220 : 180,
      projectiles: (def.tier === 'ranged' || def.tier === 'miniboss') && def.projectileColor ? [] : undefined,
      projectileColor: def.projectileColor,
      hitFlash: 0,
      dead: false,
    });
  }

  // Legacy single-spawn for respawns
  _spawnEnemy(type, bounds, zoneId) {
    const def = ENEMY_TYPES[type];
    if (!def) return;
    let attempts = 0, col, row;
    do {
      col = bounds[0] + Math.floor(Math.random() * (bounds[1] - bounds[0]));
      row = bounds[2] + Math.floor(Math.random() * (bounds[3] - bounds[2]));
      attempts++;
      if (attempts < 30 && getZoneAt(col, row).id !== zoneId) continue;
    } while (attempts < 40 && this._isBadSpawn(col, row));
    if (attempts >= 40) return;
    this._spawnAt(type, col, row, bounds, zoneId);
  }

  _isBadSpawn(col, row) {
    if (col < 1 || col >= WORLD_COLS - 1 || row < 1 || row >= WORLD_ROWS - 1) return true;
    if (this.world.getTile(col, row) === TILE.WATER) return true;
    if (this.world.isBlocked(col, row)) return true;
    if (Math.abs(col - 185) < 16 && Math.abs(row - 390) < 16) return true;
    return false;
  }

  update(dt, px, py, gameState, pushDamageNumber, pushEffect) {
    const now = performance.now();
    const playerLevel = gameState.level || 1;

    // Respawn queue
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

      if (e.attackCooldown > 0) e.attackCooldown -= dt;
      if (e.chargeCooldown > 0) e.chargeCooldown -= dt;
      if (e.hitFlash > 0) e.hitFlash -= dt;

      const dx = px - e.x;
      const dy = py - e.y;
      const dist = Math.sqrt(dx * dx + dy * dy);

      // Projectile updates
      if (e.projectiles) {
        e.projectiles = e.projectiles.filter(p => {
          p.x += p.vx * dt;
          p.y += p.vy * dt;
          p.life -= dt;
          const pdx = p.x - px, pdy = p.y - py;
          if (Math.sqrt(pdx * pdx + pdy * pdy) < 20) {
            playerDmgTotal += p.dmg;
            pushDamageNumber(px, py - 20, `-${p.dmg}`, '#ff4444', false);
            p.life = 0;
          }
          return p.life > 0;
        });
      }

      // Alert
      if (dist < e.alertRadius) {
        e.state = 'chase';
      } else if (e.state === 'chase' && dist > e.alertRadius + 80) {
        e.state = 'idle';
      }

      if (e.state === 'chase' || e.state === 'attack') {
        const def = ENEMY_TYPES[e.type];
        const isBoss = def.tier === 'boss';
        const isMiniboss = def.tier === 'miniboss';

        // ── Boss / miniboss: charge attack ──
        if ((isBoss || isMiniboss) && e.chargeCooldown <= 0 && dist < (isBoss ? 320 : 250)) {
          e.state = 'charge';
          e.chargeVx = (dx / dist) * (isBoss ? 300 : 240);
          e.chargeVy = (dy / dist) * (isBoss ? 300 : 240);
          e.chargeDuration = isBoss ? 0.5 : 0.4;
          e.chargeCooldown = isBoss ? 8 : 6;
          pushDamageNumber(e.x, e.y - 40, isBoss ? 'CHARGE!' : 'RUSH!', '#ff9800', true);
        }

        if (e.state === 'charge') {
          e.x += e.chargeVx * dt;
          e.y += e.chargeVy * dt;
          e.chargeDuration -= dt;
          if (e.chargeDuration <= 0) e.state = 'chase';
          const cdx = e.x - px, cdy = e.y - py;
          if (Math.sqrt(cdx * cdx + cdy * cdy) < 36) {
            const dmg = Math.max(1, e.atk * 2 - (gameState.equipStats?.defense || 0));
            playerDmgTotal += dmg;
            pushDamageNumber(px, py - 20, `-${dmg}`, '#ff2222', true);
            e.state = 'idle';
          }
        } else if (def.tier === 'ranged' || (isMiniboss && e.projectiles)) {
          // Ranged / frost witch
          const preferredDist = e.range * 0.65;
          if (dist < preferredDist) {
            const nx = e.x - (dx / dist) * e.speed * dt;
            const ny = e.y - (dy / dist) * e.speed * dt;
            if (!this._blocked(nx, ny)) { e.x = nx; e.y = ny; }
          } else if (dist > e.range) {
            const nx = e.x + (dx / dist) * e.speed * dt;
            const ny = e.y + (dy / dist) * e.speed * dt;
            if (!this._blocked(nx, ny)) { e.x = nx; e.y = ny; }
          }
          if (e.attackCooldown <= 0 && dist < e.range) {
            const speed = isMiniboss ? 190 : 160;
            const angle = Math.atan2(dy, dx);
            const jitter = (Math.random() - 0.5) * (isMiniboss ? 0.15 : 0.3);
            const dmg = Math.max(1, e.atk - Math.floor((gameState.equipStats?.defense || 0) * 0.5));
            e.projectiles.push({ x: e.x, y: e.y, vx: Math.cos(angle + jitter) * speed, vy: Math.sin(angle + jitter) * speed, dmg, life: 2.5, color: e.projectileColor });
            e.attackCooldown = isMiniboss ? 1.8 : 2.2;
          }
        } else {
          // Melee move
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
            const cdBase = isMiniboss ? 2.2 : def.tier === 'elite' ? 1.8 : 1.2;
            e.attackCooldown = cdBase;
            pushEffect(e.x, e.y, 18, 0.3, e.color);
          }
        }
      }
    }

    // Collect dead
    for (const e of this.enemies) {
      if (e.dead) {
        dead.push(e);
        // Mini-bosses and bosses guaranteed drop; others roll
        const loot = rollLoot(e.type, playerLevel);
        if (loot) lootDrops.push(loot);
        // Miniboss drops an extra loot item always
        if (e.tier === 'miniboss') {
          const bonus = rollLoot(e.type, playerLevel);
          if (bonus) lootDrops.push(bonus);
        }
      }
    }
    this.enemies = this.enemies.filter(e => !e.dead);

    for (const e of dead) {
      const def = ENEMY_TYPES[e.type];
      let delay;
      if (def.tier === 'boss')     delay = 180000;
      else if (def.tier === 'miniboss') delay = 90000;
      else delay = 25000;
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

  applyAbilityDamage(px, py, abilityType, skillLevel, classAtk, equipAtk, targetX, targetY) {
    const totalAtk = classAtk + equipAtk;
    const lvlBonus = 1 + skillLevel * 0.3;
    const results = [];

    // Use aimed target position if provided, otherwise fall back to player pos
    const tx = targetX !== undefined ? targetX : px;
    const ty = targetY !== undefined ? targetY : py;

    let baseMult;
    if (abilityType === 'single')        { baseMult = 1.2 + Math.random() * 0.4; }
    else if (abilityType === 'aoe')      { baseMult = 0.8 + Math.random() * 0.3; }
    else if (abilityType === 'ultimate') { baseMult = 2.5 + Math.random() * 0.5; }
    else return results;

    // Direction vector from player to target (for line/single skills)
    const dirDx = tx - px;
    const dirDy = ty - py;
    const dirLen = Math.sqrt(dirDx * dirDx + dirDy * dirDy) || 1;
    const dirNx = dirDx / dirLen;
    const dirNy = dirDy / dirLen;

    for (const e of this.enemies) {
      if (e.dead) continue;
      const ex = e.x - px, ey = e.y - py;
      const distFromPlayer = Math.sqrt(ex * ex + ey * ey);

      let inHitZone = false;

      if (abilityType === 'single') {
        // Line/projectile hit: enemy must be within a cone/rectangle toward target
        // Project enemy onto the aim direction
        const proj = ex * dirNx + ey * dirNy; // distance along aim axis
        const perp = Math.abs(ex * (-dirNy) + ey * dirNx); // distance perpendicular
        const maxRange = Math.max(dirLen * 1.1, 90); // at least 90px, up to aimed range + 10%
        inHitZone = proj >= -16 && proj <= maxRange && perp <= 28 && distFromPlayer <= maxRange;

      } else if (abilityType === 'aoe') {
        // Circle centered on target
        const dtx = e.x - tx, dty = e.y - ty;
        const distFromTarget = Math.sqrt(dtx * dtx + dty * dty);
        inHitZone = distFromTarget <= 160;

      } else if (abilityType === 'ultimate') {
        // Large circle centered on target
        const dtx = e.x - tx, dty = e.y - ty;
        const distFromTarget = Math.sqrt(dtx * dtx + dty * dty);
        inHitZone = distFromTarget <= 200;
      }

      if (!inHitZone) continue;

      const raw = Math.floor(totalAtk * baseMult * lvlBonus);
      const dmg = Math.max(1, raw - Math.floor(e.def * 0.5));
      e.hp -= dmg;
      e.hitFlash = 0.15;
      results.push({ x: e.x, y: e.y, dmg, killed: e.hp <= 0 });
      if (e.hp <= 0) e.dead = true;
    }
    return results;
  }

  draw(ctx, camX, camY, playerSX, playerSY, fogRadiusWorld) {
    for (const e of this.enemies) {
      this._drawEnemy(ctx, e, camX, camY, playerSX, playerSY, fogRadiusWorld);
    }
    // Projectiles
    for (const e of this.enemies) {
      if (!e.projectiles) continue;
      for (const p of e.projectiles) {
        const sx = p.x - camX, sy = p.y - camY;
        ctx.save();
        ctx.fillStyle = p.color || '#ff0';
        ctx.shadowColor = p.color || '#ff0';
        ctx.shadowBlur = 8;
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

    if (sx < -60 || sx > ctx.canvas.width + 60 || sy < -60 || sy > ctx.canvas.height + 60) return;

    const distFromPlayer = fogRadiusWorld != null && playerSX != null
      ? Math.sqrt((sx - playerSX) ** 2 + (sy - playerSY) ** 2) : 0;
    const labelAlpha = fogRadiusWorld != null
      ? Math.max(0, Math.min(1, 1 - (distFromPlayer - fogRadiusWorld * 0.7) / (fogRadiusWorld * 0.3))) : 1;

    const isBoss     = e.tier === 'boss';
    const isMiniboss = e.tier === 'miniboss';
    const isElite    = e.tier === 'elite';
    const scale = isBoss ? 2.2 : isMiniboss ? 1.8 : isElite ? 1.4 : 1.0;
    const r = 12 * scale;

    ctx.save();
    if (e.hitFlash > 0) ctx.globalAlpha = 0.85;

    // Shadow
    ctx.fillStyle = 'rgba(0,0,0,0.35)';
    ctx.beginPath();
    ctx.ellipse(sx, sy + r + 4, r * 0.9, r * 0.35, 0, 0, Math.PI * 2);
    ctx.fill();

    // Aura glow for special tiers
    if (isElite || isMiniboss || isBoss) {
      const glowColor = isBoss ? '#ff9800' : isMiniboss ? '#e040fb' : e.color;
      const grd = ctx.createRadialGradient(sx, sy, 0, sx, sy, r * 2.2);
      grd.addColorStop(0, glowColor + '66');
      grd.addColorStop(1, 'transparent');
      ctx.fillStyle = grd;
      ctx.beginPath();
      ctx.arc(sx, sy, r * 2.2, 0, Math.PI * 2);
      ctx.fill();
    }

    // Body
    ctx.fillStyle = e.hitFlash > 0 ? '#ffffff' : e.color;
    ctx.beginPath();
    ctx.arc(sx, sy, r, 0, Math.PI * 2);
    ctx.fill();

    // Border
    const borderColor = isBoss ? '#ff9800' : isMiniboss ? '#e040fb' : isElite ? '#ffd700' : 'rgba(0,0,0,0.4)';
    ctx.strokeStyle = borderColor;
    ctx.lineWidth = isBoss ? 4 : isMiniboss ? 3 : isElite ? 2 : 1;
    ctx.stroke();

    // Icon
    ctx.font = `${isBoss ? 22 : isMiniboss ? 18 : isElite ? 16 : 13}px serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(e.icon, sx, sy);

    // Labels — fog-culled
    if (labelAlpha > 0) {
      ctx.save();
      ctx.globalAlpha = (ctx.globalAlpha || 1) * labelAlpha;

      // Tier badge
      if (isBoss) {
        ctx.font = 'bold 8px Cinzel, serif';
        ctx.fillStyle = '#ff9800';
        ctx.textBaseline = 'alphabetic';
        ctx.fillText('⚠ BOSS', sx, sy - r - 24);
      } else if (isMiniboss) {
        ctx.font = 'bold 8px Cinzel, serif';
        ctx.fillStyle = '#e040fb';
        ctx.textBaseline = 'alphabetic';
        ctx.fillText('◆ MINI-BOSS', sx, sy - r - 22);
      } else if (isElite) {
        ctx.font = 'bold 8px Cinzel, serif';
        ctx.fillStyle = '#ffd700';
        ctx.textBaseline = 'alphabetic';
        ctx.fillText('★ ELITE', sx, sy - r - 20);
      }

      // Name
      ctx.font = `bold ${isBoss ? 11 : isMiniboss ? 10 : 9}px Cinzel, serif`;
      ctx.fillStyle = isBoss ? '#ff9800' : isMiniboss ? '#e040fb' : isElite ? '#ffd700' : '#ddd';
      ctx.textBaseline = 'alphabetic';
      ctx.fillText(e.name, sx, sy - r - 10);

      // HP bar
      const barW = isBoss ? 90 : isMiniboss ? 70 : isElite ? 54 : 36;
      const barH = isBoss ? 8 : isMiniboss ? 7 : 5;
      const barX = sx - barW / 2;
      const barY = sy - r - 8;
      const hpPct = Math.max(0, e.hp / e.maxHp);
      ctx.fillStyle = 'rgba(0,0,0,0.65)';
      ctx.fillRect(barX, barY, barW, barH);
      ctx.fillStyle = hpPct > 0.5 ? '#4caf50' : hpPct > 0.25 ? '#ff9800' : '#f44336';
      ctx.fillRect(barX, barY, barW * hpPct, barH);

      ctx.restore();
    }

    ctx.restore();
  }
}