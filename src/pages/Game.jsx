import React, { useRef, useEffect, useState, useCallback } from 'react';
import { CLASSES, STARTER_ITEMS, xpForLevel } from '@/game/constants.js';
import { saveCharacter, loadCharacter } from '@/game/CharacterManager.js';
import { calculatePlayerStats } from '@/game/StatsCalculator.js';
import { base44 } from '@/api/base44Client';
import { GameEngine } from '@/game/GameEngine.js';
import { AssetPreloader } from '@/game/AssetPreloader.js';
import { assetIntegration } from '@/game/AssetIntegration.js';
import ClassSelect from '@/components/game/ClassSelect.jsx';
import PauseMenu from '@/components/game/PauseMenu.jsx';
import HUD from '@/components/game/HUD.jsx';
import InventoryPanel from '@/components/game/InventoryPanel.jsx';
import SkillsPanel from '@/components/game/SkillsPanel.jsx';
import DialoguePanel from '@/components/game/DialoguePanel.jsx';
import LootNotification from '@/components/game/LootNotification.jsx';
import CraftingPanel from '@/components/game/CraftingPanel.jsx';
import WorldMap from '@/components/game/WorldMap.jsx';
import GMPanel from '@/components/game/GMPanel.jsx';
import SkillHotbar from '@/components/game/SkillHotbar.jsx';
import BuffIndicators from '@/components/game/BuffIndicators.jsx';
import QuestTracker from '@/components/game/QuestTracker.jsx';
import QuestOfferPanel from '@/components/game/QuestOfferPanel.jsx';
import { getNPCRole, consumeInputs as craftConsume } from '@/game/CraftingRecipes.js';
import { addResourcesToInventory } from '@/game/GatheringSystem.js';
import { getSkillsByClass } from '@/game/SkillSystem.js';
import { getNPCById } from '@/game/NPCRegistry.js';
import { getQuestById } from '@/game/QuestRegistry.js';
// Initialize registries on module load
import '@/game/NPCRegistry.js';
import '@/game/QuestRegistry.js';
import '@/game/EnemyRegistry.js';
import '@/game/GatherNodeRegistry.js';

const initialGameState = (classId, playerName) => {
  const classData = CLASSES[classId];
  const base = classData.baseStats;
  const starterItems = STARTER_ITEMS[classId] || [];
  const equipped = {};
  starterItems.forEach(item => { equipped[item.slot] = item; });

  // Create base state with defensive defaults
  const state = {
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
    potionCooldowns: { hp: 0, mp: 0 },
    skillPoints: 1,
    skillLevels: { Q: 0, W: 0, E: 0, R: 0 },
    cooldowns: { Q: 0, W: 0, E: 0, R: 0 },
    currentZone: null,
    nearNPC: null,
    nearChest: null,
    nearNode: null,
    dialogueNPC: null,
    dialogueIndex: 0,
    lootFound: null,
    kills: 0,
    gold: 0,
    _activeBuffs: [], // For UI tracking
    equipStats: { attack: 0, defense: 0 }, // For equipment calculation
  };

  // Calculate final stats from gear
  state.stats = calculatePlayerStats(state);
  
  return state;
};

export default function Game() {
  const canvasRef = useRef(null);
  const engineRef = useRef(null);

  const [gameStarted, setGameStarted] = useState(false);
  const [gameState, setGameState] = useState(null);
  const activeCharIdRef = useRef(null); // tracks current character's save ID
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  const [showInventory, setShowInventory] = useState(false);
  const [showSkills, setShowSkills] = useState(false);
  const [showWorldMap, setShowWorldMap] = useState(false);
  const [showPauseMenu, setShowPauseMenu] = useState(false);
  const [showGMPanel, setShowGMPanel] = useState(false);
  const [lootItem, setLootItem] = useState(null);
  const [craftingNPC, setCraftingNPC] = useState(null);
  const [questOfferNPC, setQuestOfferNPC] = useState(null);
  const [questOfferList, setQuestOfferList] = useState([]);

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

  // Save the current character state and return the charId
  function saveCurrentCharacter(state) {
    const gs = state || gameState;
    if (!gs) return null;
    const charId = saveCharacter(gs, activeCharIdRef.current);
    activeCharIdRef.current = charId;
    return charId;
  }

  // Start a brand-new character
  function startGame({ classId, playerName }) {
    const gs = initialGameState(classId, playerName);
    activeCharIdRef.current = null; // new char — ID assigned on first save
    setGameState(gs);
    setGameStarted(true);
  }

  // Load an existing saved character
  function loadGame(charId) {
    const saved = loadCharacter(charId);
    if (!saved) return;
    activeCharIdRef.current = charId;
    setGameState({
      ...saved,
      // Reset transient state
      cooldowns: { Q: 0, W: 0, E: 0, R: 0 },
      potionCooldowns: { hp: 0, mp: 0 },
      nearNPC: null,
      nearChest: null,
      nearNode: null,
      dialogueNPC: null,
      dialogueIndex: 0,
      lootFound: null,
    });
    setGameStarted(true);
  }

  // Return to character select — save first
  function returnToSelect() {
    if (gameState) saveCurrentCharacter(gameState);
    if (engineRef.current) { engineRef.current.stop(); engineRef.current = null; }
    setGameStarted(false);
    setGameState(null);
    setShowPauseMenu(false);
    setShowInventory(false);
    setShowSkills(false);
    setShowWorldMap(false);
    setLootItem(null);
    setCraftingNPC(null);
    activeCharIdRef.current = null;
  }

  // Logout
  function handleLogout() {
    if (gameState) saveCurrentCharacter(gameState);
    if (engineRef.current) { engineRef.current.stop(); engineRef.current = null; }
    setIsLoggingOut(true);
    setTimeout(() => base44.auth.logout(), 200);
  }

  // Quest: Accept
  function handleAcceptQuest(questId) {
    engineRef.current?.questManager?.startQuest(questId);
    setQuestOfferNPC(null);
    setQuestOfferList([]);
  }

  // Quest: Turn In
  function handleTurnInQuest(questId) {
    const quest = getQuestById(questId);
    if (!quest) return;
    
    const success = engineRef.current?.questManager?.turnInQuest(questId);
    if (!success) return;

    // Apply rewards
    setGameState(prev => {
      if (!prev) return prev;
      return {
        ...prev,
        xp: prev.xp + quest.rewards.xp,
        gold: (prev.gold || 0) + quest.rewards.gold,
      };
    });
  }

  // NPC interaction: Show quest offer
  function handleNPCInteraction(npc) {
    if (!engineRef.current?.questManager) return;
    const availableQuests = npc.availableQuests?.filter(qid => {
      const qs = engineRef.current.questManager.getQuestState(qid);
      return qs?.state === 'not_started' || qs?.state === 'active';
    }) || [];
    if (availableQuests.length > 0) {
      setQuestOfferNPC(npc);
      setQuestOfferList(availableQuests);
    }
  }

  useEffect(() => {
    if (!gameStarted || !canvasRef.current || !gameState) return;

    // Give canvas time to render, then preload assets before starting engine
    const timer = setTimeout(async () => {
      try {
        console.log('[Game] ===== STARTING GAME ENGINE =====');
        console.log('[Game] Starting asset preload...');
        const preloader = new AssetPreloader(assetIntegration);
        const preloadResult = await preloader.preloadAll();
        
        console.log(`[Game] Preload result: ${preloadResult.preloaded} loaded, ${preloadResult.failed} failed`);
        
        // Log cache status for test sprites
        const testUrls = [
          'https://raw.githubusercontent.com/jseaborn94/Realm-of-Echoes-Assets/main/assets/Units/Blue Units/Warrior/Warrior_Idle.png',
          'https://raw.githubusercontent.com/jseaborn94/Realm-of-Echoes-Assets/main/assets/Units/Black Units/Warrior/Warrior_Idle.png',
          'https://raw.githubusercontent.com/jseaborn94/Realm-of-Echoes-Assets/main/assets/Enemy Pack/Bear/Bear_Idle.png',
        ];
        testUrls.forEach(url => {
          const cached = assetIntegration.imageCache.has(url);
          console.log(`[Game] Test sprite cached: ${cached ? '✓' : '✗'} ${url.split('/').pop()}`);
        });
        
        if (!preloadResult.success) {
          console.warn(`[Game] Preload complete with ${preloadResult.failed} failures`);
        } else {
          console.log('[Game] All assets preloaded successfully');
        }

        // Now start the game engine with preloaded assets
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
      } catch (err) {
        console.error('[Game] Failed to start: ', err);
      }
    }, 100);

    return () => clearTimeout(timer);
  }, [gameStarted]); // eslint-disable-line

  // Keep engine's gameState ref and pause state in sync
  useEffect(() => {
    if (engineRef.current && gameState) {
      engineRef.current.gameState = gameState;
      engineRef.current.isPaused = showPauseMenu;
    }
  }, [gameState, showPauseMenu]);

  // Auto-save every 60 seconds while playing
  useEffect(() => {
    if (!gameStarted) return;
    const interval = setInterval(() => {
      if (gameState) saveCurrentCharacter(gameState);
    }, 60000);
    return () => clearInterval(interval);
  }, [gameStarted, gameState]); // eslint-disable-line

  // Global keyboard handling for UI panels
  useEffect(() => {
    if (!gameStarted) return;
    const handler = (e) => {
      // F10 — GM Panel (admin only)
      if (e.key === 'F10') {
        e.preventDefault();
        if (gameState?.isAdmin) {
          setShowGMPanel(v => !v);
        }
        return;
      }
      if (e.key === 'Escape') {
        e.preventDefault();
        // If pause menu is open, close it
        if (showPauseMenu) {
          setShowPauseMenu(false);
          return;
        }
        // If any other panel is open, close them first
        if (showInventory || showSkills || showWorldMap || craftingNPC || gameState?.dialogueNPC) {
          setShowInventory(false);
          setShowSkills(false);
          setShowWorldMap(false);
          setCraftingNPC(null);
          if (gameState?.dialogueNPC) setGameState(prev => ({ ...prev, dialogueNPC: null }));
        } else {
          // Open pause menu
          setShowPauseMenu(true);
        }
        return;
      }
      // Don't handle game keys when pause menu is open
      if (showPauseMenu) return;
      if (e.key === 'i' || e.key === 'I') setShowInventory(v => !v);
      if (e.key === 'k' || e.key === 'K') setShowSkills(v => !v);
      if (e.key === 'm' || e.key === 'M') setShowWorldMap(v => !v);

      // Skill hotbar keybinds: 1, 2, 3, 4
      if (['1', '2', '3', '4'].includes(e.key)) {
        const slotIndex = parseInt(e.key) - 1;
        const classId = gameState?.classData?.id || 'warrior';
        const skills = getSkillsByClass(classId);
        const skill = skills[slotIndex];
        if (skill && engineRef.current) {
          engineRef.current._beginSkill(skill.key);
        }
        return;
      }

      // Dialogue / crafting / quest advance with F
      if (e.key === 'f' || e.key === 'F') {
        if (questOfferNPC) {
          // Quest panel is open, ignore F
          return;
        }
        if (gameState?.dialogueNPC) {
          const npc = gameState.dialogueNPC;
          const npcDef = getNPCById(npc.id);
          if (npcDef) {
            handleNPCInteraction(npcDef);
          }
        }
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [gameStarted, gameState, showInventory, showSkills, showWorldMap, craftingNPC, showPauseMenu, showGMPanel, questOfferNPC]);

  function handleEquip(item, slot) {
    setGameState(prev => {
      if (!prev) return prev;
      
      const newEquipped = { ...prev.equipped };
      const oldItem = newEquipped[slot];

      // Check inventory space for old item
      if (oldItem) {
        const gearCount = prev.inventory.filter(i => !i.isResource).length;
        const maxGearSlots = 20;
        
        if (gearCount >= maxGearSlots) {
          engineRef.current?.damageNumbers?.push?.({
            x: engineRef.current?.px || 0,
            y: (engineRef.current?.py || 0) - 30,
            text: `Inventory full! Drop an item first.`,
            color: '#ff6644',
            life: 2.0,
          });
          return prev;
        }
      }

      // Remove new item from inventory, add old item back
      const newInventory = prev.inventory.filter(i => i.id !== item.id);
      if (oldItem) newInventory.push(oldItem);

      // Equip the new item
      newEquipped[slot] = item;

      // Recalculate stats from base + new equipped items
      const newState = { ...prev, equipped: newEquipped, inventory: newInventory };
      newState.stats = calculatePlayerStats(newState);

      return newState;
    });
  }

  function handleUnequip(item, slot) {
    setGameState(prev => {
      if (!prev) return prev;
      
      const newEquipped = { ...prev.equipped };
      delete newEquipped[slot];
      const newInventory = prev.inventory.find(i => i.id === item.id) ? prev.inventory : [...prev.inventory, item];

      const newState = { ...prev, equipped: newEquipped, inventory: newInventory };
      newState.stats = calculatePlayerStats(newState);

      return newState;
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
    return (
      <ClassSelect
        onSelect={startGame}
        onLoadCharacter={loadGame}
        onLogout={handleLogout}
        isLoggingOut={isLoggingOut}
      />
    );
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

      {/* Skill Hotbar */}
      {gameState && <SkillHotbar gameState={gameState} gameEngine={engineRef.current} />}

      {/* Buff Indicators */}
      {gameState && <BuffIndicators buffs={gameState._activeBuffs || []} />}

      {/* Quest Tracker */}
      {gameState && engineRef.current && (
        <QuestTracker
          activeQuests={engineRef.current.questManager?.getActiveQuests() || []}
          completedQuests={engineRef.current.questManager?.getCompletedQuests() || []}
          onTurnIn={handleTurnInQuest}
        />
      )}

      {/* Quest Offer Panel */}
      {questOfferNPC && (
        <QuestOfferPanel
          npc={questOfferNPC}
          availableQuests={questOfferList}
          onAcceptQuest={handleAcceptQuest}
          onDecline={() => {
            setQuestOfferNPC(null);
            setQuestOfferList([]);
          }}
        />
      )}

      {/* Pause menu button */}
      <button
        onClick={() => setShowPauseMenu(true)}
        className="fixed top-3 right-3 z-40 font-cinzel text-xs px-3 py-2 rounded-lg panel-glass transition-all hover:border-yellow-500/40"
        style={{ color: '#6a5a3a' }}
      >
        ☰ Menu
      </button>

      {/* Pause Menu */}
      {gameState && (
        <PauseMenu
          isOpen={showPauseMenu}
          onClose={() => setShowPauseMenu(false)}
          onReturnToSelect={returnToSelect}
          onLogout={handleLogout}
          playerName={gameState.playerName}
          level={gameState.level}
          className={gameState.classData?.name}
          classColor={gameState.classData?.color}
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

      {/* GM Panel (admin only) */}
      {gameState?.isAdmin && (
        <GMPanel
          isOpen={showGMPanel}
          onClose={() => setShowGMPanel(false)}
          gameState={gameState}
          onStateChange={setGameState}
          gameEngine={engineRef.current}
        />
      )}

      {/* Controls hint */}
      <div className="fixed bottom-32 left-3 z-30 text-xs font-cinzel space-y-0.5"
        style={{ color: '#2a1a0a' }}>
        <div>Click — Move / Attack</div>
        <div>1-4 — Cast Skill</div>
        <div>F — Interact · I — Inv · K — Skills · M — Map</div>
      </div>
    </div>
  );
}