import { TILE_SIZE, WORLD_COLS, WORLD_ROWS, getZoneAt } from './constants.js';

// Seeded random
function mulberry32(seed) {
  return function() {
    let t = seed += 0x6D2B79F5;
    t = Math.imul(t ^ t >>> 15, t | 1);
    t ^= t + Math.imul(t ^ t >>> 7, t | 61);
    return ((t ^ t >>> 14) >>> 0) / 4294967296;
  };
}

const rand = mulberry32(42);

// Tile types
export const TILE = {
  GRASS: 0,
  DIRT: 1,
  STONE: 2,
  WATER: 3,
  SAND: 4,
  SNOW: 5,
  DARK_GRASS: 6,
  DEAD: 7,
};

// Object types (collidable)
export const OBJ = {
  NONE: 0,
  TREE: 1,
  PINE: 2,
  ROCK: 3,
  BOULDER: 4,
  CHEST: 5,
  NPC: 6,
  RUIN: 7,
  CRYSTAL: 8,
};

export class WorldGenerator {
  constructor() {
    this.tiles = new Uint8Array(WORLD_COLS * WORLD_ROWS);
    this.objects = new Uint8Array(WORLD_COLS * WORLD_ROWS);
    this.npcs = [];
    this.chests = [];
    this._generate();
  }

  idx(col, row) {
    return row * WORLD_COLS + col;
  }

  setTile(col, row, type) {
    if (col < 0 || col >= WORLD_COLS || row < 0 || row >= WORLD_ROWS) return;
    this.tiles[this.idx(col, row)] = type;
  }

  setObj(col, row, type) {
    if (col < 0 || col >= WORLD_COLS || row < 0 || row >= WORLD_ROWS) return;
    this.objects[this.idx(col, row)] = type;
  }

  getTile(col, row) {
    if (col < 0 || col >= WORLD_COLS || row < 0 || row >= WORLD_ROWS) return TILE.GRASS;
    return this.tiles[this.idx(col, row)];
  }

  getObj(col, row) {
    if (col < 0 || col >= WORLD_COLS || row < 0 || row >= WORLD_ROWS) return OBJ.NONE;
    return this.objects[this.idx(col, row)];
  }

  isBlocked(col, row) {
    const obj = this.getObj(col, row);
    return obj !== OBJ.NONE && obj !== OBJ.CHEST;
  }

  _generate() {
    // Fill base tiles by zone
    for (let row = 0; row < WORLD_ROWS; row++) {
      for (let col = 0; col < WORLD_COLS; col++) {
        const zone = getZoneAt(col, row);
        let tile = TILE.GRASS;
        const r = rand();
        if (zone.id === 1) tile = r < 0.05 ? TILE.DIRT : TILE.GRASS;
        else if (zone.id === 2) tile = r < 0.08 ? TILE.DIRT : TILE.DARK_GRASS;
        else if (zone.id === 3) tile = r < 0.15 ? TILE.STONE : (r < 0.3 ? TILE.SAND : TILE.DIRT);
        else if (zone.id === 4) tile = r < 0.2 ? TILE.SNOW : (r < 0.4 ? TILE.STONE : TILE.GRASS);
        else if (zone.id === 5) tile = r < 0.1 ? TILE.DEAD : (r < 0.2 ? TILE.STONE : TILE.DARK_GRASS);
        this.setTile(col, row, tile);
      }
    }

    // Place water rivers
    this._placeRiver(20, 0, 20, 60, true);
    this._placeRiver(100, 40, 100, 100, true);
    this._placeRiver(0, 120, 80, 120, false);

    // Place trees per zone
    this._placeObjects(0, 0, 80, 80, [OBJ.TREE], 0.06);
    this._placeObjects(80, 0, 160, 80, [OBJ.PINE], 0.10);
    this._placeObjects(0, 80, 80, 160, [OBJ.ROCK, OBJ.BOULDER], 0.08);
    this._placeObjects(80, 80, 160, 160, [OBJ.ROCK, OBJ.CRYSTAL], 0.07);
    this._placeObjects(60, 60, 140, 140, [OBJ.RUIN, OBJ.ROCK], 0.12);

    // Clear spawn area
    for (let r = 35; r <= 45; r++) {
      for (let c = 35; c <= 45; c++) {
        this.setObj(c, r, OBJ.NONE);
        this.setTile(c, r, TILE.GRASS);
      }
    }

    // Place NPCs
    this._placeNPCs();

    // Place chests
    this._placeChests();
  }

  _placeRiver(startCol, startRow, endCol, endRow, vertical) {
    const len = vertical ? (endRow - startRow) : (endCol - startCol);
    let pos = vertical ? startCol : startRow;
    for (let i = 0; i < len; i++) {
      if (rand() > 0.3) pos += Math.round((rand() - 0.5));
      pos = Math.max(2, Math.min((vertical ? WORLD_COLS : WORLD_ROWS) - 2, pos));
      const col = vertical ? pos : (startCol + i);
      const row = vertical ? (startRow + i) : pos;
      this.setTile(col, row, TILE.WATER);
      this.setObj(col, row, OBJ.NONE);
    }
  }

  _placeObjects(c0, r0, c1, r1, types, density) {
    for (let row = r0; row < r1; row++) {
      for (let col = c0; col < c1; col++) {
        if (this.getTile(col, row) === TILE.WATER) continue;
        if (rand() < density) {
          const t = types[Math.floor(rand() * types.length)];
          this.setObj(col, row, t);
        }
      }
    }
  }

  _placeNPCs() {
    const npcDefs = [
      { col: 40, row: 37, name: 'Elder Thaddeus', dialogue: ["Welcome to Realm of Echoes, brave one.", "Seek your destiny across the five zones.", "Press F to interact with objects and NPCs."] },
      { col: 43, row: 37, name: 'Blacksmith Oryn', dialogue: ["I can forge mighty weapons.", "Bring me rare materials from the Wastes.", "The Ironvale holds ancient ores."] },
      { col: 40, row: 43, name: 'Scout Mira', dialogue: ["The Wildwood is perilous at night.", "Frostthorn Reach lies to the east.", "Be wary of the Shadowfall Wastes — darkness consumes there."] },
    ];
    this.npcs = npcDefs;
  }

  _placeChests() {
    const chestPositions = [
      [52, 38], [28, 55], [95, 25], [110, 90], [75, 110], [130, 130],
    ];
    chestPositions.forEach(([col, row]) => {
      this.setObj(col, row, OBJ.CHEST);
      this.chests.push({ col, row, looted: false });
    });
  }
}

// Tile visual configs
export const TILE_COLORS = {
  [TILE.GRASS]:      { fill: '#2d5a1b', stroke: '#24491a' },
  [TILE.DARK_GRASS]: { fill: '#1a3a12', stroke: '#152e0f' },
  [TILE.DIRT]:       { fill: '#6b4c2a', stroke: '#5a3e22' },
  [TILE.STONE]:      { fill: '#4a4a4a', stroke: '#3d3d3d' },
  [TILE.WATER]:      { fill: '#1a4a7a', stroke: '#153e68' },
  [TILE.SAND]:       { fill: '#a08838', stroke: '#8a7530' },
  [TILE.SNOW]:       { fill: '#c8d8e8', stroke: '#b0c4d4' },
  [TILE.DEAD]:       { fill: '#2a1a2a', stroke: '#201520' },
};