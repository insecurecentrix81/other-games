/**
 * config.js
 * Global game configuration and constants
 * All values are namespaced under GAME_CONFIG
 */

const GAME_CONFIG = {
  // Game identity
  GAME_NAME: 'Calvin with Eric',
  VERSION: '1.0.0',
  STORAGE_PREFIX: window.location.pathname.replace(/[^a-zA-Z0-9]/g, '_') + '_calvinWithEric_',
  
  // Display settings
  WIDTH: 1024,
  HEIGHT: 768,
  SCALE_MODE: Phaser.Scale.FIT,
  AUTO_CENTER: Phaser.Scale.CENTER_BOTH,
  
  // Physics configuration
  PHYSICS: {
    default: 'arcade',
    arcade: {
      gravity: { y: 1500 },
      debug: false,
      debugShowBody: false,
      debugShowVelocity: false,
      debugVelocityColor: 0xffff00,
      debugBodyColor: 0x0000ff,
      debugVelocityScale: 0.5
    }
  },
  
  // Display boundaries
  WORLD_BOUNDS: {
    minX: 0,
    maxX: 1024 * 5, // 5 times the screen width
    minY: 0,
    maxY: 768 * 2  // 2 times the screen height
  },
  
  // Player configuration
  PLAYER: {
    moveSpeed: 400,
    jumpForce: -900,
    attackRange: 80,
    attackDamage: 10,
    invincibilityDuration: 1.0, // seconds
    baseHealth: 100,
    healAmount: 15 // Amount restored by healing items
  },
  
  // Camera configuration
  CAMERA: {
    followLerp: 0.1, // Camera follow smoothness
    zoom: 1.0,
    boundaryBuffer: 100 // Pixel buffer before camera stops following
  },
  
  // Relationship system configuration
  RELATIONSHIP: {
    TIER_THRESHOLDS: {
      strained: 30,
      growing: 60,
      strong: 85,
      unbreakable: 100
    },
    COMBAT_BONUSES: {
      strained: { damageBoost: 0, healChance: 0, syncAttack: false },
      growing: { damageBoost: 0, healChance: 0.05, syncAttack: false },
      strong: { damageBoost: 0.15, healChance: 0.1, syncAttack: true },
      unbreakable: { damageBoost: 0.3, healChance: 0.2, syncAttack: true }
    },
    // Relationship impact values for choices
    CHOICE_IMPACT: {
      positive: { min: 3, max: 12 },
      slightlyPositive: { min: 1, max: 4 },
      neutral: { min: -1, max: 1 },
      negative: { min: -5, max: -2 },
      veryNegative: { min: -8, max: -4 }
    },
    MAX_SCORE: 100,
    MIN_SCORE: 0
  },
  
  // Date mini-game configuration
  MINIGAMES: {
    COOKING: {
      ingredientCount: 3,
      baseTimer: 10.0, // seconds
      successThreshold: 0.5, // seconds
      relationshipBonus: 5,
      failPenalty: -2
    },
    STARGAZING: {
      connectionThreshold: 0.3, // seconds
      maxAttempts: 3,
      relationshipBonus: 8,
      failPenalty: -3
    },
    MUSIC: {
      noteCount: 4,
      sequenceLength: 8,
      reactionTime: 0.8, // seconds to press before note passes
      relationshipBonus: 10,
      failPenalty: -4
    },
    PUZZLE: {
      gridSize: { width: 3, height: 3 },
      scrambleMoves: 15,
      timeLimit: 60, // seconds
      relationshipBonus: 12,
      failPenalty: -5
    }
  },
  
  // Audio configuration
  AUDIO: {
    volume: {
      music: 0.5,
      effects: 0.7,
      dialogue: 0.8
    },
    fadeDuration: 1000, // milliseconds
    activeMusic: null
  },
  
  // Particle configuration
  PARTICLES: {
    MAX_COUNT: 100,
    DEFAULT_LIFESPAN: 2000,
    GRAVITY: 100
  },
  
  // Combat configuration
  COMBAT: {
    MONSTER_SPAWN: {
      baseRate: 0.005, // Chance per second
      rateIncrease: 0.001, // Increase per level
      maxDistance: 300 // Maximum spawn distance from player
    },
    PROJECTILE: {
      speed: 300,
      lifespan: 2000 // ms
    }
  },
  
  // Scene transitions
  TRANSITIONS: {
    duration: 800, // ms
    scale: 10
  },
  
  // Global game references
  scenes: {
    boot: 'BootScene',
    title: 'TitleScene',
    world: 'WorldScene',
    combat: 'CombatScene',
    date: 'DateScene',
    miniGame: 'MiniGameScene',
    gameOver: 'GameOverScene',
    win: 'WinScene'
  }
};

/**
 * Get relationship tier from score
 * @param {number} score - Relationship score (0-100)
 * @returns {string} Tier name ('strained', 'growing', 'strong', 'unbreakable')
 */
GAME_CONFIG.getRelationshipTier = function(score) {
  const thresholds = this.RELATIONSHIP.TIER_THRESHOLDS;
  if (score >= thresholds.unbreakable) return 'unbreakable';
  if (score >= thresholds.strong) return 'strong';
  if (score >= thresholds.growing) return 'growing';
  return 'strained';
};

/**
 * Get combat bonuses for a given relationship tier
 * @param {string} tier - Relationship tier
 * @returns {Object} Combat bonus values
 */
GAME_CONFIG.getCombatBonuses = function(tier) {
  if (!tier) {
    console.warn('Invalid tier passed to getCombatBonuses:', tier);
    tier = 'strained';
  }
  
  return this.RELATIONSHIP.COMBAT_BONUSES[tier] || 
         this.RELATIONSHIP.COMBAT_BONUSES.strained;
};

/**
 * Generate random relationship impact within range
 * @param {string} type - 'positive', 'slightlyPositive', 'neutral', 'negative', 'veryNegative'
 * @returns {number} Random impact value
 */
GAME_CONFIG.getRandomRelationshipImpact = function(type) {
  const range = this.RELATIONSHIP.CHOICE_IMPACT[type];
  if (!range) {
    console.warn(`Invalid relationship impact type: ${type}`);
    return 0;
  }
  
  // Use Math.floor for whole numbers, add 0.5 for possible floating point values
  return Math.floor(Math.random() * (range.max - range.min + 1)) + range.min;
};

/**
 * Clamp a value between min and max
 * @param {number} value
 * @param {number} min
 * @param {number} max
 * @returns {number} Clamped value
 */
GAME_CONFIG.clamp = function(value, min, max) {
  return Math.min(Math.max(value, min), max);
};

/**
 * Set active music track
 * @param {string} trackKey
 */
GAME_CONFIG.setActiveMusic = function(trackKey) {
  this.AUDIO.activeMusic = trackKey;
};

/**
 * Get active music track
 * @returns {string|null}
 */
GAME_CONFIG.getActiveMusic = function() {
  return this.AUDIO.activeMusic;
};

/**
 * Check if a position is within world bounds
 * @param {number} x
 * @param {number} y
 * @returns {boolean}
 */
GAME_CONFIG.isWithinBounds = function(x, y) {
  const bounds = this.WORLD_BOUNDS;
  return x >= bounds.minX && x <= bounds.maxX && 
         y >= bounds.minY && y <= bounds.maxY;
};

/**
 * Convert timer value to display format (MM:SS)
 * @param {number} seconds
 * @returns {string}
 */
GAME_CONFIG.formatTime = function(seconds) {
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
};
