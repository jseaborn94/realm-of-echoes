import React, { useRef, useEffect, useState, useCallback } from 'react';
import { CLASSES, STARTER_ITEMS, xpForLevel } from '@/game/constants.js';
import { GameEngine } from '@/game/GameEngine.js';
import ClassSelect from '@/components/game/ClassSelect.jsx';
import HUD from '@/components/game/HUD.jsx';
import InventoryPanel from '@/components/game/InventoryPanel.jsx';
import SkillsPanel from '@/components/game/SkillsPanel.jsx';
import DialoguePanel from '@/components/game/DialoguePanel.jsx';
import LootNotification from '@/components/game/LootNotification.jsx';

const initialGameState = (classId, playerName) => {
  const classData = CLASSES[classId];
  const base = classData.baseStats;
  const starterItems = STARTER_ITEMS[classId] || [];
  const equipped = {};
  starterItems.forEach(item => { equipped[item.slot] = item; });

  return {
    classData,
    playerName,
    level: 1,
    xp: 0,
    hp: base.hp,
    maxHp: base.hp,
    mp: base.mp,
    maxMp: base.mp,
    inventory: [...starterItems],
    equipped,
    equipStats: starterItems.reduce((acc, i) => {
      Object.entries(i.stats || {}).forEach(([k, v]) => { acc[k] = (acc[k] || 0) + v; });
      return acc;
    }, {}),
    skillPoints: 1,
    skillLevels: { Q: 0, W: 0, E: 0 },
    cooldowns: { Q: 0, W: 0, E: 0, R: 0 },
    currentZone: null,
    nearNPC: null,
    nearChest: null,
    dialogueNPC: null,
    dialogueIndex: 0,
    lootFound: null,
    kills: 0,
  };
};

export default function Game() {
  const canvasRef = useRef(null);
  const engineRef = useRef(null);

  const [gameStarted, setGameStarted] = useState(false);
  const [gameState, setGameState] = useState(null);

  const [showInventory, setShowInventory] = useState(false);
  const [showSkills, setShowSkills] = useState(false);
  const [lootItem, setLootItem] = useState(null);

  // Stable update callback
  const handleStateUpdate = useCallback((newState) => {
    setGameState(prev => {
      const merged = { ...prev, ...newState };
      // Handle loot
      if (newState.lootFound && newState.lootFound !== prev?.lootFound) {
        setLootItem(newState.lootFound);
      }
      return merged;
    });
  }, []);

  function startGame({ classId, playerName }) {
    const gs = initialGameState(classId, playerName);
    setGameState(gs);
    setGameStarted(true);
  }

  useEffect(() => {
    if (!gameStarted || !canvasRef.current || !gameState) return;

    // Give canvas time to render
    const timer = setTimeout(() => {
      const engine = new GameEngine(canvasRef.current, gameState, handleStateUpdate);
      engineRef.current = engine;
      engine.start();

      const handleResize = () => {
        if (canvasRef.current) {
          canvasRef.current.width = window.innerWidth;
          canvasRef.current.height = window.innerHeight;
        }
      };
      window.addEventListener('resize', handleResize);

      return () => {
        engine.stop();
        window.removeEventListener('resize', handleResize);
      };
    }, 100);

    return () => clearTimeout(timer);
  }, [gameStarted]); // eslint-disable-line

  // Keep engine's gameState ref in sync
  useEffect(() => {
    if (engineRef.current && gameState) {
      engineRef.current.gameState = gameState;
    }
  }, [gameState]);

  // Global keyboard handling for UI panels
  useEffect(() => {
    if (!gameStarted) return;
    const handler = (e) => {
      if (e.key === 'Escape') {
        setShowInventory(false);
        setShowSkills(false);
        if (gameState?.dialogueNPC) {
          setGameState(prev => ({ ...prev, dialogueNPC: null }));
        }
      }
      if (e.key === 'i' || e.key === 'I') setShowInventory(v => !v);
      if (e.key === 'k' || e.key === 'K') setShowSkills(v => !v);

      // Dialogue advance with F
      if (e.key === 'f' || e.key === 'F') {
        if (gameState?.dialogueNPC) {
          const lines = gameState.dialogueNPC.dialogue || [];
          if (gameState.dialogueIndex < lines.length - 1) {
            setGameState(prev => ({ ...prev, dialogueIndex: prev.dialogueIndex + 1 }));
          } else {
            setGameState(prev => ({ ...prev, dialogueNPC: null, dialogueIndex: 0 }));
          }
        }
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [gameStarted, gameState]);

  function handleEquip(item, slot) {
    setGameState(prev => {
      if (!prev) return prev;
      const newEquipped = { ...prev.equipped };
      // Put previously equipped item back in bag
      const oldItem = newEquipped[slot];
      const newInventory = [...prev.inventory];
      if (oldItem && !newInventory.find(i => i.id === oldItem.id)) {
        newInventory.push(oldItem);
      }
      newEquipped[slot] = item;

      // Recalc equipStats
      const equipStats = Object.values(newEquipped).reduce((acc, i) => {
        if (!i) return acc;
        Object.entries(i.stats || {}).forEach(([k, v]) => { acc[k] = (acc[k] || 0) + v; });
        return acc;
      }, {});

      return { ...prev, equipped: newEquipped, inventory: newInventory, equipStats };
    });
  }

  function handleUnequip(item, slot) {
    setGameState(prev => {
      if (!prev) return prev;
      const newEquipped = { ...prev.equipped };
      delete newEquipped[slot];
      const newInventory = prev.inventory.find(i => i.id === item.id) ? prev.inventory : [...prev.inventory, item];

      const equipStats = Object.values(newEquipped).reduce((acc, i) => {
        if (!i) return acc;
        Object.entries(i.stats || {}).forEach(([k, v]) => { acc[k] = (acc[k] || 0) + v; });
        return acc;
      }, {});

      return { ...prev, equipped: newEquipped, inventory: newInventory, equipStats };
    });
  }

  function handleUpgradeSkill(key) {
    setGameState(prev => {
      if (!prev || (prev.skillPoints || 0) <= 0) return prev;
      const curLevel = prev.skillLevels?.[key] || 0;
      if (curLevel >= 5) return prev;
      return {
        ...prev,
        skillPoints: prev.skillPoints - 1,
        skillLevels: { ...(prev.skillLevels || {}), [key]: curLevel + 1 },
      };
    });
  }

  if (!gameStarted) {
    return <ClassSelect onSelect={startGame} />;
  }

  return (
    <div className="fixed inset-0 overflow-hidden" style={{ background: '#050608' }}>
      {/* Game canvas */}
      <canvas
        ref={canvasRef}
        id="game-canvas"
        style={{ display: 'block', width: '100%', height: '100%' }}
      />

      {/* HUD */}
      {gameState && (
        <HUD
          gameState={gameState}
          onOpenInventory={() => setShowInventory(true)}
          onOpenSkills={() => setShowSkills(true)}
        />
      )}

      {/* Inventory Panel */}
      {showInventory && gameState && (
        <InventoryPanel
          gameState={gameState}
          onClose={() => setShowInventory(false)}
          onEquip={handleEquip}
          onUnequip={handleUnequip}
        />
      )}

      {/* Skills Panel */}
      {showSkills && gameState && (
        <SkillsPanel
          gameState={gameState}
          onClose={() => setShowSkills(false)}
          onUpgradeSkill={handleUpgradeSkill}
        />
      )}

      {/* Dialogue */}
      {gameState?.dialogueNPC && (
        <DialoguePanel
          npc={gameState.dialogueNPC}
          dialogueIndex={gameState.dialogueIndex || 0}
          onNext={() => setGameState(prev => ({ ...prev, dialogueIndex: (prev.dialogueIndex || 0) + 1 }))}
          onClose={() => setGameState(prev => ({ ...prev, dialogueNPC: null, dialogueIndex: 0 }))}
        />
      )}

      {/* Loot notification */}
      <LootNotification item={lootItem} onClose={() => setLootItem(null)} />

      {/* Controls hint */}
      <div className="fixed bottom-20 left-3 z-30 text-xs font-cinzel space-y-0.5"
        style={{ color: '#2a1a0a' }}>
        <div>Click — Move</div>
        <div>QWER — Abilities</div>
        <div>F — Interact</div>
        <div>I — Inventory · K — Skills</div>
      </div>
    </div>
  );
}