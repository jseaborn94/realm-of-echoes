/**
 * SkillSystem.js
 * 
 * Data-driven skill definitions for all classes.
 * Each skill is stateless—execution handled by GameEngine or SkillExecutor.
 */

export const SKILLS = {
  warrior: [
    {
      id: 'cleave',
      name: 'Cleave',
      classRestriction: 'warrior',
      icon: '🗡️',
      key: 'Q',
      description: 'Short frontal AOE melee—hit multiple nearby enemies.',
      manaCost: 15,
      cooldown: 2.0,
      castType: 'instant_melee',
      range: 60,
      damageScaling: { attack: 1.1, level: 0.2 },
      areaRadius: 45,
    },
    {
      id: 'guard_break',
      name: 'Guard Break',
      classRestriction: 'warrior',
      icon: '⚔️',
      key: 'W',
      description: 'Strong single-target strike with impact.',
      manaCost: 25,
      cooldown: 4.0,
      castType: 'instant_melee',
      range: 50,
      damageScaling: { attack: 1.5, level: 0.3 },
      areaRadius: 0,
    },
    {
      id: 'shield_bash',
      name: 'Shield Bash',
      classRestriction: 'warrior',
      icon: '🛡️',
      key: 'E',
      description: 'Defensive strike stunning nearby enemies.',
      manaCost: 35,
      cooldown: 5.0,
      castType: 'ground_target_aoe',
      range: 80,
      damageScaling: { defense: 0.8 },
      areaRadius: 50,
      duration: 1.2,
    },
    {
      id: 'whirlwind',
      name: 'Whirlwind',
      classRestriction: 'warrior',
      icon: '💨',
      key: 'R',
      description: 'Ultimate: Spin violently, hitting all nearby.',
      manaCost: 60,
      cooldown: 20.0,
      castType: 'ground_target_aoe',
      range: 100,
      damageScaling: { attack: 0.9, level: 0.5 },
      areaRadius: 70,
    },
  ],

  archer: [
    {
      id: 'power_shot',
      name: 'Power Shot',
      classRestriction: 'archer',
      icon: '🏹',
      key: 'Q',
      description: 'Strong projectile with extended range.',
      manaCost: 15,
      cooldown: 2.0,
      castType: 'projectile',
      range: 280,
      damageScaling: { attack: 1.3, level: 0.2 },
      projectileSpeed: 320,
      areaRadius: 0,
    },
    {
      id: 'volley',
      name: 'Volley',
      classRestriction: 'archer',
      icon: '⬇️',
      key: 'W',
      description: 'Multi-shot cone attack.',
      manaCost: 30,
      cooldown: 4.5,
      castType: 'ground_target_aoe',
      range: 220,
      damageScaling: { attack: 0.9, level: 0.25 },
      areaRadius: 50,
    },
    {
      id: 'barrage',
      name: 'Barrage',
      classRestriction: 'archer',
      icon: '🌧️',
      key: 'E',
      description: 'Rain arrows on target area.',
      manaCost: 40,
      cooldown: 6.0,
      castType: 'ground_target_aoe',
      range: 200,
      damageScaling: { attack: 0.7, level: 0.3 },
      areaRadius: 55,
    },
    {
      id: 'rain_of_arrows',
      name: 'Rain of Arrows',
      classRestriction: 'archer',
      icon: '☔',
      key: 'R',
      description: 'Ultimate: Massive barrage over wide area.',
      manaCost: 70,
      cooldown: 25.0,
      castType: 'ground_target_aoe',
      range: 220,
      damageScaling: { attack: 0.8, level: 0.6 },
      areaRadius: 90,
    },
  ],

  lancer: [
    {
      id: 'piercing_thrust',
      name: 'Piercing Thrust',
      classRestriction: 'lancer',
      icon: '⚡',
      key: 'Q',
      description: 'Long narrow line attack piercing through enemies.',
      manaCost: 20,
      cooldown: 2.5,
      castType: 'ground_target_aoe',
      range: 100,
      damageScaling: { attack: 1.2, level: 0.2 },
      areaRadius: 25,
    },
    {
      id: 'charge',
      name: 'Charge',
      classRestriction: 'lancer',
      icon: '💨',
      key: 'W',
      description: 'Forward rush damaging enemies in path.',
      manaCost: 30,
      cooldown: 4.0,
      castType: 'dash',
      range: 140,
      damageScaling: { attack: 1.1, level: 0.25 },
      areaRadius: 40,
    },
    {
      id: 'riposte',
      name: 'Riposte',
      classRestriction: 'lancer',
      icon: '🗡️',
      key: 'E',
      description: 'Counter strike with precision damage.',
      manaCost: 25,
      cooldown: 4.5,
      castType: 'instant_melee',
      range: 60,
      damageScaling: { attack: 1.3, level: 0.2 },
      areaRadius: 0,
    },
    {
      id: 'spear_storm',
      name: 'Spear Storm',
      classRestriction: 'lancer',
      icon: '🌪️',
      key: 'R',
      description: 'Ultimate: Unleash spear barrage.',
      manaCost: 65,
      cooldown: 22.0,
      castType: 'ground_target_aoe',
      range: 160,
      damageScaling: { attack: 1.1, level: 0.5 },
      areaRadius: 75,
    },
  ],

  monk: [
    {
      id: 'palm_strike',
      name: 'Palm Strike',
      classRestriction: 'monk',
      icon: '👊',
      key: 'Q',
      description: 'Quick close-range burst strike.',
      manaCost: 15,
      cooldown: 1.5,
      castType: 'instant_melee',
      range: 45,
      damageScaling: { attack: 1.2, level: 0.15 },
      areaRadius: 0,
    },
    {
      id: 'inner_focus',
      name: 'Inner Focus',
      classRestriction: 'monk',
      icon: '✨',
      key: 'W',
      description: 'Self-buff boosting speed and damage briefly.',
      manaCost: 25,
      cooldown: 5.0,
      castType: 'self_buff',
      range: 0,
      damageScaling: { level: 0.3 },
      duration: 4.0,
    },
    {
      id: 'chi_burst',
      name: 'Chi Burst',
      classRestriction: 'monk',
      icon: '💥',
      key: 'E',
      description: 'Release chi energy in expanding pulse.',
      manaCost: 35,
      cooldown: 4.0,
      castType: 'ground_target_aoe',
      range: 100,
      damageScaling: { attack: 0.7, level: 0.3 },
      areaRadius: 55,
    },
    {
      id: 'enlightenment',
      name: 'Enlightenment',
      classRestriction: 'monk',
      icon: '🌟',
      key: 'R',
      description: 'Ultimate: Transcend, gaining invulnerability.',
      manaCost: 55,
      cooldown: 20.0,
      castType: 'self_buff',
      range: 0,
      damageScaling: { level: 0.4 },
      duration: 4.0,
    },
  ],
};

/**
 * Get skill by ID
 */
export function getSkillById(skillId) {
  for (const classSkills of Object.values(SKILLS)) {
    const skill = classSkills.find(s => s.id === skillId);
    if (skill) return skill;
  }
  return null;
}

/**
 * Get all skills for a class
 */
export function getSkillsByClass(classId) {
  return SKILLS[classId] || [];
}

/**
 * Get skill by class and key (Q, W, E, R)
 */
export function getSkillByKey(classId, key) {
  const skills = getSkillsByClass(classId);
  return skills.find(s => s.key === key);
}

/**
 * Calculate skill damage based on player stats
 * damageScaling: { attack: 1.2, defense: 0.5, level: 0.3, ... }
 */
export function calculateSkillDamage(skill, playerStats) {
  if (!skill.damageScaling) return 0;

  let damage = 0;
  const scaling = skill.damageScaling;

  if (scaling.attack) {
    damage += (playerStats.attackPower || 0) * scaling.attack;
  }
  if (scaling.defense) {
    damage += (playerStats.defense || 0) * scaling.defense;
  }
  if (scaling.level) {
    damage += (playerStats.level || 1) * scaling.level;
  }
  if (scaling.flat) {
    damage += scaling.flat;
  }

  return Math.max(1, Math.floor(damage));
}

/**
 * Check if skill is unlocked at player level
 */
export function isSkillUnlocked(skill, playerLevel) {
  if (!skill) return false;
  const unlocksAt = skill.unlocksAt || 1;
  return playerLevel >= unlocksAt;
}

/**
 * Validate if skill can be cast
 */
export function canCastSkill(skill, playerState) {
  if (!skill) return false;
  if (playerState.mp < skill.manaCost) return false;
  if (playerState.level < 6 && skill.key === 'R') return false; // R locked until level 6
  return true;
}

/**
 * Map skill castType to TargetingSystem config
 */
export function getTargetingConfig(skill) {
  const typeMap = {
    instant_melee: { type: 'instant', range: skill.range },
    projectile: { type: 'line', range: skill.range },
    ground_target_aoe: { type: 'aoe', range: skill.range, radius: skill.areaRadius || 50 },
    self_buff: { type: 'self_aoe', range: 0 },
    dash: { type: 'line', range: skill.range },
  };
  return typeMap[skill.castType] || { type: 'instant', range: skill.range };
}

/**
 * Translate skill key to old ability index for backward compatibility
 */
export function keyToAbilityIndex(key) {
  const map = { Q: 0, W: 1, E: 2, R: 3 };
  return map[key] || 0;
}

export default {
  SKILLS,
  getSkillById,
  getSkillsByClass,
  getSkillByKey,
  calculateSkillDamage,
  isSkillUnlocked,
  canCastSkill,
  getTargetingConfig,
  keyToAbilityIndex,
};