// ─── Skill Targeting Metadata ──────────────────────────────────────────────
// Maps each class+skill key to a targeting type and range/radius parameters.
// Types:
//   'ground_aoe'  — circle preview at cursor position
//   'dash'        — directional arrow from player toward cursor
//   'line'        — line from player toward cursor
//   'self_aoe'    — circle centered on the player (no cursor needed, instant confirm)

export const SKILL_TARGETING = {
  warrior: {
    Q: { type: 'line',       range: 90,  width: 18,  color: '#e63946' },   // Shield Strike
    W: { type: 'self_aoe',   range: 60,  color: '#e63946' },               // Iron Guard
    E: { type: 'self_aoe',   range: 110, color: '#e63946' },               // Whirlwind Slash
    R: { type: 'ground_aoe', range: 200, radius: 90, color: '#ff5500' },   // Guardian's Wrath
  },
  lancer: {
    Q: { type: 'line',       range: 90,  width: 16,  color: '#2196f3' },   // Piercing Thrust
    W: { type: 'dash',       range: 140, color: '#2196f3' },               // Charge
    E: { type: 'line',       range: 130, width: 60,  color: '#2196f3' },   // Sweeping Crescent (wide arc)
    R: { type: 'line',       range: 220, width: 24,  color: '#ff9800' },   // Dragon Lance
  },
  archer: {
    Q: { type: 'line',       range: 180, width: 12,  color: '#4caf50' },   // Power Shot
    W: { type: 'dash',       range: 100, color: '#4caf50' },               // Evasive Roll
    E: { type: 'ground_aoe', range: 200, radius: 80, color: '#4caf50' },   // Arrow Rain
    R: { type: 'ground_aoe', range: 230, radius: 120, color: '#ff9800' },  // Hawkstorm Barrage
  },
  monk: {
    Q: { type: 'line',       range: 80,  width: 20,  color: '#ff9800' },   // Healing Palm
    W: { type: 'self_aoe',   range: 70,  color: '#ff9800' },               // Sanctuary Step
    E: { type: 'self_aoe',   range: 100, color: '#ff9800' },               // Radiant Pulse
    R: { type: 'ground_aoe', range: 220, radius: 100, color: '#ff9800' },  // Divine Circle
  },
};

// ─── TargetingSystem ──────────────────────────────────────────────────────────
export class TargetingSystem {
  constructor() {
    this.active = false;       // currently aiming?
    this.skillKey = null;      // which skill key is being aimed
    this.config = null;        // SKILL_TARGETING entry
    this.mouseWorld = null;    // { x, y } in world coordinates
    this.confirmed = false;    // set to true for one frame when clicked
    this.cancelled = false;    // set to true for one frame when cancelled
  }

  // Called when a skill key is pressed — returns true if we entered aiming mode
  startAiming(key, classId) {
    const classConfig = SKILL_TARGETING[classId];
    if (!classConfig) return false;
    const cfg = classConfig[key];
    if (!cfg) return false;

    // self_aoe doesn't need aiming — confirm immediately
    if (cfg.type === 'self_aoe') {
      this.active = false;
      this.skillKey = key;
      this.config = cfg;
      this.confirmed = true;
      this.mouseWorld = null;
      return true;
    }

    this.active = true;
    this.skillKey = key;
    this.config = cfg;
    this.confirmed = false;
    this.cancelled = false;
    this.mouseWorld = null;
    return true;
  }

  // Consume the confirmed/cancelled flags (call once per frame after checking)
  consume() {
    const c = this.confirmed;
    const x = this.cancelled;
    this.confirmed = false;
    this.cancelled = false;
    if (x) {
      this.active = false;
      this.skillKey = null;
      this.config = null;
    }
    return { confirmed: c, cancelled: x };
  }

  cancel() {
    this.active = false;
    this.cancelled = true;
    this.skillKey = null;
    this.config = null;
    this.mouseWorld = null;
  }

  confirm() {
    if (!this.active) return;
    this.active = false;
    this.confirmed = true;
  }

  updateMouse(worldX, worldY) {
    this.mouseWorld = { x: worldX, y: worldY };
  }

  // Returns the clamped target world position and whether it's in range
  getTarget(playerX, playerY) {
    const cfg = this.config;
    if (!cfg || !this.mouseWorld) return { x: playerX, y: playerY, inRange: true };

    const dx = this.mouseWorld.x - playerX;
    const dy = this.mouseWorld.y - playerY;
    const dist = Math.sqrt(dx * dx + dy * dy);
    const range = cfg.range;

    if (dist <= range || dist === 0) {
      return { x: this.mouseWorld.x, y: this.mouseWorld.y, inRange: true };
    }

    // Clamp to range
    return {
      x: playerX + (dx / dist) * range,
      y: playerY + (dy / dist) * range,
      inRange: false,
    };
  }

  // Draw the targeting preview — ctx is in world-space (already scaled by zoom)
  draw(ctx, playerSX, playerSY, camX, camY, zoom) {
    if (!this.active || !this.config) return;

    const cfg = this.config;
    const playerWorldX = playerSX + camX;
    const playerWorldY = playerSY + camY;

    // Get target in world coords
    let targetWorld = { x: playerWorldX, y: playerWorldY, inRange: true };
    if (this.mouseWorld) {
      const dx = this.mouseWorld.x - playerWorldX;
      const dy = this.mouseWorld.y - playerWorldY;
      const dist = Math.sqrt(dx * dx + dy * dy);
      if (dist <= cfg.range || dist === 0) {
        targetWorld = { x: this.mouseWorld.x, y: this.mouseWorld.y, inRange: true };
      } else {
        targetWorld = {
          x: playerWorldX + (dx / dist) * cfg.range,
          y: playerWorldY + (dy / dist) * cfg.range,
          inRange: false,
        };
      }
    }

    // Convert to screen coords (ctx is world-space so subtract cam)
    const psx = playerSX;           // player screen x (world-space ctx coords)
    const psy = playerSY;
    const tsx = targetWorld.x - camX;
    const tsy = targetWorld.y - camY;

    const color = cfg.color;
    const invalid = !targetWorld.inRange;
    const baseAlpha = invalid ? 0.45 : 0.75;
    const strokeColor = invalid ? '#ff3333' : color;
    const fillColor = invalid ? 'rgba(255,50,50,0.12)' : (color + '20');

    ctx.save();

    // ── Draw range ring around player ──────────────────────────────────────
    ctx.globalAlpha = 0.2;
    ctx.strokeStyle = strokeColor;
    ctx.lineWidth = 1;
    ctx.setLineDash([6, 6]);
    ctx.beginPath();
    ctx.arc(psx, psy, cfg.range, 0, Math.PI * 2);
    ctx.stroke();
    ctx.setLineDash([]);

    ctx.globalAlpha = baseAlpha;

    if (cfg.type === 'ground_aoe') {
      // Impact circle at target
      ctx.strokeStyle = strokeColor;
      ctx.lineWidth = 2;
      ctx.fillStyle = fillColor;
      ctx.beginPath();
      ctx.arc(tsx, tsy, cfg.radius, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();

      // Crosshair
      ctx.globalAlpha = baseAlpha * 0.8;
      ctx.strokeStyle = strokeColor;
      ctx.lineWidth = 1.5;
      const cr = 8;
      ctx.beginPath();
      ctx.moveTo(tsx - cr, tsy); ctx.lineTo(tsx + cr, tsy);
      ctx.moveTo(tsx, tsy - cr); ctx.lineTo(tsx, tsy + cr);
      ctx.stroke();

      // Dashed line from player to target
      ctx.globalAlpha = baseAlpha * 0.4;
      ctx.setLineDash([5, 8]);
      ctx.beginPath();
      ctx.moveTo(psx, psy);
      ctx.lineTo(tsx, tsy);
      ctx.stroke();
      ctx.setLineDash([]);

    } else if (cfg.type === 'dash') {
      const angle = Math.atan2(tsy - psy, tsx - psx);
      const len = cfg.range;
      const endX = psx + Math.cos(angle) * len;
      const endY = psy + Math.sin(angle) * len;

      // Path line
      ctx.strokeStyle = strokeColor;
      ctx.lineWidth = 3;
      ctx.setLineDash([8, 5]);
      ctx.beginPath();
      ctx.moveTo(psx, psy);
      ctx.lineTo(endX, endY);
      ctx.stroke();
      ctx.setLineDash([]);

      // Arrowhead
      const arrowSize = 14;
      const al = angle - Math.PI * 0.85;
      const ar = angle + Math.PI * 0.85;
      ctx.fillStyle = strokeColor;
      ctx.beginPath();
      ctx.moveTo(endX, endY);
      ctx.lineTo(endX + Math.cos(al) * arrowSize, endY + Math.sin(al) * arrowSize);
      ctx.lineTo(endX + Math.cos(ar) * arrowSize, endY + Math.sin(ar) * arrowSize);
      ctx.closePath();
      ctx.fill();

      // Landing circle
      ctx.globalAlpha = baseAlpha * 0.6;
      ctx.strokeStyle = strokeColor;
      ctx.lineWidth = 2;
      ctx.fillStyle = fillColor;
      ctx.beginPath();
      ctx.arc(endX, endY, 16, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();

    } else if (cfg.type === 'line') {
      const angle = Math.atan2(tsy - psy, tsx - psx);
      const len = cfg.range;
      const endX = psx + Math.cos(angle) * len;
      const endY = psy + Math.sin(angle) * len;
      const half = (cfg.width || 12) / 2;

      // Line rectangle (oriented along angle)
      const cos = Math.cos(angle);
      const sin = Math.sin(angle);
      const perp = [-sin, cos];

      ctx.fillStyle = fillColor;
      ctx.strokeStyle = strokeColor;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(psx + perp[0] * half,       psy + perp[1] * half);
      ctx.lineTo(endX + perp[0] * half,       endY + perp[1] * half);
      ctx.lineTo(endX - perp[0] * half,       endY - perp[1] * half);
      ctx.lineTo(psx - perp[0] * half,       psy - perp[1] * half);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();

      // Endpoint glow
      ctx.globalAlpha = baseAlpha * 0.9;
      ctx.fillStyle = strokeColor;
      ctx.beginPath();
      ctx.arc(endX, endY, 6, 0, Math.PI * 2);
      ctx.fill();
    }

    ctx.restore();
  }

  // Draw self-aoe preview (called separately, always draws around player)
  drawSelfAoe(ctx, playerSX, playerSY) {
    if (!this.config || this.config.type !== 'self_aoe') return;
    const cfg = this.config;
    const pulse = Math.sin(Date.now() / 200) * 0.15 + 0.65;

    ctx.save();
    ctx.globalAlpha = pulse;
    ctx.strokeStyle = cfg.color;
    ctx.lineWidth = 2.5;
    ctx.fillStyle = cfg.color + '18';
    ctx.beginPath();
    ctx.arc(playerSX, playerSY, cfg.range, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
    ctx.restore();
  }

  // Draw the aiming cursor label on screen (call in screen-space after ctx.restore)
  drawCursorLabel(ctx, screenMouseX, screenMouseY, playerWorldX, playerWorldY) {
    if (!this.active || !this.config || !this.mouseWorld) return;

    const dx = this.mouseWorld.x - playerWorldX;
    const dy = this.mouseWorld.y - playerWorldY;
    const dist = Math.sqrt(dx * dx + dy * dy);
    const inRange = dist <= this.config.range;

    const label = inRange ? 'Left-click to cast · Right-click or [Key] to cancel' : 'Out of range';
    const bgColor = inRange ? 'rgba(0,0,0,0.72)' : 'rgba(80,0,0,0.80)';
    const textColor = inRange ? '#ffe88a' : '#ff6666';

    ctx.save();
    ctx.font = '11px Cinzel, serif';
    const tw = ctx.measureText(label).width;
    const bx = screenMouseX - tw / 2 - 8;
    const by = screenMouseY - 38;

    ctx.fillStyle = bgColor;
    ctx.beginPath();
    ctx.roundRect(bx, by, tw + 16, 22, 4);
    ctx.fill();

    ctx.fillStyle = textColor;
    ctx.textAlign = 'center';
    ctx.fillText(label, screenMouseX, by + 15);
    ctx.restore();
  }
}