import React, { useRef, useEffect } from 'react';
import { getZoneAt, WORLD_WIDTH, WORLD_HEIGHT } from '../../game/constants.js';

const MAP_W = 110;
const MAP_H = 110;

// Zone id → minimap color
const ZONE_COLORS = {
  1: '#2d6b1c',
  2: '#1a4a10',
  3: '#7a6020',
  4: '#4888a8',
  5: '#3a1050',
};

let cachedImageData = null;

function hexToRgb(hex) {
  return [
    parseInt(hex.slice(1, 3), 16),
    parseInt(hex.slice(3, 5), 16),
    parseInt(hex.slice(5, 7), 16),
  ];
}

// Build a smoothed zone map by sampling at low resolution then upscaling with bilinear blending
function buildMinimapImage() {
  if (cachedImageData) return cachedImageData;

  // Sample at low res for smooth blending
  const SAMPLE = 20; // sample grid size
  const sampleGrid = [];
  for (let sy = 0; sy <= SAMPLE; sy++) {
    sampleGrid[sy] = [];
    for (let sx = 0; sx <= SAMPLE; sx++) {
      const worldCol = Math.floor((sx / SAMPLE) * 500);
      const worldRow = Math.floor((sy / SAMPLE) * 500);
      const zone = getZoneAt(worldCol, worldRow);
      sampleGrid[sy][sx] = hexToRgb(ZONE_COLORS[zone.id] || '#222222');
    }
  }

  const canvas = document.createElement('canvas');
  canvas.width  = MAP_W;
  canvas.height = MAP_H;
  const ctx = canvas.getContext('2d');
  const imgData = ctx.createImageData(MAP_W, MAP_H);

  for (let py = 0; py < MAP_H; py++) {
    for (let px = 0; px < MAP_W; px++) {
      // Bilinear interpolation across sample grid
      const gx = (px / MAP_W) * SAMPLE;
      const gy = (py / MAP_H) * SAMPLE;
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

      const idx = (py * MAP_W + px) * 4;
      imgData.data[idx]     = r;
      imgData.data[idx + 1] = g;
      imgData.data[idx + 2] = b;
      imgData.data[idx + 3] = 230;
    }
  }

  ctx.putImageData(imgData, 0, 0);

  // Apply a light blur for extra smoothness
  const blurred = document.createElement('canvas');
  blurred.width  = MAP_W;
  blurred.height = MAP_H;
  const bctx = blurred.getContext('2d');
  bctx.filter = 'blur(2px)';
  bctx.drawImage(canvas, 0, 0);

  cachedImageData = blurred.toDataURL();
  return cachedImageData;
}

export default function MiniMap({ gameState, tier }) {
  const canvasRef = useRef(null);
  const imgRef    = useRef(null);

  useEffect(() => {
    const dataUrl = buildMinimapImage();
    const img = new Image();
    img.src = dataUrl;
    img.onload = () => { imgRef.current = img; };
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, MAP_W, MAP_H);

    if (imgRef.current) {
      ctx.drawImage(imgRef.current, 0, 0, MAP_W, MAP_H);
    }

    // Player dot
    const px = ((gameState.playerWorldX || 0) / WORLD_WIDTH) * MAP_W;
    const py = ((gameState.playerWorldY || 0) / WORLD_HEIGHT) * MAP_H;

    ctx.save();
    ctx.shadowColor = tier.color;
    ctx.shadowBlur  = 6;
    ctx.fillStyle   = '#ffffff';
    ctx.beginPath();
    ctx.arc(px, py, 2.5, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();

    // Spawn marker
    const spawnX = (185 / 500) * MAP_W;
    const spawnY = (390 / 500) * MAP_H;
    ctx.save();
    ctx.strokeStyle = 'rgba(255,232,138,0.5)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.arc(spawnX, spawnY, 3, 0, Math.PI * 2);
    ctx.stroke();
    ctx.restore();
  });

  return (
    <div className="fixed top-3 right-3 z-40 panel-glass rounded-lg p-2">
      <div className="text-xs font-cinzel mb-1 text-center" style={{ color: '#5a4a2a' }}>MAP</div>
      <canvas
        ref={canvasRef}
        width={MAP_W}
        height={MAP_H}
        style={{ borderRadius: '4px', border: '1px solid rgba(255,255,255,0.08)', display: 'block' }}
      />
      <div className="text-center mt-1 font-cinzel" style={{ fontSize: '8px', color: '#4a3a2a' }}>
        {gameState.currentZone?.name || 'Starter Plains'}
      </div>
    </div>
  );
}