/**
 * stateManager.js
 * Manages persistent game state with extensive progression systems
 */

class StateManager {
  constructor() {
    this.storagePrefix = GAME_CONFIG.STORAGE_PREFIX;
    this.gameTime = 0; // Track total gameplay time in seconds
    this.initialized = false;
    this.saveTimeout = null;
    
    // Initialize stats tracking
    this.stats = {
      totalPlayTime: 0,
      enemiesDefeated: 0,
      datesCompleted: 0,
      levelsCompleted: 0,
      deaths: 0,
      healingUses: 0,
      relationshipsChanged: 0,
      currencyEarned: { love: 0, courage: 0, trust: 0 },
      challengesCompleted: 0,
      achievementsUnlocked: 0,
      itemsCollected: 0,
      combos: 0,
      maxCombo: 0,
      bestTime: {}
    };
    
    // Daily challenge tracking
    this.dailyChallenge = {
      id: null,
      progress: 0,
      completed: false,
      lastReset: 0
    };
    
    // Game modes
    this.unlockedModes = new Set(['main']);
    this.currentMode = 'main';
    
    // New Game+
    this.newGamePlus = {
      active: false,
      cycle: 0,
      modifiers: {}
    };
    
    // Relationship memory system
    this.relationshipMemories = [];
    this.memoryAffinity = {}; // How much Eric values different choice types
    
    // Shop system
    this.shopItems = new Map();
    
    // Load state
    this.loadState();
    
    // Set up auto-save every 30 seconds
    setInterval(() => {
      this.saveState();
    }, 30000);
    
    // Daily challenge reset check
    setInterval(() => {
      this.checkDailyChallengeReset();
    }, 3600000); // Every hour
    
    this.initialized = true;
  }

  /**
   * Safe get from localStorage
   * @param {string} key
   * @returns {string|null}
   */
  safeGetItem(key) {
    try {
      return localStorage.getItem(key);
    } catch (e) {
      console.warn('Could not read from localStorage:', e);
      return null;
    }
  }

  /**
   * Safe set to localStorage
   * @param {string} key
   * @param {string} value
   * @returns {boolean}
   */
  safeSetItem(key, value) {
    try {
      localStorage.setItem(key, value);
      return true;
    } catch (e) {
      console.warn('Could not write to localStorage:', e);
      return false;
    }
  }

  /**
   * Check if daily challenge should reset
   */
  checkDailyChallengeReset() {
    const now = Date.now();
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    // If we've passed the reset time
    if (this.dailyChallenge.lastReset < today.getTime()) {
      this.resetDailyChallenge();
    }
  }

  /**
   * Reset daily challenge
   */
  resetDailyChallenge() {
    this.dailyChallenge = {
      id: null,
      progress: 0,
      completed: false,
      lastReset: new Date().setHours(0, 0, 0, 0)
    };
    
    // Generate new challenge
    const challenge = GAME_CONFIG.getActiveDailyChallenge();
    if (challenge) {
      this.dailyChallenge.id = challenge.id;
    }
  }

  /**
   * Load game state from localStorage
   */
  loadState() {
    try {
      const savedState = this.safeGetItem(this.storagePrefix + 'gameState');
      if (savedState) {
        const state = JSON.parse(savedState);
        this.restoreState(state);
        
        // Check daily challenge
        this.checkDailyChallengeReset();
      } else {
        this.resetState();
      }
    } catch (e) {
      console.error('Error loading game state:', e);
      this.resetState();
    }
  }

  /**
   * Reset to initial game state
   */
  resetState() {
    // Core game state
    this.currentLevel = 1;
    this.health = GAME_CONFIG.PLAYER.baseHealth;
    this.maxHealth = GAME_CONFIG.PLAYER.baseHealth;
    this.score = 0;
    this.gameTime = 0;
    
    // Relationship system
    this.relationshipScore = 50;  // Starting at neutral
    this.unlockedMilestones = new Set();
    this.combatBonuses = this.calculateCombatBonuses();
    
    // Progression tracking
    this.completedDates = new Set();
    this.defeatedBosses = new Set();
    this.completedLevels = new Set();
    this.completedChallenges = new Set();
    this.completedMiniGames = new Set();
    
    // Game modes
    this.unlockedModes = new Set(['main']);
    this.currentMode = 'main';
    
    // New Game+
    this.newGamePlus = {
      active: false,
      cycle: 0,
      modifiers: {}
    };
    
    // Inventory
    this.inventory = new Map();
    this.inventory.set("hearts", 3); // Starting with 3 healing items
    this.inventory.set("love_charm", 0);
    this.inventory.set("courage_talisman", 0);
    this.inventory.set("trust_crystal", 0);
    
    // Currency
    this.currency = {
      love: 0,
      courage: 0,
      trust: 0
    };
    
    // Game settings
    this.settings = {
      musicVolume: GAME_CONFIG.AUDIO.volume.music,
      effectsVolume: GAME_CONFIG.AUDIO.volume.effects,
      dialogueVolume: GAME_CONFIG.AUDIO.volume.dialogue,
      colorblindMode: false,
      inputAssist: false,
      subtitles: true,
      brightness: 1.0,
      fastDialogue: false,
      showTutorial: true
    };
    
    // Tutorial progress
    this.tutorial = {
      combat: false,
      relationship: false,
      dates: false,
      shop: false,
      modes: false
    };
    
    // Achievements
    this.achievements = new Set();
    
    // Game flags
    this.gameFlags = new Set();
    
    // Challenge system
    this.completedChallenges = new Set();
    this.activeChallenges = new Set();
    
    // Daily challenge
    this.dailyChallenge = {
      id: null,
      progress: 0,
      completed: false,
      lastReset: new Date().setHours(0, 0, 0, 0)
    };
    
    // Stats tracking
    this.stats = {
      totalPlayTime: 0,
      enemiesDefeated: 0,
      datesCompleted: 0,
      levelsCompleted: 0,
      deaths: 0,
      healingUses: 0,
      relationshipsChanged: 0,
      currencyEarned: { love: 0, courage: 0, trust: 0 },
      challengesCompleted: 0,
      achievementsUnlocked: 0,
      itemsCollected: 0,
      combos: 0,
      maxCombo: 0,
      bestTime: {}
    };
    
    // Relationship memory system
    this.relationshipMemories = [];
    this.memoryAffinity = {
      words: 1.0,
      touch: 1.0,
      gifts: 1.0,
      acts: 1.0,
      time: 1.0
    };
    
    // Shop system
    this.shopItems = new Map();
    this.initializeShop();
    
    // Leaderboards
    this.leaderboards = {
      highScore: [],
      fastestCompletion: [],
      longestSurvival: []
    };
    
    // New content indicators
    this.newContent = {
      modes: new Set(),
      characters: new Set(),
      abilities: new Set(),
      areas: new Set()
    };
    
    // Call save to persist immediately
    this.saveState();
  }

  /**
   * Initialize shop items
   */
  initializeShop() {
    // Base items
    this.shopItems.set('heart_upgrade', {
      name: 'Heart Upgrade',
      description: 'Increases max health by 5',
      type: 'upgrade',
      price: { love: 100 },
      effects: { maxHealth: 5 },
      unlocked: true
    });
    
    this.shopItems.set('speed_boost', {
      name: 'Speed Charm',
      description: 'Increases movement speed by 10%',
      type: 'upgrade',
      price: { love: 150, courage: 100 },
      effects: { moveSpeed: 0.1 },
      unlocked: false
    });
    
    this.shopItems.set('double_jump', {
      name: 'Levitation Pendant',
      description: 'Unlocks ability to double jump',
      type: 'ability',
      price: { trust: 200, courage: 150 },
      effects: { doubleJump: true },
      unlocked: false
    });
    
    this.shopItems.set('sync_attack', {
      name: 'Harmony Crystal',
      description: 'Unlocks sync attack with Eric',
      type: 'ability',
      price: { love: 300, trust: 250 },
      effects: { syncAttack: true },
      unlocked: false
    });
    
    this.shopItems.set('relationship_pulse', {
      name: 'Connection Pulse',
      description: 'Eric occasionally emits a pulse that boosts your relationship',
      type: 'ability',
      price: { love: 400, trust: 300 },
      effects: { relationshipPulse: true },
      unlocked: false
    });
    
    this.shopItems.set('ultimate_combo', {
      name: 'Combo Mastery',
      description: 'Increases combo damage bonus and duration',
      type: 'upgrade',
      price: { love: 500, courage: 400, trust: 300 },
      effects: { ultimateCombo: true },
      unlocked: false
    });
    
    this.shopItems.set('love_sauce', {
      name: 'Love Potion',
      description: 'Temporarily doubles relationship gains for 5 minutes',
      type: 'consumable',
      price: { love: 50 },
      effects: { loveBooster: 2, duration: 300 },
      unlocked: true,
      maxOwned: 5
    });
  }

  /**
   * Restore state from saved data
   * @param {Object} state - Saved state object
   */
  restoreState(state) {
    // Core game state
    this.currentLevel = this.validateNumber(state.currentLevel, 1, 1, 15);
    this.health = this.validateNumber(state.health, GAME_CONFIG.PLAYER.baseHealth, 0, state.maxHealth || GAME_CONFIG.PLAYER.maxHealth);
    this.maxHealth = this.validateNumber(state.maxHealth, GAME_CONFIG.PLAYER.baseHealth, GAME_CONFIG.PLAYER.baseHealth, 200);
    this.score = this.validateNumber(state.score, 0, 0, Infinity);
    this.gameTime = this.validateNumber(state.gameTime, 0, 0, Infinity);
    
    // Relationship system
    this.relationshipScore = Math.min(Math.max(
      this.validateNumber(state.relationshipScore, 50, 0, 100), 
      GAME_CONFIG.RELATIONSHIP.MIN_SCORE
    ), GAME_CONFIG.RELATIONSHIP.MAX_SCORE);
    this.unlockedMilestones = new Set(state.unlockedMilestones || []);
    this.combatBonuses = this.calculateCombatBonuses();
    
    // Progression tracking
    this.completedDates = new Set(state.completedDates || []);
    this.defeatedBosses = new Set(state.defeatedBosses || []);
    this.completedLevels = new Set(state.completedLevels || []);
    this.completedChallenges = new Set(state.completedChallenges || []);
    this.completedMiniGames = new Set(state.completedMiniGames || []);
    
    // Game modes
    this.unlockedModes = new Set(state.unlockedModes || ['main']);
    this.currentMode = state.currentMode || 'main';
    
    // New Game+
    this.newGamePlus = {
      active: Boolean(state.newGamePlus?.active),
      cycle: this.validateNumber(state.newGamePlus?.cycle, 0, 0, 10),
      modifiers: state.newGamePlus?.modifiers || {}
    };
    
    // Validate and restore inventory
    const savedInventory = state.inventory || { "hearts": 3 };
    this.inventory = new Map();
    for (const [item, count] of Object.entries(savedInventory)) {
      if (typeof item === 'string' && typeof count === 'number' && count >= 0) {
        this.inventory.set(item, count);
      }
    }
    
    // Currency
    this.currency = {
      love: this.validateNumber(state.currency?.love, 0, 0, 10000),
      courage: this.validateNumber(state.currency?.courage, 0, 0, 10000),
      trust: this.validateNumber(state.currency?.trust, 0, 0, 10000)
    };
    
    // Game settings
    this.settings = {
      musicVolume: this.validateNumber(
        state.settings?.musicVolume, 
        GAME_CONFIG.AUDIO.volume.music, 
        0, 1
      ),
      effectsVolume: this.validateNumber(
        state.settings?.effectsVolume, 
        GAME_CONFIG.AUDIO.volume.effects, 
        0, 1
      ),
      dialogueVolume: this.validateNumber(
        state.settings?.dialogueVolume, 
        GAME_CONFIG.AUDIO.volume.dialogue, 
        0, 1
      ),
      colorblindMode: Boolean(state.settings?.colorblindMode),
      inputAssist: Boolean(state.settings?.inputAssist),
      subtitles: Boolean(state.settings?.subtitles),
      brightness: this.validateNumber(state.settings?.brightness, 1.0, 0.5, 1.5),
      fastDialogue: Boolean(state.settings?.fastDialogue),
      showTutorial: true // Always show tutorial initially
    };
    
    // Tutorial progress
    this.tutorial = {
      combat: Boolean(state.tutorial?.combat),
      relationship: Boolean(state.tutorial?.relationship),
      dates: Boolean(state.tutorial?.dates),
      shop: Boolean(state.tutorial?.shop),
      modes: Boolean(state.tutorial?.modes)
    };
    
    // Achievements
    this.achievements = new Set(state.achievements || []);
    
    // Game flags
    this.gameFlags = new Set(state.gameFlags || []);
    
    // Active challenges
    this.activeChallenges = new Set(state.activeChallenges || []);
    
    // Daily challenge
    this.dailyChallenge = {
      id: state.dailyChallenge?.id || null,
      progress: this.validateNumber(state.dailyChallenge?.progress, 0, 0, 1000),
      completed: Boolean(state.dailyChallenge?.completed),
      lastReset: this.validateNumber(state.dailyChallenge?.lastReset, Date.now(), 0, Infinity)
    };
    
    // Stats tracking
    this.stats = {
      totalPlayTime: this.validateNumber(state.stats?.totalPlayTime, 0, 0, Infinity),
      enemiesDefeated: this.validateNumber(state.stats?.enemiesDefeated, 0, 0, 100000),
      datesCompleted: this.validateNumber(state.stats?.datesCompleted, 0, 0, 100),
      levelsCompleted: this.validateNumber(state.stats?.levelsCompleted, 0, 0, 100),
      deaths: this.validateNumber(state.stats?.deaths, 0, 0, 10000),
      healingUses: this.validateNumber(state.stats?.healingUses, 0, 0, 10000),
      relationshipsChanged: this.validateNumber(state.stats?.relationshipsChanged, 0, 0, 100000),
      currencyEarned: {
        love: this.validateNumber(state.stats?.currencyEarned?.love, 0, 0, 100000),
        courage: this.validateNumber(state.stats?.currencyEarned?.courage, 0, 0, 100000),
        trust: this.validateNumber(state.stats?.currencyEarned?.trust, 0, 0, 100000)
      },
      challengesCompleted: this.validateNumber(state.stats?.challengesCompleted, 0, 0, 1000),
      achievementsUnlocked: this.validateNumber(state.stats?.achievementsUnlocked, 0, 0, 100),
      itemsCollected: this.validateNumber(state.stats?.itemsCollected, 0, 0, 10000),
      combos: this.validateNumber(state.stats?.combos, 0, 0, 100000),
      maxCombo: this.validateNumber(state.stats?.maxCombo, 0, 0, 1000),
      bestTime: state.stats?.bestTime || {}
    };
    
    // Relationship memory system
    this.relationshipMemories = Array.isArray(state.relationshipMemories) ? state.relationshipMemories : [];
    this.memoryAffinity = {
      words: this.validateNumber(state.memoryAffinity?.words, 1.0, 0.5, 2.0),
      touch: this.validateNumber(state.memoryAffinity?.touch, 1.0, 0.5, 2.0),
      gifts: this.validateNumber(state.memoryAffinity?.gifts, 1.0, 0.5, 2.0),
      acts: this.validateNumber(state.memoryAffinity?.acts, 1.0, 0.5, 2.0),
      time: this.validateNumber(state.memoryAffinity?.time, 1.0, 0.5, 2.0)
    };
    
    // Shop items
    this.shopItems = new Map(state.shopItems ? Object.entries(state.shopItems) : []);
    if (this.shopItems.size === 0) {
      this.initializeShop();
    }
    
    // Leaderboards
    this.leaderboards = {
      highScore: Array.isArray(state.leaderboards?.highScore) ? state.leaderboards.highScore.slice(0, 10) : [],
      fastestCompletion: Array.isArray(state.leaderboards?.fastestCompletion) ? state.leaderboards.fastestCompletion : [],
      longestSurvival: Array.isArray(state.leaderboards?.longestSurvival) ? state.leaderboards.longestSurvival : []
    };
    
    // New content indicators
    this.newContent = {
      modes: new Set(state.newContent?.modes || []),
      characters: new Set(state.newContent?.characters || []),
      abilities: new Set(state.newContent?.abilities || []),
      areas: new Set(state.newContent?.areas || [])
    };
    
    // Check for new content since last play
    this.checkForNewContent();
  }

  /**
   * Validate a number value with bounds
   * @param {any} value - The value to validate
   * @param {number} fallback - Value to use if validation fails
   * @param {number} min - Minimum allowed value
   * @param {number} max - Maximum allowed value
   * @returns {number}
   */
  validateNumber(value, fallback, min, max) {
    const num = Number(value);
    if (isNaN(num) || !isFinite(num)) {
      return fallback;
    }
    return Math.min(Math.max(num, min), max);
  }

  /**
   * Check for new content since last play
   */
  checkForNewContent() {
    // Check for new game modes
    const allModes = Object.keys(GAME_CONFIG.MODES);
    allModes.forEach(modeId => {
      if (modeId !== 'main' && !this.unlockedModes.has(modeId)) {
        // Check if unlocked now by achievements
        const mode = GAME_CONFIG.MODES[modeId];
        if (!mode.unlocks || mode.unlocks.length === 0) {
          this.newContent.modes.add(modeId);
        } else {
          const allUnlocked = mode.unlocks.every(req => 
            this.achievements.has(req) || this.unlockedModes.has(req)
          );
          if (allUnlocked) {
            this.newContent.modes.add(modeId);
          }
        }
      }
    });
    
    // Check for new abilities that can be purchased
    for (const [itemId, item] of this.shopItems) {
      if (item.type === 'ability' && !item.unlocked && this.canAfford(itemId)) {
        this.newContent.abilities.add(itemId);
      }
    }
    
    // Check for new areas that can be accessed
    // This would be determined by game events
  }

  /**
   * Schedule a state save (debounced)
   */
  scheduleSave() {
    // Clear previous timeout
    if (this.saveTimeout) {
      clearTimeout(this.saveTimeout);
    }
    
    // Set new timeout
    this.saveTimeout = setTimeout(() => {
      this.saveState();
    }, 1000); // Save after 1 second of inactivity
  }

  /**
   * Save current state to localStorage
   */
  saveState() {
    if (!this.initialized) return;
    
    try {
      const state = {
        currentLevel: this.currentLevel,
        health: this.health,
        maxHealth: this.maxHealth,
        score: this.score,
        gameTime: this.gameTime,
        relationshipScore: this.relationshipScore,
        unlockedMilestones: Array.from(this.unlockedMilestones),
        completedDates: Array.from(this.completedDates),
        defeatedBosses: Array.from(this.defeatedBosses),
        completedLevels: Array.from(this.completedLevels),
        completedChallenges: Array.from(this.completedChallenges),
        completedMiniGames: Array.from(this.completedMiniGames),
        unlockedModes: Array.from(this.unlockedModes),
        currentMode: this.currentMode,
        newGamePlus: this.newGamePlus,
        inventory: Object.fromEntries(this.inventory),
        currency: this.currency,
        settings: this.settings,
        tutorial: this.tutorial,
        achievements: Array.from(this.achievements),
        gameFlags: Array.from(this.gameFlags),
        activeChallenges: Array.from(this.activeChallenges),
        dailyChallenge: this.dailyChallenge,
        stats: this.stats,
        relationshipMemories: this.relationshipMemories,
        memoryAffinity: this.memoryAffinity,
        shopItems: Object.fromEntries(this.shopItems),
        leaderboards: this.leaderboards,
        newContent: {
          modes: Array.from(this.newContent.modes),
          characters: Array.from(this.newContent.characters),
          abilities: Array.from(this.newContent.abilities),
          areas: Array.from(this.newContent.areas)
        }
      };
      
      const json = JSON.stringify(state);
      const success = this.safeSetItem(this.storagePrefix + 'gameState', json);
      
      if (success) {
        console.log('Game state saved successfully');
      }
    } catch (e) {
      console.error('Error saving game state:', e);
    }
  }

  /**
   * Update relationship score and recalculate bonuses
   * @param {number} change - Amount to change relationship score by
   * @param {boolean} immediate - Whether to save immediately
   * @param {string} choiceType - Type of choice made (for memory system)
   */
  updateRelationship(change, immediate = false, choiceType = null) {
    const oldScore = this.relationshipScore;
    this.relationshipScore = GAME_CONFIG.clamp(
      this.relationshipScore + change, 
      GAME_CONFIG.RELATIONSHIP.MIN_SCORE, 
      GAME_CONFIG.RELATIONSHIP.MAX_SCORE
    );
    this.combatBonuses = this.calculateCombatBonuses();
    
    // Track statistics
    this.stats.relationshipsChanged += Math.abs(change);
    
    // Update memory affinity based on choice type
    if (choiceType && this.memoryAffinity[choiceType]) {
      // Reduce all affinities slightly
      Object.keys(this.memoryAffinity).forEach(key => {
        this.memoryAffinity[key] *= 0.98;
      });
      
      // Increase affinity for this choice type
      this.memoryAffinity[choiceType] *= 1.2;
      
      // Ensure no affinity gets too low
      Object.keys(this.memoryAffinity).forEach(key => {
        this.memoryAffinity[key] = Math.max(this.memoryAffinity[key], 0.5);
      });
    }
    
    // Check for achievements related to relationship
    if (oldScore < 100 && this.relationshipScore >= 100 && !this.achievements.has('unbreakable_heart')) {
      this.unlockAchievement('unbreakable_heart');
    }
    
    // Check for tier changes
    const oldTier = GAME_CONFIG.getRelationshipTier(oldScore);
    const newTier = GAME_CONFIG.getRelationshipTier(this.relationshipScore);
    
    if (oldTier !== newTier) {
      this.handleTierChange(oldTier, newTier);
    }
    
    // Schedule save (unless immediate)
    if (immediate) {
      this.saveState();
    } else {
      this.scheduleSave();
    }
    
    return this.relationshipScore;
  }

  /**
   * Calculate combat bonuses based on current relationship score
   * @returns {Object} Combat bonus values
   */
  calculateCombatBonuses() {
    const tier = GAME_CONFIG.getRelationshipTier(this.relationshipScore);
    const baseBonuses = GAME_CONFIG.getCombatBonuses(tier);
    
    // Apply New Game+ modifiers
    if (this.newGamePlus.active && this.newGamePlus.modifiers.relationship) {
      return {
        damageBoost: baseBonuses.damageBoost * this.newGamePlus.modifiers.relationship.damage,
        healChance: baseBonuses.healChance * this.newGamePlus.modifiers.relationship.heal,
        syncAttack: baseBonuses.syncAttack || this.newGamePlus.modifiers.relationship.syncAttack
      };
    }
    
    return baseBonuses;
  }

  /**
   * Handle relationship tier change
   * @param {string} oldTier
   * @param {string} newTier
   */
  handleTierChange(oldTier, newTier) {
    console.log(`** Relationship tier changed ** from ${oldTier} to ${newTier}`);
    
    // Add milestone unlocks based on tier
    if (newTier === 'growing' && !this.unlockedMilestones.has('first_date')) {
      this.unlockedMilestones.add('first_date');
      this.inventory.set("hearts", (this.inventory.get("hearts") || 0) + 1);
      this.unlockAchievement('first_steps');
    }
    
    if (newTier === 'strong' && !this.unlockedMilestones.has('sync_attack')) {
      this.unlockedMilestones.add('sync_attack');
      this.unlockAchievement('growing_together');
    }
    
    if (newTier === 'unbreakable' && !this.unlockedMilestones.has('true_partner')) {
      this.unlockedMilestones.add('true_partner');
      this.maxHealth = 150;
      this.health = this.maxHealth;
      this.unlockAchievement('eternal_bond');
      
      // Unlock secret mode
      this.unlockGameMode('secret');
    }
    
    // Track milestones as achievements
    if (this.unlockedMilestones.has('first_date') && !this.achievements.has('first_date_milestone')) {
      this.unlockAchievement('first_date_milestone');
    }
    
    if (this.unlockedMilestones.has('sync_attack') && !this.achievements.has('sync_attack_milestone')) {
      this.unlockAchievement('sync_attack_milestone');
    }
    
    if (this.unlockedMilestones.has('true_partner') && !this.achievements.has('true_partner_milestone')) {
      this.unlockAchievement('true_partner_milestone');
    }
  }

  /**
   * Unlock an achievement
   * @param {string} achievementId
   * @param {boolean} silent - Don't show notification if true
   */
  unlockAchievement(achievementId, silent = false) {
    if (this.achievements.has(achievementId)) return false;
    
    this.achievements.add(achievementId);
    this.stats.achievementsUnlocked++;
    
    // Update score based on achievement
    const achievementData = this.getAchievementData(achievementId);
    if (achievementData) {
      this.score += achievementData.points || 25;
    }
    
    // Trigger mode unlock if applicable
    const modeUnlock = this.getModeUnlock(achievementId);
    if (modeUnlock) {
      this.unlockGameMode(modeUnlock);
    }
    
    // Notify UI
    if (!silent && this.scene) {
      this.scene.events.emit('achievementUnlocked', achievementId);
    }
    
    this.scheduleSave();
    return true;
  }

  /**
   * Get achievement data
   * @param {string} id
   * @returns {Object|null}
   */
  getAchievementData(id) {
    const achievements = {
      'first_steps': { name: 'First Steps', description: 'Reached a growing relationship', points: 100 },
      'growing_together': { name: 'Growing Together', description: 'Reached a strong relationship', points: 150 },
      'eternal_bond': { name: 'Eternal Bond', description: 'Achieved unbreakable relationship', points: 300 },
      'first_date_milestone': { name: 'First Date', description: 'Completed your first date', points: 50 },
      'sync_attack_milestone': { name: 'Sync Attack', description: 'Unlocked sync attack ability', points: 75 },
      'true_partner_milestone': { name: 'True Partner', description: 'Maxed out health with Eric\'s help', points: 100 },
      'unbreakable_heart': { name: 'Unbreakable Heart', description: 'Reached maximum relationship level', points: 500 },
      '100enemies': { name: 'Monster Slayer', description: 'Defeated 100 enemies together', points: 200 },
      'relationship_expert': { name: 'Relationship Expert', description: 'Completed all dates', points: 250 },
      'arena_veteran': { name: 'Arena Veteran', description: 'Survived 10 waves in Endless Arena', points: 150 },
      'speed_demon': { name: 'Speed Demon', description: 'Completed a level in under 1 minute', points: 100 },
      'completionist': { name: 'Completionist', description: '100% story completion', points: 1000 }
    };
    
    return achievements[id] || null;
  }

  /**
   * Get mode unlock from achievement
   * @param {string} achievementId
   * @returns {string|null}
   */
  getModeUnlock(achievementId) {
    const unlocks = {
      'eternal_bond': 'secret',
      'arena_veteran': 'endless',
      'speed_demon': 'trial',
      'relationship_expert': 'recall'
    };
    
    return unlocks[achievementId] || null;
  }

  /**
   * Heal the player, respecting max health
   * @param {number} amount - Amount to heal
   * @returns {number} Actual amount healed
   */
  heal(amount) {
    const oldHealth = this.health;
    this.health = Math.min(this.health + amount, this.maxHealth);
    const actualHealed = this.health - oldHealth;
    
    if (actualHealed > 0) {
      this.stats.healingUses++;
      this.scheduleSave();
    }
    
    return actualHealed;
  }

  /**
   * Take damage, applying any relevant modifiers
   * @param {number} amount - Amount of damage
   * @returns {number} Actual damage taken
   */
  takeDamage(amount) {
    const oldHealth = this.health;
    this.health = Math.max(this.health - amount, 0);
    const damageTaken = oldHealth - this.health;
    
    if (damageTaken > 0) {
      this.stats.totalDamageTaken += damageTaken;
    }
    
    this.scheduleSave();
    return damageTaken;
  }

  /**
   * Check if the player has a specific milestone unlocked
   * @param {string} milestone - Milestone name
   * @returns {boolean}
   */
  hasMilestone(milestone) {
    return this.unlockedMilestones.has(milestone);
  }

  /**
   * Use a healing item
   * @returns {boolean} True if item was used
   */
  useHealingItem() {
    const heartCount = this.inventory.get("hearts") || 0;
    if (heartCount > 0 && this.health < this.maxHealth) {
      this.inventory.set("hearts", heartCount - 1);
      const healed = this.heal(GAME_CONFIG.PLAYER.healAmount);
      
      // Track consumption
      if (healed > 0) {
        this.stats.healingUses++;
      }
      
      this.scheduleSave();
      return true;
    }
    return false;
  }

  /**
   * Add an item to inventory
   * @param {string} item
   * @param {number} count
   * @returns {boolean}
   */
  addItem(item, count = 1) {
    if (count <= 0) return false;
    
    const current = this.inventory.get(item) || 0;
    
    // Check if we're exceeding max owned
    const shopItem = this.shopItems.get(item);
    if (shopItem?.maxOwned && current + count > shopItem.maxOwned) {
      return false;
    }
    
    this.inventory.set(item, current + count);
    this.stats.itemsCollected += count;
    this.scheduleSave();
    return true;
  }

  /**
   * Remove an item from inventory
   * @param {string} item
   * @param {number} count
   * @returns {boolean}
   */
  removeItem(item, count = 1) {
    const current = this.inventory.get(item) || 0;
    if (current < count) return false;
    
    if (current === count) {
      this.inventory.delete(item);
    } else {
      this.inventory.set(item, current - count);
    }
    
    this.scheduleSave();
    return true;
  }

  /**
   * Get count of a specific item
   * @param {string} item
   * @returns {number}
   */
  getItemCount(item) {
    return this.inventory.get(item) || 0;
  }

  /**
   * Check if a date has been completed
   * @param {string} dateId
   * @returns {boolean}
   */
  hasCompletedDate(dateId) {
    return this.completedDates.has(dateId);
  }

  /**
   * Mark a date as completed
   * @param {string} dateId
   */
  completeDate(dateId) {
    this.completedDates.add(dateId);
    this.stats.datesCompleted++;
    
    // Award achievement if all dates completed
    if (this.completedDates.size >= 4 && !this.achievements.has('relationship_expert')) {
      this.unlockAchievement('relationship_expert');
    }
    
    this.scheduleSave();
  }

  /**
   * Check if a boss has been defeated
   * @param {string} bossId
   * @returns {boolean}
   */
  hasDefeatedBoss(bossId) {
    return this.defeatedBosses.has(bossId);
  }

  /**
   * Record boss defeat
   * @param {string} bossId
   */
  defeatBoss(bossId) {
    this.defeatedBosses.add(bossId);
    
    // Award achievement for first boss
    if (this.defeatedBosses.size === 1 && !this.achievements.has('first_boss')) {
      this.unlockAchievement('first_boss');
    }
    
    this.scheduleSave();
  }

  /**
   * Set a game flag
   * @param {string} flag
   */
  setFlag(flag) {
    this.gameFlags.add(flag);
    this.scheduleSave();
    
    // Check for achievements based on flags
    this.checkFlagAchievements(flag);
  }

  /**
   * Check if a game flag is set
   * @param {string} flag
   * @returns {boolean}
   */
  hasFlag(flag) {
    return this.gameFlags.has(flag);
  }

  /**
   * Check if the game is in a win state for the current mode
   * @param {string} mode - Game mode
   * @returns {boolean}
   */
  isWinState(mode = this.currentMode) {
    switch(mode) {
      case 'main':
        // Win main story when all bosses defeated and relationship strong
        const allBossesDefeated = GAME_CONFIG.PROGRESSION.BOSS_LEVELS.length === this.defeatedBosses.size;
        return allBossesDefeated && this.relationshipScore >= 70;
        
      case 'endless':
        // No win state for endless - player wins by surviving
        return false;
        
      case 'trial':
        // Win by completing level under time limit
        return this.hasFlag('level_completed_on_time');
        
      case 'recall':
      case 'secret':
        // Story-based modes - win when completed
        return this.hasFlag(`${mode}_completed`);
        
      default:
        // Default win condition
        return this.defeatedBosses.size > 0 && this.relationshipScore >= 60;
    }
  }

  /**
   * Check if the game is in a loss state
   * @returns {string|null} Loss reason or null if not in loss state
   */
  isLossState() {
    // No special loss state in certain modes
    if (this.currentMode === 'endless') {
      // Loss only if health drops to zero
      if (this.health <= 0) {
        return 'combat';
      }
      return null;
    }
    
    // Standard loss conditions
    if (this.health <= 0) {
      return 'combat';
    }
    
    if (this.relationshipScore < 10) {
      return 'relationship';
    }
    
    return null;
  }

  /**
   * Clear saved game state
   */
  clearSave() {
    try {
      // Only remove keys with our prefix
      Object.keys(localStorage).forEach(key => {
        if (key.startsWith(this.storagePrefix)) {
          localStorage.removeItem(key);
        }
      });
      
      // Reset state
      this.resetState();
    } catch (e) {
      console.error('Error clearing save data:', e);
    }
  }

  /**
   * Get formatted playtime
   * @returns {string}
   */
  getFormattedPlaytime() {
    return GAME_CONFIG.formatTime(this.gameTime);
  }

  /**
   * Update gameplay time
   * @param {number} delta - Time delta in seconds
   */
  updateGameTime(delta) {
    this.gameTime += delta;
    this.stats.totalPlayTime += delta;
    
    // Save every 5 minutes of gameplay
    if (Math.floor(this.gameTime / 300) > Math.floor((this.gameTime - delta) / 300)) {
      this.saveState();
    }
  }

  /**
   * Complete a challenge
   * @param {string} challengeId
   */
  completeChallenge(challengeId) {
    if (this.completedChallenges.has(challengeId)) return;
    
    this.completedChallenges.add(challengeId);
    this.stats.challengesCompleted++;
    
    // Get challenge data
    const challenge = this.getChallengeData(challengeId);
    if (challenge) {
      // Award currency
      if (challenge.reward?.currency) {
        this.earnCurrency(challenge.reward.currency);
      }
      
      // Award relationship
      if (challenge.reward?.relationship) {
        this.updateRelationship(challenge.reward.relationship);
      }
      
      // Unlock item
      if (challenge.reward?.unlock) {
        this.unlockItem(challenge.reward.unlock);
      }
    }
    
    // Achievement for completing challenges
    if (this.stats.challengesCompleted >= 5 && !this.achievements.has('challenge_master')) {
      this.unlockAchievement('challenge_master');
    }
    
    // Update daily challenge if applicable
    if (this.dailyChallenge.id === challengeId) {
      this.dailyChallenge.completed = true;
      this.dailyChallenge.progress = 1;
    }
    
    this.scheduleSave();
  }

  /**
   * Get challenge data
   * @param {string} id
   * @returns {Object|null}
   */
  getChallengeData(id) {
    // Check daily challenges
    const daily = GAME_CONFIG.CHALLENGES.DAILY.find(c => c.id === id);
    if (daily) return daily;
    
    // Check global challenges
    const global = GAME_CONFIG.CHALLENGES.GLOBAL.find(c => c.id === id);
    if (global) return global;
    
    return null;
  }

  /**
   * Update daily challenge progress
   * @param {number} amount
   */
  updateDailyChallenge(amount = 1) {
    const challenge = this.getChallengeData(this.dailyChallenge.id);
    if (!challenge) return;
    
    this.dailyChallenge.progress += amount;
    
    // Check if completed
    let threshold = 1;
    if (challenge.id === 'damageless') {
      threshold = 1;
    } else if (challenge.id === 'speedrun') {
      // Different threshold based on level
      threshold = 1;
    } else if (challenge.id === 'combo') {
      threshold = 5;
    } else if (challenge.id === 'explore') {
      threshold = 3;
    }
    
    if (this.dailyChallenge.progress >= threshold && !this.dailyChallenge.completed) {
      this.completeChallenge(this.dailyChallenge.id);
    }
    
    this.scheduleSave();
  }

  /**
   * Unlock an item
   * @param {string} itemId
   */
  unlockItem(itemId) {
    const shop = this.shopItems.get(itemId);
    if (shop) {
      shop.unlocked = true;
      
      // Show notification
      if (this.scene) {
        this.scene.events.emit('itemUnlocked', itemId);
      }
      
      // New content indicator
      if (shop.type === 'ability') {
        this.newContent.abilities.add(itemId);
      }
      
      this.scheduleSave();
    }
  }

  /**
   * Earn currency
   * @param {Object} amounts - { love, courage, trust }
   */
  earnCurrency(amounts) {
    let changed = false;
    
    for (const type of ['love', 'courage', 'trust']) {
      if (amounts[type] > 0) {
        this.currency[type] += amounts[type];
        this.stats.currencyEarned[type] += amounts[type];
        changed = true;
      }
    }
    
    if (changed) {
      this.scheduleSave();
    }
  }

  /**
   * Spend currency
   * @param {Object} amounts - { love, courage, trust }
   * @returns {boolean} Success
   */
  spendCurrency(amounts) {
    // Check if we can afford
    for (const type of ['love', 'courage', 'trust']) {
      if (amounts[type] > this.currency[type]) {
        return false;
      }
    }
    
    // Spend
    for (const type of ['love', 'courage', 'trust']) {
      this.currency[type] -= amounts[type];
    }
    
    this.scheduleSave();
    return true;
  }

  /**
   * Check if we can afford an item
   * @param {string} itemId
   * @returns {boolean}
   */
  canAfford(itemId) {
    const item = this.shopItems.get(itemId);
    if (!item || !item.price) return false;
    
    for (const [currency, amount] of Object.entries(item.price)) {
      if (this.currency[currency] < amount) {
        return false;
      }
    }
    
    return true;
  }

  /**
   * Purchase an item from the shop
   * @param {string} itemId
   * @returns {boolean} Success
   */
  purchaseItem(itemId) {
    const item = this.shopItems.get(itemId);
    if (!item || !item.unlocked || !this.canAfford(itemId)) {
      return false;
    }
    
    // Check if we're at max owned
    if (item.maxOwned && this.getItemCount(itemId) >= item.maxOwned) {
      return false;
    }
    
    // Spend currency
    if (!this.spendCurrency(item.price)) {
      return false;
    }
    
    // Add to inventory
    this.addItem(itemId);
    
    // Apply effects if it's an upgrade
    if (item.type === 'upgrade' && item.effects) {
      this.applyUpgradeEffects(item.effects);
    }
    
    // Achievement for making purchases
    if (!this.achievements.has('shopper') && this.getCumulativeSpending() >= 500) {
      this.unlockAchievement('shopper');
    }
    
    this.scheduleSave();
    return true;
  }

  /**
   * Apply upgrade effects
   * @param {Object} effects
   */
  applyUpgradeEffects(effects) {
    // This would be handled by the scene or player
    // Emit event so other systems can respond
    if (this.scene) {
      this.scene.events.emit('upgradePurchased', effects);
    }
  }

  /**
   * Get cumulative spending
   * @returns {number}
   */
  getCumulativeSpending() {
    let total = 0;
    for (const currency of ['love', 'courage', 'trust']) {
      total += this.currency[currency] / 2; // Assume average value
    }
    return total;
  }

  /**
   * Add relationship memory
   * @param {Object} memory - Memory data
   */
  addMemory(memory) {
    const newMemory = {
      ...memory,
      timestamp: Date.now(),
      level: this.currentLevel
    };
    
    this.relationshipMemories.push(newMemory);
    
    // Limit memory size
    if (this.relationshipMemories.length > 50) {
      this.relationshipMemories.shift();
    }
    
    this.scheduleSave();
  }

  /**
   * Get recent memories of a type
   * @param {string} type
   * @param {number} count
   * @returns {Array}
   */
  getRecentMemories(type, count = 5) {
    return this.relationshipMemories
      .filter(m => m.type === type)
      .sort((a, b) => b.timestamp - a.timestamp)
      .slice(0, count);
  }

  /**
   * Unlock a game mode
   * @param {string} modeId
   */
  unlockGameMode(modeId) {
    if (this.unlockedModes.has(modeId)) return;
    
    this.unlockedModes.add(modeId);
    this.newContent.modes.add(modeId);
    
    // Check for achievements
    if (this.unlockedModes.size >= 4 && !this.achievements.has('mode_master')) {
      this.unlockAchievement('mode_master');
    }
    
    this.scheduleSave();
  }

  /**
   * Start New Game+
   */
  startNewGamePlus() {
    if (this.newGamePlus.cycle >= 3) {
      // Max 3 NG+ cycles
      return false;
    }
    
    this.newGamePlus.active = true;
    this.newGamePlus.cycle++;
    
    // Apply modifiers
    this.newGamePlus.modifiers = {
      enemyHealth: GAME_CONFIG.NEW_GAME_PLUS.enemyHealthMultiplier ** this.newGamePlus.cycle,
      enemyDamage: GAME_CONFIG.NEW_GAME_PLUS.enemyDamageMultiplier ** this.newGamePlus.cycle,
      currency: GAME_CONFIG.NEW_GAME_PLUS.currencyGainMultiplier ** this.newGamePlus.cycle,
      relationship: GAME_CONFIG.NEW_GAME_PLUS.relationshipGainMultiplier ** this.newGamePlus.cycle
    };
    
    // Award special unlocks
    if (this.newGamePlus.cycle === 1) {
      this.unlockItem('secret_unlocks');
    } else if (this.newGamePlus.cycle === 2) {
      this.unlockItem('ultimate_abilities');
    }
    
    // Reset progression but keep some elements
    this.currentLevel = 1;
    this.health = this.maxHealth;
    
    // Don't reset relationship, inventory, or currency
    // But reduce gains
    
    this.scheduleSave();
    return true;
  }

  /**
   * End New Game+
   */
  endNewGamePlus() {
    this.newGamePlus.active = false;
    this.scheduleSave();
  }

  /**
   * Check for achievements based on game flag
   * @param {string} flag
   */
  checkFlagAchievements(flag) {
    // Implementation depends on game events
    if (flag === 'all_achievements' && this.achievements.size >= 10) {
      this.unlockAchievement('completionist');
    }
    
    if (flag === '1000_points' && this.score >= 1000) {
      this.unlockAchievement('high_scorer');
    }
  }

  /**
   * Get progress to next level
   * @returns {number} Percentage (0-100)
   */
  getLevelProgress() {
    const current = this.currentLevel;
    const total = 15;
    return Math.min((current / total) * 100, 100);
  }

  /**
   * Get overall game progress
   * @returns {number} Percentage (0-100)
   */
  getOverallProgress() {
    return GAME_CONFIG.getProgressPercent();
  }

  /**
   * Record enemy defeat
   * @param {number} count
   */
  enemyDefeated(count = 1) {
    this.stats.enemiesDefeated += count;
    
    // Achievement for 100 enemies
    if (this.stats.enemiesDefeated >= 100 && !this.achievements.has('100enemies')) {
      this.unlockAchievement('100enemies');
    }
    
    // Daily challenge
    if (this.dailyChallenge.id === 'damageless') {
      this.updateDailyChallenge();
    }
    
    this.scheduleSave();
  }

  /**
   * Record level completion
   * @param {number} levelNum
   * @param {number} time - Completion time in seconds
   */
  levelCompleted(levelNum, time) {
    this.completedLevels.add(levelNum.toString());
    this.stats.levelsCompleted++;
    
    // Daily challenge
    if (this.dailyChallenge.id === 'speedrun' && time < 120) {
      this.updateDailyChallenge();
    }
    
    // Check for speed run achievement
    if (time < 60 && !this.achievements.has('speed_demon')) {
      this.unlockAchievement('speed_demon');
    }
    
    // Track best time
    const key = `level_${levelNum}`;
    if (!this.stats.bestTime[key] || time < this.stats.bestTime[key]) {
      this.stats.bestTime[key] = time;
      
      // Update leaderboard
      this.updateLeaderboard('fastestCompletion', {
        mode: this.currentMode,
        level: levelNum,
        time: time,
        date: Date.now()
      });
    }
    
    this.scheduleSave();
  }

  /**
   * Update leaderboard
   * @param {string} board - Leaderboard name
   * @param {Object} entry - Entry data
   */
  updateLeaderboard(board, entry) {
    if (!this.leaderboards[board]) return;
    
    this.leaderboards[board].push(entry);
    
    // Sort leaderboard
    this.leaderboards[board].sort((a, b) => {
      if (board === 'highScore') return b.score - a.score;
      if (board === 'fastestCompletion') return a.time - b.time;
      if (board === 'longestSurvival') return b.duration - a.duration;
      return 0;
    });
    
    // Keep top 10
    this.leaderboards[board] = this.leaderboards[board].slice(0, 10);
    
    this.scheduleSave();
  }

  /**
   * Get game mode info
   * @param {string} modeId
   */
  getModeInfo(modeId) {
    const mode = GAME_CONFIG.MODES[modeId];
    if (!mode) return null;
    
    return {
      ...mode,
      unlocked: this.unlockedModes.has(modeId),
      nextUnlock: this.unlockedModes.has(modeId) ? null : mode.unlocks
    };
  }

  /**
   * Get active game mode
   * @returns {Object}
   */
  getActiveMode() {
    return this.getModeInfo(this.currentMode);
  }

  /**
   * Get available game modes
   * @returns {Array}
   */
  getAvailableModes() {
    return Object.keys(GAME_CONFIG.MODES)
      .map(id => this.getModeInfo(id))
      .filter(mode => mode.unlocked);
  }

  /**
   * Get locked game modes
   * @returns {Array}
   */
  getLockedModes() {
    return Object.keys(GAME_CONFIG.MODES)
      .map(id => this.getModeInfo(id))
      .filter(mode => !mode.unlocked && mode.id !== 'main');
  }

  /**
   * Get daily challenge status
   * @returns {Object}
   */
  getDailyChallengeStatus() {
    const challenge = this.getChallengeData(this.dailyChallenge.id);
    if (!challenge) return null;
    
    return {
      ...challenge,
      progress: this.dailyChallenge.progress,
      maxProgress: 1, // Default
      completed: this.dailyChallenge.completed
    };
  }

  /**
   * Get shop inventory
   * @returns {Map}
   */
  getShopItems() {
    return this.shopItems;
  }

  /**
   * Get new content notifications
   * @returns {Object}
   */
  getNewContent() {
    const notifications = {};
    
    for (const [type, items] of Object.entries(this.newContent)) {
      notifications[type] = Array.from(items);
    }
    
    // Clear notifications after reading
    this.newContent = {
      modes: new Set(),
      characters: new Set(),
      abilities: new Set(),
      areas: new Set()
    };
    
    return notifications;
  }

  /**
   * Get relationship sentiment
   * @returns {string} Sentiment level
   */
  getRelationshipSentiment() {
    const score = this.relationshipScore;
    if (score < 30) return 'negative';
    if (score < 60) return 'neutral';
    if (score < 85) return 'positive';
    return 'veryPositive';
  }
}

// Create singleton instance
const stateManager = new StateManager();
window.stateManager = stateManager; // For debugging purposes only

// Export for module systems
if (typeof module !== 'undefined') {
  module.exports = StateManager;
}
