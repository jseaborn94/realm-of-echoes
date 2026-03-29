// ─── Settings Manager ─────────────────────────────────────────────────────────
// Handles load/save of game settings to localStorage

const SETTINGS_KEY = 'roe_settings';

export const DEFAULT_SETTINGS = {
  // Audio
  masterVolume: 80,
  sfxVolume: 80,
  musicVolume: 50,

  // Gameplay
  cameraShake: true,
  screenEffects: true,

  // (future) keybinds are display-only for now
};

export function loadSettings() {
  try {
    const raw = localStorage.getItem(SETTINGS_KEY);
    if (!raw) return { ...DEFAULT_SETTINGS };
    return { ...DEFAULT_SETTINGS, ...JSON.parse(raw) };
  } catch {
    return { ...DEFAULT_SETTINGS };
  }
}

export function saveSettings(settings) {
  try {
    localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
  } catch {}
}