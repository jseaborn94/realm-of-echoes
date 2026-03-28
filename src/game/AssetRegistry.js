/**
 * ASSET REGISTRY — Realm of Echoes
 * Source: Tiny Swords by Pixel Frog (uploaded ZIP in GitHub repo)
 *
 * This file is a CATALOG ONLY. Assets are NOT loaded or applied here.
 * Use AssetLoader.js to load specific assets on demand when explicitly instructed.
 *
 * Tilemap grid: 64x64px | Animation speed: 10fps / 100ms | Format: PNG
 * Pack root paths:
 *   FREE:   "Tiny Swords (Free Pack)/"
 *   ENEMY:  "Tiny Swords (Enemy Pack)/"
 *   UPDATE: "Tiny Swords (Update 010)/"
 */

// ─────────────────────────────────────────────
// TERRAIN & TILES
// Path: Tiny Swords (Free Pack)/Terrain/
// ─────────────────────────────────────────────
export const TERRAIN = {
  // Ground tiles (64x64 tileset sheets)
  GROUND: {
    TILESET:        'Terrain/Ground/Tilemap_Flat.png',
    TILESET_SHADOW: 'Terrain/Ground/Tilemap_Elevation.png',
    WATER_WAVE:     'Terrain/Water/Water.png',          // animated
    GRASS_1:        'Terrain/Ground/Tilemap_Flat.png',
    GRASS_COLORS: [ // 5 color variants
      'Terrain/Ground/Tilemap_Flat.png',
    ],
    WATER_EDGE:     'Terrain/Water/Water_Edge.png',     // flat edge tiles
  },
  // Elevation / stairs
  ELEVATION: {
    TILES:    'Terrain/Ground/Tilemap_Elevation.png',
    STAIRS:   'Terrain/Ground/Tilemap_Stairs.png',
    SHADOW:   'Terrain/Ground/Tilemap_Shadow.png',
  },
};

// ─────────────────────────────────────────────
// DECORATIONS (environment props)
// Path: Tiny Swords (Free Pack)/Terrain/
// ─────────────────────────────────────────────
export const DECORATIONS = {
  BUSHES: [
    'Terrain/Decorations/Bush.png',                    // 4 variants, animated
  ],
  ROCKS: [
    'Terrain/Decorations/Rock.png',                    // 8 variants, some animated
    'Terrain/Decorations/Rock_Water.png',
  ],
  TREES: [
    'Terrain/Decorations/Tree.png',
    'Terrain/Decorations/Tree_2.png',
    'Terrain/Decorations/Tree_3.png',
    'Terrain/Decorations/Tree_4.png',
    'Terrain/Decorations/Stump.png',                  // 4 stump variants
  ],
  CLOUDS: [
    'Terrain/Decorations/Cloud_1.png',
    'Terrain/Decorations/Cloud_2.png',
    'Terrain/Decorations/Cloud_3.png',
  ],
};

// ─────────────────────────────────────────────
// PLAYER UNITS (Human)
// Path: Tiny Swords (Free Pack)/Factions/Knights/
// Each unit has: Idle, Run, Attack, Death animations
// Colors: Blue, Red, Purple, Yellow, Black
// ─────────────────────────────────────────────
export const UNITS = {
  WARRIOR: {
    IDLE:   'Factions/Knights/Troops/Warrior/Blue/Warrior_Blue.png',
    // color variants: Blue | Red | Purple | Yellow | Black
    COLORS: {
      BLUE:   'Factions/Knights/Troops/Warrior/Blue/Warrior_Blue.png',
      RED:    'Factions/Knights/Troops/Warrior/Red/Warrior_Red.png',
      PURPLE: 'Factions/Knights/Troops/Warrior/Purple/Warrior_Purple.png',
      YELLOW: 'Factions/Knights/Troops/Warrior/Yellow/Warrior_Yellow.png',
      BLACK:  'Factions/Knights/Troops/Warrior/Black/Warrior_Black.png',
    },
  },
  LANCER: {
    COLORS: {
      BLUE:   'Factions/Knights/Troops/Lancer/Blue/Lancer_Blue.png',
      RED:    'Factions/Knights/Troops/Lancer/Red/Lancer_Red.png',
      PURPLE: 'Factions/Knights/Troops/Lancer/Purple/Lancer_Purple.png',
      YELLOW: 'Factions/Knights/Troops/Lancer/Yellow/Lancer_Yellow.png',
      BLACK:  'Factions/Knights/Troops/Lancer/Black/Lancer_Black.png',
    },
  },
  ARCHER: {
    COLORS: {
      BLUE:   'Factions/Knights/Troops/Archer/Blue/Archer_Blue.png',
      RED:    'Factions/Knights/Troops/Archer/Red/Archer_Red.png',
      PURPLE: 'Factions/Knights/Troops/Archer/Purple/Archer_Purple.png',
      YELLOW: 'Factions/Knights/Troops/Archer/Yellow/Archer_Yellow.png',
      BLACK:  'Factions/Knights/Troops/Archer/Black/Archer_Black.png',
    },
  },
  MONK: {
    COLORS: {
      BLUE:   'Factions/Knights/Troops/Monk/Blue/Monk_Blue.png',
      RED:    'Factions/Knights/Troops/Monk/Red/Monk_Red.png',
      PURPLE: 'Factions/Knights/Troops/Monk/Purple/Monk_Purple.png',
      YELLOW: 'Factions/Knights/Troops/Monk/Yellow/Monk_Yellow.png',
      BLACK:  'Factions/Knights/Troops/Monk/Black/Monk_Black.png',
    },
  },
  PAWN: {
    COLORS: {
      BLUE:   'Factions/Knights/Troops/Pawn/Blue/Pawn_Blue.png',
      RED:    'Factions/Knights/Troops/Pawn/Red/Pawn_Red.png',
      PURPLE: 'Factions/Knights/Troops/Pawn/Purple/Pawn_Purple.png',
      YELLOW: 'Factions/Knights/Troops/Pawn/Yellow/Pawn_Yellow.png',
      BLACK:  'Factions/Knights/Troops/Pawn/Black/Pawn_Black.png',
    },
  },
};

// ─────────────────────────────────────────────
// BUILDINGS
// Path: Tiny Swords (Free Pack)/Factions/Knights/Buildings/
// 8 building types, 5 color variants each
// ─────────────────────────────────────────────
export const BUILDINGS = {
  TYPES: ['Castle', 'Tower', 'House', 'Barracks', 'Tower_Single', 'Ice_Tower', 'Sand_Tower', 'Wood_Tower'],
  COLORS: ['Blue', 'Red', 'Purple', 'Yellow', 'Black'],
  // Example path pattern:
  // 'Factions/Knights/Buildings/Castle/Castle_Blue.png'
  path: (type, color) => `Factions/Knights/Buildings/${type}/${type}_${color}.png`,
};

// ─────────────────────────────────────────────
// RESOURCES (collectibles)
// Path: Tiny Swords (Free Pack)/Resources/
// ─────────────────────────────────────────────
export const RESOURCES = {
  WOOD:  'Resources/Wood/Log.png',
  GOLD:  'Resources/Gold/Gold_1.png',       // 6 size variants
  MEAT:  'Resources/Meat/Meat.png',
  SHEEP: 'Resources/Sheep/Sheep.png',       // animated
};

// ─────────────────────────────────────────────
// PARTICLES / EFFECTS
// Path: Tiny Swords (Free Pack)/Particles/
// ─────────────────────────────────────────────
export const EFFECTS = {
  DUST:       ['Particles/Smoke/Smoke_1.png', 'Particles/Smoke/Smoke_2.png'],
  FIRE:       ['Particles/Fire/Fire_1.png', 'Particles/Fire/Fire_2.png', 'Particles/Fire/Fire_3.png'],
  EXPLOSION:  ['Particles/Explosion/Explosion_1.png', 'Particles/Explosion/Explosion_2.png'],
  WATER_SPLASH: 'Particles/Water/Water_Splash.png',
};

// ─────────────────────────────────────────────
// UI ELEMENTS
// Path: Tiny Swords (Free Pack)/UI/
// ─────────────────────────────────────────────
export const UI = {
  BANNER_PAPER:   'UI/Banners/Banner_Paper.png',        // stretchable
  TABLE_WOOD:     'UI/Banners/Table_Wood.png',          // stretchable
  SWORDS: [
    'UI/Icons/Sword_Blue.png',   // 5 colors
    'UI/Icons/Sword_Red.png',
    'UI/Icons/Sword_Purple.png',
    'UI/Icons/Sword_Yellow.png',
    'UI/Icons/Sword_Black.png',
  ],
  RIBBONS: {
    BIG:   'UI/Ribbons/Ribbon_Blue_3Slides.png',        // 5 colors, stretchable
    SMALL: 'UI/Ribbons/Ribbon_Red_3Slides.png',
  },
  PAPERS:         ['UI/Scrolls/Paper_1.png', 'UI/Scrolls/Paper_2.png'],
  HP_BARS:        ['UI/Health_Bars/Healthbar_1.png', 'UI/Health_Bars/Healthbar_2.png'],
  BUTTONS: {
    SQUARE: ['UI/Buttons/Button_Blue.png', 'UI/Buttons/Button_Red.png'],
    ROUND:  ['UI/Buttons/Round_Blue.png',  'UI/Buttons/Round_Red.png'],
  },
  CURSORS: [
    'UI/Cursors/Cursor_1.png',
    'UI/Cursors/Cursor_2.png',
    'UI/Cursors/Cursor_3.png',
    'UI/Cursors/Cursor_4.png',
  ],
  ICONS: [], // 12 icons under UI/Icons/
};

// ─────────────────────────────────────────────
// ENEMIES (Enemy Pack — paid)
// Path: Tiny Swords (Enemy Pack)/Enemies/
// Each has: Idle, Run, Attack animations
// ─────────────────────────────────────────────
export const ENEMIES = {
  SKULL:       'Enemies/Skull/Skull.png',
  PADDLE_FISH: 'Enemies/Paddle_Fish/Paddle_Fish.png',
  HARPOON_FISH:'Enemies/Harpon_Fish/Harpon_Fish.png',
  GOBLIN_LANCER:'Enemies/Goblin/Goblin_Lancer.png',
  SHAMAN:      'Enemies/Goblin/Goblin_Shaman.png',
  THIEF:       'Enemies/Thief/Thief.png',
  SNAKE:       'Enemies/Snake/Snake.png',
  TURTLE:      'Enemies/Turtle/Turtle.png',
  MINOTAUR:    'Enemies/Minotaur/Minotaur.png',
  GNOLL:       'Enemies/Gnoll/Gnoll.png',
  SPIDER:      'Enemies/Spider/Spider.png',
  PANDA:       'Enemies/Panda/Panda.png',
  LIZARD:      'Enemies/Lizard/Lizard.png',
  BEAR:        'Enemies/Bear/Bear.png',
  GNOME:       'Enemies/Gnome/Gnome.png',
  OGRE_BOSS:   'Enemies/Ogre/Ogre.png',
  BOAT:        'Enemies/Boat/Boat.png',
};

// ─────────────────────────────────────────────
// ANIMATION METADATA
// All sprite sheets use 10fps / 100ms per frame
// Standard frame size: 64x64px per frame
// ─────────────────────────────────────────────
export const ANIM_META = {
  FPS: 10,
  FRAME_MS: 100,
  FRAME_SIZE: 64,

  // Known frame counts per animation state (approximate — verify against sheet)
  UNIT_FRAMES: {
    IDLE:   6,
    RUN:    8,
    ATTACK: 6,
    DEATH:  4,
  },
};

// ─────────────────────────────────────────────
// HELPER: build a raw GitHub URL for an asset
// Usage: assetUrl('Factions/Knights/Troops/Warrior/Blue/Warrior_Blue.png', 'free')
// ─────────────────────────────────────────────
const GITHUB_RAW_BASE = 'https://raw.githubusercontent.com/jseaborn94/realm-of-echoes/main/Assets';
const PACK_ROOTS = {
  free:   'Tiny Swords (Free Pack)',
  enemy:  'Tiny Swords (Enemy Pack)',
  update: 'Tiny Swords (Update 010)',
};

export function assetUrl(relativePath, pack = 'free') {
  const root = PACK_ROOTS[pack] || PACK_ROOTS.free;
  return `${GITHUB_RAW_BASE}/${encodeURIComponent(root)}/${relativePath}`;
}