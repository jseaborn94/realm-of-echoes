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

  // ── Perlin-like noise patches for terrain variety ─────────────────────────
  _addNoiseVariation() {
    // Scatter random tile-type blobs across the world for natural variation
    // rowMin/rowMax now reference new zone rows (row 0=north/Shadowfall, row 499=south/Starter)
    const patches = [
      { tile: TILE.MUD,   count: 80, size: 8 },
      { tile: TILE.SAND,  count: 50, size: 10, rowMin: 100, rowMax: 400 },
      { tile: TILE.STONE, count: 60, size: 7,  rowMin: 100, rowMax: 400 },
      { tile: TILE.SNOW,  count: 40, size: 9,  rowMax: 120 },
      { tile: TILE.DEAD,  count: 30, size: 8,  rowMax: 100 },
    ];
    for (const p of patches) {
      const rMin = p.rowMin || 0;
      const rMax = p.rowMax || WORLD_ROWS;
      for (let i = 0; i < p.count; i++) {
        const cx = Math.floor(rand() * WORLD_COLS);
        const cy = rMin + Math.floor(rand() * (rMax - rMin));
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

  // ── Dirt roads connecting the zones ──────────────────────────────────────
  _paintRoads() {
    // NEW LAYOUT:
    // Zone 1 (spawn): cols 0–249, rows 300–499  (SW quadrant)
    // Zone 2:         cols 250–499, rows 300–499 (SE quadrant)
    // Zone 3:         cols 0–249,   rows 100–299 (NW quadrant)
    // Zone 4:         cols 250–499, rows 100–299 (NE quadrant)
    // Zone 5:         cols 0–499,   rows 0–99    (top strip)
    // Spawn: col 125, row 420

    // Main vertical road — Zone 1 spine (col ~125, south to mid)
    this._paintRoad(125, 490, 125, 300, true, 3);
    // Horizontal connector at zone 1/2 border (row 300)
    this._paintRoad(10, 300, 490, 300, false, 2);
    // Zone 2 spine (col ~375)
    this._paintRoad(375, 490, 375, 300, true, 3);
    // Zone 3 spine (col ~125, rows 100–300)
    this._paintRoad(125, 300, 125, 100, true, 3);
    // Zone 4 spine (col ~375, rows 100–300)
    this._paintRoad(375, 300, 375, 100, true, 3);
    // Horizontal connector at zone 3/4 border mid (row ~200)
    this._paintRoad(10, 200, 490, 200, false, 2);
    // Horizontal connector at zone 5 border (row 100)
    this._paintRoad(10, 100, 490, 100, false, 2);
    // Zone 5 spine (row ~50, horizontal)
    this._paintRoad(10, 50, 490, 50, false, 2);
    // Cross connectors between left/right at mid heights
    this._paintRoad(125, 420, 375, 420, false, 2);
    this._paintRoad(125, 350, 375, 350, false, 1);
    this._paintRoad(125, 150, 375, 150, false, 1);
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
    // River 1: horizontal river separating Zone 1/2 (south) from Zone 3/4 (north), row ~300
    this._placeRiver(0, 298, 500, 298, false, 3, 18);
    // River 2: vertical river dividing Zone 1 (left) from Zone 2 (right) in lower half, col ~250
    this._placeRiver(248, 300, 248, 499, true, 2, 14);
    // River 3: vertical river dividing Zone 3 from Zone 4 in upper half, col ~250
    this._placeRiver(248, 100, 248, 300, true, 2, 12);
    // River 4: horizontal river at Zone 5 boundary, row ~100
    this._placeRiver(0, 98, 500, 98, false, 2, 16);
    // River 5: meandering river through Zone 3 (Ironvale), row ~200
    this._placeRiver(0, 200, 249, 200, false, 2, 12);
    // River 6: meandering river through Zone 4 (Frostthorn), row ~180
    this._placeRiver(250, 180, 499, 180, false, 2, 12);
    // River 7: river through Shadowfall strip
    this._placeRiver(0, 50, 499, 50, false, 2, 14);
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
      // Zone 1 — Starter Plains (cols 0–249, rows 300–499)
      { cx:  60, cy: 380, rx: 16, ry: 10 },
      { cx: 190, cy: 460, rx: 18, ry: 12 },
      { cx: 100, cy: 440, rx: 12, ry:  8 },
      // Zone 2 — Wildwood Frontier (cols 250–499, rows 300–499)
      { cx: 350, cy: 380, rx: 16, ry: 10 },
      { cx: 430, cy: 450, rx: 14, ry:  9 },
      { cx: 290, cy: 460, rx: 12, ry:  8 },
      // Zone 3 — Ironvale Expanse (cols 0–249, rows 100–299)
      { cx:  70, cy: 240, rx: 14, ry:  9 },
      { cx: 180, cy: 140, rx: 16, ry: 10 },
      { cx:  50, cy: 130, rx: 10, ry:  7 },
      // Zone 4 — Frostthorn Reach (cols 250–499, rows 100–299)
      { cx: 380, cy: 240, rx: 14, ry:  9 },
      { cx: 460, cy: 140, rx: 16, ry: 10 },
      { cx: 290, cy: 130, rx: 12, ry:  8 },
      // Zone 5 — Shadowfall Wastes (full width, rows 0–99)
      { cx: 120, cy:  55, rx: 18, ry: 11 },
      { cx: 370, cy:  45, rx: 16, ry: 10 },
      { cx: 250, cy:  70, rx: 14, ry:  9 },
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

  // ── Forest clusters ───────────────────────────────────────────────────────
  _placeForestClusters() {
    // Zone 1 — Starter Plains (cols 0–249, rows 300–499): scattered trees
    this._placeClusterField(0, 300, 249, 499, [OBJ.TREE], 0.045, 12, 20);
    // Zone 2 — Wildwood Frontier (cols 250–499, rows 300–499): dense forest
    this._placeClusterField(250, 300, 499, 499, [OBJ.TREE, OBJ.PINE], 0.09, 22, 35);
    this._placeDenseCluster(330, 380, 45, 55, [OBJ.TREE, OBJ.PINE], 0.68);
    this._placeDenseCluster(420, 420, 38, 45, [OBJ.TREE, OBJ.PINE], 0.65);
    this._placeDenseCluster(280, 460, 35, 40, [OBJ.PINE],           0.70);
    // Zone 3 — Ironvale Expanse (cols 0–249, rows 100–299): sparse pines + boulders
    this._placeClusterField(0, 100, 249, 299, [OBJ.PINE, OBJ.BOULDER], 0.05, 10, 18);
    // Zone 4 — Frostthorn Reach (cols 250–499, rows 100–299): frost pines
    this._placeClusterField(250, 100, 499, 299, [OBJ.PINE], 0.07, 12, 22);
    this._placeDenseCluster(380, 160, 40, 45, [OBJ.PINE], 0.72);
    this._placeDenseCluster(460, 250, 35, 40, [OBJ.PINE], 0.68);
    // Zone 5 — Shadowfall Wastes (cols 0–499, rows 0–99): dead trees + ruins
    this._placeClusterField(0, 0, 499, 99, [OBJ.RUIN, OBJ.ROCK], 0.08, 8, 14);
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
    // Zone 3 — Ironvale rock fields (cols 0–249, rows 100–299)
    this._placeDenseCluster( 60, 220, 50, 60, [OBJ.ROCK, OBJ.BOULDER], 0.45);
    this._placeDenseCluster(180, 150, 55, 65, [OBJ.ROCK, OBJ.BOULDER], 0.45);
    this._placeDenseCluster( 80, 130, 40, 50, [OBJ.BOULDER, OBJ.ROCK], 0.50);
    // Zone 4 — Frostthorn boulder fields (cols 250–499, rows 100–299)
    this._placeDenseCluster(320, 240, 45, 55, [OBJ.BOULDER, OBJ.ROCK], 0.40);
    this._placeDenseCluster(450, 150, 40, 50, [OBJ.BOULDER],           0.42);
    this._placeDenseCluster(290, 140, 38, 48, [OBJ.ROCK, OBJ.BOULDER], 0.44);
    // Zone 1 — occasional rocks in plains
    this._placeClusterField(0, 300, 249, 499, [OBJ.ROCK], 0.015, 4, 8);
    // Zone 2 — occasional rocks in wildwood
    this._placeClusterField(250, 300, 499, 499, [OBJ.ROCK], 0.015, 4, 8);
  }

  // ── Ruin sites (landmark areas) ───────────────────────────────────────────
  _placeRuinSites() {
    const sites = [
      // Zone 1 — Starter Plains (cols 0–249, rows 300–499)
      { cx:  50, cy: 340, w: 14, h: 14 },
      { cx: 200, cy: 490, w: 12, h: 12 },
      // Zone 2 — Wildwood Frontier (cols 250–499, rows 300–499)
      { cx: 470, cy: 340, w: 14, h: 14 },
      { cx: 300, cy: 490, w: 12, h: 12 },
      { cx: 390, cy: 320, w: 16, h: 16 },
      // Zone 3 — Ironvale Expanse (cols 0–249, rows 100–299)
      { cx:  55, cy: 280, w: 16, h: 14 },
      { cx: 200, cy: 270, w: 18, h: 18 },
      { cx: 130, cy: 120, w: 14, h: 12 },
      // Zone 4 — Frostthorn Reach (cols 250–499, rows 100–299)
      { cx: 440, cy: 280, w: 16, h: 14 },
      { cx: 300, cy: 270, w: 15, h: 15 },
      { cx: 380, cy: 120, w: 14, h: 12 },
      // Zone 5 — Shadowfall Wastes (full width, rows 0–99)
      { cx:  80, cy:  30, w: 20, h: 16 },
      { cx: 250, cy:  30, w: 24, h: 18 }, // central boss ruins
      { cx: 420, cy:  30, w: 20, h: 16 },
      { cx: 160, cy:  70, w: 16, h: 14 },
      { cx: 340, cy:  70, w: 16, h: 14 },
    ];
    for (const s of sites) {
      this._placeDenseCluster(s.cx, s.cy, s.w, s.h, [OBJ.RUIN, OBJ.ROCK], 0.55);
    }
  }

  // ── Crystal groves (Shadowfall special) ──────────────────────────────────
  _placeCrystalGroves() {
    // Zone 5 — Shadowfall crystal fields
    this._placeDenseCluster( 60, 40, 18, 20, [OBJ.CRYSTAL], 0.55);
    this._placeDenseCluster(200, 60, 16, 18, [OBJ.CRYSTAL], 0.55);
    this._placeDenseCluster(250, 35, 20, 22, [OBJ.CRYSTAL, OBJ.RUIN], 0.50);
    this._placeDenseCluster(350, 55, 16, 18, [OBJ.CRYSTAL], 0.55);
    this._placeDenseCluster(450, 40, 18, 20, [OBJ.CRYSTAL], 0.55);
    // Scattered frost crystals in Zone 4 (cols 250–499, rows 100–299)
    this._placeDenseCluster(310, 200, 10, 12, [OBJ.CRYSTAL], 0.40);
    this._placeDenseCluster(470, 120, 10, 12, [OBJ.CRYSTAL], 0.40);
  }

  // ── Clear safe areas around towns ────────────────────────────────────────
  _clearTownAreas() {
    const towns = [
      // Zone 1 — Starter Plains (cols 0–249, rows 300–499)
      { col: 125, row: 420, r: 18 }, // Evergreen Hollow (spawn)
      { col:  55, row: 460, r: 12 }, // Southern Outpost
      { col: 200, row: 480, r: 10 }, // Eastwatch Post
      // Zone 2 — Wildwood Frontier (cols 250–499, rows 300–499)
      { col: 375, row: 420, r: 14 }, // Thornmere
      { col: 460, row: 470, r: 10 }, // East Wildwood Camp
      { col: 280, row: 470, r: 10 }, // West Wildwood Camp
      // Zone 3 — Ironvale Expanse (cols 0–249, rows 100–299)
      { col: 125, row: 200, r: 14 }, // Ironhaven
      { col:  55, row: 130, r: 10 }, // Northern Ironvale Outpost
      { col: 210, row: 280, r: 10 }, // Ironvale Gate
      // Zone 4 — Frostthorn Reach (cols 250–499, rows 100–299)
      { col: 375, row: 200, r: 14 }, // Frostholm
      { col: 460, row: 130, r: 10 }, // Northern Frostholm Post
      { col: 290, row: 280, r: 10 }, // Frostholm Gate
      // Zone 5 — Shadowfall Wastes (full width, rows 0–99)
      { col: 250, row:  50, r: 14 }, // Dusk Citadel (boss area)
      { col:  80, row:  60, r:  8 }, // Shadowfall West Watch
      { col: 420, row:  60, r:  8 }, // Shadowfall East Watch
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
      // ── Zone 1: Starter Plains (cols 0–249, rows 300–499, spawn col 125 row 420) ──
      { col: 125, row: 420, name: 'Elder Thaddeus',  dialogue: ["Welcome to Evergreen Hollow. This is where your journey begins.", "Head east across the river to reach the Wildwood Frontier.", "Go north through Ironhaven, then Frostholm — and beyond lies Shadowfall."] },
      { col: 127, row: 418, name: 'Blacksmith Oryn', dialogue: ["I can smelt Ore into Metal Bars, and upgrade your gear.", "Mine rocks in the world to gather Ore. Bring 3 Ore to smelt a Metal Bar.", "Press F to open my crafting menu."] },
      { col: 123, row: 422, name: 'Scout Mira',      dialogue: ["The river divides this land. East is the Wildwood — wilder, denser.", "The north holds Ironvale and Frostholm — cold and dangerous.", "At the very top of the world lies the Shadowfall. Don't go unprepared."] },
      // Zone 1 — Southern Outpost
      { col:  55, row: 460, name: 'Cook Yeva',       dialogue: ["I cook Raw Meat into meals that restore HP.", "Chop trees for Wood, then gather meat from sheep in the fields.", "Press F to open my cooking menu."] },
      { col:  57, row: 458, name: 'Ranger Hollis',   dialogue: ["I craft leather armor from Hide and Metal Bars.", "Gather Hide and Wool from sheep roaming the plains — hold F near them.", "Press F to open my crafting menu."] },
      // ── Zone 2: Wildwood Frontier (cols 250–499, rows 300–499) ──
      { col: 375, row: 420, name: 'Thornmere Guard',  dialogue: ["Thornmere watches over the eastern Wildwood.", "The forest here is dense — enemies lurk between the trees.", "Follow the road north to reach Frostholm."] },
      { col: 377, row: 418, name: 'Weaponsmith Bram', dialogue: ["I forge blades from Metal Bars and Ore.", "Bring me Metal Bars to craft a new weapon or upgrade your existing one.", "Press F to open my weapon forge."] },
      { col: 460, row: 470, name: 'Herbalist Fenn',   dialogue: ["The Wildwood fungi have strange healing properties.", "I've seen travelers push north too early and regret it.", "The crystals in Shadowfall are said to glow at midnight."] },
      { col: 280, row: 470, name: 'Armorsmith Liss',  dialogue: ["I build heavy armor from Metal Bars and Hide.", "A well-armored adventurer survives longer. Bring materials and I'll get to work.", "Press F to open my armor forge."] },
      // ── Zone 3: Ironvale Expanse (cols 0–249, rows 100–299) ──
      { col: 125, row: 200, name: 'Ironhaven Elder',  dialogue: ["Ironhaven was built on the bones of an older city.", "The ore veins run deep here — follow them into the rock.", "Do not touch the standing stones at the ruin sites."] },
      { col: 127, row: 198, name: 'Geomancer Thal',   dialogue: ["The earth here resonates with old power.", "Those boulders were placed deliberately — ancient engineering.", "Shadowfall at the top of the world is a wound that will not close."] },
      { col:  55, row: 130, name: 'Ironvale Scout',   dialogue: ["The northern pass into Frostholm is treacherous.", "Gear up well before you cross the zone border.", "I've seen bears up there bigger than horses."] },
      // ── Zone 4: Frostthorn Reach (cols 250–499, rows 100–299) ──
      { col: 375, row: 200, name: 'Frostholm Warden', dialogue: ["Frostholm has stood for three hundred winters.", "The ice wolves grow bolder each year.", "Shadowfall lies just north — avoid it until you are ready."] },
      { col: 377, row: 198, name: 'Ice Mage Solvei',  dialogue: ["The ley lines converge beneath this glacier.", "Crystal formations are conduits for ancient magic.", "The Shadowfall boss is not of this world. You will need level 20 at minimum."] },
      { col: 460, row: 130, name: 'Frost Scout',      dialogue: ["These ruins predate the kingdom by centuries.", "Something stirs in the Shadowfall strip — I can feel it from here.", "Be careful near the ice — it cracks."] },
      // ── Zone 5: Shadowfall Wastes (cols 0–499, rows 0–99) ──
      { col: 250, row:  50, name: 'Dusk Sentinel',    dialogue: ["You should not be here.", "The Wastes consume the unprepared.", "Only the strongest survive the Shadowfall."] },
      { col: 252, row:  48, name: 'Cursed Scholar',   dialogue: ["I came to study the ruins. I cannot leave.", "The crystals speak if you listen long enough.", "Find the Obsidian Throne. Destroy it. Please."] },
      { col:  80, row:  60, name: 'Shadow Watcher',   dialogue: ["This western watch has not seen relief in months.", "Something drives the beasts south. Something ancient.", "Do not linger here after dark."] },
      { col: 420, row:  60, name: 'East Sentinel',    dialogue: ["The eastern ruins are older than the kingdom.", "We've lost three scouts this week.", "If you find the Throne room — do not touch the altar."] },
    ];
  }

  // ── Chests ────────────────────────────────────────────────────────────────
  _placeChests() {
    const positions = [
      // Zone 1 — Starter Plains (cols 0–249, rows 300–499)
      [ 60, 350], [150, 330], [ 30, 450], [200, 340],
      [140, 470], [ 80, 400], [220, 410], [170, 390],
      [ 20, 310], [230, 490],
      // Zone 2 — Wildwood Frontier (cols 250–499, rows 300–499)
      [290, 330], [440, 350], [480, 310], [310, 490],
      [390, 470], [460, 420], [270, 400], [350, 310],
      [490, 490], [420, 390],
      // Zone 3 — Ironvale Expanse (cols 0–249, rows 100–299)
      [ 30, 280], [170, 260], [ 90, 170], [230, 120],
      [ 50, 110], [200, 290], [140, 140], [ 20, 200],
      [220, 170], [ 70, 240],
      // Zone 4 — Frostthorn Reach (cols 250–499, rows 100–299)
      [270, 280], [430, 260], [490, 170], [320, 120],
      [460, 110], [300, 290], [400, 140], [480, 200],
      [280, 170], [460, 240],
      // Zone 5 — Shadowfall Wastes (cols 0–499, rows 0–99)
      [ 30,  20], [120,  30], [200,  15], [250,  80],
      [310,  20], [400,  35], [470,  15], [150,  75],
      [350,  75], [ 80,  85],
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