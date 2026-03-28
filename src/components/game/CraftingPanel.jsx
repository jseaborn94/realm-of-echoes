import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { RECIPES, canCraft, countResource, getNPCRole } from '../../game/CraftingRecipes.js';

function RecipeRow({ recipe, inventory, onCraft }) {
  const affordable = canCraft(inventory, recipe);

  return (
    <div className="rounded-lg p-3 transition-all"
      style={{
        background: affordable ? 'rgba(76,175,80,0.08)' : 'rgba(0,0,0,0.25)',
        border: `1px solid ${affordable ? 'rgba(76,175,80,0.35)' : 'rgba(255,255,255,0.07)'}`,
      }}>
      {/* Header */}
      <div className="flex items-center gap-2 mb-2">
        <span style={{ fontSize: '20px' }}>{recipe.icon}</span>
        <div className="flex-1">
          <div className="font-cinzel text-sm font-bold" style={{ color: affordable ? '#ffe88a' : '#6a5a3a' }}>
            {recipe.name}
          </div>
          <div style={{ fontSize: '10px', color: '#5a4a2a', fontFamily: 'Crimson Text, serif' }}>
            {recipe.description}
          </div>
        </div>
        <button
          onClick={() => affordable && onCraft(recipe)}
          disabled={!affordable}
          className="font-cinzel text-xs px-3 py-1.5 rounded transition-all"
          style={{
            background: affordable ? 'linear-gradient(135deg, #ffe88a, #c8a030)' : 'rgba(255,255,255,0.05)',
            color: affordable ? '#1a1000' : '#3a3030',
            border: affordable ? '1px solid #ffe88a' : '1px solid rgba(255,255,255,0.08)',
            cursor: affordable ? 'pointer' : 'not-allowed',
            fontWeight: 'bold',
          }}
        >
          Craft
        </button>
      </div>

      {/* Ingredients */}
      <div className="flex flex-wrap gap-2">
        {recipe.inputs.map(input => {
          const have = countResource(inventory, input.id);
          const enough = have >= input.qty;
          return (
            <div key={input.id} className="flex items-center gap-1 px-2 py-0.5 rounded"
              style={{ background: 'rgba(0,0,0,0.3)', border: `1px solid ${enough ? 'rgba(76,175,80,0.3)' : 'rgba(200,60,60,0.3)'}` }}>
              <span style={{ fontSize: '13px' }}>{input.icon}</span>
              <span className="font-cinzel text-xs" style={{ color: enough ? '#4caf50' : '#e63946' }}>
                {have}/{input.qty}
              </span>
              <span style={{ fontSize: '10px', color: '#5a4a2a' }}>{input.name}</span>
            </div>
          );
        })}
      </div>

      {/* Output preview */}
      {recipe.outputTemplate && (
        <div className="mt-2 flex items-center gap-1" style={{ fontSize: '10px', color: '#6a8a5a' }}>
          <span>→ Yields:</span>
          <span style={{ fontSize: '13px' }}>{recipe.outputTemplate.icon}</span>
          <span className="font-cinzel" style={{ color: '#7caf6a' }}>{recipe.outputTemplate.name}</span>
          {recipe.outputTemplate.stats?.attack > 0 && (
            <span style={{ color: '#e63946' }}>+{recipe.outputTemplate.stats.attack} ATK</span>
          )}
          {recipe.outputTemplate.stats?.defense > 0 && (
            <span style={{ color: '#4a9eff' }}>+{recipe.outputTemplate.stats.defense} DEF</span>
          )}
        </div>
      )}
      {recipe.output?.useEffect && (
        <div className="mt-1 text-xs" style={{ color: '#6a8a5a' }}>
          → Restores <span style={{ color: '#4caf50', fontWeight: 'bold' }}>{recipe.output.useEffect.hp} HP</span>
        </div>
      )}
      {recipe.special === 'upgrade_weapon' && (
        <div className="mt-1 text-xs" style={{ color: '#6a8a5a' }}>→ Adds <span style={{ color: '#e63946' }}>+8 ATK</span> to equipped weapon</div>
      )}
      {recipe.special === 'upgrade_armor' && (
        <div className="mt-1 text-xs" style={{ color: '#6a8a5a' }}>→ Adds <span style={{ color: '#4a9eff' }}>+6 DEF</span> to equipped chest</div>
      )}
    </div>
  );
}

const ROLE_LABELS = {
  blacksmith:  { label: 'Blacksmith', icon: '⚒️', color: '#ff9800' },
  cook:        { label: 'Cook',       icon: '🍳', color: '#4caf50' },
  weaponsmith: { label: 'Weaponsmith',icon: '⚔️', color: '#e63946' },
  armorsmith:  { label: 'Armorsmith', icon: '🛡️', color: '#4a9eff' },
};

export default function CraftingPanel({ npc, gameState, onClose, onCraft }) {
  const role = getNPCRole(npc?.name || '');
  const recipes = role ? (RECIPES[role] || []) : [];
  const { inventory = [] } = gameState;
  const [lastCrafted, setLastCrafted] = useState(null);

  const roleInfo = ROLE_LABELS[role] || { label: 'Crafter', icon: '🔨', color: '#ffe88a' };

  function handleCraft(recipe) {
    onCraft(recipe);
    setLastCrafted(recipe.name);
    setTimeout(() => setLastCrafted(null), 2000);
  }

  // Resource summary — show relevant resources
  const resources = inventory.filter(i => i.isResource);
  const resourceMap = {};
  for (const r of resources) {
    if (!resourceMap[r.id]) resourceMap[r.id] = { ...r };
    else resourceMap[r.id].qty = (resourceMap[r.id].qty || 1) + (r.qty || 1);
  }
  const uniqueResources = Object.values(resourceMap);

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 flex items-center justify-center"
        style={{ background: 'rgba(0,0,0,0.75)' }}
        onClick={e => e.target === e.currentTarget && onClose()}
      >
        <motion.div
          initial={{ scale: 0.88, y: 24 }}
          animate={{ scale: 1, y: 0 }}
          exit={{ scale: 0.88, y: 24 }}
          className="panel-glass-gold rounded-xl p-5 w-full max-w-lg"
          style={{ maxHeight: '88vh', overflowY: 'auto' }}
        >
          {/* Header */}
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <span style={{ fontSize: '26px' }}>{roleInfo.icon}</span>
              <div>
                <div className="font-cinzel font-bold text-lg" style={{ color: roleInfo.color }}>
                  {npc?.name}
                </div>
                <div className="font-cinzel text-xs" style={{ color: '#5a4a2a' }}>{roleInfo.label}</div>
              </div>
            </div>
            <button onClick={onClose} className="font-cinzel text-xs px-3 py-1 rounded"
              style={{ color: '#6a5a3a', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)' }}>
              ✕ Close
            </button>
          </div>

          {/* Success flash */}
          <AnimatePresence>
            {lastCrafted && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                className="mb-3 text-center font-cinzel text-sm py-2 rounded-lg"
                style={{ background: 'rgba(76,175,80,0.2)', border: '1px solid rgba(76,175,80,0.4)', color: '#4caf50' }}>
                ✓ Crafted: {lastCrafted}!
              </motion.div>
            )}
          </AnimatePresence>

          {/* Player resources summary */}
          {uniqueResources.length > 0 && (
            <div className="mb-4 p-3 rounded-lg" style={{ background: 'rgba(0,0,0,0.3)', border: '1px solid rgba(255,255,255,0.07)' }}>
              <div className="font-cinzel text-xs mb-2" style={{ color: '#5a4a2a' }}>YOUR MATERIALS</div>
              <div className="flex flex-wrap gap-2">
                {uniqueResources.map(r => (
                  <div key={r.id} className="flex items-center gap-1 px-2 py-1 rounded"
                    style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)' }}>
                    <span style={{ fontSize: '14px' }}>{r.icon}</span>
                    <span className="font-cinzel text-xs font-bold" style={{ color: '#ffe88a' }}>{r.qty || 1}</span>
                    <span style={{ fontSize: '10px', color: '#5a4a2a' }}>{r.name}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* No resources hint */}
          {uniqueResources.length === 0 && (
            <div className="mb-4 p-3 rounded-lg text-center"
              style={{ background: 'rgba(0,0,0,0.2)', border: '1px solid rgba(255,255,255,0.06)' }}>
              <div className="font-cinzel text-xs" style={{ color: '#4a3a2a' }}>
                No materials yet — gather resources from the world!
              </div>
              <div className="text-xs mt-1" style={{ color: '#3a2a1a', fontFamily: 'Crimson Text, serif' }}>
                Press F near trees (🪵 Wood), rocks (🪨 Ore), or sheep (🐑) to gather
              </div>
            </div>
          )}

          {/* Recipes */}
          {recipes.length > 0 ? (
            <div className="space-y-3">
              <div className="font-cinzel text-xs" style={{ color: '#5a4a2a' }}>AVAILABLE RECIPES</div>
              {recipes.map(recipe => (
                <RecipeRow
                  key={recipe.id}
                  recipe={recipe}
                  inventory={inventory}
                  onCraft={handleCraft}
                />
              ))}
            </div>
          ) : (
            <div className="text-center py-8 font-cinzel text-xs" style={{ color: '#3a2a1a' }}>
              This NPC has no crafting services.
            </div>
          )}
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}