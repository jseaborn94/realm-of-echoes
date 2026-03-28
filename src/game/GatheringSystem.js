import { TILE_SIZE, WORLD_COLS, WORLD_ROWS } from './constants.js';
import { TILE } from './WorldGenerator.js';

// Resource node types
export const NODE_TYPE = {
  TREE: 'tree',
  ROCK: 'rock',
  SHEEP: 'sheep',
};

// What each node drops
export const NODE_DROPS = {
  [NODE_TYPE.TREE]:  [{ id: 'wood',     name: 'Wood',     icon: '🪵', qty: 2, rarity: 'common' }],
  [NODE_TYPE.ROCK]:  [{ id: 'ore',      name: 'Ore',      icon: '🪨', qty: 1, rarity: 'common' }],
  [NODE_TYPE.SHEEP]: [
    { id: 'raw_meat', name: 'Raw Meat', icon: '🥩', qty: 1, rarity: 'common' },
    { id: 'hide',     name: 'Hide',     icon: '🟫', qty: 1, rarity: 'common' },
    { id: 'wool',     name: 'Wool',     icon: '🧶', qty: 1, rarity: 'common' },
  ],
};

const RESPAWN_DELAY = {
  [NODE_TYPE.TREE]:  30000, // 30s
  [NODE_TYPE.ROCK]:  45000, // 45s
  [NODE_TYPE.SHEEP]: 60000, // 60s
};

export class GatheringSystem {
  constructor(world) {
    this.world = world;
    this.nodes = [];       // active nodes
    this.respawnQueue = []; // { type, col, row, spawnTime }
    this._nextId = 1;
    this._placeNodes();
  }

  _placeNodes() {
    // Scan world objects and tag subset as gatherable resource nodes
    // Trees — every 3rd tree in bounds becomes a node
    let treeCount = 0;
    for (let row = 0; row < WORLD_ROWS; row++) {
      for (let col = 0; col < WORLD_COLS; col++) {
        const obj = this.world.getObj(col, row);
        // OBJ.TREE = 1, OBJ.PINE = 2
        if (obj === 1 || obj === 2) {
          treeCount++;
          if (treeCount % 3 === 0) {
            this.nodes.push(this._makeNode(NODE_TYPE.TREE, col, row));
          }
        }
        // OBJ.ROCK = 3, OBJ.BOULDER = 4 — every 2nd rock
        if (obj === 3 || obj === 4) {
          treeCount++;
          if (treeCount % 2 === 0) {
            this.nodes.push(this._makeNode(NODE_TYPE.ROCK, col, row));
          }
        }
      }
    }

    // Sheep — scatter near towns in starter zone
    const sheepSpawns = [
      [260, 455], [270, 460], [240, 462], [255, 468],
      [280, 445], [230, 442], [295, 455], [220, 460],
      [110, 420], [120, 425], [390, 420], [400, 425],
      [265, 350], [245, 355], [275, 360],
    ];
    for (const [col, row] of sheepSpawns) {
      if (col >= 0 && col < WORLD_COLS && row >= 0 && row < WORLD_ROWS) {
        if (this.world.getTile(col, row) !== TILE.WATER && !this.world.isBlocked(col, row)) {
          this.nodes.push(this._makeNode(NODE_TYPE.SHEEP, col, row));
        }
      }
    }
  }

  _makeNode(type, col, row) {
    return {
      id: this._nextId++,
      type,
      col,
      row,
      x: col * TILE_SIZE + TILE_SIZE / 2,
      y: row * TILE_SIZE + TILE_SIZE / 2,
      active: true,
      harvesting: false,
      harvestProgress: 0,
      harvestDuration: type === NODE_TYPE.SHEEP ? 1.5 : 1.0, // seconds
    };
  }

  // Returns the nearest harvestable node within range, or null
  getNearNode(px, py, range = 52) {
    const playerCol = Math.floor(px / TILE_SIZE);
    const playerRow = Math.floor(py / TILE_SIZE);
    let best = null;
    let bestDist = range / TILE_SIZE + 1;
    for (const node of this.nodes) {
      if (!node.active) continue;
      const dist = Math.abs(node.col - playerCol) + Math.abs(node.row - playerRow);
      if (dist <= 2 && dist < bestDist) {
        bestDist = dist;
        best = node;
      }
    }
    return best;
  }

  // Begin harvesting a node — returns true if started
  startHarvest(nodeId) {
    const node = this.nodes.find(n => n.id === nodeId);
    if (!node || !node.active || node.harvesting) return false;
    node.harvesting = true;
    node.harvestProgress = 0;
    return true;
  }

  // Cancel any in-progress harvest
  cancelHarvest() {
    for (const node of this.nodes) {
      if (node.harvesting) {
        node.harvesting = false;
        node.harvestProgress = 0;
      }
    }
  }

  // Update per frame — returns array of completed harvests { node, drops }
  update(dt) {
    const now = performance.now();
    const completed = [];

    // Tick harvesting nodes
    for (const node of this.nodes) {
      if (!node.active || !node.harvesting) continue;
      node.harvestProgress += dt;
      if (node.harvestProgress >= node.harvestDuration) {
        // Done!
        node.active = false;
        node.harvesting = false;
        const drops = NODE_DROPS[node.type].map(d => ({ ...d }));
        completed.push({ node, drops });
        // Queue respawn
        this.respawnQueue.push({
          type: node.type,
          col: node.col,
          row: node.row,
          spawnTime: now + RESPAWN_DELAY[node.type],
        });
      }
    }

    // Handle respawns
    this.respawnQueue = this.respawnQueue.filter(r => {
      if (now >= r.spawnTime) {
        const existing = this.nodes.find(n => n.col === r.col && n.row === r.row);
        if (existing) {
          existing.active = true;
          existing.harvestProgress = 0;
        } else {
          this.nodes.push(this._makeNode(r.type, r.col, r.row));
        }
        return false;
      }
      return true;
    });

    return completed;
  }

  // Draw resource nodes on canvas
  draw(ctx, camX, camY) {
    for (const node of this.nodes) {
      if (!node.active) continue;
      const sx = node.x - camX;
      const sy = node.y - camY;
      if (sx < -40 || sx > ctx.canvas.width + 40 || sy < -40 || sy > ctx.canvas.height + 40) continue;

      if (node.type === NODE_TYPE.SHEEP) {
        this._drawSheep(ctx, node, sx, sy);
      }

      // Draw harvest progress bar above node when active
      if (node.harvesting) {
        const pct = node.harvestProgress / node.harvestDuration;
        const bw = 36;
        const bx = sx - bw / 2;
        const by = sy - (node.type === NODE_TYPE.SHEEP ? 28 : 36);
        ctx.fillStyle = 'rgba(0,0,0,0.7)';
        ctx.fillRect(bx, by, bw, 5);
        ctx.fillStyle = '#4caf50';
        ctx.fillRect(bx, by, bw * pct, 5);
        // "Gathering..." label
        ctx.save();
        ctx.font = '9px Cinzel, serif';
        ctx.fillStyle = '#ffe88a';
        ctx.textAlign = 'center';
        ctx.fillText('⚒ Gathering...', sx, by - 4);
        ctx.restore();
      }

      // Interaction highlight glow for trees/rocks
      if (node.type !== NODE_TYPE.SHEEP) {
        ctx.save();
        ctx.strokeStyle = 'rgba(255,232,138,0.6)';
        ctx.lineWidth = 1.5;
        ctx.setLineDash([3, 3]);
        ctx.beginPath();
        ctx.arc(sx, sy, 16, 0, Math.PI * 2);
        ctx.stroke();
        ctx.setLineDash([]);
        ctx.restore();
      }
    }
  }

  _drawSheep(ctx, node, sx, sy) {
    ctx.save();
    // Body
    ctx.fillStyle = '#e8e4dc';
    ctx.beginPath();
    ctx.ellipse(sx, sy, 13, 9, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#c8c4bc';
    ctx.lineWidth = 1;
    ctx.stroke();
    // Head
    ctx.fillStyle = '#d0ccc4';
    ctx.beginPath();
    ctx.arc(sx + 10, sy - 3, 6, 0, Math.PI * 2);
    ctx.fill();
    // Legs
    ctx.fillStyle = '#a89880';
    for (const [lx, ly] of [[-6, 8], [-2, 8], [4, 8], [8, 8]]) {
      ctx.fillRect(sx + lx - 1, sy + ly, 2, 6);
    }
    // Name
    ctx.font = '8px Cinzel, serif';
    ctx.fillStyle = '#e8d8b0';
    ctx.textAlign = 'center';
    ctx.fillText('🐑 Sheep', sx, sy - 18);
    ctx.restore();
  }
}

// Helper: add resources to inventory with stacking
export function addResourcesToInventory(inventory, drops) {
  const inv = [...inventory];
  for (const drop of drops) {
    const qty = drop.qty || 1;
    // Try to stack onto existing
    const existing = inv.find(i => i.id === drop.id && i.isResource);
    if (existing) {
      existing.qty = (existing.qty || 1) + qty;
    } else {
      inv.push({
        id: drop.id,
        name: drop.name,
        icon: drop.icon,
        rarity: drop.rarity || 'common',
        isResource: true,
        qty,
        slot: null,
        stats: {},
      });
    }
  }
  return inv;
}