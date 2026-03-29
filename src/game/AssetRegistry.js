/**
 * AssetRegistry.js
 * 
 * Centralizes all game asset definitions from Tiny Swords asset packs.
 * Assets are organized by category: player, enemies, environment, UI, effects.
 * 
 * This version references assets from the Tiny Swords packs:
 * - Tiny Swords.zip (main pack)
 * - Tiny Swords (Free Pack).zip
 * - Tiny Swords (Enemy Pack).zip
 */

// ──────────────────────────────────────────────────────────────────────────
// TINY SWORDS SPRITE DEFINITIONS
// ──────────────────────────────────────────────────────────────────────────

export const ASSETS = {
  // Player characters - from Tiny Swords humanoid characters
  player: {
    knight: {
      name: 'Knight',
      spriteSheet: 'https://github.com/jseaborn94/realm-of-echoes/raw/main/Tiny%20Swords.zip',
      frameWidth: 16,
      frameHeight: 16,
      scale: 3,
      animations: {
        idle: { frames: [0, 1, 2, 3], speed: 6 },
        run: { frames: [4, 5, 6, 7], speed: 8 },
        attack: { frames: [8, 9, 10, 11], speed: 10 },
        death: { frames: [12, 13, 14, 15], speed: 5 }
      }
    },
    archer: {
      name: 'Archer',
      spriteSheet: 'https://github.com/jseaborn94/realm-of-echoes/raw/main/Tiny%20Swords.zip',
      frameWidth: 16,
      frameHeight: 16,
      scale: 3,
      animations: {
        idle: { frames: [0, 1], speed: 6 },
        run: { frames: [2, 3, 4, 5], speed: 8 },
        attack: { frames: [6, 7, 8], speed: 10 },
        death: { frames: [9, 10], speed: 5 }
      }
    },
    mage: {
      name: 'Mage',
      spriteSheet: 'https://github.com/jseaborn94/realm-of-echoes/raw/main/Tiny%20Swords.zip',
      frameWidth: 16,
      frameHeight: 16,
      scale: 3,
      animations: {
        idle: { frames: [0, 1], speed: 6 },
        run: { frames: [2, 3, 4, 5], speed: 8 },
        attack: { frames: [6, 7, 8, 9], speed: 10 },
        death: { frames: [10, 11], speed: 5 }
      }
    }
  },

  // Enemies - from Tiny Swords (Enemy Pack)
  enemies: {
    goblin: {
      name: 'Goblin',
      spriteSheet: 'https://github.com/jseaborn94/realm-of-echoes/raw/main/Tiny%20Swords%20(Enemy%20Pack).zip',
      frameWidth: 16,
      frameHeight: 16,
      scale: 3,
      animations: {
        idle: { frames: [0, 1], speed: 6 },
        move: { frames: [2, 3, 4, 5], speed: 8 },
        attack: { frames: [6, 7], speed: 10 },
        death: { frames: [8, 9, 10], speed: 5 }
      }
    },
    orc: {
      name: 'Orc',
      spriteSheet: 'https://github.com/jseaborn94/realm-of-echoes/raw/main/Tiny%20Swords%20(Enemy%20Pack).zip',
      frameWidth: 16,
      frameHeight: 16,
      scale: 3,
      animations: {
        idle: { frames: [0, 1], speed: 6 },
        move: { frames: [2, 3, 4, 5], speed: 8 },
        attack: { frames: [6, 7, 8], speed: 10 },
        death: { frames: [9, 10], speed: 5 }
      }
    },
    skeleton: {
      name: 'Skeleton',
      spriteSheet: 'https://github.com/jseaborn94/realm-of-echoes/raw/main/Tiny%20Swords%20(Enemy%20Pack).zip',
      frameWidth: 16,
      frameHeight: 16,
      scale: 3,
      animations: {
        idle: { frames: [0, 1], speed: 6 },
        move: { frames: [2, 3, 4, 5], speed: 8 },
        attack: { frames: [6, 7], speed: 10 },
        death: { frames: [8, 9, 10, 11], speed: 5 }
      }
    },
    necromancer: {
      name: 'Necromancer',
      spriteSheet: 'https://github.com/jseaborn94/realm-of-echoes/raw/main/Tiny%20Swords%20(Enemy%20Pack).zip',
      frameWidth: 16,
      frameHeight: 16,
      scale: 3,
      animations: {
        idle: { frames: [0, 1], speed: 6 },
        move: { frames: [2, 3, 4], speed: 8 },
        attack: { frames: [5, 6, 7], speed: 10 },
        death: { frames: [8, 9, 10], speed: 5 }
      }
    }
  },

  // Environment & Tilesets - from Tiny Swords (Free Pack)
  environment: {
    grass: {
      name: 'Grass Tile',
      spriteSheet: 'https://github.com/jseaborn94/realm-of-echoes/raw/main/Tiny%20Swords%20(Free%20Pack).zip',
      frameWidth: 16,
      frameHeight: 16,
      scale: 2,
      static: true
    },
    dirt: {
      name: 'Dirt Tile',
      spriteSheet: 'https://github.com/jseaborn94/realm-of-echoes/raw/main/Tiny%20Swords%20(Free%20Pack).zip',
      frameWidth: 16,
      frameHeight: 16,
      scale: 2,
      static: true
    },
    stone: {
      name: 'Stone Tile',
      spriteSheet: 'https://github.com/jseaborn94/realm-of-echoes/raw/main/Tiny%20Swords%20(Free%20Pack).zip',
      frameWidth: 16,
      frameHeight: 16,
      scale: 2,
      static: true
    },
    water: {
      name: 'Water Tile',
      spriteSheet: 'https://github.com/jseaborn94/realm-of-echoes/raw/main/Tiny%20Swords%20(Free%20Pack).zip',
      frameWidth: 16,
      frameHeight: 16,
      scale: 2,
      animations: {
        wave: { frames: [0, 1, 2, 3], speed: 6 }
      }
    },
    tree: {
      name: 'Tree',
      spriteSheet: 'https://github.com/jseaborn94/realm-of-echoes/raw/main/Tiny%20Swords%20(Free%20Pack).zip',
      frameWidth: 16,
      frameHeight: 24,
      scale: 2,
      static: true
    },
    rock: {
      name: 'Rock',
      spriteSheet: 'https://github.com/jseaborn94/realm-of-echoes/raw/main/Tiny%20Swords%20(Free%20Pack).zip',
      frameWidth: 16,
      frameHeight: 16,
      scale: 2,
      static: true
    }
  },

  // Visual Effects
  effects: {
    slash: {
      name: 'Slash Effect',
      spriteSheet: 'https://github.com/jseaborn94/realm-of-echoes/raw/main/Tiny%20Swords.zip',
      frameWidth: 16,
      frameHeight: 16,
      scale: 3,
      animations: {
        play: { frames: [0, 1, 2, 3], speed: 10 }
      }
    },
    hit: {
      name: 'Hit Flash',
      spriteSheet: 'https://github.com/jseaborn94/realm-of-echoes/raw/main/Tiny%20Swords.zip',
      frameWidth: 16,
      frameHeight: 16,
      scale: 3,
      animations: {
        play: { frames: [0, 1], speed: 12 }
      }
    },
    death: {
      name: 'Death Burst',
      spriteSheet: 'https://github.com/jseaborn94/realm-of-echoes/raw/main/Tiny%20Swords.zip',
      frameWidth: 16,
      frameHeight: 16,
      scale: 3,
      animations: {
        play: { frames: [0, 1, 2, 3, 4], speed: 10 }
      }
    }
  },

  // UI Assets
  ui: {
    slot: {
      name: 'Item Slot',
      spriteSheet: 'https://github.com/jseaborn94/realm-of-echoes/raw/main/Tiny%20Swords%20(Free%20Pack).zip',
      frameWidth: 16,
      frameHeight: 16,
      scale: 2,
      static: true
    },
    panel: {
      name: 'UI Panel',
      spriteSheet: 'https://github.com/jseaborn94/realm-of-echoes/raw/main/Tiny%20Swords%20(Free%20Pack).zip',
      frameWidth: 16,
      frameHeight: 16,
      scale: 1,
      static: true
    }
  }
};

/**
 * Get an asset by category and key
 * @param {string} category - Asset category (player, enemies, environment, effects, ui)
 * @param {string} key - Asset key
 * @returns {object} Asset definition or null
 */
export function getAsset(category, key) {
  return ASSETS[category]?.[key] || null;
}

/**
 * Get all assets in a category
 * @param {string} category - Asset category
 * @returns {object} All assets in that category
 */
export function getAssetsByCategory(category) {
  return ASSETS[category] || {};
}

/**
 * List all available asset keys in a category
 * @param {string} category - Asset category
 * @returns {string[]} Array of asset keys
 */
export function listAssets(category) {
  return Object.keys(ASSETS[category] || {});
}

export default ASSETS;