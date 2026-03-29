import React, { useState, useRef, useEffect } from 'react';
import { X } from 'lucide-react';

/**
 * Hidden admin/GM testing panel
 * Toggle with F10, only visible when user has isAdmin = true
 * Draggable overlay with sections for player, inventory, enemies, world, loot, visuals
 */
export default function GMPanel({
  isOpen,
  onClose,
  gameState,
  onStateChange,
  gameEngine,
}) {
  const panelRef = useRef(null);
  const [isDragging, setIsDragging] = useState(false);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const [panelPos, setPanelPos] = useState({ x: 20, y: 20 });
  const [expandedSections, setExpandedSections] = useState({
    player: true,
    inventory: true,
    enemies: false,
    world: false,
    loot: false,
    visual: false,
  });

  const toggleSection = (section) => {
    setExpandedSections(prev => ({ ...prev, [section]: !prev[section] }));
  };

  // Dragging
  const handleMouseDown = (e) => {
    if (e.target.closest('button') || e.target.closest('input')) return;
    setIsDragging(true);
    setDragOffset({ x: e.clientX - panelPos.x, y: e.clientY - panelPos.y });
  };

  const handleMouseMove = (e) => {
    if (!isDragging) return;
    setPanelPos({ x: e.clientX - dragOffset.x, y: e.clientY - dragOffset.y });
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  React.useEffect(() => {
    if (isDragging) {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
      return () => {
        window.removeEventListener('mousemove', handleMouseMove);
        window.removeEventListener('mouseup', handleMouseUp);
      };
    }
  }, [isDragging, dragOffset]);

  if (!isOpen) return null;

  // Helper to dispatch state change
  const updateState = (updates) => {
    onStateChange({ ...gameState, ...updates });
  };

  // Player section handlers
  const healFull = () => {
    updateState({ hp: gameState.maxHp, mp: gameState.maxMp });
  };

  const toggleInvincibility = () => {
    updateState({ isInvincible: !gameState.isInvincible });
  };

  const addXP = (amount) => {
    updateState({ xp: gameState.xp + amount });
  };

  const setLevel = (level) => {
    updateState({ level: Math.min(60, Math.max(1, level)) });
  };

  const addGold = (amount) => {
    const currentGold = gameState.gold || 0;
    updateState({ gold: currentGold + amount });
  };

  const killPlayer = () => {
    updateState({ hp: 0 });
  };

  // Inventory section handlers
  const spawnTestGear = () => {
    const testItems = [
      { id: 'test_sword', name: 'Test Sword', slot: 'weapon', rarity: 'common', icon: '⚔️' },
      { id: 'test_shield', name: 'Test Shield', slot: 'shield', rarity: 'uncommon', icon: '🛡️' },
      { id: 'test_helm', name: 'Test Helm', slot: 'helmet', rarity: 'rare', icon: '⛑️' },
      { id: 'test_armor', name: 'Test Plate', slot: 'chest', rarity: 'epic', icon: '🧥' },
      { id: 'test_boots', name: 'Test Boots', slot: 'boots', rarity: 'common', icon: '👢' },
      { id: 'test_cape', name: 'Test Cape', slot: 'cape', rarity: 'uncommon', icon: '🧣' },
    ];
    updateState({ inventory: [...(gameState.inventory || []), ...testItems] });
  };

  const unequipAll = () => {
    updateState({ equipped: {} });
  };

  const equipItem = (itemId) => {
    const item = (gameState.inventory || []).find(i => i.id === itemId);
    if (item) {
      updateState({ equipped: { ...gameState.equipped, [item.slot]: item } });
    }
  };

  // Enemies section handlers
  const spawnNearby = () => {
    if (gameEngine && gameEngine.enemyManager) {
      const types = ['bear', 'gnoll', 'spider', 'skeleton'];
      const type = types[Math.floor(Math.random() * types.length)];
      gameEngine.enemyManager.spawnEnemy(
        gameEngine.px + (Math.random() - 0.5) * 100,
        gameEngine.py + (Math.random() - 0.5) * 100,
        type
      );
    }
  };

  const killNearby = () => {
    if (gameEngine && gameEngine.enemyManager) {
      for (const enemy of gameEngine.enemyManager.enemies) {
        if (!enemy.dead) {
          const dx = enemy.x - gameEngine.px;
          const dy = enemy.y - gameEngine.py;
          const dist = Math.sqrt(dx * dx + dy * dy);
          if (dist < 200) {
            enemy.hp = 0;
            enemy.dead = true;
          }
        }
      }
    }
  };

  // World section handlers
  const teleportPlayer = () => {
    const col = prompt('Enter column (0-240):');
    const row = prompt('Enter row (0-480):');
    if (col !== null && row !== null) {
      if (gameEngine) {
        gameEngine.px = parseInt(col) * 16;
        gameEngine.py = parseInt(row) * 16;
      }
    }
  };

  const toggleCollisionDebug = () => {
    gameState._debugCollision = !gameState._debugCollision;
    updateState({ _debugCollision: !gameState._debugCollision });
  };

  // Visual section handlers
  const toggleFPS = () => {
    gameState._showFPS = !gameState._showFPS;
    updateState({ _showFPS: !gameState._showFPS });
  };

  const toggleGearDebug = () => {
    gameState._debugGear = !gameState._debugGear;
    updateState({ _debugGear: !gameState._debugGear });
  };

  return (
    <div
      ref={panelRef}
      onMouseDown={handleMouseDown}
      className="fixed bg-gray-900 border-2 border-yellow-600 rounded-lg p-3 text-xs text-yellow-100 font-mono"
      style={{
        left: `${panelPos.x}px`,
        top: `${panelPos.y}px`,
        width: '380px',
        maxHeight: '90vh',
        overflowY: 'auto',
        cursor: isDragging ? 'grabbing' : 'grab',
        zIndex: 9999,
      }}
    >
      {/* Header */}
      <div className="flex justify-between items-center mb-2 pb-2 border-b border-yellow-600/50">
        <span className="font-bold text-yellow-400">⚙️ GM PANEL</span>
        <button
          onClick={onClose}
          className="hover:bg-yellow-600/30 p-1 rounded transition"
        >
          <X size={16} />
        </button>
      </div>

      {/* Player Section */}
      <Section
        title="1. PLAYER"
        expanded={expandedSections.player}
        onToggle={() => toggleSection('player')}
      >
        <div className="space-y-1">
          <div className="text-yellow-300">HP: {gameState.hp.toFixed(0)}/{gameState.maxHp} | MP: {gameState.mp.toFixed(0)}/{gameState.maxMp}</div>
          <div className="text-yellow-300">Level: {gameState.level} | XP: {gameState.xp.toFixed(0)}</div>
          <Button onClick={healFull}>Heal Full</Button>
          <Button onClick={toggleInvincibility}>
            Toggle Invincible ({gameState.isInvincible ? 'ON' : 'OFF'})
          </Button>
          <Button onClick={killPlayer}>Kill Player</Button>
          <div className="flex gap-1">
            <Button onClick={() => addXP(100)}>+100 XP</Button>
            <Button onClick={() => addXP(1000)}>+1000 XP</Button>
          </div>
          <div className="flex gap-1">
            <Button onClick={() => setLevel(gameState.level + 1)}>Level +1</Button>
            <Button onClick={() => setLevel(Math.max(1, gameState.level - 1))}>Level -1</Button>
          </div>
          <div className="flex gap-1">
            <Button onClick={() => addGold(100)}>+100 Gold</Button>
            <Button onClick={() => addGold(1000)}>+1000 Gold</Button>
          </div>
        </div>
      </Section>

      {/* Inventory Section */}
      <Section
        title="2. INVENTORY / EQUIPMENT"
        expanded={expandedSections.inventory}
        onToggle={() => toggleSection('inventory')}
      >
        <div className="space-y-1">
          <div className="text-yellow-300">Items: {(gameState.inventory || []).length}</div>
          <Button onClick={spawnTestGear}>Spawn Test Gear Set</Button>
          <Button onClick={unequipAll}>Unequip All</Button>
          <div className="text-xs text-yellow-400 mt-2">Quick Equip:</div>
          <div className="space-y-0.5 max-h-32 overflow-y-auto">
            {(gameState.inventory || []).slice(0, 10).map(item => (
              <button
                key={item.id}
                onClick={() => equipItem(item.id)}
                className="block w-full text-left hover:bg-yellow-600/30 px-1 py-0.5 rounded text-xs"
              >
                {item.icon} {item.name} ({item.slot})
              </button>
            ))}
          </div>
        </div>
      </Section>

      {/* Enemies Section */}
      <Section
        title="3. ENEMIES"
        expanded={expandedSections.enemies}
        onToggle={() => toggleSection('enemies')}
      >
        <div className="space-y-1">
          <div className="text-yellow-300">Active: {gameEngine?.enemyManager?.enemies?.filter(e => !e.dead).length || 0}</div>
          <Button onClick={spawnNearby}>Spawn Enemy Nearby</Button>
          <Button onClick={killNearby}>Kill Nearby Enemies</Button>
          <Button onClick={() => {
            for (let i = 0; i < 5; i++) spawnNearby();
          }}>Spawn Wave (5)</Button>
        </div>
      </Section>

      {/* World Section */}
      <Section
        title="4. WORLD"
        expanded={expandedSections.world}
        onToggle={() => toggleSection('world')}
      >
        <div className="space-y-1">
          <div className="text-yellow-300">Pos: {(gameEngine?.px || 0).toFixed(0)}, {(gameEngine?.py || 0).toFixed(0)}</div>
          <Button onClick={teleportPlayer}>Teleport (Prompt)</Button>
          <Button onClick={toggleCollisionDebug}>Toggle Collision Debug</Button>
        </div>
      </Section>

      {/* Loot / Balance Section */}
      <Section
        title="5. LOOT / BALANCE"
        expanded={expandedSections.loot}
        onToggle={() => toggleSection('loot')}
      >
        <div className="space-y-1">
          <div className="text-yellow-300 text-xs">Force loot drop: (via enemy drops)</div>
          <Button onClick={() => updateState({ testLootMode: !gameState.testLootMode })}>
            Test Loot Mode ({gameState.testLootMode ? 'ON' : 'OFF'})
          </Button>
        </div>
      </Section>

      {/* Visual / Debug Section */}
      <Section
        title="6. VISUAL / DEBUG"
        expanded={expandedSections.visual}
        onToggle={() => toggleSection('visual')}
      >
        <div className="space-y-1">
          <Button onClick={toggleFPS}>Show FPS ({gameState._showFPS ? 'ON' : 'OFF'})</Button>
          <Button onClick={toggleGearDebug}>Gear Debug ({gameState._debugGear ? 'ON' : 'OFF'})</Button>
          <Button onClick={toggleCollisionDebug}>Collision Debug ({gameState._debugCollision ? 'ON' : 'OFF'})</Button>
        </div>
      </Section>

      {/* Footer */}
      <div className="mt-3 pt-2 border-t border-yellow-600/50 text-yellow-600 text-xs">
        F10 to close • Changes apply live
      </div>
    </div>
  );
}

function Section({ title, expanded, onToggle, children }) {
  return (
    <div className="mb-2 border border-yellow-600/30 rounded">
      <button
        onClick={onToggle}
        className="w-full px-2 py-1 bg-yellow-600/10 hover:bg-yellow-600/20 text-left font-bold text-yellow-400 transition"
      >
        {expanded ? '▼' : '▶'} {title}
      </button>
      {expanded && <div className="p-2 bg-gray-950/50">{children}</div>}
    </div>
  );
}

function Button({ children, onClick }) {
  return (
    <button
      onClick={onClick}
      className="w-full px-2 py-0.5 bg-yellow-600/20 hover:bg-yellow-600/40 border border-yellow-600/50 text-yellow-100 rounded text-xs transition"
    >
      {children}
    </button>
  );
}