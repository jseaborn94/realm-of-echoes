import React, { useRef, useEffect, useState, useCallback } from 'react';
import { CLASSES, STARTER_ITEMS, xpForLevel } from '@/game/constants.js';
import { GameEngine } from '@/game/GameEngine.js';
import ClassSelect from '@/components/game/ClassSelect.jsx';
import HUD from '@/components/game/HUD.jsx';
import InventoryPanel from '@/components/game/InventoryPanel.jsx';
import SkillsPanel from '@/components/game/SkillsPanel.jsx';
import DialoguePanel from '@/components/game/DialoguePanel.jsx';
import LootNotification from '@/components/game/LootNotification.jsx';
import CraftingPanel from '@/components/game/CraftingPanel.jsx';
import WorldMap from '@/components/game/WorldMap.jsx';
import { getNPCRole, consumeInputs as craftConsume } from '@/game/CraftingRecipes.js';
import { addResourcesToInventory } from '@/game/GatheringSystem.js';

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
    skillLevels: { Q: 0, W: 0, E: 0, R: 0 },
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
  const [showWorldMap, setShowWorldMap] = useState(false);
  const [lootItem, setLootItem] = useState(null);
  const [craftingNPC, setCraftingNPC] = useState(null);

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
        setShowWorldMap(false);
        setCraftingNPC(null);
        if (gameState?.dialogueNPC) {
          setGameState(prev => ({ ...prev, dialogueNPC: null }));
        }
      }
      if (e.key === 'i' || e.key === 'I') setShowInventory(v => !v);
      if (e.key === 'k' || e.key === 'K') setShowSkills(v => !v);
      if (e.key === 'm' || e.key === 'M') setShowWorldMap(v => !v);

      // Dialogue / crafting advance with F
      if (e.key === 'f' || e.key === 'F') {
        if (gameState?.dialogueNPC) {
          const npcRole = getNPCRole(gameState.dialogueNPC.name || '');
          if (npcRole) {
            // Open crafting panel instead of dialogue
            setCraftingNPC(gameState.dialogueNPC);
            setGameState(prev => ({ ...prev, dialogueNPC: null, dialogueIndex: 0 }));
          } else {
            const lines = gameState.dialogueNPC.dialogue || [];
            if (gameState.dialogueIndex < lines.length - 1) {
              setGameState(prev => ({ ...prev, dialogueIndex: prev.dialogueIndex + 1 }));
            } else {
              setGameState(prev => ({ ...prev, dialogueNPC: null, dialogueIndex: 0 }));
            }
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

  function handleUseItem(item) {
    if (!item?.useEffect) return;
    setGameState(prev => {
      if (!prev) return prev;
      let inv = [...(prev.inventory || [])];
      // Consume one from stack
      const idx = inv.findIndex(i => i.id === item.id && i.isResource);
      if (idx === -1) return prev;
      const stack = { ...inv[idx] };
      if ((stack.qty || 1) <= 1) {
        inv.splice(idx, 1);
      } else {
        stack.qty = (stack.qty || 1) - 1;
        inv[idx] = stack;
      }
      const newHp = Math.min(prev.maxHp, prev.hp + (item.useEffect.hp || 0));
      return { ...prev, inventory: inv, hp: newHp };
    });
  }

  function handleCraft(recipe) {
    setGameState(prev => {
      if (!prev) return prev;
      let inv = craftConsume(prev.inventory || [], recipe);

      if (recipe.special === 'upgrade_weapon') {
        // Upgrade equipped weapon +8 ATK
        const weapon = prev.equipped?.weapon;
        if (!weapon) return prev;
        const upgraded = { ...weapon, name: weapon.name + ' (+)', stats: { ...weapon.stats, attack: (weapon.stats?.attack || 0) + 8 } };
        return { ...prev, inventory: inv, equipped: { ...prev.equipped, weapon: upgraded } };
      }
      if (recipe.special === 'upgrade_armor') {
        const chest = prev.equipped?.chest;
        if (!chest) return prev;
        const upgraded = { ...chest, name: chest.name + ' (+)', stats: { ...chest.stats, defense: (chest.stats?.defense || 0) + 6 } };
        return { ...prev, inventory: inv, equipped: { ...prev.equipped, chest: upgraded } };
      }

      // Produce output item
      const tmpl = recipe.outputTemplate || recipe.output;
      if (!tmpl) return { ...prev, inventory: inv };

      let output;
      if (tmpl.isResource) {
        // Stack resource output
        output = { ...tmpl, id: tmpl.id || recipe.id, qty: tmpl.qty || 1 };
        inv = addResourcesToInventory(inv, [output]);
      } else {
        // Gear item
        output = { ...tmpl, id: `crafted_${recipe.id}_${Date.now()}`, isResource: false, stats: tmpl.stats || {} };
        inv = [...inv, output];
      }
      return { ...prev, inventory: inv };
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
          onUseItem={handleUseItem}
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

      {/* Crafting Panel */}
      {craftingNPC && gameState && (
        <CraftingPanel
          npc={craftingNPC}
          gameState={gameState}
          onClose={() => setCraftingNPC(null)}
          onCraft={handleCraft}
        />
      )}

      {/* Loot notification */}
      <LootNotification item={lootItem} onClose={() => setLootItem(null)} />

      {/* World Map */}
      {showWorldMap && gameState && (
        <WorldMap gameState={gameState} onClose={() => setShowWorldMap(false)} />
      )}

      {/* Controls hint */}
      <div className="fixed bottom-20 left-3 z-30 text-xs font-cinzel space-y-0.5"
        style={{ color: '#2a1a0a' }}>
        <div>Click — Move</div>
        <div>QWER — Aim &amp; Cast · Click — Confirm</div>
        <div>1 — HP Potion · 2 — MP Potion</div>
        <div>F — Interact · I — Inv · K — Skills · M — Map</div>
      </div>
    </div>
  );
}