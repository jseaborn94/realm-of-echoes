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
            tile = r < 0.15 ? TILE.DEAD : (r < 0.30 ? TILE.STONE : (r < 0.42 ? TILE.MUD : TILE.DARK_GRASS));
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
    const patches = [
      { tile: TILE.MUD,   count: 80, size: 8 },
      { tile: TILE.SAND,  count: 50, size: 10, rowMin: 100 },
      { tile: TILE.STONE, count: 60, size: 7,  rowMin: 100 },
      { tile: TILE.SNOW,  count: 40, size: 9,  rowMax: 180 },
      { tile: TILE.DEAD,  count: 30, size: 8,  rowMin: 140, rowMax: 300 },
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
    // North-South spine road through middle of the world
    this._paintRoad(245, 490, 245, 10, true, 3);
    // Branch roads at various depths
    this._paintRoad(100, 420, 245, 420, false, 2); // Plains east branch
    this._paintRoad(380, 420, 245, 420, false, 2); // Plains west branch
    this._paintRoad(80,  310, 245, 310, false, 2); // Forest branch
    this._paintRoad(400, 310, 245, 310, false, 2);
    this._paintRoad(60,  200, 245, 200, false, 2); // Ironvale branch
    this._paintRoad(420, 200, 245, 200, false, 2);
    this._paintRoad(120, 80,  245, 80,  false, 2); // Frost branch
    this._paintRoad(360, 80,  245, 80,  false, 2);
    // Diagonal shortcut paths
    this._paintRoad(130, 290, 245, 310, false, 1);
    this._paintRoad(370, 290, 245, 310, false, 1);
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
    // River 1: wide river cutting through Plains/Forest border
    this._placeRiver(0, 340, 500, 340, false, 3, 20);
    // River 2: vertical river on west side
    this._placeRiver(60, 0, 60, 300, true, 2, 15);
    // River 3: vertical river on east side
    this._placeRiver(440, 0, 440, 280, true, 2, 12);
    // River 4: short river through Ironvale
    this._placeRiver(150, 130, 350, 130, false, 2, 18);
    // River 5: Frost river
    this._placeRiver(100, 55, 400, 55, false, 2, 14);
    // River 6: Shadowfall boundary creek
    this._placeRiver(130, 210, 380, 210, false, 1, 10);
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
      { cx: 420, cy: 430, rx: 18, ry: 12 }, // Plains SE lake
      { cx: 80,  cy: 400, rx: 14, ry: 10 }, // Plains SW lake
      { cx: 250, cy: 440, rx: 22, ry: 14 }, // Plains central lake (near spawn)
      { cx: 350, cy: 280, rx: 15, ry: 10 }, // Forest lake
      { cx: 110, cy: 260, rx: 12, ry:  8 }, // Forest west lake
      { cx: 200, cy: 160, rx: 16, ry: 10 }, // Ironvale lake
      { cx: 380, cy: 150, rx: 12, ry:  8 }, // Ironvale east lake
      { cx: 250, cy:  50, rx: 20, ry: 12 }, // Frost lake
      { cx: 100, cy:  40, rx: 10, ry:  7 }, // Frost west lake
      { cx: 250, cy: 220, rx: 14, ry:  9 }, // Shadowfall marsh
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
    // Zone 1 — scattered trees (sparse)
    this._placeClusterField(0, 300, 500, 500, [OBJ.TREE], 0.045, 15, 20);
    // Zone 2 — dense forest
    this._placeClusterField(0, 200, 500, 320, [OBJ.TREE, OBJ.PINE], 0.09, 25, 35);
    // Zone 3 — sparse pine groves
    this._placeClusterField(0, 100, 500, 220, [OBJ.PINE, OBJ.BOULDER], 0.055, 10, 18);
    // Zone 4 — frost pines
    this._placeClusterField(0, 0, 500, 120, [OBJ.PINE], 0.07, 12, 22);
    // Zone 5 — dead trees + ruins
    this._placeClusterField(130, 150, 380, 270, [OBJ.RUIN, OBJ.ROCK], 0.08, 8, 15);
    // Extra dense pockets (named "groves") within Zone 2
    this._placeDenseCluster(120, 240, 40, 50, [OBJ.TREE, OBJ.PINE], 0.65);
    this._placeDenseCluster(350, 260, 38, 45, [OBJ.TREE, OBJ.PINE], 0.65);
    this._placeDenseCluster(240, 230, 30, 35, [OBJ.PINE],           0.70);
    // Dense frost forests (Zone 4)
    this._placeDenseCluster(180, 40, 35, 40, [OBJ.PINE], 0.72);
    this._placeDenseCluster(320, 35, 38, 45, [OBJ.PINE], 0.68);
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
    // Ironvale rock fields
    this._placeDenseCluster(120, 155, 50, 60, [OBJ.ROCK, OBJ.BOULDER], 0.45);
    this._placeDenseCluster(380, 165, 55, 65, [OBJ.ROCK, OBJ.BOULDER], 0.45);
    this._placeDenseCluster(250, 140, 40, 50, [OBJ.BOULDER, OBJ.ROCK], 0.50);
    // Frost boulder fields
    this._placeDenseCluster(100, 70, 45, 55, [OBJ.BOULDER, OBJ.ROCK],  0.40);
    this._placeDenseCluster(380, 75, 40, 50, [OBJ.BOULDER],            0.42);
    // Plains occasional rocks
    this._placeClusterField(0, 300, 500, 500, [OBJ.ROCK], 0.015, 4, 8);
  }

  // ── Ruin sites (landmark areas) ───────────────────────────────────────────
  _placeRuinSites() {
    const sites = [
      { cx: 90,  cy: 390, w: 14, h: 14 }, // Plains SW ruins
      { cx: 410, cy: 410, w: 12, h: 12 }, // Plains SE ruins
      { cx: 160, cy: 310, w: 16, h: 16 }, // Forest ruins
      { cx: 360, cy: 295, w: 15, h: 15 },
      { cx: 245, cy: 185, w: 18, h: 18 }, // Ironvale ancient site
      { cx: 90,  cy: 165, w: 14, h: 12 },
      { cx: 420, cy: 175, w: 13, h: 13 },
      { cx: 245, cy: 95,  w: 20, h: 16 }, // Frost ruins
      { cx: 155, cy: 215, w: 16, h: 16 }, // Shadowfall outer ruins
      { cx: 320, cy: 220, w: 16, h: 16 },
      { cx: 245, cy: 200, w: 22, h: 18 }, // Shadowfall core ruins
    ];
    for (const s of sites) {
      this._placeDenseCluster(s.cx, s.cy, s.w, s.h, [OBJ.RUIN, OBJ.ROCK], 0.55);
    }
  }

  // ── Crystal groves (Shadowfall special) ──────────────────────────────────
  _placeCrystalGroves() {
    this._placeDenseCluster(200, 190, 18, 20, [OBJ.CRYSTAL], 0.55);
    this._placeDenseCluster(290, 195, 16, 18, [OBJ.CRYSTAL], 0.55);
    this._placeDenseCluster(245, 255, 20, 22, [OBJ.CRYSTAL, OBJ.RUIN], 0.50);
    // Smaller frost crystals
    this._placeDenseCluster(170, 60, 10, 12, [OBJ.CRYSTAL], 0.40);
    this._placeDenseCluster(340, 65, 10, 12, [OBJ.CRYSTAL], 0.40);
  }

  // ── Clear safe areas around towns ────────────────────────────────────────
  _clearTownAreas() {
    const towns = [
      { col: 248, row: 448, r: 18 }, // Zone 1 — Evergreen Hollow (spawn)
      { col: 95,  row: 415, r: 12 }, // Zone 1 — Western Outpost
      { col: 405, row: 415, r: 12 }, // Zone 1 — Eastern Outpost
      { col: 248, row: 308, r: 14 }, // Zone 2 — Thornmere
      { col: 100, row: 285, r: 10 }, // Zone 2 — West Wildwood Camp
      { col: 395, row: 285, r: 10 },
      { col: 248, row: 175, r: 14 }, // Zone 3 — Ironhaven
      { col: 248, row:  82, r: 14 }, // Zone 4 — Frostholm
      { col: 248, row: 210, r: 10 }, // Zone 5 — Dusk Citadel
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
      // ── Zone 1: Starter Plains ──
      { col: 248, row: 448, name: 'Elder Thaddeus',  dialogue: ["Welcome to the Realm of Echoes.", "Many adventurers set out from Evergreen Hollow — few return from the north.", "Press F to speak to any soul you find."] },
      { col: 250, row: 446, name: 'Blacksmith Oryn', dialogue: ["I can smelt Ore into Metal Bars, and upgrade your gear.", "Bring me 3 Ore to smelt a Metal Bar. Mine rocks in the world to gather Ore.", "Press F to open my crafting menu."] },
      { col: 246, row: 450, name: 'Scout Mira',      dialogue: ["Follow the northern road through the Wildwood.", "The Shadowfall Wastes lie in the heart of the world — avoid them until you're ready.", "I've seen creatures near the lakebed at dusk."] },
      { col: 95,  row: 413, name: 'Ranger Hollis',   dialogue: ["I craft leather armor from Hide and Metal Bars.", "Gather Hide and Wool from sheep roaming the plains — hold F near them.", "Press F to open my crafting menu."] },
      { col: 405, row: 413, name: 'Cook Yeva',       dialogue: ["I cook Raw Meat into meals that restore HP.", "Chop trees for Wood to fuel my fire, then gather meat from sheep.", "Press F to open my cooking menu."] },
      // ── Zone 2: Wildwood Frontier ──
      { col: 248, row: 308, name: 'Thornmere Guard',  dialogue: ["Thornmere is the last safe town in the Wildwood.", "The trees grow darker to the north.", "Follow the road — leave it and you risk the beasts."] },
      { col: 250, row: 306, name: 'Herbalist Fenn',   dialogue: ["The wild fungi here have strange properties.", "I once walked to Ironvale — never again alone.", "The crystals in the Shadowfall glow at midnight."] },
      { col: 100, row: 283, name: 'Weaponsmith Bram',  dialogue: ["I forge blades from Metal Bars and Ore.", "Bring me Metal Bars to craft a new weapon, or upgrade the one you carry.", "Press F to open my weapon forge."] },
      { col: 395, row: 283, name: 'Armorsmith Liss',  dialogue: ["I build heavy armor from Metal Bars and Hide.", "A well-armored adventurer survives longer. Bring materials and I'll get to work.", "Press F to open my armor forge."] },
      // ── Zone 3: Ironvale Expanse ──
      { col: 248, row: 175, name: 'Ironhaven Elder',  dialogue: ["Ironhaven was built on the bones of an older city.", "The ore flows north into the Frost — follow the veins.", "Do not touch the standing stones at the centre site."] },
      { col: 250, row: 173, name: 'Geomancer Thal',   dialogue: ["The earth here resonates with old power.", "Those boulders were placed deliberately — ancient engineering.", "The Shadowfall Wastes are a wound in the world itself."] },
      // ── Zone 4: Frostthorn Reach ──
      { col: 248, row:  82, name: 'Frostholm Warden', dialogue: ["Frostholm has stood for three hundred winters.", "The ice wolves grow bolder each year.", "The peaks beyond are named the Silence — only legends have returned from there."] },
      { col: 250, row:  80, name: 'Ice Mage Solvei',  dialogue: ["The ley lines converge beneath this glacier.", "Crystal formations act as conduits for ancient magic.", "The boss of this region is not of this world."] },
      // ── Zone 5: Shadowfall Wastes ──
      { col: 248, row: 210, name: 'Dusk Sentinel',    dialogue: ["You should not be here.", "The Wastes consume the unprepared.", "Only the strongest survive the Shadowfall."] },
      { col: 246, row: 212, name: 'Cursed Scholar',   dialogue: ["I came to study the ruins. I cannot leave.", "The crystals… they speak if you listen long enough.", "Find the Obsidian Throne at the centre. Destroy it. Please."] },
    ];
  }

  // ── Chests ────────────────────────────────────────────────────────────────
  _placeChests() {
    const positions = [
      // Zone 1 — Starter Plains (easier finds)
      [265, 440], [230, 455], [310, 470], [185, 430], [340, 425],
      [75,  390], [420, 390], [155, 380], [360, 380],
      [245, 360], [80,  350], [420, 350],
      // Zone 2 — Wildwood Frontier
      [145, 315], [355, 315], [245, 295], [110, 270], [390, 268],
      [195, 250], [300, 250], [245, 235],
      // Zone 3 — Ironvale Expanse
      [100, 195], [390, 195], [175, 180], [320, 178],
      [245, 160], [140, 145], [360, 145],
      // Zone 4 — Frostthorn Reach
      [100, 100], [390, 100], [175, 85], [320, 85],
      [245, 65],  [145, 50],  [360, 50],
      [80,  30],  [420, 30],
      // Zone 5 — Shadowfall Wastes (dangerous but rewarding)
      [175, 185], [320, 185], [245, 175],
      [165, 255], [330, 255], [245, 245],
      [200, 215], [295, 215],
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