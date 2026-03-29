import { TILE_SIZE, WORLD_COLS, WORLD_ROWS, getZoneAt } from './constants.js';
import { TILE } from './WorldGenerator.js';
import { assetIntegration } from './AssetIntegration.js';
import { getEnemyProjectileType } from './CompleteAssetRegistry.js';

// ─── Enemy Definitions ───────────────────────────────────────────────────────
export const ENEMY_TYPES = {
  // ── MELEE ──
  skull:       { name: 'Skull',        tier: 'melee',    color: '#c8c8c8', icon: '💀', hp: 160,  atk: 10, def: 2,  speed: 60, xp: 15,  range: 28, lootMult: 1.0 },
  lancer:      { name: 'Lancer',       tier: 'melee',    color: '#4a90d9', icon: '🗡️', hp: 200,  atk: 14, def: 4,  speed: 65, xp: 22,  range: 30, lootMult: 1.1 },
  thief:       { name: 'Thief',        tier: 'melee',    color: '#9b59b6', icon: '🔪', hp: 140,  atk: 16, def: 2,  speed: 90, xp: 20,  range: 26, lootMult: 1.1 },
  snake:       { name: 'Snake',        tier: 'melee',    color: '#27ae60', icon: '🐍', hp: 130,  atk: 12, def: 1,  speed: 75, xp: 14,  range: 24, lootMult: 1.0 },
  spider:      { name: 'Spider',       tier: 'melee',    color: '#8e44ad', icon: '🕷️', hp: 120,  atk: 11, def: 1,  speed: 80, xp: 13,  range: 24, lootMult: 1.0 },
  bear:        { name: 'Bear',         tier: 'melee',    color: '#795548', icon: '🐻', hp: 380,  atk: 22, def: 8,  speed: 55, xp: 35,  range: 36, lootMult: 1.3 },
  gnome:       { name: 'Gnome',        tier: 'melee',    color: '#e74c3c', icon: '🧙', hp: 180,  atk: 15, def: 3,  speed: 62, xp: 18,  range: 28, lootMult: 1.0 },
  panda:       { name: 'Panda',        tier: 'melee',    color: '#ecf0f1', icon: '🐼', hp: 320,  atk: 20, def: 7,  speed: 50, xp: 30,  range: 34, lootMult: 1.2 },

  // ── RANGED ──
  harpoonfish: { name: 'Harpoon Fish', tier: 'ranged',   color: '#1abc9c', icon: '🐠', hp: 160,  atk: 16, def: 2,  speed: 52, xp: 24,  range: 160, lootMult: 1.1, projectileColor: '#1abc9c' },
  shaman:      { name: 'Shaman',       tier: 'ranged',   color: '#e67e22', icon: '🔮', hp: 190,  atk: 18, def: 3,  speed: 48, xp: 28,  range: 180, lootMult: 1.2, projectileColor: '#e67e22' },
  gnoll:       { name: 'Gnoll',        tier: 'ranged',   color: '#f39c12', icon: '🦴', hp: 200,  atk: 17, def: 4,  speed: 50, xp: 26,  range: 170, lootMult: 1.2, projectileColor: '#f39c12' },

  // ── ELITE ──
  turtle:      { name: 'Turtle',       tier: 'elite',    color: '#16a085', icon: '🐢', hp: 320,  atk: 30, def: 18, speed: 34, xp: 80,  range: 32, lootMult: 2.2 },
  lizard:      { name: 'Lizard',       tier: 'elite',    color: '#2ecc71', icon: '🦎', hp: 280,  atk: 38, def: 12, speed: 60, xp: 90,  range: 34, lootMult: 2.2 },
  minotaur:    { name: 'Minotaur',     tier: 'elite',    color: '#c0392b', icon: '🐂', hp: 400,  atk: 45, def: 15, speed: 48, xp: 110, range: 40, lootMult: 2.8 },
  alpha_skull: { name: 'Alpha Skull',  tier: 'elite',    color: '#ff4444', icon: '☠️', hp: 180,  atk: 28, def: 6,  speed: 70, xp: 55,  range: 30, lootMult: 2.0 },
  viper:       { name: 'Viper',        tier: 'elite',    color: '#00e676', icon: '🐍', hp: 150,  atk: 32, def: 5,  speed: 90, xp: 50,  range: 28, lootMult: 2.0 },
  frost_bear:  { name: 'Frost Bear',   tier: 'elite',    color: '#80deea', icon: '🐻', hp: 380,  atk: 40, def: 16, speed: 44, xp: 95,  range: 38, lootMult: 2.3 },
  shadow_panda:{ name: 'Shadow Panda', tier: 'elite',    color: '#7c4dff', icon: '🐼', hp: 340,  atk: 42, def: 14, speed: 55, xp: 100, range: 36, lootMult: 2.4 },

  // ── MINI-BOSS ──
  troll:       { name: 'Troll',        tier: 'miniboss', color: '#4caf50', icon: '👾', hp: 600,  atk: 48, def: 14, speed: 42, xp: 200, range: 44, lootMult: 3.5 },
  wraith:      { name: 'Wraith',       tier: 'miniboss', color: '#9c27b0', icon: '👻', hp: 480,  atk: 55, def: 10, speed: 70, xp: 220, range: 38, lootMult: 3.5 },
  golem:       { name: 'Stone Golem',  tier: 'miniboss', color: '#78909c', icon: '🗿', hp: 800,  atk: 50, def: 22, speed: 30, xp: 250, range: 48, lootMult: 4.0 },
  warlord:     { name: 'Warlord',      tier: 'miniboss', color: '#ef5350', icon: '⚔️', hp: 700,  atk: 62, def: 16, speed: 48, xp: 280, range: 46, lootMult: 4.0 },
  frost_witch: { name: 'Frost Witch',  tier: 'miniboss', color: '#4fc3f7', icon: '🧙', hp: 550,  atk: 60, def: 12, speed: 55, xp: 260, range: 200, lootMult: 3.8, projectileColor: '#4fc3f7' },

  // ── BOSS ──
  ogre:        { name: 'Ogre',         tier: 'boss',     color: '#7f8c8d', icon: '👹', hp: 1200, atk: 70, def: 20, speed: 38, xp: 500, range: 50, lootMult: 5.0 },

  // ── TRAINING DUMMY (GM testing) ──
  dummy:       { name: 'Training Dummy', tier: 'dummy',   color: '#888888', icon: '🎯', hp: 1000, atk: 0, def: 0, speed: 0, xp: 0, range: 0, lootMult: 0 },
};

// ─── Zone enemy tables ────────────────────────────────────────────────────────
const ZONE_NORMAL = {
  1: ['skull', 'thief', 'lancer', 'gnome'],
  2: ['lancer', 'thief', 'snake', 'spider', 'gnoll', 'harpoonfish'],
  3: ['snake', 'spider', 'bear', 'gnoll', 'harpoonfish', 'shaman'],
  4: ['bear', 'panda', 'gnoll', 'shaman'],
  5: ['panda', 'shaman'],
};

const ZONE_ELITES = {
  1: ['alpha_skull'],
  2: ['alpha_skull', 'viper', 'turtle'],
  3: ['turtle', 'viper', 'lizard'],
  4: ['frost_bear', 'lizard', 'minotaur'],
  5: ['shadow_panda', 'minotaur', 'frost_bear'],
};

const MINI_BOSS_SPAWNS = [
  { type: 'troll',       col: 65,  row: 350 },
  { type: 'wraith',      col: 220, row: 490 },
  { type: 'troll',       col: 465, row: 350 },
  { type: 'golem',       col: 400, row: 285 },
  { type: 'golem',       col: 160, row: 260 },
  { type: 'warlord',     col: 30,  row: 295 },
  { type: 'frost_witch', col: 445, row: 265 },
  { type: 'golem',       col: 305, row: 250 },
  { type: 'warlord',     col: 150, row: 75  },
  { type: 'frost_witch', col: 310, row: 75  },
];

// ─── Loot tables ──────────────────────────────────────────────────────────────
const RARITY_POOL = {
  normal:   ['common','common','common','common','uncommon','uncommon','rare'],
  elite:    ['uncommon','uncommon','rare','rare','epic'],
  miniboss: ['rare','rare','epic','epic','legendary'],
  boss:     ['epic','epic','legendary','legendary'],
};

// Armor slots shared across all classes
const ARMOR_SLOTS = ['helmet','chest','pants','gloves','boots'];

// Per-class weapon definitions: slot name, icon, display name fragments
const CLASS_WEAPONS = {
  warrior: [
    { slot: 'weapon', icon: '⚔️', names: ['Sword','Blade','Longsword','Claymore','Broadsword'] },
    { slot: 'shield', icon: '🛡️', names: ['Shield','Buckler','Ward','Aegis','Bulwark'] },
  ],
  lancer: [
    { slot: 'weapon', icon: '🗡️', names: ['Spear','Lance','Pike','Halberd','Glaive'] },
  ],
  archer: [
    { slot: 'weapon', icon: '🏹', names: ['Bow','Longbow','Shortbow','Recurve','Greatbow'] },
  ],
  monk: [
    { slot: 'weapon', icon: '🪄', names: ['Staff','Rod','Wand','Scepter','Focus'] },
  ],
};

const ARMOR_NAMES = {
  helmet: ['Helm','Crown','Hood','Coif','Visor'],
  chest:  ['Plate','Chestpiece','Hauberk','Cuirass','Breastplate'],
  pants:  ['Greaves','Legguards','Chausses','Cuisses','Tassets'],
  gloves: ['Gauntlets','Grips','Gloves','Handguards','Vambraces'],
  boots:  ['Boots','Sabatons','Treads','Stompers','Greaves'],
};

const PREFIXES = ['Iron','Shadow','Frost','Divine','Ancient','Cursed','Radiant','Void','Storm','Ember','Bone','Arcane'];
const RARITY_MULT = { common:1, uncommon:1.5, rare:2.2, epic:3.5, legendary:6 };

// Neutral ring/accessory loot (no class restriction — always usable)
const NEUTRAL_ITEMS = [
  { slot: 'ring',    icon: '💍', names: ['Ring','Band','Signet','Loop','Seal'],       stats: (lvl, mult) => ({ attack: Math.floor((2 + lvl) * mult), defense: Math.floor((1 + lvl * 0.5) * mult) }) },
  { slot: 'amulet',  icon: '📿', names: ['Amulet','Pendant','Charm','Talisman'],       stats: (lvl, mult) => ({ attack: Math.floor((1 + lvl) * mult), defense: Math.floor((2 + lvl) * mult) }) },
  { slot: 'trinket', icon: '🔮', names: ['Orb','Crystal','Gem','Shard','Focus'],       stats: (lvl, mult) => ({ attack: Math.floor((3 + lvl * 1.2) * mult), defense: 0 }) },
];

// Build a single class-aware loot item
function buildLootItem(playerLevel, playerClassId, rarity) {
  const classId  = playerClassId || 'warrior';
  const mult     = RARITY_MULT[rarity];
  const prefix   = PREFIXES[Math.floor(Math.random() * PREFIXES.length)];

  // 70% → class weapon or armor | 30% → neutral accessory
  if (Math.random() < 0.70) {
    // 35% of the 70% → class-specific weapon; rest → armor
    const rollWeapon = Math.random() < 0.35;
    const classWeaponPool = CLASS_WEAPONS[classId] || CLASS_WEAPONS.warrior;

    if (rollWeapon && classWeaponPool.length > 0) {
      const weaponDef = classWeaponPool[Math.floor(Math.random() * classWeaponPool.length)];
      const namePart  = weaponDef.names[Math.floor(Math.random() * weaponDef.names.length)];
      const isShield  = weaponDef.slot === 'shield';
      return {
        id: `loot_${Date.now()}_${Math.random()}`,
        name: `${prefix} ${namePart}`,
        slot: weaponDef.slot,
        rarity,
        icon: weaponDef.icon,
        weaponClass: classId,
        classRestriction: classId,
        stats: {
          attack:  isShield ? 0 : Math.floor((4 + playerLevel * 2) * mult),
          defense: isShield ? Math.floor((3 + playerLevel * 1.5) * mult) : 0,
        },
      };
    } else {
      // Armor — usable by all classes
      const armorSlot = ARMOR_SLOTS[Math.floor(Math.random() * ARMOR_SLOTS.length)];
      const namePart  = ARMOR_NAMES[armorSlot][Math.floor(Math.random() * ARMOR_NAMES[armorSlot].length)];
      return {
        id: `loot_${Date.now()}_${Math.random()}`,
        name: `${prefix} ${namePart}`,
        slot: armorSlot,
        rarity,
        icon: { helmet:'⛑️', chest:'🧥', pants:'👖', gloves:'🧤', boots:'👢' }[armorSlot],
        classRestriction: 'all',
        stats: { attack: 0, defense: Math.floor((2 + playerLevel) * mult) },
      };
    }
  } else {
    // 30% → neutral accessory (ring / amulet / trinket)
    const neutralDef = NEUTRAL_ITEMS[Math.floor(Math.random() * NEUTRAL_ITEMS.length)];
    const namePart   = neutralDef.names[Math.floor(Math.random() * neutralDef.names.length)];
    return {
      id: `loot_${Date.now()}_${Math.random()}`,
      name: `${prefix} ${namePart}`,
      slot: neutralDef.slot,
      rarity,
      icon: neutralDef.icon,
      classRestriction: 'all',
      stats: neutralDef.stats(playerLevel, mult),
    };
  }
}

function rollLoot(enemyType, playerLevel, playerClassId) {
  const def  = ENEMY_TYPES[enemyType];
  const tier = def.tier;

  const dropChance = { boss: 1.0, miniboss: 1.0, elite: 0.75, ranged: 0.22, melee: 0.16 }[tier] ?? 0.16;
  if (Math.random() > dropChance * def.lootMult) return null;

  const pool   = RARITY_POOL[tier] || RARITY_POOL.normal;
  const rarity = pool[Math.floor(Math.random() * pool.length)];

  return buildLootItem(playerLevel, playerClassId, rarity);
}

// ─── Camp group aggro radius ──────────────────────────────────────────────────
const CAMP_SUPPORT_RADIUS = 160; // world px — allies within this range join the fight

// ─── EnemyManager ────────────────────────────────────────────────────────────
export class EnemyManager {
  constructor(world) {
    this.world = world;
    this.enemies = [];
    this.respawnQueue = [];
    this._nextId = 1;
    this._initialSpawn();
  }

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
    const ZONE_CAMPS  = { 1: 50, 2: 60, 3: 55, 4: 60, 5: 50 };
    const CAMP_SIZE   = { 1: [3,4], 2: [3,4], 3: [3,5], 4: [4,5], 5: [4,5] };
    const ELITE_CAMPS = { 1: 6, 2: 8, 3: 8, 4: 10, 5: 10 };

    for (let zoneId = 1; zoneId <= 5; zoneId++) {
      const bounds = this._getZoneSearchBounds(zoneId);
      const camps  = ZONE_CAMPS[zoneId];
      const [minCamp, maxCamp] = CAMP_SIZE[zoneId];
      const types  = ZONE_NORMAL[zoneId];

      for (let p = 0; p < camps; p++) {
        const center = this._findValidSpot(bounds, zoneId, 40);
        if (!center) continue;
        const campType = types[Math.floor(Math.random() * types.length)];
        const count = minCamp + Math.floor(Math.random() * (maxCamp - minCamp + 1));
        // Assign a campId so members can support each other
        const campId = this._nextId * 1000 + p;
        for (let i = 0; i < count; i++) {
          const scatter = 4 * TILE_SIZE;
          const ox = (Math.random() - 0.5) * scatter * 2;
          const oy = (Math.random() - 0.5) * scatter * 2;
          const col = Math.floor((center.x + ox) / TILE_SIZE);
          const row = Math.floor((center.y + oy) / TILE_SIZE);
          if (!this._isBadSpawn(col, row)) {
            this._spawnAt(campType, col, row, bounds, zoneId, i === 0, campId);
          }
        }
      }

      const eliteCamps = ELITE_CAMPS[zoneId];
      const eliteTypes = ZONE_ELITES[zoneId];
      for (let p = 0; p < eliteCamps; p++) {
        const center = this._findValidSpot(bounds, zoneId, 60);
        if (!center) continue;
        const eliteType = eliteTypes[Math.floor(Math.random() * eliteTypes.length)];
        const count = 1 + Math.floor(Math.random() * 2);
        const campId = this._nextId * 1000 + p + 9999;
        for (let i = 0; i < count; i++) {
          const scatter = 3 * TILE_SIZE;
          const ox = (Math.random() - 0.5) * scatter * 2;
          const oy = (Math.random() - 0.5) * scatter * 2;
          const col = Math.floor((center.x + ox) / TILE_SIZE);
          const row = Math.floor((center.y + oy) / TILE_SIZE);
          if (!this._isBadSpawn(col, row)) {
            this._spawnAt(eliteType, col, row, bounds, zoneId, false, campId);
          }
        }
      }
    }

    for (const mb of MINI_BOSS_SPAWNS) {
      if (!this._isBadSpawn(mb.col, mb.row)) {
        const zoneId = getZoneAt(mb.col, mb.row).id;
        const bounds = this._getZoneSearchBounds(zoneId);
        this._spawnAt(mb.type, mb.col, mb.row, bounds, zoneId);
      }
    }

    this._spawnAt('ogre', 210, 65, this._getZoneSearchBounds(5), 5);
  }

  _findValidSpot(bounds, zoneId, minSpacing) {
    for (let attempt = 0; attempt < 50; attempt++) {
      const col = bounds[0] + Math.floor(Math.random() * (bounds[1] - bounds[0]));
      const row = bounds[2] + Math.floor(Math.random() * (bounds[3] - bounds[2]));
      if (getZoneAt(col, row).id !== zoneId) continue;
      if (this._isBadSpawn(col, row)) continue;
      const x = col * TILE_SIZE + TILE_SIZE / 2;
      const y = row * TILE_SIZE + TILE_SIZE / 2;
      const tooClose = this.enemies.some(e => Math.sqrt((e.x - x) ** 2 + (e.y - y) ** 2) < minSpacing * TILE_SIZE * 0.5);
      if (!tooClose) return { x, y };
    }
    return null;
  }

  _spawnAt(type, col, row, bounds, zoneId, isLeader = false, campId = null) {
    const def = ENEMY_TYPES[type];
    if (!def) return;

    const isDummy    = def.tier === 'dummy';
    const isBoss     = def.tier === 'boss';
    const isElite    = def.tier === 'elite';
    const isMiniboss = def.tier === 'miniboss';
    const isNormalLeader = isLeader && !isElite && !isMiniboss && !isBoss && !isDummy;

    const zoneScale   = 1 + (zoneId - 1) * 0.12;
    const leaderScale = isNormalLeader ? 1.2 : 1.0;
    const hp  = Math.floor(def.hp  * zoneScale * leaderScale);
    const atk = Math.floor(def.atk * zoneScale);

    this.enemies.push({
      id: this._nextId++,
      type,
      zoneId,
      bounds,
      campId,
      x: col * TILE_SIZE + TILE_SIZE / 2,
      y: row * TILE_SIZE + TILE_SIZE / 2,
      homeX: col * TILE_SIZE + TILE_SIZE / 2,
      homeY: row * TILE_SIZE + TILE_SIZE / 2,
      hp,
      maxHp: hp,
      atk,
      def: def.def,
      speed: def.speed,
      range: def.range,
      color: def.color,
      icon: isNormalLeader ? '⭐' : def.icon,
      name: isNormalLeader ? def.name + ' Leader' : def.name,
      tier: def.tier,
      isLeader: isNormalLeader,
      xp: Math.floor(def.xp * zoneScale * leaderScale),
      state: isDummy ? 'dummy' : 'idle',
      attackCooldown: 0,
      chargeCooldown: 0,
      // Alert radii: melee/ranged see player from closer; elite/boss from further
      alertRadius: isBoss ? 320 : isMiniboss ? 280 : isElite ? 240 : isDummy ? 0 : 190,
      projectiles: (def.tier === 'ranged' || (def.tier === 'miniboss' && def.projectileColor)) ? [] : undefined,
      projectileColor: def.projectileColor,
      hitFlash: 0,
      dead: false,
      deathTimer: null,
      isInvulnerable: isDummy,
    });
  }

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

  // Trigger camp-wide aggro: all allies sharing the same campId within support radius join the fight
  _triggerCampAggro(aggroEnemy, px, py) {
    if (!aggroEnemy.campId) return;
    for (const e of this.enemies) {
      if (e.dead || e === aggroEnemy || e.campId !== aggroEnemy.campId) continue;
      if (e.state !== 'idle') continue;
      const dx = e.x - aggroEnemy.x, dy = e.y - aggroEnemy.y;
      const dist = Math.sqrt(dx * dx + dy * dy);
      if (dist < CAMP_SUPPORT_RADIUS) {
        e.state = 'chase';
      }
    }
  }

  update(dt, px, py, gameState, pushDamageNumber, pushEffect) {
    const now = performance.now();
    const playerLevel  = gameState.level || 1;
    const playerClassId = gameState.classData?.id || 'warrior';

    // Respawn queue
    this.respawnQueue = this.respawnQueue.filter(r => {
      if (now >= r.spawnTime) { this._spawnEnemy(r.type, r.bounds, r.zoneId); return false; }
      return true;
    });

    const dead = [];
     const lootDrops = [];
     let playerDmgTotal = 0;

     for (const e of this.enemies) {
       // Update death fade timer
       if (e.deathTimer !== null) {
         e.deathTimer -= dt;
         if (e.deathTimer <= 0) {
           dead.push(e);
         }
         continue; // Don't update already-dead enemies
       }
       if (e.dead) continue;

      if (e.attackCooldown > 0) e.attackCooldown -= dt;
      if (e.chargeCooldown  > 0) e.chargeCooldown  -= dt;
      if (e.hitFlash        > 0) e.hitFlash        -= dt;

      const dx = px - e.x;
      const dy = py - e.y;
      const dist = Math.sqrt(dx * dx + dy * dy);

      // ── Projectile physics ──
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

      // ── Idle patrol: random wander when not in combat ──
        if (e.state === 'idle') {
          if (!e.patrolTimer) {
            e.patrolTimer = 3 + Math.random() * 4; // patrol for 3-7 seconds
            e.patrolTarget = { x: e.homeX + (Math.random() - 0.5) * 120, y: e.homeY + (Math.random() - 0.5) * 120 };
          }
          e.patrolTimer -= dt;

          // Wander toward patrol target slowly
          const pdx = e.patrolTarget.x - e.x, pdy = e.patrolTarget.y - e.y;
          const pdist = Math.sqrt(pdx * pdx + pdy * pdy);
          if (pdist > 8) {
            const idleSpeed = e.speed * 0.4; // patrol at 40% normal speed
            const nx = e.x + (pdx / pdist) * idleSpeed * dt;
            const ny = e.y + (pdy / pdist) * idleSpeed * dt;
            if (!this._blocked(nx, ny)) { e.x = nx; e.y = ny; }
          }
        }

        // ── Alert / state transitions ──
        if (dist < e.alertRadius && e.state === 'idle') {
          e.state = 'chase';
          e.patrolTimer = 0; // stop patrol
          // Bring camp allies into the fight
          this._triggerCampAggro(e, px, py);
        } else if (e.state === 'chase' && dist > e.alertRadius + 120) {
          // Enemy lost player — return home
          e.state = 'idle';
          e.patrolTimer = 0;
        }

      // ── Leash system: if too far from home, return ──
      const homeX = e.homeX, homeY = e.homeY;
      const homeDist = Math.sqrt((e.x - homeX) ** 2 + (e.y - homeY) ** 2);
      const LEASH_RANGE = 400; // world pixels — enemies return if player runs too far
      if (e.state !== 'idle' && homeDist > LEASH_RANGE) {
        // Return toward home
        const hdx = homeX - e.x, hdy = homeY - e.y;
        const hlen = Math.sqrt(hdx * hdx + hdy * hdy);
        if (hlen > 8) {
          const nx = e.x + (hdx / hlen) * e.speed * dt;
          const ny = e.y + (hdy / hlen) * e.speed * dt;
          if (!this._blocked(nx, ny)) { e.x = nx; e.y = ny; }
        } else {
          e.state = 'idle'; // Returned home
        }
        return; // Skip normal combat logic
      }

      // ── AI per state ──
      if (e.state === 'charge') {
        // Boss/miniboss charge lunge
        e.x += e.chargeVx * dt;
        e.y += e.chargeVy * dt;
        e.chargeDuration -= dt;
        if (e.chargeDuration <= 0) e.state = 'chase';
        const cdx = e.x - px, cdy = e.y - py;
        if (Math.sqrt(cdx * cdx + cdy * cdy) < 40) {
          const dmg = Math.max(1, e.atk * 2 - (gameState.equipStats?.defense || 0));
          playerDmgTotal += dmg;
          pushDamageNumber(px, py - 20, `-${dmg}`, '#ff2222', true);
          e.state = 'chase';
        }

      } else if (e.state === 'chase' || e.state === 'attack') {
        const def = ENEMY_TYPES[e.type];
        const isBoss     = def.tier === 'boss';
        const isMiniboss = def.tier === 'miniboss';
        const isElite    = def.tier === 'elite';
        const isRanged   = def.tier === 'ranged' || (isMiniboss && !!e.projectileColor);

        // ── Boss / miniboss charge wind-up ──
        if ((isBoss || isMiniboss) && e.chargeCooldown <= 0 && dist < (isBoss ? 340 : 270)) {
          e.state = 'charge';
          e.chargeVx = (dx / dist) * (isBoss ? 320 : 260);
          e.chargeVy = (dy / dist) * (isBoss ? 320 : 260);
          e.chargeDuration = isBoss ? 0.55 : 0.42;
          e.chargeCooldown = isBoss ? 8 : 6;
          pushDamageNumber(e.x, e.y - 40, isBoss ? 'CHARGE!' : 'RUSH!', '#ff9800', true);

        } else if (isRanged) {
          // ── Ranged AI: kite at preferred distance, shoot when in range ──
          const preferredDist = e.range * 0.6;
          const tooClose      = dist < preferredDist;
          const inRange       = dist <= e.range;

          if (tooClose) {
            // Back away from player
            const nx = e.x - (dx / dist) * e.speed * dt;
            const ny = e.y - (dy / dist) * e.speed * dt;
            if (!this._blocked(nx, ny)) { e.x = nx; e.y = ny; }
            else {
              // Try strafing perpendicular if backing is blocked
              const px2 = e.x + (-dy / dist) * e.speed * dt;
              const py2 = e.y + ( dx / dist) * e.speed * dt;
              if (!this._blocked(px2, py2)) { e.x = px2; e.y = py2; }
            }
          } else if (!inRange) {
            // Approach until in range
            const nx = e.x + (dx / dist) * e.speed * dt;
            const ny = e.y + (dy / dist) * e.speed * dt;
            if (!this._blocked(nx, ny)) { e.x = nx; e.y = ny; }
          }

          // Fire projectile when in range and not too close
          if (inRange && !tooClose && e.attackCooldown <= 0) {
            const speed  = isMiniboss ? 200 : 165;
            const angle  = Math.atan2(dy, dx);
            const jitter = (Math.random() - 0.5) * (isMiniboss ? 0.12 : 0.25);
            const dmg    = Math.max(1, e.atk - Math.floor((gameState.equipStats?.defense || 0) * 0.4));
            const projType = getEnemyProjectileType(e.type);
            e.projectiles.push({
              x: e.x, y: e.y,
              vx: Math.cos(angle + jitter) * speed,
              vy: Math.sin(angle + jitter) * speed,
              dmg, life: 2.8, color: e.projectileColor,
              type: projType,
              angle: angle + jitter,
            });
            // Ranged attack cooldown: elites fire faster than normals
            e.attackCooldown = isMiniboss ? 1.6 : isElite ? 1.4 : 2.0;
          }

        } else {
          // ── Melee AI: charge toward player, attack in range ──
          // Use stopRange (similar to player) to prevent overlapping: stop at ~90% of attack range
          const stopRange = Math.max(e.range * 0.9, 28);
          
          if (dist > stopRange) {
            // Chase toward player
            const spd = isElite ? e.speed * 1.1 : e.speed;
            const moveStep = spd * dt;
            // Limit step to avoid overshooting
            const limitedStep = Math.min(moveStep, Math.max(0, dist - stopRange * 0.95));
            const nx = e.x + (dx / dist) * limitedStep;
            const ny = e.y + (dy / dist) * limitedStep;
            if (!this._blocked(nx, ny)) {
              e.x = nx; e.y = ny;
            } else {
              // Slide along axes if blocked
              const nx2 = e.x + (dx / dist) * limitedStep;
              if (!this._blocked(nx2, e.y)) e.x = nx2;
              else {
                const ny2 = e.y + (dy / dist) * limitedStep;
                if (!this._blocked(e.x, ny2)) e.y = ny2;
              }
            }
          }

          // Attack when in range
          if (dist <= e.range && e.attackCooldown <= 0) {
            const dmg = Math.max(1, e.atk - Math.floor((gameState.equipStats?.defense || 0) * (isElite ? 0.3 : 0.5)));
            playerDmgTotal += dmg;
            pushDamageNumber(px, py - 20, `-${dmg}`, isElite ? '#ff8800' : '#ff4444', false);
            // Elites hit slower but harder, miniboss even slower
            const cdBase = isBoss ? 2.5 : isMiniboss ? 2.2 : isElite ? 1.8 : 1.1;
            e.attackCooldown = cdBase + Math.random() * 0.3; // slight jitter so packs don't sync
            pushEffect(e.x, e.y, isElite ? 24 : 18, 0.3, e.color);

            // If player backs away after being hit, melee enemy will chase immediately
            e.state = 'chase';
          }
        }
      }
    }

    // ── Collect dead & loot ──
    for (const e of this.enemies) {
      if (e.dead) {
        dead.push(e);
        // Drop loot
        const loot = rollLoot(e.type, playerLevel, playerClassId);
        if (loot) lootDrops.push(loot);
        if (e.tier === 'miniboss') {
          const bonus = rollLoot(e.type, playerLevel, playerClassId);
          if (bonus) lootDrops.push(bonus);
        }
        // Death burst effect
        pushEffect(e.x, e.y, 28, 0.4, e.color);
      }
    }
    this.enemies = this.enemies.filter(e => !e.dead);

    for (const e of dead) {
      const def = ENEMY_TYPES[e.type];
      let delay = def.tier === 'boss' ? 180000 : def.tier === 'miniboss' ? 90000 : 25000;
      this.respawnQueue.push({ type: e.type, bounds: e.bounds, zoneId: e.zoneId, spawnTime: now + delay });
    }

    return { playerDmgTotal, lootDrops, xpGained: dead.reduce((s, e) => s + e.xp, 0), killCount: dead.length };
  }

  _blocked(wx, wy) {
    const col = Math.floor(wx / TILE_SIZE);
    const row = Math.floor(wy / TILE_SIZE);
    if (col < 0 || col >= WORLD_COLS || row < 0 || row >= WORLD_ROWS) return true;
    if (this.world.getTile(col, row) === TILE.WATER) return true;
    if (this.world.isBlocked(col, row)) return true;
    return false;
  }

  applyAbilityDamage(px, py, abilityType, skillLevel, classAtk, equipAtk, targetX, targetY) {
    const totalAtk = classAtk + equipAtk;
    const lvlBonus = 1 + skillLevel * 0.3;
    const results  = [];

    const tx = targetX !== undefined ? targetX : px;
    const ty = targetY !== undefined ? targetY : py;

    let baseMult;
    if (abilityType === 'single')        baseMult = 1.2 + Math.random() * 0.4;
    else if (abilityType === 'aoe')      baseMult = 0.8 + Math.random() * 0.3;
    else if (abilityType === 'ultimate') baseMult = 2.5 + Math.random() * 0.5;
    else return results;

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
        const proj = ex * dirNx + ey * dirNy;
        const perp = Math.abs(ex * (-dirNy) + ey * dirNx);
        const maxRange = Math.max(dirLen * 1.1, 90);
        inHitZone = proj >= -16 && proj <= maxRange && perp <= 28 && distFromPlayer <= maxRange;
      } else if (abilityType === 'aoe') {
        const dtx = e.x - tx, dty = e.y - ty;
        inHitZone = Math.sqrt(dtx * dtx + dty * dty) <= 160;
      } else if (abilityType === 'ultimate') {
        const dtx = e.x - tx, dty = e.y - ty;
        inHitZone = Math.sqrt(dtx * dtx + dty * dty) <= 200;
      }

      if (!inHitZone) continue;

      const raw = Math.floor(totalAtk * baseMult * lvlBonus);
      const dmg = Math.max(1, raw - Math.floor(e.def * 0.5));
      
      // Don't damage invulnerable dummy
      if (e.isInvulnerable) {
        e.hitFlash = 0.15; // still show hit indicator
        results.push({ x: e.x, y: e.y, dmg: 0, killed: false });
      } else {
        e.hp -= dmg;
        e.hitFlash = 0.15;
        // Skills hitting an enemy also trigger camp aggro
        if (e.state === 'idle') { e.state = 'chase'; this._triggerCampAggro(e, px, py); }
        results.push({ x: e.x, y: e.y, dmg, killed: e.hp <= 0 });
        if (e.hp <= 0) {
          e.dead = true;
          e.deathTimer = 0.6; // 0.6s fade-out before removal
        }
      }
    }
    return results;
  }

  // Public method for spawning dummy via GM panel
  spawnEnemy(x, y, type) {
    const col = Math.floor(x / TILE_SIZE);
    const row = Math.floor(y / TILE_SIZE);
    const zoneId = 1;
    const bounds = [0, 499, 0, 499];
    if (!this._isBadSpawn(col, row)) {
      this._spawnAt(type, col, row, bounds, zoneId);
    }
  }

  draw(ctx, camX, camY, playerSX, playerSY, fogRadiusWorld) {
    for (const e of this.enemies) {
      this._drawEnemy(ctx, e, camX, camY, playerSX, playerSY, fogRadiusWorld);
    }
    for (const e of this.enemies) {
      if (!e.projectiles) continue;
      for (const p of e.projectiles) {
        const sx = p.x - camX, sy = p.y - camY;
        // Draw projectile with type-specific sprite and rotation
        const angle = p.angle || Math.atan2(p.vy || 0, p.vx || 1);
        const projType = p.type || 'magic';
        assetIntegration.drawProjectile(ctx, sx, sy, angle, projType).catch(() => {
          // Fallback: colored glow circle matching projectile type
          ctx.save();
          const colorMap = { arrow: '#d4a574', magic: '#9c27b0', flame: '#ff6b00', ice: '#4fc3f7', spark: '#ffeb3b', dark: '#424242', default: '#888' };
          const glowColor = colorMap[projType] || colorMap.magic;
          ctx.fillStyle = glowColor;
          ctx.shadowColor = glowColor;
          ctx.shadowBlur = 10;
          ctx.beginPath();
          ctx.arc(sx, sy, 5, 0, Math.PI * 2);
          ctx.fill();
          ctx.restore();
        });
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
    // Death fade-out effect
    if (e.deathTimer !== null) {
      const fadeAlpha = e.deathTimer / 0.6;
      ctx.globalAlpha = Math.min(1, fadeAlpha) * 0.5;
    }
    if (e.hitFlash > 0) ctx.globalAlpha = (ctx.globalAlpha || 1) * 0.85;

    // Shadow
    ctx.fillStyle = 'rgba(0,0,0,0.4)';
    ctx.beginPath();
    ctx.ellipse(sx, sy + r + 4, r * 1.0, r * 0.4, 0, 0, Math.PI * 2);
    ctx.fill();

    // Aura for special tiers
    if (isElite || isMiniboss || isBoss) {
      const glowColor = isBoss ? '#ff9800' : isMiniboss ? '#e040fb' : e.color;
      const grd = ctx.createRadialGradient(sx, sy, 0, sx, sy, r * 2.4);
      grd.addColorStop(0, glowColor + '66');
      grd.addColorStop(1, 'transparent');
      ctx.fillStyle = grd;
      ctx.beginPath();
      ctx.arc(sx, sy, r * 2.4, 0, Math.PI * 2);
      ctx.fill();
    }

    // Draw enemy sprite from registry (async, but don't await in draw loop)
    const { assetIntegration } = require('./AssetIntegration.js');
    const enemyType = e.type || 'goblin';
    const action = e.moving ? 'run' : e.attacking ? 'attack' : 'idle';
    assetIntegration.drawEnemySprite(ctx, enemyType, sx, sy, action, e.facingLeft ? -1 : 1).catch(() => {
      // Fallback: draw circle placeholder
      ctx.fillStyle = e.hitFlash > 0 ? '#ffffff' : e.color;
      ctx.beginPath();
      ctx.arc(sx, sy, r, 0, Math.PI * 2);
      ctx.fill();
    });

    const borderColor = isBoss ? '#ff9800' : isMiniboss ? '#e040fb' : isElite ? '#ffd700' : 'rgba(0,0,0,0.4)';
    ctx.strokeStyle = borderColor;
    ctx.lineWidth = isBoss ? 4 : isMiniboss ? 3 : isElite ? 2 : 1;
    ctx.stroke();

    if (labelAlpha > 0) {
      ctx.save();
      ctx.globalAlpha = (ctx.globalAlpha || 1) * labelAlpha;

      if (isBoss) {
        ctx.font = 'bold 8px Cinzel, serif'; ctx.fillStyle = '#ff9800'; ctx.textBaseline = 'alphabetic';
        ctx.fillText('⚠ BOSS', sx, sy - r - 24);
      } else if (isMiniboss) {
        ctx.font = 'bold 8px Cinzel, serif'; ctx.fillStyle = '#e040fb'; ctx.textBaseline = 'alphabetic';
        ctx.fillText('◆ MINI-BOSS', sx, sy - r - 22);
      } else if (isElite) {
        ctx.font = 'bold 8px Cinzel, serif'; ctx.fillStyle = '#ffd700'; ctx.textBaseline = 'alphabetic';
        ctx.fillText('★ ELITE', sx, sy - r - 20);
      }

      ctx.font = `bold ${isBoss ? 11 : isMiniboss ? 10 : 9}px Cinzel, serif`;
      ctx.fillStyle = isBoss ? '#ff9800' : isMiniboss ? '#e040fb' : isElite ? '#ffd700' : '#ddd';
      ctx.textBaseline = 'alphabetic';
      ctx.fillText(e.name, sx, sy - r - 10);

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