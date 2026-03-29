/**
 * BuffSystem.js
 * 
 * Manages active buffs and applies their stat modifications to the player
 * Buffs are applied in real-time and expire after duration
 */

export class BuffSystem {
  constructor() {
    this.activeBuffs = {};
  }

  /**
   * Apply a buff to the player
   */
  applyBuff(buffId, buffData) {
    this.activeBuffs[buffId] = {
      id: buffId,
      name: buffData.name,
      type: buffData.type,
      duration: buffData.duration || 3.0,
      maxDuration: buffData.duration || 3.0,
      // Stat modifiers
      statModifiers: buffData.statModifiers || {
        attackSpeed: 0,
        attackDamage: 0,
        defense: 0,
        speed: 0,
      },
      // Special effects
      invulnerable: buffData.invulnerable || false,
      hidden: buffData.hidden || false, // invisible to UI
    };
  }

  /**
   * Remove a buff
   */
  removeBuff(buffId) {
    delete this.activeBuffs[buffId];
  }

  /**
   * Update buff durations
   */
  update(dt) {
    for (const buffId of Object.keys(this.activeBuffs)) {
      const buff = this.activeBuffs[buffId];
      buff.duration -= dt;
      if (buff.duration <= 0) {
        this.removeBuff(buffId);
      }
    }
  }

  /**
   * Get aggregated stat modifiers from all active buffs
   */
  getAggregatedModifiers() {
    const mods = {
      attackSpeed: 0,
      attackDamage: 0,
      defense: 0,
      speed: 0,
      invulnerable: false,
    };

    for (const buff of Object.values(this.activeBuffs)) {
      mods.attackSpeed += buff.statModifiers.attackSpeed || 0;
      mods.attackDamage += buff.statModifiers.attackDamage || 0;
      mods.defense += buff.statModifiers.defense || 0;
      mods.speed += buff.statModifiers.speed || 0;
      if (buff.invulnerable) mods.invulnerable = true;
    }

    return mods;
  }

  /**
   * Get visible buffs for UI
   */
  getVisibleBuffs() {
    return Object.values(this.activeBuffs).filter(b => !b.hidden);
  }

  /**
   * Check if player is invulnerable
   */
  isInvulnerable() {
    return this.getAggregatedModifiers().invulnerable;
  }

  /**
   * Clear all buffs
   */
  clear() {
    this.activeBuffs = {};
  }
}

export const buffSystem = new BuffSystem();