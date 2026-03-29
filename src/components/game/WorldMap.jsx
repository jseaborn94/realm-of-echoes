import React, { useRef, useEffect, useState, useCallback } from 'react';
import { getZoneAt, WORLD_WIDTH, WORLD_HEIGHT } from '../../game/constants.js';

const ZONE_COLORS = {
  1: '#2d6b1c',
  2: '#1a4a10',
  3: '#7a6020',
  4: '#4888a8',
  5: '#3a1050',
};

const ZONE_NAMES = {
  1: 'Starter Plains',
  2: 'Wildwood Frontier',
  3: 'Ironvale Expanse',
  4: 'Frostthorn Reach',
  5: 'Shadowfall Wastes',
};

const TOWN_DATA = [
  {
    col: 185, row: 390, name: 'Evergreen Hollow', color: '#ffe88a', primary: true,
    npcs: [
      { name: 'Elder Thaddeus', role: 'Quest NPC / Town Guide' },
      { name: 'Blacksmith Oryn', role: 'Blacksmith — Smelting & Gear Upgrades' },
      { name: 'Scout Mira', role: 'Zone Guide' },
    ],
  },
  {
    col: 55, row: 440, name: 'Western Outpost', color: '#d4a070',
    npcs: [
      { name: 'Cook Yeva', role: 'Cook — Meals & HP Restoration' },
      { name: 'Ranger Hollis', role: 'Armorsmith — Leather Armor' },
    ],
  },
  {
    col: 230, row: 460, name: 'Eastern Farmstead', color: '#d4a070',
    npcs: [],
  },
  {
    col: 380, row: 320, name: 'Thornmere', color: '#d4a070',
    npcs: [
      { name: 'Thornmere Guard', role: 'Zone Guide' },
      { name: 'Weaponsmith Bram', role: 'Weaponsmith — Blade Forging' },
    ],
  },
  {
    col: 460, row: 460, name: 'E. Wildwood Camp', color: '#d4a070',
    npcs: [
      { name: 'Herbalist Fenn', role: 'Lore NPC' },
    ],
  },
  {
    col: 305, row: 460, name: 'W. Wildwood Camp', color: '#d4a070',
    npcs: [
      { name: 'Armorsmith Liss', role: 'Armorsmith — Heavy Armor' },
    ],
  },
  {
    col: 80, row: 220, name: 'Ironhaven', color: '#d4a070',
    npcs: [
      { name: 'Ironhaven Elder', role: 'Lore NPC' },
      { name: 'Geomancer Thal', role: 'Lore NPC' },
    ],
  },
  {
    col: 35, row: 145, name: 'W. Ironvale Post', color: '#d4a070',
    npcs: [
      { name: 'Ironvale Scout', role: 'Zone Guide' },
    ],
  },
  {
    col: 340, row: 150, name: 'Frostholm', color: '#c8e8ff',
    npcs: [
      { name: 'Frostholm Warden', role: 'Zone Guide' },
      { name: 'Ice Mage Solvei', role: 'Lore NPC / Warning' },
    ],
  },
  {
    col: 455, row: 125, name: 'Frost Watch', color: '#c8e8ff',
    npcs: [
      { name: 'Frost Scout', role: 'Lore NPC' },
    ],
  },
  {
    col: 210, row: 65, name: 'Dusk Citadel', color: '#ff6644', primary: true,
    npcs: [
      { name: 'Dusk Sentinel', role: 'Boss Area Guard' },
      { name: 'Cursed Scholar', role: 'Quest NPC' },
    ],
  },
  {
    col: 75, row: 55, name: 'Shadow West Watch', color: '#cc7755',
    npcs: [
      { name: 'Shadow Watcher', role: 'Zone Guide' },
    ],
  },
  {
    col: 380, row: 60, name: 'Shadow East Watch', color: '#cc7755',
    npcs: [
      { name: 'East Sentinel', role: 'Zone Guard' },
    ],
  },
];

function hexToRgb(hex) {
  return [
    parseInt(hex.slice(1, 3), 16),
    parseInt(hex.slice(3, 5), 16),
    parseInt(hex.slice(5, 7), 16),
  ];
}

const MAP_SIZE = 600;
let cachedMapCanvas = null;

function buildWorldMapCanvas() {
  if (cachedMapCanvas) return cachedMapCanvas;

  const W = MAP_SIZE;
  const H = MAP_SIZE;
  const SAMPLE = 80;

  const sampleGrid = [];
  for (let sy = 0; sy <= SAMPLE; sy++) {
    sampleGrid[sy] = [];
    for (let sx = 0; sx <= SAMPLE; sx++) {
      const worldCol = Math.floor((sx / SAMPLE) * 500);
      const worldRow = Math.floor((sy / SAMPLE) * 500);
      const zone = getZoneAt(worldCol, worldRow);
      sampleGrid[sy][sx] = hexToRgb(ZONE_COLORS[zone.id] || '#111111');
    }
  }

  const raw = document.createElement('canvas');
  raw.width = W; raw.height = H;
  const rctx = raw.getContext('2d');
  const imgData = rctx.createImageData(W, H);

  for (let py = 0; py < H; py++) {
    for (let px = 0; px < W; px++) {
      const gx = (px / W) * SAMPLE;
      const gy = (py / H) * SAMPLE;
      const x0 = Math.floor(gx), x1 = Math.min(x0 + 1, SAMPLE);
      const y0 = Math.floor(gy), y1 = Math.min(y0 + 1, SAMPLE);
      const tx = gx - x0, ty = gy - y0;
      const c00 = sampleGrid[y0][x0], c10 = sampleGrid[y0][x1];
      const c01 = sampleGrid[y1][x0], c11 = sampleGrid[y1][x1];
      const r = Math.round(c00[0]*(1-tx)*(1-ty) + c10[0]*tx*(1-ty) + c01[0]*(1-tx)*ty + c11[0]*tx*ty);
      const g = Math.round(c00[1]*(1-tx)*(1-ty) + c10[1]*tx*(1-ty) + c01[1]*(1-tx)*ty + c11[1]*tx*ty);
      const b = Math.round(c00[2]*(1-tx)*(1-ty) + c10[2]*tx*(1-ty) + c01[2]*(1-tx)*ty + c11[2]*tx*ty);
      const idx = (py * W + px) * 4;
      imgData.data[idx] = r; imgData.data[idx+1] = g; imgData.data[idx+2] = b; imgData.data[idx+3] = 255;
    }
  }
  rctx.putImageData(imgData, 0, 0);

  const blurred = document.createElement('canvas');
  blurred.width = W; blurred.height = H;
  const bctx = blurred.getContext('2d');
  bctx.filter = 'blur(5px)';
  bctx.drawImage(raw, 0, 0);
  bctx.filter = 'none';

  // Zone labels
  const labelPositions = [
    { id: 1, lx: 175, ly: 415 }, { id: 2, lx: 390, ly: 335 },
    { id: 3, lx: 68, ly: 225 },  { id: 4, lx: 345, ly: 160 },
    { id: 5, lx: 210, ly: 72 },
  ];
  bctx.textAlign = 'center';
  for (const lp of labelPositions) {
    const sx = (lp.lx / 500) * W;
    const sy = (lp.ly / 500) * H;
    bctx.save();
    bctx.font = 'bold 10px serif';
    bctx.shadowColor = 'rgba(0,0,0,0.95)';
    bctx.shadowBlur = 7;
    bctx.fillStyle = 'rgba(255,255,255,0.5)';
    bctx.fillText(ZONE_NAMES[lp.id], sx, sy);
    bctx.restore();
  }

  cachedMapCanvas = blurred;
  return blurred;
}

export default function WorldMap({ gameState, onClose }) {
  const containerRef = useRef(null);
  const canvasRef = useRef(null);
  const mapCanvasRef = useRef(null);

  // Pan & zoom state
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const dragging = useRef(false);
  const dragStart = useRef({ x: 0, y: 0, px: 0, py: 0 });

  // Hover tooltip
  const [hoveredTown, setHoveredTown] = useState(null);
  const [tooltipPos, setTooltipPos] = useState({ x: 0, y: 0 });

  useEffect(() => {
    mapCanvasRef.current = buildWorldMapCanvas();
  }, []);

  // Draw map
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !mapCanvasRef.current) return;
    const ctx = canvas.getContext('2d');
    const W = canvas.width;
    const H = canvas.height;

    ctx.clearRect(0, 0, W, H);
    ctx.save();
    ctx.translate(pan.x, pan.y);
    ctx.scale(zoom, zoom);

    // Zone background
    ctx.drawImage(mapCanvasRef.current, 0, 0, W, H);

    // Town markers
    for (const town of TOWN_DATA) {
      const tx = (town.col / 500) * W;
      const ty = (town.row / 500) * H;
      const r = town.primary ? 6 : 4;
      const isHovered = hoveredTown?.name === town.name;

      ctx.save();
      ctx.shadowColor = isHovered ? '#ffffff' : 'rgba(0,0,0,0.7)';
      ctx.shadowBlur = isHovered ? 10 : 5;
      ctx.fillStyle = isHovered ? '#ffffff' : town.color;
      ctx.beginPath();
      ctx.arc(tx, ty, isHovered ? r + 2 : r, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = isHovered ? town.color : '#fff';
      ctx.lineWidth = 1.5;
      ctx.stroke();
      ctx.restore();

      // Town name label
      ctx.save();
      ctx.font = `${town.primary ? 'bold ' : ''}${8 / zoom + 2}px Cinzel, serif`;
      ctx.textAlign = 'center';
      ctx.shadowColor = 'rgba(0,0,0,0.95)';
      ctx.shadowBlur = 5;
      ctx.fillStyle = isHovered ? '#ffffff' : town.color;
      ctx.fillText(town.name, tx, ty - r - 3);
      ctx.restore();
    }

    // Player dot
    const px = (gameState.playerWorldX || 0) / 32 / 500 * W;
    const py = (gameState.playerWorldY || 0) / 32 / 500 * H;
    ctx.save();
    ctx.shadowColor = '#ffffff';
    ctx.shadowBlur = 12;
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.arc(px, py, 5, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#4a9eff';
    ctx.lineWidth = 2;
    ctx.stroke();
    ctx.restore();

    ctx.restore();
  });

  // Convert canvas coords to map coords (accounting for pan/zoom)
  const canvasToMap = useCallback((ex, ey) => {
    const canvas = canvasRef.current;
    if (!canvas) return { mx: 0, my: 0 };
    const rect = canvas.getBoundingClientRect();
    const cx = (ex - rect.left) * (canvas.width / rect.width);
    const cy = (ey - rect.top) * (canvas.height / rect.height);
    return { mx: (cx - pan.x) / zoom, my: (cy - pan.y) / zoom };
  }, [pan, zoom]);

  // Hover detection
  const handleMouseMove = useCallback((e) => {
    if (dragging.current) {
      const dx = e.clientX - dragStart.current.x;
      const dy = e.clientY - dragStart.current.y;
      setPan({ x: dragStart.current.px + dx, y: dragStart.current.py + dy });
      return;
    }

    const { mx, my } = canvasToMap(e.clientX, e.clientY);
    const W = MAP_SIZE;
    let found = null;
    for (const town of TOWN_DATA) {
      const tx = (town.col / 500) * W;
      const ty = (town.row / 500) * W;
      const r = (town.primary ? 8 : 6) + 4;
      if (Math.hypot(mx - tx, my - ty) < r) { found = town; break; }
    }
    setHoveredTown(found);

    if (found) {
      const canvas = canvasRef.current;
      const rect = canvas.getBoundingClientRect();
      setTooltipPos({ x: e.clientX - rect.left, y: e.clientY - rect.top });
    }
  }, [canvasToMap]);

  const handleMouseDown = useCallback((e) => {
    dragging.current = true;
    dragStart.current = { x: e.clientX, y: e.clientY, px: pan.x, py: pan.y };
  }, [pan]);

  const handleMouseUp = useCallback(() => { dragging.current = false; }, []);

  const handleWheel = useCallback((e) => {
    e.preventDefault();
    const delta = e.deltaY > 0 ? 0.85 : 1.18;
    setZoom(z => Math.max(0.5, Math.min(5, z * delta)));
  }, []);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center"
      style={{ background: 'rgba(0,0,0,0.88)', backdropFilter: 'blur(4px)' }}
      onClick={e => e.target === e.currentTarget && onClose()}
    >
      <div
        className="flex flex-col rounded-xl overflow-hidden"
        style={{ maxWidth: '92vw', maxHeight: '92vh', border: '1px solid rgba(255,232,138,0.22)', minWidth: 340 }}
      >
        {/* Header */}
        <div className="px-5 py-3 flex items-center gap-4" style={{ background: 'rgba(12,9,3,0.98)', borderBottom: '1px solid rgba(255,232,138,0.12)' }}>
          <h2 className="font-cinzel text-base tracking-widest" style={{ color: '#ffe88a' }}>WORLD MAP</h2>
          <div className="font-cinzel text-xs" style={{ color: '#6a5a3a' }}>
            Zone: <span style={{ color: '#ffe88a' }}>{gameState.currentZone?.name || 'Unknown'}</span>
          </div>
          {/* Zoom controls */}
          <div className="ml-auto flex items-center gap-2">
            <button
              onClick={() => setZoom(z => Math.min(5, z * 1.3))}
              className="font-cinzel text-xs px-2 py-1 rounded"
              style={{ background: 'rgba(255,232,138,0.1)', color: '#ffe88a', border: '1px solid rgba(255,232,138,0.2)' }}>
              ＋
            </button>
            <span className="font-cinzel text-xs" style={{ color: '#5a4a2a', minWidth: 36, textAlign: 'center' }}>
              {Math.round(zoom * 100)}%
            </span>
            <button
              onClick={() => setZoom(z => Math.max(0.5, z * 0.77))}
              className="font-cinzel text-xs px-2 py-1 rounded"
              style={{ background: 'rgba(255,232,138,0.1)', color: '#ffe88a', border: '1px solid rgba(255,232,138,0.2)' }}>
              －
            </button>
            <button
              onClick={() => { setZoom(1); setPan({ x: 0, y: 0 }); }}
              className="font-cinzel text-xs px-2 py-1 rounded ml-1"
              style={{ background: 'rgba(255,232,138,0.06)', color: '#8a7a5a', border: '1px solid rgba(255,232,138,0.1)' }}>
              Reset
            </button>
          </div>
          <button onClick={onClose} className="font-cinzel text-lg leading-none ml-2" style={{ color: '#6a5a3a' }}>✕</button>
        </div>

        {/* Map area */}
        <div
          className="relative overflow-hidden"
          style={{ background: '#070508', flex: '1 1 auto' }}
        >
          <canvas
            ref={canvasRef}
            width={MAP_SIZE}
            height={MAP_SIZE}
            style={{
              display: 'block',
              maxWidth: '100%',
              maxHeight: '75vh',
              cursor: dragging.current ? 'grabbing' : hoveredTown ? 'pointer' : 'grab',
            }}
            onMouseMove={handleMouseMove}
            onMouseDown={handleMouseDown}
            onMouseUp={handleMouseUp}
            onMouseLeave={handleMouseUp}
            onWheel={handleWheel}
          />

          {/* Town tooltip */}
          {hoveredTown && (
            <div
              className="absolute pointer-events-none rounded-lg p-3"
              style={{
                left: Math.min(tooltipPos.x + 14, MAP_SIZE - 190),
                top: Math.max(tooltipPos.y - 10, 8),
                background: 'rgba(8,5,2,0.97)',
                border: `1px solid ${hoveredTown.color}55`,
                minWidth: 170,
                maxWidth: 220,
                zIndex: 10,
              }}
            >
              <div className="font-cinzel font-bold text-sm mb-2" style={{ color: hoveredTown.color }}>
                {hoveredTown.name}
              </div>
              {hoveredTown.npcs.length > 0 ? (
                <div className="space-y-1">
                  {hoveredTown.npcs.map((npc, i) => (
                    <div key={i}>
                      <div className="font-cinzel text-xs" style={{ color: '#d4c090' }}>{npc.name}</div>
                      <div style={{ color: '#5a4a2a', fontSize: 10 }}>{npc.role}</div>
                    </div>
                  ))}
                </div>
              ) : (
                <div style={{ color: '#4a3a2a', fontSize: 11, fontFamily: 'Crimson Text, serif', fontStyle: 'italic' }}>No NPCs nearby</div>
              )}
            </div>
          )}
        </div>

        {/* Legend + hint */}
        <div className="px-4 py-2 flex flex-wrap gap-3 items-center font-cinzel text-xs"
          style={{ background: 'rgba(8,5,2,0.98)', borderTop: '1px solid rgba(255,232,138,0.08)' }}>
          {Object.entries(ZONE_NAMES).map(([id, name]) => (
            <span key={id} className="flex items-center gap-1.5">
              <span style={{ width: 9, height: 9, borderRadius: 2, background: ZONE_COLORS[id], display: 'inline-block', flexShrink: 0 }} />
              <span style={{ color: '#6a5a3a' }}>{name}</span>
            </span>
          ))}
          <span className="flex items-center gap-1.5 ml-auto">
            <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#fff', display: 'inline-block' }} />
            <span style={{ color: '#5a4a2a' }}>You</span>
          </span>
          <span style={{ color: '#3a2a1a', marginLeft: 8 }}>Scroll to zoom · Drag to pan · Hover towns</span>
        </div>
      </div>
    </div>
  );
}