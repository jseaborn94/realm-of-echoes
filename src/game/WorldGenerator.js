import { TILE_SIZE, WORLD_COLS, WORLD_ROWS, getZoneAt } from './constants.js';

// ─── Seeded deterministic RNG ───────────────────────────────────────────────
function mulberry32(seed) {
  return function () {
    let t = (seed += 0x6D2B79F5);
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
const rand = mulberry32(7331);

// ─── Tile / Object enums ─────────────────────────────────────────────────────
export const TILE = {
  GRASS: 0, DIRT: 1, STONE: 2, WATER: 3,
  SAND: 4, SNOW: 5, DARK_GRASS: 6, DEAD: 7, MUD: 8, ICE: 9,
};

export const OBJ = {
  NONE: 0, TREE: 1, PINE: 2, ROCK: 3, BOULDER: 4,
  CHEST: 5, NPC: 6, RUIN: 7, CRYSTAL: 8,
};

// ─── World Generator ─────────────────────────────────────────────────────────
export class WorldGenerator {
  constructor() {
    this.tiles   = new Uint8Array(WORLD_COLS * WORLD_ROWS);
    this.objects = new Uint8Array(WORLD_COLS * WORLD_ROWS);
    this.npcs    = [];
    this.chests  = [];
    this._generate();
  }

  idx(col, row)           { return row * WORLD_COLS + col; }
  setTile(col, row, type) { if (this._inBounds(col, row)) this.tiles[this.idx(col, row)] = type; }
  setObj(col, row, type)  { if (this._inBounds(col, row)) this.objects[this.idx(col, row)] = type; }
  getTile(col, row)       { return this._inBounds(col, row) ? this.tiles[this.idx(col, row)] : TILE.GRASS; }
  getObj(col, row)        { return this._inBounds(col, row) ? this.objects[this.idx(col, row)] : OBJ.NONE; }
  isBlocked(col, row)     { const o = this.getObj(col, row); return o !== OBJ.NONE && o !== OBJ.CHEST; }
  _inBounds(col, row)     { return col >= 0 && col < WORLD_COLS && row >= 0 && row < WORLD_ROWS; }

  // ── Main generation pipeline ──────────────────────────────────────────────
  _generate() {
    this._fillBaseTiles();
    this._addNoiseVariation();
    this._paintRoads();
    this._placeRivers();
    this._placeLakes();
    this._placeForestClusters();
    this._placeRockFields();
    this._placeRuinSites();
    this._placeCrystalGroves();
    this._clearTownAreas();
    this._placeNPCs();
    this._placeChests();
  }

  // ── Base tile fill by zone ────────────────────────────────────────────────
  _fillBaseTiles() {
    for (let row = 0; row < WORLD_ROWS; row++) {
      for (let col = 0; col < WORLD_COLS; col++) {
        const zone = getZoneAt(col, row);
        const r = rand();
        let tile;
        switch (zone.id) {
          case 1: // Starter Plains — lush grass with dirt patches
            tile = r < 0.06 ? TILE.DIRT : (r < 0.09 ? TILE.MUD : TILE.GRASS);
            break;
          case 2: // Wildwood — dense dark forest floor
            tile = r < 0.05 ? TILE.MUD : (r < 0.10 ? TILE.DIRT : TILE.DARK_GRASS);
            break;
          case 3: // Ironvale — rocky, sandy, arid
            tile = r < 0.18 ? TILE.STONE : (r < 0.36 ? TILE.SAND : (r < 0.50 ? TILE.DIRT : TILE.GRASS));
            break;
          case 4: // Frostthorn — snow and ice
            tile = r < 0.25 ? TILE.ICE : (r < 0.50 ? TILE.SNOW : (r < 0.65 ? TILE.STONE : TILE.GRASS));
            break;
          case 5: // Shadowfall — dead, dark, corrupted
            tile = r < 0.20 ? TILE.DEAD : (r < 0.38 ? TILE.STONE : (r < 0.50 ? TILE.MUD : TILE.DARK_GRASS));
            break;
          default:
            tile = TILE.GRASS;
        }
        this.setTile(col, row, tile);
      }
    }
  }

  // ── Expose zone id lookup for other systems ───────────────────────────────
  getZoneId(col, row) {
    return getZoneAt(col, row).id;
  }

  // ── Perlin-like noise patches for terrain variety ─────────────────────────
  _addNoiseVariation() {
    // Scatter random tile-type blobs across the world for natural variation
    const patches = [
      { tile: TILE.MUD,   count: 80, size: 8 },
      { tile: TILE.SAND,  count: 50, size: 10 },
      { tile: TILE.STONE, count: 60, size: 7  },
      { tile: TILE.SNOW,  count: 40, size: 9  },
      { tile: TILE.DEAD,  count: 30, size: 8  },
    ];
    for (const p of patches) {
      for (let i = 0; i < p.count; i++) {
        const cx = Math.floor(rand() * WORLD_COLS);
        const cy = Math.floor(rand() * WORLD_ROWS);
        for (let dr = -p.size; dr <= p.size; dr++) {
          for (let dc = -p.size; dc <= p.size; dc++) {
            const d = Math.sqrt(dc * dc + dr * dr);
            if (d < p.size * rand()) {
              const r2 = cy + dr, c2 = cx + dc;
              if (this.getTile(c2, r2) !== TILE.WATER) this.setTile(c2, r2, p.tile);
            }
          }
        }
      }
    }
  }

  // ── Dirt roads connecting organic zone centers ────────────────────────────
  _paintRoads() {
    // Organic layout zone centers:
    //   Zone 1 Evergreen Hollow spawn: col 185, row 390
    //   Zone 2 Thornmere:              col 380, row 320
    //   Zone 3 Ironhaven:              col 80,  row 220
    //   Zone 4 Frostholm:              col 340, row 150
    //   Zone 5 Dusk Citadel:           col 210, row 65

    // Spawn → east toward Thornmere (Zone 2)
    this._paintRoad(185, 390, 280, 355, false, 2);
    this._paintRoad(280, 355, 380, 320, false, 2);

    // Spawn → northwest toward Ironhaven (Zone 3)
    this._paintRoad(185, 390, 135, 310, false, 2);
    this._paintRoad(135, 310, 80,  260, false, 2);
    this._paintRoad(80,  260, 80,  220, true,  2);

    // Ironhaven → Frostholm (Zone 3 → Zone 4)
    this._paintRoad(80,  220, 180, 190, false, 2);
    this._paintRoad(180, 190, 280, 165, false, 2);
    this._paintRoad(280, 165, 340, 150, false, 2);

    // Thornmere → Frostholm (Zone 2 → Zone 4)
    this._paintRoad(380, 320, 365, 235, true,  2);
    this._paintRoad(365, 235, 340, 150, false, 2);

    // Frostholm → Dusk Citadel (Zone 4 → Zone 5)
    this._paintRoad(340, 150, 285, 108, false, 2);
    this._paintRoad(285, 108, 210, 65,  false, 2);

    // Ironhaven → Dusk Citadel western path (Zone 3 → Zone 5)
    this._paintRoad(80,  220, 80,  150, true,  2);
    this._paintRoad(80,  150, 140, 90,  false, 2);
    this._paintRoad(140, 90,  210, 65,  false, 2);

    // Spawn southern spur
    this._paintRoad(185, 390, 185, 470, true, 2);

    // Thornmere eastern spur
    this._paintRoad(380, 320, 450, 400, false, 1);
    this._paintRoad(450, 400, 460, 460, true,  1);
  }

  _paintRoad(c0, r0, c1, r1, vertical, width) {
    const steps = Math.max(Math.abs(c1 - c0), Math.abs(r1 - r0));
    for (let i = 0; i <= steps; i++) {
      const t = steps === 0 ? 0 : i / steps;
      const col = Math.round(c0 + (c1 - c0) * t);
      const row = Math.round(r0 + (r1 - r0) * t);
      for (let dw = -width; dw <= width; dw++) {
        const fc = vertical ? col + dw : col;
        const fr = vertical ? row : row + dw;
        if (this.getTile(fc, fr) !== TILE.WATER) {
          // Add slight meander noise
          const offset = Math.round((rand() - 0.5) * 1.5);
          const mc = vertical ? fc + offset : fc;
          const mr = vertical ? fr : fr + offset;
          this.setTile(mc, mr, TILE.DIRT);
        }
      }
    }
  }

  // ── Rivers (long winding water bodies) ────────────────────────────────────
  _placeRivers() {
    // River 1: winding river east of spawn, separating Zone 1 from Zone 2
    this._placeRiver(270, 500, 300, 340, true, 2, 16);
    this._placeRiver(300, 340, 320, 280, true, 2, 14);
    // River 2: river separating Zone 1/3 border (NW)
    this._placeRiver(0, 310, 130, 280, false, 2, 12);
    this._placeRiver(130, 280, 165, 240, false, 2, 10);
    // River 3: river through Ironvale (Zone 3), flowing west to east
    this._placeRiver(0, 185, 80, 175, false, 2, 10);
    this._placeRiver(80, 175, 155, 160, false, 2, 10);
    // River 4: frozen river in Frostthorn (Zone 4)
    this._placeRiver(350, 240, 420, 200, false, 2, 12);
    this._placeRiver(420, 200, 499, 195, false, 2, 10);
    // River 5: Shadowfall corrupted river
    this._placeRiver(100, 95, 280, 85, false, 2, 14);
    this._placeRiver(280, 85, 400, 75, false, 2, 12);
    // River 6: northern isolated river west area
    this._placeRiver(0, 130, 55, 120, false, 2, 8);
  }

  _placeRiver(sc, sr, ec, er, vertical, width, meander) {
    const steps = Math.max(Math.abs(ec - sc), Math.abs(er - sr));
    let offset = 0;
    for (let i = 0; i <= steps; i++) {
      const t = steps === 0 ? 0 : i / steps;
      const baseC = Math.round(sc + (ec - sc) * t);
      const baseR = Math.round(sr + (er - sr) * t);
      if (rand() < 0.4) offset += Math.round((rand() - 0.5) * 2);
      offset = Math.max(-meander, Math.min(meander, offset));
      for (let w = -width; w <= width; w++) {
        const col = vertical ? baseC + w : baseC + (rand() < 0.3 ? offset : 0);
        const row = vertical ? baseR + (rand() < 0.3 ? offset : 0) : baseR + w;
        this.setTile(col, row, TILE.WATER);
        this.setObj(col, row, OBJ.NONE);
      }
    }
  }

  // ── Lakes ────────────────────────────────────────────────────────────────
  _placeLakes() {
    const lakes = [
      // Zone 1 — Starter Plains (south-central)
      { cx: 140, cy: 450, rx: 18, ry: 12 },
      { cx:  50, cy: 410, rx: 14, ry:  9 },
      { cx: 235, cy: 420, rx: 12, ry:  8 },
      { cx: 100, cy: 470, rx: 10, ry:  7 },
      // Zone 2 — Wildwood Frontier (southeast)
      { cx: 420, cy: 370, rx: 16, ry: 10 },
      { cx: 350, cy: 430, rx: 14, ry:  9 },
      { cx: 470, cy: 430, rx: 12, ry:  8 },
      { cx: 310, cy: 380, rx: 10, ry:  7 },
      // Zone 3 — Ironvale Expanse (west)
      { cx:  40, cy: 260, rx: 14, ry:  9 },
      { cx: 110, cy: 165, rx: 16, ry: 10 },
      { cx:  25, cy: 165, rx: 10, ry:  7 },
      // Zone 4 — Frostthorn Reach (northeast)
      { cx: 400, cy: 195, rx: 18, ry: 11 },
      { cx: 460, cy: 130, rx: 16, ry: 10 },
      { cx: 290, cy: 120, rx: 12, ry:  8 },
      { cx: 460, cy: 245, rx: 10, ry:  7 },
      // Zone 5 — Shadowfall (north-central)
      { cx: 145, cy:  55, rx: 16, ry: 10 },
      { cx: 290, cy:  40, rx: 18, ry: 11 },
      { cx: 390, cy:  70, rx: 14, ry:  9 },
    ];
    for (const lake of lakes) {
      for (let dr = -lake.ry - 2; dr <= lake.ry + 2; dr++) {
        for (let dc = -lake.rx - 2; dc <= lake.rx + 2; dc++) {
          const norm = (dc * dc) / (lake.rx * lake.rx) + (dr * dr) / (lake.ry * lake.ry);
          const col = lake.cx + dc, row = lake.cy + dr;
          if (norm < 1) {
            this.setTile(col, row, TILE.WATER);
            this.setObj(col, row, OBJ.NONE);
          } else if (norm < 1.3 && rand() < 0.5) {
            // Shore tiles
            const cur = this.getTile(col, row);
            if (cur !== TILE.WATER) this.setTile(col, row, TILE.MUD);
          }
        }
      }
    }
  }

  // ── Forest clusters (positioned by organic zone centers) ──────────────────
  _placeForestClusters() {
    // Zone 1 — Starter Plains: scattered trees around spawn area
    this._placeClusterField(60, 320, 240, 500, [OBJ.TREE], 0.045, 12, 20);
    this._placeDenseCluster(155, 340, 28, 32, [OBJ.TREE], 0.55);
    this._placeDenseCluster( 60, 360, 22, 25, [OBJ.TREE], 0.50);
    this._placeDenseCluster(230, 470, 20, 22, [OBJ.TREE], 0.48);

    // Zone 2 — Wildwood: dense forest east/southeast
    this._placeClusterField(290, 260, 499, 490, [OBJ.TREE, OBJ.PINE], 0.09, 22, 35);
    this._placeDenseCluster(370, 360, 48, 55, [OBJ.TREE, OBJ.PINE], 0.70);
    this._placeDenseCluster(440, 400, 40, 48, [OBJ.TREE, OBJ.PINE], 0.68);
    this._placeDenseCluster(320, 440, 38, 42, [OBJ.PINE],           0.72);
    this._placeDenseCluster(470, 330, 32, 38, [OBJ.TREE],           0.65);

    // Zone 3 — Ironvale: sparse pines + boulders across west
    this._placeClusterField(0, 130, 180, 310, [OBJ.PINE, OBJ.BOULDER], 0.05, 10, 18);
    this._placeDenseCluster( 50, 260, 28, 32, [OBJ.PINE], 0.60);
    this._placeDenseCluster(130, 185, 24, 28, [OBJ.PINE], 0.55);

    // Zone 4 — Frostthorn: frost pines northeast
    this._placeClusterField(260, 95, 499, 280, [OBJ.PINE], 0.07, 12, 22);
    this._placeDenseCluster(360, 175, 40, 48, [OBJ.PINE], 0.72);
    this._placeDenseCluster(450, 220, 36, 42, [OBJ.PINE], 0.68);
    this._placeDenseCluster(300, 130, 30, 35, [OBJ.PINE], 0.65);

    // Zone 5 — Shadowfall: dead trees + ruins, north
    this._placeClusterField(0, 0, 499, 100, [OBJ.RUIN, OBJ.ROCK], 0.08, 8, 14);
  }

  _placeClusterField(c0, r0, c1, r1, types, density, minSize, maxSize) {
    const area = (c1 - c0) * (r1 - r0);
    const clusters = Math.floor(area / 3000);
    for (let i = 0; i < clusters; i++) {
      const cx = c0 + Math.floor(rand() * (c1 - c0));
      const cy = r0 + Math.floor(rand() * (r1 - r0));
      const size = minSize + Math.floor(rand() * (maxSize - minSize));
      this._placeDenseCluster(cx, cy, size, size + 5, types, density);
    }
  }

  _placeDenseCluster(cx, cy, w, h, types, density) {
    for (let dr = -Math.floor(h / 2); dr <= Math.floor(h / 2); dr++) {
      for (let dc = -Math.floor(w / 2); dc <= Math.floor(w / 2); dc++) {
        const col = cx + dc, row = cy + dr;
        if (!this._inBounds(col, row)) continue;
        if (this.getTile(col, row) === TILE.WATER) continue;
        if (this.getObj(col, row) !== OBJ.NONE) continue;
        // Elliptical falloff
        const norm = (dc * dc) / ((w / 2) * (w / 2)) + (dr * dr) / ((h / 2) * (h / 2));
        const prob = density * (1 - norm * 0.6);
        if (rand() < prob) {
          const t = types[Math.floor(rand() * types.length)];
          this.setObj(col, row, t);
        }
      }
    }
  }

  // ── Rock fields ───────────────────────────────────────────────────────────
  _placeRockFields() {
    // Zone 3 — Ironvale: major rock/boulder fields
    this._placeDenseCluster( 55, 235, 55, 65, [OBJ.ROCK, OBJ.BOULDER], 0.45);
    this._placeDenseCluster(145, 170, 55, 65, [OBJ.ROCK, OBJ.BOULDER], 0.45);
    this._placeDenseCluster( 30, 160, 40, 50, [OBJ.BOULDER, OBJ.ROCK], 0.50);
    this._placeDenseCluster( 90, 300, 35, 42, [OBJ.ROCK, OBJ.BOULDER], 0.42);
    // Zone 4 — Frostthorn: frozen boulder fields
    this._placeDenseCluster(400, 220, 48, 55, [OBJ.BOULDER, OBJ.ROCK], 0.42);
    this._placeDenseCluster(460, 150, 40, 50, [OBJ.BOULDER],           0.44);
    this._placeDenseCluster(295, 175, 38, 45, [OBJ.ROCK, OBJ.BOULDER], 0.40);
    this._placeDenseCluster(370, 120, 36, 44, [OBJ.BOULDER],           0.42);
    // Zone 1 — occasional rocks
    this._placeClusterField(60, 320, 240, 490, [OBJ.ROCK], 0.015, 4, 8);
    // Zone 2 — occasional rocks in wildwood
    this._placeClusterField(290, 270, 490, 480, [OBJ.ROCK], 0.015, 4, 8);
  }

  // ── Ruin sites (landmark areas) ───────────────────────────────────────────
  _placeRuinSites() {
    const sites = [
      // Zone 1 — scattered ruins across plains
      { cx:  65, cy: 350, w: 14, h: 14 },
      { cx: 220, cy: 490, w: 12, h: 12 },
      { cx: 155, cy: 480, w: 10, h: 10 },
      // Zone 2 — Wildwood ruins
      { cx: 465, cy: 350, w: 14, h: 14 },
      { cx: 315, cy: 490, w: 12, h: 12 },
      { cx: 405, cy: 290, w: 16, h: 16 },
      { cx: 480, cy: 280, w: 12, h: 12 },
      // Zone 3 — Ironvale ancient ruins (west side)
      { cx:  30, cy: 295, w: 16, h: 14 },
      { cx: 160, cy: 260, w: 18, h: 18 },
      { cx:  95, cy: 140, w: 14, h: 12 },
      // Zone 4 — Frostthorn ruins (northeast)
      { cx: 445, cy: 265, w: 16, h: 14 },
      { cx: 305, cy: 250, w: 15, h: 15 },
      { cx: 390, cy: 110, w: 14, h: 12 },
      { cx: 490, cy: 110, w: 12, h: 12 },
      // Zone 5 — Shadowfall: dense ruins
      { cx:  70, cy:  35, w: 20, h: 16 },
      { cx: 210, cy:  30, w: 24, h: 18 }, // central boss ruins
      { cx: 380, cy:  35, w: 20, h: 16 },
      { cx: 150, cy:  75, w: 16, h: 14 },
      { cx: 310, cy:  75, w: 16, h: 14 },
      { cx: 460, cy:  55, w: 14, h: 14 },
    ];
    for (const s of sites) {
      this._placeDenseCluster(s.cx, s.cy, s.w, s.h, [OBJ.RUIN, OBJ.ROCK], 0.55);
    }
  }

  // ── Crystal groves (Shadowfall + Frostthorn border) ──────────────────────
  _placeCrystalGroves() {
    // Zone 5 — Shadowfall crystal fields (north)
    this._placeDenseCluster( 55, 45, 18, 22, [OBJ.CRYSTAL], 0.55);
    this._placeDenseCluster(175, 60, 16, 20, [OBJ.CRYSTAL], 0.55);
    this._placeDenseCluster(210, 35, 22, 24, [OBJ.CRYSTAL, OBJ.RUIN], 0.52);
    this._placeDenseCluster(330, 55, 18, 20, [OBJ.CRYSTAL], 0.55);
    this._placeDenseCluster(440, 45, 18, 22, [OBJ.CRYSTAL], 0.55);
    this._placeDenseCluster(110, 80, 14, 16, [OBJ.CRYSTAL], 0.50);
    this._placeDenseCluster(270, 80, 14, 16, [OBJ.CRYSTAL], 0.50);
    // Zone 4 — scattered frost crystals
    this._placeDenseCluster(325, 195, 12, 14, [OBJ.CRYSTAL], 0.42);
    this._placeDenseCluster(470, 130, 10, 12, [OBJ.CRYSTAL], 0.40);
    this._placeDenseCluster(415, 105, 10, 12, [OBJ.CRYSTAL], 0.38);
  }

  // ── Clear safe areas around towns ────────────────────────────────────────
  _clearTownAreas() {
    const towns = [
      // Zone 1 — Starter Plains (south-central organic region)
      { col: 185, row: 390, r: 18 }, // Evergreen Hollow (spawn)
      { col:  55, row: 440, r: 12 }, // Western Outpost
      { col: 230, row: 460, r: 10 }, // Eastern Farmstead
      { col: 185, row: 470, r:  8 }, // Southern hamlet
      // Zone 2 — Wildwood Frontier (southeast)
      { col: 380, row: 320, r: 14 }, // Thornmere
      { col: 460, row: 460, r: 10 }, // East Wildwood Camp
      { col: 305, row: 460, r: 10 }, // West Wildwood Camp
      { col: 445, row: 285, r:  8 }, // Northern Wildwood Post
      // Zone 3 — Ironvale Expanse (west)
      { col:  80, row: 220, r: 14 }, // Ironhaven
      { col:  35, row: 145, r: 10 }, // Western Ironvale Post
      { col: 155, row: 275, r: 10 }, // Ironvale Gate
      // Zone 4 — Frostthorn Reach (northeast)
      { col: 340, row: 150, r: 14 }, // Frostholm
      { col: 455, row: 125, r: 10 }, // Northern Frostholm Post
      { col: 300, row: 255, r: 10 }, // Frostholm Gate
      { col: 430, row: 240, r:  8 }, // Eastern Frost Watch
      // Zone 5 — Shadowfall Wastes (north)
      { col: 210, row:  65, r: 14 }, // Dusk Citadel (boss area)
      { col:  75, row:  55, r:  8 }, // Shadow West Watch
      { col: 380, row:  60, r:  8 }, // Shadow East Watch
    ];
    for (const t of towns) {
      for (let dr = -t.r; dr <= t.r; dr++) {
        for (let dc = -t.r; dc <= t.r; dc++) {
          if (dc * dc + dr * dr <= t.r * t.r) {
            this.setObj(t.col + dc, t.row + dr, OBJ.NONE);
            if (this.getTile(t.col + dc, t.row + dr) !== TILE.WATER) {
              // Roads near center, grass otherwise
              const d = Math.sqrt(dc * dc + dr * dr);
              this.setTile(t.col + dc, t.row + dr, d < t.r * 0.4 ? TILE.DIRT : TILE.GRASS);
            }
          }
        }
      }
    }
  }

  // ── NPCs ─────────────────────────────────────────────────────────────────
  _placeNPCs() {
    this.npcs = [
      // ── Zone 1: Evergreen Hollow (spawn col 185, row 390) ──
      { col: 185, row: 390, name: 'Elder Thaddeus',  dialogue: ["Welcome to Evergreen Hollow. Your journey begins here.", "Head east to find Thornmere in the Wildwood.", "Go northwest to reach Ironhaven, or northeast for Frostholm. Beyond lies Shadowfall."] },
      { col: 187, row: 388, name: 'Blacksmith Oryn', dialogue: ["I can smelt Ore into Metal Bars, and upgrade your gear.", "Mine rocks across the land to gather Ore. Bring 3 Ore to smelt a Metal Bar.", "Press F to open my crafting menu."] },
      { col: 183, row: 392, name: 'Scout Mira',      dialogue: ["The Wildwood lies to the east — denser and wilder.", "Ironvale sits northwest, rocky and arid. Cold Frostholm is northeast.", "Shadowfall lurks in the far north. Don't go there unprepared."] },
      // Zone 1 — Western Outpost
      { col:  55, row: 440, name: 'Cook Yeva',       dialogue: ["I cook Raw Meat into meals that restore HP.", "Chop trees for Wood, then gather meat from sheep in the fields.", "Press F to open my cooking menu."] },
      { col:  57, row: 442, name: 'Ranger Hollis',   dialogue: ["I craft leather armor from Hide and Metal Bars.", "Gather Hide and Wool from sheep roaming the plains.", "Press F to open my crafting menu."] },
      // ── Zone 2: Thornmere (col 380, row 320) ──
      { col: 380, row: 320, name: 'Thornmere Guard',  dialogue: ["Thornmere watches over the eastern Wildwood.", "The forest is dense — enemies lurk between the trees.", "Head northeast along the road to reach Frostholm."] },
      { col: 382, row: 318, name: 'Weaponsmith Bram', dialogue: ["I forge blades from Metal Bars and Ore.", "Bring me Metal Bars to craft or upgrade your weapon.", "Press F to open my weapon forge."] },
      { col: 460, row: 460, name: 'Herbalist Fenn',   dialogue: ["Wildwood fungi have strange healing properties.", "Don't push north too early — the Ironvale beasts are brutal.", "Crystals in Shadowfall are said to pulse with dark energy."] },
      { col: 305, row: 460, name: 'Armorsmith Liss',  dialogue: ["I build heavy armor from Metal Bars and Hide.", "A well-armored adventurer survives longer.", "Press F to open my armor forge."] },
      // ── Zone 3: Ironhaven (col 80, row 220) ──
      { col:  80, row: 220, name: 'Ironhaven Elder',  dialogue: ["Ironhaven was built on bones of an older city.", "Ore veins run deep here — follow them into the rock.", "Do not touch the standing stones at the ruin sites."] },
      { col:  82, row: 218, name: 'Geomancer Thal',   dialogue: ["The earth resonates with old power.", "Those boulders were placed deliberately — ancient engineering.", "Shadowfall is a wound that will not close."] },
      { col:  35, row: 145, name: 'Ironvale Scout',   dialogue: ["The path to Frostholm is treacherous.", "Gear up well before crossing into the frozen lands.", "I've seen bears up there bigger than horses."] },
      // ── Zone 4: Frostholm (col 340, row 150) ──
      { col: 340, row: 150, name: 'Frostholm Warden', dialogue: ["Frostholm has stood for three hundred winters.", "Ice wolves grow bolder each year.", "Shadowfall lies north — avoid it until you are ready."] },
      { col: 342, row: 148, name: 'Ice Mage Solvei',  dialogue: ["The ley lines converge beneath this glacier.", "Crystal formations are conduits for ancient magic.", "The Shadowfall boss is not of this world. Level 20 minimum."] },
      { col: 455, row: 125, name: 'Frost Scout',      dialogue: ["These ruins predate the kingdom by centuries.", "Something stirs in the Shadowfall to the north.", "Be careful near the ice — it cracks."] },
      // ── Zone 5: Dusk Citadel (col 210, row 65) ──
      { col: 210, row:  65, name: 'Dusk Sentinel',    dialogue: ["You should not be here.", "The Wastes consume the unprepared.", "Only the strongest survive the Shadowfall."] },
      { col: 212, row:  63, name: 'Cursed Scholar',   dialogue: ["I came to study the ruins. I cannot leave.", "The crystals speak if you listen long enough.", "Find the Obsidian Throne. Destroy it. Please."] },
      { col:  75, row:  55, name: 'Shadow Watcher',   dialogue: ["This watch post has not had relief in months.", "Something drives the beasts south. Something ancient.", "Do not linger here after dark."] },
      { col: 380, row:  60, name: 'East Sentinel',    dialogue: ["The eastern ruins are older than the kingdom.", "We've lost three scouts this week.", "If you find the Throne room — do not touch the altar."] },
    ];
  }

  // ── Chests ────────────────────────────────────────────────────────────────
  _placeChests() {
    const positions = [
      // Zone 1 — Starter Plains (south-central organic region)
      [ 70, 360], [155, 340], [ 30, 440], [215, 355],
      [145, 475], [ 90, 415], [225, 420], [175, 405],
      [ 20, 330], [240, 490], [115, 490], [ 50, 490],
      // Zone 2 — Wildwood Frontier (southeast)
      [305, 345], [445, 350], [480, 290], [325, 490],
      [400, 470], [465, 415], [280, 395], [355, 295],
      [490, 490], [425, 380], [490, 360], [345, 490],
      // Zone 3 — Ironvale Expanse (west)
      [ 25, 285], [165, 255], [ 85, 165], [170, 125],
      [ 25, 155], [155, 295], [125, 145], [ 15, 205],
      [115, 240], [ 50, 240], [ 15, 130],
      // Zone 4 — Frostthorn Reach (northeast)
      [285, 265], [425, 255], [490, 165], [315, 115],
      [460, 105], [300, 280], [395, 130], [480, 195],
      [270, 165], [460, 235], [490, 245], [355, 240],
      // Zone 5 — Shadowfall Wastes (north)
      [ 30,  25], [115,  35], [195,  18], [210,  82],
      [305,  22], [385,  38], [465,  18], [145,  78],
      [345,  78], [ 75,  88], [445,  75], [255,  60],
    ];
    for (const [col, row] of positions) {
      if (!this._inBounds(col, row)) continue;
      if (this.getTile(col, row) === TILE.WATER) continue;
      this.setObj(col, row, OBJ.CHEST);
      this.chests.push({ col, row, looted: false });
    }
  }
}

// ─── Tile visual configs ──────────────────────────────────────────────────────
export const TILE_COLORS = {
  [TILE.GRASS]:      { fill: '#2d5a1b', stroke: '#25491a' },
  [TILE.DARK_GRASS]: { fill: '#182e10', stroke: '#122509' },
  [TILE.DIRT]:       { fill: '#6b4c2a', stroke: '#5a3e22' },
  [TILE.MUD]:        { fill: '#4a3520', stroke: '#3c2c1a' },
  [TILE.STONE]:      { fill: '#4a4a52', stroke: '#3d3d44' },
  [TILE.WATER]:      { fill: '#1a4a7a', stroke: '#153e68' },
  [TILE.SAND]:       { fill: '#a08838', stroke: '#8a7530' },
  [TILE.SNOW]:       { fill: '#c8d8e8', stroke: '#b0c4d4' },
  [TILE.ICE]:        { fill: '#9ecce8', stroke: '#82b8d8' },
  [TILE.DEAD]:       { fill: '#251a25', stroke: '#1c1420' },
};