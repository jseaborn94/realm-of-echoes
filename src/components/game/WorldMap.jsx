import React, { useRef, useEffect, useState } from 'react';
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

const TOWN_MARKERS = [
  { col: 185, row: 390, name: 'Evergreen Hollow', color: '#ffe88a', primary: true },
  { col: 55,  row: 440, name: 'Western Outpost',   color: '#d4a070' },
  { col: 230, row: 460, name: 'Eastern Farmstead',  color: '#d4a070' },
  { col: 380, row: 320, name: 'Thornmere',           color: '#d4a070' },
  { col: 460, row: 460, name: 'E. Wildwood Camp',    color: '#d4a070' },
  { col: 305, row: 460, name: 'W. Wildwood Camp',    color: '#d4a070' },
  { col: 80,  row: 220, name: 'Ironhaven',            color: '#d4a070' },
  { col: 35,  row: 145, name: 'W. Ironvale',          color: '#d4a070' },
  { col: 340, row: 150, name: 'Frostholm',             color: '#c8e8ff' },
  { col: 210, row: 65,  name: 'Dusk Citadel',          color: '#ff6644' },
];

function hexToRgb(hex) {
  return [
    parseInt(hex.slice(1, 3), 16),
    parseInt(hex.slice(3, 5), 16),
    parseInt(hex.slice(5, 7), 16),
  ];
}

let cachedMapCanvas = null;

function buildWorldMapCanvas() {
  if (cachedMapCanvas) return cachedMapCanvas;

  const W = 600;
  const H = 600;

  // Step 1: build raw zone map at low sample resolution, bilinear interpolated
  const SAMPLE = 60; // sample grid
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

  // Step 2: render to offscreen canvas via bilinear interpolation
  const raw = document.createElement('canvas');
  raw.width  = W;
  raw.height = H;
  const rctx = raw.getContext('2d');
  const imgData = rctx.createImageData(W, H);

  for (let py = 0; py < H; py++) {
    for (let px = 0; px < W; px++) {
      const gx = (px / W) * SAMPLE;
      const gy = (py / H) * SAMPLE;
      const x0 = Math.floor(gx), x1 = Math.min(x0 + 1, SAMPLE);
      const y0 = Math.floor(gy), y1 = Math.min(y0 + 1, SAMPLE);
      const tx = gx - x0, ty = gy - y0;

      const c00 = sampleGrid[y0][x0];
      const c10 = sampleGrid[y0][x1];
      const c01 = sampleGrid[y1][x0];
      const c11 = sampleGrid[y1][x1];

      const r = Math.round(c00[0]*(1-tx)*(1-ty) + c10[0]*tx*(1-ty) + c01[0]*(1-tx)*ty + c11[0]*tx*ty);
      const g = Math.round(c00[1]*(1-tx)*(1-ty) + c10[1]*tx*(1-ty) + c01[1]*(1-tx)*ty + c11[1]*tx*ty);
      const b = Math.round(c00[2]*(1-tx)*(1-ty) + c10[2]*tx*(1-ty) + c01[2]*(1-tx)*ty + c11[2]*tx*ty);

      const idx = (py * W + px) * 4;
      imgData.data[idx]     = r;
      imgData.data[idx + 1] = g;
      imgData.data[idx + 2] = b;
      imgData.data[idx + 3] = 255;
    }
  }
  rctx.putImageData(imgData, 0, 0);

  // Step 3: apply blur to smooth borders further
  const blurred = document.createElement('canvas');
  blurred.width  = W;
  blurred.height = H;
  const bctx = blurred.getContext('2d');
  bctx.filter = 'blur(6px)';
  bctx.drawImage(raw, 0, 0);
  bctx.filter = 'none';

  // Step 4: draw zone name labels
  bctx.font = 'bold 11px Cinzel, serif';
  bctx.textAlign = 'center';
  const labelPositions = [
    { id: 1, lx: 185, ly: 410 },
    { id: 2, lx: 390, ly: 330 },
    { id: 3, lx: 70,  ly: 220 },
    { id: 4, lx: 350, ly: 155 },
    { id: 5, lx: 210, ly: 70  },
  ];
  for (const lp of labelPositions) {
    const sx = (lp.lx / 500) * W;
    const sy = (lp.ly / 500) * H;
    bctx.save();
    bctx.shadowColor = 'rgba(0,0,0,0.9)';
    bctx.shadowBlur  = 6;
    bctx.fillStyle   = 'rgba(255,255,255,0.55)';
    bctx.fillText(ZONE_NAMES[lp.id], sx, sy);
    bctx.restore();
  }

  // Step 5: town markers
  for (const town of TOWN_MARKERS) {
    const tx = (town.col / 500) * W;
    const ty = (town.row / 500) * H;
    const r  = town.primary ? 6 : 4;

    bctx.save();
    bctx.shadowColor = 'rgba(0,0,0,0.6)';
    bctx.shadowBlur  = 6;
    bctx.fillStyle   = town.color;
    bctx.beginPath();
    bctx.arc(tx, ty, r, 0, Math.PI * 2);
    bctx.fill();
    bctx.strokeStyle = '#fff';
    bctx.lineWidth   = 1.2;
    bctx.stroke();

    // Town name
    bctx.shadowBlur  = 4;
    bctx.font        = town.primary ? 'bold 9px Cinzel, serif' : '8px Cinzel, serif';
    bctx.fillStyle   = town.color;
    bctx.fillText(town.name, tx, ty - r - 4);
    bctx.restore();
  }

  cachedMapCanvas = blurred;
  return cachedMapCanvas;
}

export default function WorldMap({ gameState, onClose }) {
  const canvasRef = useRef(null);
  const [mapCanvas, setMapCanvas] = useState(null);

  useEffect(() => {
    setMapCanvas(buildWorldMapCanvas());
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !mapCanvas) return;
    const ctx = canvas.getContext('2d');
    const W = canvas.width;
    const H = canvas.height;

    ctx.drawImage(mapCanvas, 0, 0, W, H);

    // Player position
    const px = (gameState.playerWorldX || 0) / 32 / 500 * W;
    const py = (gameState.playerWorldY || 0) / 32 / 500 * H;

    ctx.save();
    ctx.shadowColor = '#ffffff';
    ctx.shadowBlur  = 10;
    ctx.fillStyle   = '#ffffff';
    ctx.beginPath();
    ctx.arc(px, py, 5, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#4a9eff';
    ctx.lineWidth   = 2;
    ctx.stroke();
    ctx.restore();
  });

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center"
      style={{ background: 'rgba(0,0,0,0.88)', backdropFilter: 'blur(4px)' }}
      onClick={e => e.target === e.currentTarget && onClose()}
    >
      <div className="flex flex-col rounded-xl overflow-hidden" style={{ maxWidth: '92vw', maxHeight: '92vh', border: '1px solid rgba(255,232,138,0.25)' }}>
        {/* Header */}
        <div className="px-5 py-3 flex items-center justify-between" style={{ background: 'rgba(20,15,5,0.97)', borderBottom: '1px solid rgba(255,232,138,0.15)' }}>
          <h2 className="font-cinzel text-base tracking-widest" style={{ color: '#ffe88a' }}>WORLD MAP</h2>
          <div className="font-cinzel text-xs" style={{ color: '#6a5a3a' }}>
            Current Zone: <span style={{ color: '#ffe88a' }}>{gameState.currentZone?.name || 'Unknown'}</span>
          </div>
          <button onClick={onClose} className="font-cinzel text-lg leading-none ml-4" style={{ color: '#6a5a3a' }}>✕</button>
        </div>

        {/* Map */}
        <div style={{ background: '#0a0a0a', padding: '12px' }}>
          <canvas
            ref={canvasRef}
            width={600}
            height={600}
            style={{ display: 'block', maxWidth: '100%', maxHeight: '75vh', borderRadius: '6px' }}
          />
        </div>

        {/* Legend */}
        <div className="px-5 py-2 flex flex-wrap gap-4 font-cinzel text-xs" style={{ background: 'rgba(10,8,3,0.98)', borderTop: '1px solid rgba(255,232,138,0.1)' }}>
          {Object.entries(ZONE_NAMES).map(([id, name]) => (
            <span key={id} className="flex items-center gap-1.5">
              <span style={{ width: 10, height: 10, borderRadius: 2, background: ZONE_COLORS[id], display: 'inline-block' }} />
              <span style={{ color: '#8a7a5a' }}>{name}</span>
            </span>
          ))}
          <span className="flex items-center gap-1.5 ml-auto">
            <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#fff', display: 'inline-block' }} />
            <span style={{ color: '#8a7a5a' }}>You</span>
          </span>
        </div>
      </div>
    </div>
  );
}