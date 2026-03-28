import React, { useRef, useEffect } from 'react';
import { getZoneAt, WORLD_WIDTH, WORLD_HEIGHT } from '../../game/constants.js';

// Minimap resolution — lower = faster to generate
const MAP_W = 100;
const MAP_H = 100;
const SAMPLE_STEP = 5; // sample every 5 world cols/rows

// Zone id → minimap color
const ZONE_COLORS = {
  1: '#2d6b1c', // Starter Plains — green
  2: '#1a4a10', // Wildwood — dark green
  3: '#7a6020', // Ironvale — sandy/rocky
  4: '#4888a8', // Frostthorn — ice blue
  5: '#3a1050', // Shadowfall — dark purple
};

let cachedImageData = null;

function buildMinimapImage() {
  if (cachedImageData) return cachedImageData;

  const canvas = document.createElement('canvas');
  canvas.width  = MAP_W;
  canvas.height = MAP_H;
  const ctx = canvas.getContext('2d');
  const imgData = ctx.createImageData(MAP_W, MAP_H);

  for (let py = 0; py < MAP_H; py++) {
    for (let px = 0; px < MAP_W; px++) {
      const worldCol = Math.floor((px / MAP_W) * 500);
      const worldRow = Math.floor((py / MAP_H) * 500);
      const zone = getZoneAt(worldCol, worldRow);
      const hex  = ZONE_COLORS[zone.id] || '#222';

      const r = parseInt(hex.slice(1, 3), 16);
      const g = parseInt(hex.slice(3, 5), 16);
      const b = parseInt(hex.slice(5, 7), 16);

      const idx = (py * MAP_W + px) * 4;
      imgData.data[idx]     = r;
      imgData.data[idx + 1] = g;
      imgData.data[idx + 2] = b;
      imgData.data[idx + 3] = 220;
    }
  }

  ctx.putImageData(imgData, 0, 0);
  cachedImageData = canvas.toDataURL();
  return cachedImageData;
}

export default function MiniMap({ gameState, tier }) {
  const canvasRef = useRef(null);
  const imgRef    = useRef(null);

  // Build background image once on mount
  useEffect(() => {
    const dataUrl = buildMinimapImage();
    const img = new Image();
    img.src = dataUrl;
    img.onload = () => { imgRef.current = img; };
  }, []);

  // Redraw player dot each frame
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, MAP_W, MAP_H);

    // Draw zone background
    if (imgRef.current) {
      ctx.drawImage(imgRef.current, 0, 0, MAP_W, MAP_H);
    }

    // Draw player dot
    const px = ((gameState.playerWorldX || 0) / WORLD_WIDTH) * MAP_W;
    const py = ((gameState.playerWorldY || 0) / WORLD_HEIGHT) * MAP_H;

    ctx.save();
    ctx.shadowColor = tier.color;
    ctx.shadowBlur  = 6;
    ctx.fillStyle   = tier.color;
    ctx.beginPath();
    ctx.arc(px, py, 2.5, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();

    // Spawn marker (faint)
    const spawnX = (185 / 500) * MAP_W;
    const spawnY = (390 / 500) * MAP_H;
    ctx.save();
    ctx.strokeStyle = 'rgba(255,232,138,0.4)';
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