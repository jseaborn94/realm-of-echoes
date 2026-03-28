import React, { useRef, useEffect, useState } from 'react';
import { getZoneAt, WORLD_WIDTH, WORLD_HEIGHT } from '../../game/constants.js';

const ZONE_COLORS = {
  1: '#2d6b1c',
  2: '#1a4a10',
  3: '#7a6020',
  4: '#4888a8',
  5: '#3a1050',
};

const TOWN_MARKERS = [
  { col: 185, row: 390, name: 'Evergreen Hollow', color: '#ffe88a' },
  { col: 55,  row: 440, name: 'Western Outpost', color: '#d4a070' },
  { col: 230, row: 460, name: 'Eastern Farmstead', color: '#d4a070' },
  { col: 380, row: 320, name: 'Thornmere', color: '#d4a070' },
  { col: 460, row: 460, name: 'East Wildwood Camp', color: '#d4a070' },
  { col: 305, row: 460, name: 'West Wildwood Camp', color: '#d4a070' },
  { col: 80,  row: 220, name: 'Ironhaven', color: '#d4a070' },
  { col: 35,  row: 145, name: 'Western Ironvale', color: '#d4a070' },
  { col: 340, row: 150, name: 'Frostholm', color: '#d4a070' },
  { col: 210, row: 65,  name: 'Dusk Citadel', color: '#ff6644' },
];

let cachedMapCanvas = null;

function buildWorldMapCanvas() {
  if (cachedMapCanvas) return cachedMapCanvas;

  const W = 800;
  const H = 800;
  const canvas = document.createElement('canvas');
  canvas.width = W;
  canvas.height = H;
  const ctx = canvas.getContext('2d');

  // Draw zones (scaled: 500x500 world → 800x800 canvas)
  const scaleX = W / 500;
  const scaleY = H / 500;

  for (let py = 0; py < H; py += 4) {
    for (let px = 0; px < W; px += 4) {
      const worldCol = px / scaleX;
      const worldRow = py / scaleY;
      const zone = getZoneAt(Math.floor(worldCol), Math.floor(worldRow));
      const hex = ZONE_COLORS[zone.id] || '#222';

      ctx.fillStyle = hex;
      ctx.fillRect(px, py, 4, 4);
    }
  }

  // Draw town markers
  for (const town of TOWN_MARKERS) {
    const px = (town.col / 500) * W;
    const py = (town.row / 500) * H;

    // Circle
    ctx.save();
    ctx.fillStyle = town.color;
    ctx.shadowColor = 'rgba(0,0,0,0.5)';
    ctx.shadowBlur = 4;
    ctx.beginPath();
    ctx.arc(px, py, 6, 0, Math.PI * 2);
    ctx.fill();

    // Border
    ctx.strokeStyle = '#fff';
    ctx.lineWidth = 1;
    ctx.stroke();
    ctx.restore();
  }

  cachedMapCanvas = canvas;
  return canvas;
}

export default function WorldMap({ gameState, onClose }) {
  const canvasRef = useRef(null);
  const [mapCanvas, setMapCanvas] = useState(null);

  useEffect(() => {
    const canvas = buildWorldMapCanvas();
    setMapCanvas(canvas);
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !mapCanvas) return;

    const ctx = canvas.getContext('2d');
    const W = canvas.width;
    const H = canvas.height;

    // Draw map background
    ctx.drawImage(mapCanvas, 0, 0, W, H);

    // Draw player position
    const scaleX = W / 500;
    const scaleY = H / 500;
    const px = (gameState.playerWorldX || 0) / 32 / 500 * W;
    const py = (gameState.playerWorldY || 0) / 32 / 500 * H;

    ctx.save();
    ctx.shadowColor = '#4a9eff';
    ctx.shadowBlur = 8;
    ctx.fillStyle = '#4a9eff';
    ctx.beginPath();
    ctx.arc(px, py, 5, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#fff';
    ctx.lineWidth = 1.5;
    ctx.stroke();
    ctx.restore();
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center"
      style={{ background: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(4px)' }}>
      <div className="relative w-full h-full flex flex-col" style={{ maxWidth: '90vw', maxHeight: '90vh' }}>
        {/* Header */}
        <div className="p-4 flex items-center justify-between panel-glass-gold rounded-t-lg">
          <h2 className="font-cinzel text-lg" style={{ color: '#ffe88a' }}>WORLD MAP</h2>
          <button
            onClick={onClose}
            className="text-2xl leading-none"
            style={{ color: '#ffe88a' }}>
            ✕
          </button>
        </div>

        {/* Map Canvas */}
        <div className="flex-1 flex items-center justify-center p-4 bg-black/50 overflow-auto">
          <canvas
            ref={canvasRef}
            width={800}
            height={800}
            style={{ border: '2px solid #ffe88a', maxWidth: '100%', maxHeight: '100%', imageRendering: 'pixelated' }}
          />
        </div>

        {/* Legend */}
        <div className="p-4 panel-glass-gold rounded-b-lg text-xs font-cinzel space-y-1" style={{ color: '#d4a070' }}>
          <div>🟢 Starter Plains · 🟢 Wildwood · 🟡 Ironvale · 🔵 Frostthorn · 🟣 Shadowfall</div>
          <div>Current Zone: <span style={{ color: '#ffe88a' }}>{gameState.currentZone?.name || 'Unknown'}</span></div>
        </div>
      </div>
    </div>
  );
}