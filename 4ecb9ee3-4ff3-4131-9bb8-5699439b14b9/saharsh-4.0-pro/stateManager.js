/**
 * stateManager.js
 * Manages persistent game state using localStorage with proper namespacing
 */

class StateManager {
  constructor() {
    this.storagePrefix = GAME_CONFIG.STORAGE_PREFIX;
    this.gameTime = 0; // Track total gameplay time in seconds
    this.initialized = false;
    this.saveTimeout = null;
    
    // Attempt to load state
    this.loadState();
    
    // Set up auto-save every 30 seconds
    setInterval(() => {
      this.saveState();
    }, 30000);
    
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
   * Load game state from localStorage
   */
  loadState() {
    try {
      const savedState = this.safeGetItem(this.storagePrefix + 'gameState');
      if (savedState) {
        const state = JSON.parse(savedState);
        this.restoreState(state);
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
    this.inventory = new Map();
    this.inventory.set("hearts", 3); // Starting with 3 healing items
    
    // Game settings
    this.settings = {
      musicVolume: GAME_CONFIG.AUDIO.volume.music,
      effectsVolume: GAME_CONFIG.AUDIO.volume.effects,
      dialogueVolume: GAME_CONFIG.AUDIO.volume.dialogue,
      colorblindMode: false,
      inputAssist: false,
      subtitles: true,
      brightness: 1.0
    };
    
    // Tutorial progress
    this.tutorial = {
      combat: false,
      relationship: false,
      dates: false
    };
    
    // Achievements
    this.achievements = new Set();
    
    // Game flags
    this.gameFlags = new Set();
    
    // Call save to persist immediately
    this.saveState();
  }

  /**
   * Restore state from saved data
   * @param {Object} state - Saved state object
   */
  restoreState(state) {
    // Core game state
    this.currentLevel = this.validateNumber(state.currentLevel, 1, 1, 10);
    this.health = this.validateNumber(state.health, GAME_CONFIG.PLAYER.baseHealth, 0, state.maxHealth || GAME_CONFIG.PLAYER.baseHealth);
    this.maxHealth = this.validateNumber(state.maxHealth, GAME_CONFIG.PLAYER.baseHealth, GAME_CONFIG.PLAYER.baseHealth, 150);
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
    
    // Validate and restore inventory
    const savedInventory = state.inventory || { "hearts": 3 };
    this.inventory = new Map();
    for (const [item, count] of Object.entries(savedInventory)) {
      if (typeof item === 'string' && typeof count === 'number' && count >= 0) {
        this.inventory.set(item, count);
      }
    }
    
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
      brightness: this.validateNumber(state.settings?.brightness, 1.0, 0.5, 1.5)
    };
    
    // Tutorial progress
    this.tutorial = {
      combat: Boolean(state.tutorial?.combat),
      relationship: Boolean(state.tutorial?.relationship),
      dates: Boolean(state.tutorial?.dates)
    };
    
    // Achievements
    this.achievements = new Set(state.achievements || []);
    
    // Game flags
    this.gameFlags = new Set(state.gameFlags || []);
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
        inventory: Object.fromEntries(this.inventory),
        settings: this.settings,
        tutorial: this.tutorial,
        achievements: Array.from(this.achievements),
        gameFlags: Array.from(this.gameFlags)
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
   */
  updateRelationship(change, immediate = false) {
    const oldScore = this.relationshipScore;
    this.relationshipScore = GAME_CONFIG.clamp(
      this.relationshipScore + change, 
      GAME_CONFIG.RELATIONSHIP.MIN_SCORE, 
      GAME_CONFIG.RELATIONSHIP.MAX_SCORE
    );
    this.combatBonuses = this.calculateCombatBonuses();
    
    // Track achievement for reaching unbreakable relationship
    if (oldScore < 100 && this.relationshipScore >= 100 && !this.achievements.has('unbreakable_heart')) {
      this.achievements.add('unbreakable_heart');
      this.score += 500; // Bonus points for achievement
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
    return GAME_CONFIG.getCombatBonuses(tier);
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
      this.triggerAchievement('first_steps');
    }
    
    if (newTier === 'strong' && !this.unlockedMilestones.has('sync_attack')) {
      this.unlockedMilestones.add('sync_attack');
      this.triggerAchievement('growing_together');
    }
    
    if (newTier === 'unbreakable' && !this.unlockedMilestones.has('true_partner')) {
      this.unlockedMilestones.add('true_partner');
      this.maxHealth = 150;
      this.health = this.maxHealth;
      this.triggerAchievement('eternal_bond');
    }
    
    // Track milestones as achievements
    if (this.unlockedMilestones.has('first_date') && !this.achievements.has('first_date_milestone')) {
      this.triggerAchievement('first_date_milestone');
    }
    
    if (this.unlockedMilestones.has('sync_attack') && !this.achievements.has('sync_attack_milestone')) {
      this.triggerAchievement('sync_attack_milestone');
    }
    
    if (this.unlockedMilestones.has('true_partner') && !this.achievements.has('true_partner_milestone')) {
      this.triggerAchievement('true_partner_milestone');
    }
  }

  /**
   * Trigger an achievement
   * @param {string} achievementId
   */
  triggerAchievement(achievementId) {
    if (!this.achievements.has(achievementId)) {
      this.achievements.add(achievementId);
      console.log(`Achievement unlocked: ${achievementId}`);
      
      // Update score based on achievement
      const achievementScores = {
        'first_steps': 100,
        'growing_together': 150, 
        'eternal_bond': 300,
        'first_date_milestone': 50,
        'sync_attack_milestone': 75,
        'true_partner_milestone': 100,
        'unbreakable_heart': 500
      };
      
      this.score += achievementScores[achievementId] || 25;
      this.scheduleSave();
    }
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
      this.heal(GAME_CONFIG.PLAYER.healAmount);
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
    this.inventory.set(item, current + count);
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
   * Check if the player has completed a specific date
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
    this.scheduleSave();
  }

  /**
   * Set a game flag
   * @param {string} flag
   */
  setFlag(flag) {
    this.gameFlags.add(flag);
    this.scheduleSave();
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
   * Check if the game is in a win state
   * @returns {boolean}
   */
  isWinState() {
    // Win if all bosses are defeated and relationship is strong
    const allBossesDefeated = LEVELS.filter(l => l.type === 'boss').length === this.defeatedBosses.size;
    return allBossesDefeated && this.relationshipScore >= 70;
  }

  /**
   * Check if the game is in a loss state
   * @returns {string|null} Loss reason or null if not in loss state
   */
  isLossState() {
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
    // Save every 5 minutes of gameplay
    if (Math.floor(this.gameTime / 300) > Math.floor((this.gameTime - delta) / 300)) {
      this.saveState();
    }
  }
}

// Create singleton instance
const stateManager = new StateManager();
window.stateManager = stateManager; // For debugging purposes only

// Export for module systems
if (typeof module !== 'undefined') {
  module.exports = StateManager;
}
