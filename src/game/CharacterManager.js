// CharacterManager.js — Save/load character slots to localStorage
// Each character is stored under a unique key: `roe_char_{userId}_{charId}`

const SAVE_KEY_PREFIX = 'roe_char_';
const INDEX_KEY = 'roe_char_index';

function getIndex() {
  try {
    return JSON.parse(localStorage.getItem(INDEX_KEY) || '[]');
  } catch {
    return [];
  }
}

function saveIndex(index) {
  localStorage.setItem(INDEX_KEY, JSON.stringify(index));
}

// Return all saved character summaries (sorted newest first)
export function listCharacters() {
  const index = getIndex();
  const chars = [];
  for (const entry of index) {
    try {
      const raw = localStorage.getItem(SAVE_KEY_PREFIX + entry.id);
      if (raw) {
        const data = JSON.parse(raw);
        chars.push({ ...entry, snapshot: data });
      }
    } catch {
      // ignore corrupt saves
    }
  }
  return chars.sort((a, b) => (b.lastSaved || 0) - (a.lastSaved || 0));
}

// Save (or update) a character — gameState is the full state object
export function saveCharacter(gameState, charId = null) {
  const id = charId || `char_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
  const now = Date.now();

  // Strip engine-only transient fields that shouldn't persist
  const saved = {
    classData: gameState.classData,
    playerName: gameState.playerName,
    level: gameState.level,
    xp: gameState.xp,
    hp: gameState.hp,
    maxHp: gameState.maxHp,
    mp: gameState.mp,
    maxMp: gameState.maxMp,
    inventory: gameState.inventory || [],
    equipped: gameState.equipped || {},
    equipStats: gameState.equipStats || {},
    skillPoints: gameState.skillPoints || 0,
    skillLevels: gameState.skillLevels || { Q: 0, W: 0, E: 0, R: 0 },
    kills: gameState.kills || 0,
    charId: id,
    lastSaved: now,
  };

  localStorage.setItem(SAVE_KEY_PREFIX + id, JSON.stringify(saved));

  // Update index
  const index = getIndex();
  const existing = index.find(e => e.id === id);
  const summary = {
    id,
    playerName: saved.playerName,
    className: saved.classData?.name || '?',
    classIcon: saved.classData?.icon || '⚔️',
    classColor: saved.classData?.color || '#888',
    level: saved.level,
    lastSaved: now,
  };
  if (existing) {
    Object.assign(existing, summary);
  } else {
    index.push(summary);
  }
  saveIndex(index);

  return id;
}

// Load a character by ID — returns the full saved state or null
export function loadCharacter(charId) {
  try {
    const raw = localStorage.getItem(SAVE_KEY_PREFIX + charId);
    if (!raw) return null;
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

// Delete a character by ID
export function deleteCharacter(charId) {
  localStorage.removeItem(SAVE_KEY_PREFIX + charId);
  const index = getIndex().filter(e => e.id !== charId);
  saveIndex(index);
}