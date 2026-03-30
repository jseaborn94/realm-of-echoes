/**
 * CompleteAssetRegistry.js
 *
 * Rebuilt from VERIFIED flat PNG files in:
 * https://github.com/jseaborn94/realm-of-echoes/tree/main/Assets
 *
 * Raw base URL: https://raw.githubusercontent.com/jseaborn94/realm-of-echoes/main/Assets/
 *
 * All filenames below were individually verified to exist at that path.
 * DO NOT add any path that was not verified — 404s break the preloader.
 */

const BASE = 'https://raw.githubusercontent.com/jseaborn94/realm-of-echoes/main/Assets';

// ─────────────────────────────────────────────────────────────
// VERIFIED TEST URLS (used by SpriteDebugRenderer)
// ─────────────────────────────────────────────────────────────
export const TEST_PLAYER_URL  = `${BASE}/Archer_Idle.png`;   // ✅ verified 4.95 KB
export const TEST_NPC_URL     = `${BASE}/Avatars_01.png`;     // ✅ verified 5.96 KB
export const TEST_ENEMY_URL   = `${BASE}/Bear_Idle.png`;      // ✅ verified 11.2 KB
export const TEST_PROJECTILE_URL = `${BASE}/Arrow.png`;       // ✅ verified 447 B

// ─────────────────────────────────────────────────────────────
// PLAYER SPRITES
// Verified files: Archer_Idle.png, Archer_Run.png, Archer_Shoot.png
//                 Warrior_Idle.png, Warrior_Run.png
//                 Lancer_Idle.png, Lancer_Run.png, Lancer_Attack.png
// Note: Warrior_Attack.png = NOT found → falls back to idle
//       Monk_Idle.png      = NOT found → uses Lancer as fallback
// ─────────────────────────────────────────────────────────────
export const PLAYER_SPRITES = {
  archer: {
    idle:   `${BASE}/Archer_Idle.png`,
    move:   `${BASE}/Archer_Run.png`,
    attack: `${BASE}/Archer_Shoot.png`,
  },
  warrior: {
    idle:   `${BASE}/Warrior_Idle.png`,
    move:   `${BASE}/Warrior_Run.png`,
    attack: `${BASE}/Warrior_Idle.png`,   // Warrior_Attack.png not uploaded yet — fallback to idle
  },
  lancer: {
    idle:   `${BASE}/Lancer_Idle.png`,
    move:   `${BASE}/Lancer_Run.png`,
    attack: `${BASE}/Lancer_Attack.png`,
  },
  monk: {
    idle:   `${BASE}/Lancer_Idle.png`,    // Monk_Idle.png not uploaded yet — fallback to Lancer
    move:   `${BASE}/Lancer_Run.png`,
    attack: `${BASE}/Lancer_Attack.png`,
  },
};

// ─────────────────────────────────────────────────────────────
// ENEMY SPRITES
// Verified base files: Bear_Idle/Run/Attack, Gnoll_Idle, Spider_Idle,
//                      Snake_Idle, Skull_Idle, Lancer_Idle/Run/Attack
//
// Fallback policy: types without a dedicated file map to the closest
// verified humanoid or creature sprite. Marked with [TEMP].
// ─────────────────────────────────────────────────────────────

// Base sprite sets (directly verified)
const BEAR_SPRITES   = { idle: `${BASE}/Bear_Idle.png`,   run: `${BASE}/Bear_Run.png`,   attack: `${BASE}/Bear_Attack.png` };
const GNOLL_SPRITES  = { idle: `${BASE}/Gnoll_Idle.png`,  run: `${BASE}/Gnoll_Idle.png`, attack: `${BASE}/Gnoll_Idle.png`  };
const SPIDER_SPRITES = { idle: `${BASE}/Spider_Idle.png`, run: `${BASE}/Spider_Idle.png`,attack: `${BASE}/Spider_Idle.png` };
const SNAKE_SPRITES  = { idle: `${BASE}/Snake_Idle.png`,  run: `${BASE}/Snake_Idle.png`, attack: `${BASE}/Snake_Idle.png`  };
const SKULL_SPRITES  = { idle: `${BASE}/Skull_Idle.png`,  run: `${BASE}/Skull_Idle.png`, attack: `${BASE}/Skull_Idle.png`  };
const LANCER_SPRITES = { idle: `${BASE}/Lancer_Idle.png`, run: `${BASE}/Lancer_Run.png`, attack: `${BASE}/Lancer_Attack.png` };

export const ENEMY_SPRITES = {
  // ── DEDICATED sprites ──────────────────────────────────────
  bear:         BEAR_SPRITES,
  gnoll:        GNOLL_SPRITES,
  spider:       SPIDER_SPRITES,
  snake:        SNAKE_SPRITES,
  skull:        SKULL_SPRITES,
  lancer:       LANCER_SPRITES,

  // ── HUMANOID melee fallbacks (lancer is best humanoid combat sprite) ──
  thief:        LANCER_SPRITES,   // [TEMP] fast humanoid → lancer
  gnome:        GNOLL_SPRITES,    // [TEMP] small humanoid → gnoll
  warlord:      LANCER_SPRITES,   // [TEMP] heavy humanoid → lancer

  // ── CREATURE / BEAST fallbacks ──────────────────────────────
  panda:        BEAR_SPRITES,     // [TEMP] large bear-like → bear
  frost_bear:   BEAR_SPRITES,     // [TEMP] elite bear → bear
  shadow_panda: BEAR_SPRITES,     // [TEMP] elite panda → bear
  minotaur:     BEAR_SPRITES,     // [TEMP] large brute → bear
  troll:        BEAR_SPRITES,     // [TEMP] miniboss brute → bear
  golem:        BEAR_SPRITES,     // [TEMP] miniboss tank → bear
  ogre:         BEAR_SPRITES,     // [TEMP] boss → bear
  turtle:       BEAR_SPRITES,     // [TEMP] armored tank → bear
  lizard:       LANCER_SPRITES,   // [TEMP] elite reptile humanoid → lancer

  // ── UNDEAD / MAGIC fallbacks ─────────────────────────────────
  alpha_skull:  SKULL_SPRITES,    // elite skull → skull
  wraith:       SKULL_SPRITES,    // [TEMP] ghost → skull
  frost_witch:  LANCER_SPRITES,   // [TEMP] caster humanoid → lancer

  // ── RANGED fallbacks ─────────────────────────────────────────
  harpoonfish:  SNAKE_SPRITES,    // [TEMP] aquatic ranged → snake
  shaman:       GNOLL_SPRITES,    // [TEMP] ranged caster → gnoll
  viper:        SNAKE_SPRITES,    // elite snake → snake

  // ── TRAINING DUMMY ───────────────────────────────────────────
  dummy:        SKULL_SPRITES,    // training dummy → skull
};

// ─────────────────────────────────────────────────────────────
// PROJECTILES
// ─────────────────────────────────────────────────────────────
export const PROJECTILE_SPRITES = {
  arrow:   `${BASE}/Arrow.png`,
  magic:   `${BASE}/Arrow.png`,
  default: `${BASE}/Arrow.png`,
};

// ─────────────────────────────────────────────────────────────
// NPC / AVATAR SPRITES
// Warrior_Idle.png is a clean upright humanoid — best available
// for NPCs until dedicated NPC sprites are uploaded.
// ─────────────────────────────────────────────────────────────
export const NPC_SPRITES = {
  default:  `${BASE}/Warrior_Idle.png`,  // clean upright humanoid [TEMP until NPC sprite uploaded]
  avatar1:  `${BASE}/Avatars_01.png`,    // kept for reference
};

// ─────────────────────────────────────────────────────────────
// HELPER FUNCTIONS
// ─────────────────────────────────────────────────────────────

/**
 * Get player sprite URL by class and animation state.
 * Falls back to idle if the requested state is missing.
 * Falls back to warrior if class is unknown.
 */
export function getPlayerSprite(classId, color = 'blue', animState = 'idle') {
  const cls = (classId || 'warrior').toLowerCase();
  const state = animState || 'idle';
  const entry = PLAYER_SPRITES[cls] || PLAYER_SPRITES['warrior'];
  return entry[state] || entry['idle'] || null;
}

/**
 * Get enemy sprite URL by type and action.
 * Falls back to idle if action not found.
 * Falls back to bear if type unknown.
 */
export function getEnemySprite(type, action = 'idle') {
  const t = (type || 'bear').toLowerCase();
  const a = action || 'idle';
  const entry = ENEMY_SPRITES[t] || ENEMY_SPRITES['bear'];
  return entry[a] || entry['idle'] || null;
}

/**
 * Get a random enemy type from the verified list.
 */
export function getRandomEnemyType() {
  const types = Object.keys(ENEMY_SPRITES);
  return types[Math.floor(Math.random() * types.length)];
}

/**
 * Get projectile sprite URL.
 */
export function getProjectileSprite(type) {
  return PROJECTILE_SPRITES[type] || PROJECTILE_SPRITES['default'];
}

/**
 * Get NPC sprite URL.
 */
export function getNPCSprite(role) {
  return NPC_SPRITES[role] || NPC_SPRITES['default'];
}

// Terrain stubs (no verified terrain files yet — returns null gracefully)
export function getTerrainSprite(category, type) {
  return null;
}

/**
 * Map enemy type to projectile type (kept for EnemyManager compatibility)
 */
export function getEnemyProjectileType(enemyType) {
  const map = {
    gnoll: 'arrow',
    shaman: 'magic',
    harpoonfish: 'arrow',
    default: 'arrow',
  };
  return map[(enemyType || '').toLowerCase()] || map.default;
}

export default {
  PLAYER_SPRITES,
  ENEMY_SPRITES,
  PROJECTILE_SPRITES,
  NPC_SPRITES,
  TEST_PLAYER_URL,
  TEST_NPC_URL,
  TEST_ENEMY_URL,
  TEST_PROJECTILE_URL,
  getPlayerSprite,
  getEnemySprite,
  getRandomEnemyType,
  getProjectileSprite,
  getNPCSprite,
  getTerrainSprite,
};