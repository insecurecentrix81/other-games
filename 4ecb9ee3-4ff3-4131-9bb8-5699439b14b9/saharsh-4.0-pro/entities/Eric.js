/**
 * Eric.js
 * Companion character entity
 */

class Eric {
  constructor(scene, x, y) {
    this.scene = scene;
    this.stateManager = window.stateManager;
    this.relationshipManager = scene.relationshipManager;
    
    // Create sprite
    this.sprite = scene.physics.add.sprite(x, y, 'eric');
    this.sprite.setCollideWorldBounds(true);
    this.sprite.setOrigin(0.5, 1); // Bottom-center origin for platforming
    this.sprite.setDepth(9);
    
    // Animation states
    this.state = 'following'; // 'following', 'healing', 'sync_attack', 'idle', 'dead'
    this.isHealing = false;
    this.healCooldown = 0;
    this.isActing = false; // For synchronization
    this.blushing = false;
    
    // Movement properties
    this.lastDirection = 'right'; // 'left' or 'right'
    this.followDistance = 120; // How far Eric stays behind Calvin
    this.followOffsetY = -30; // Vertical offset for better visibility
    
    // Combat properties
    this.syncAttackReady = false;
    this.syncAttackCooldown = 0;
    
    // Initialize animations
    this.createAnimations();
    
    // Start with idle animation
    this.sprite.anims.play('eric-idle', true);
    
    // Setup events
    this.setupEvents();
  }

  /**
   * Create character animations
   */
  createAnimations() {
    const frameRate = {
      idle: 5,
      follow: 10,
      heal: 10,
      syncAttack: 15,
      blush: 5
    };
    
    // Idle animation
    this.scene.anims.create({
      key: 'eric-idle',
      frames: this.scene.anims.generateFrameNumbers('eric', { start: 0, end: 3 }),
      frameRate: frameRate.idle,
      repeat: -1
    });
    
    // Following animation
    this.scene.anims.create({
      key: 'eric-follow',
      frames: this.scene.anims.generateFrameNumbers('eric', { start: 4, end: 7 }),
      frameRate: frameRate.follow,
      repeat: -1
    });
    
    // Healing animation
    this.scene.anims.create({
      key: 'eric-heal',
      frames: this.scene.anims.generateFrameNumbers('eric', { start: 8, end: 10 }),
      frameRate: frameRate.heal,
      repeat: 0
    });
    
    // Sync attack animation
    this.scene.anims.create({
      key: 'eric-sync-attack',
      frames: this.scene.anims.generateFrameNumbers('eric', { start: 11, end: 13 }),
      frameRate: frameRate.syncAttack,
      repeat: 0
    });
    
    // Blush animation (for dates)
    this.scene.anims.create({
      key: 'eric-blush',
      frames: this.scene.anims.generateFrameNumbers('eric', { start: 14, end: 16 }),
      frameRate: frameRate.blush,
      repeat: -1
    });
    
    // Hurt animation
    this.scene.anims.create({
      key: 'eric-hurt',
      frames: [{ key: 'eric', frame: 17 }],
      frameRate: 1,
      repeat: 0
    });
  }

  /**
   * Setup event listeners
   */
  setupEvents() {
    // Listen for game over
    this.scene.events.on('gameOver', () => {
      this.destroy();
    });
    
    // Listen for player death
    this.scene.events.on('playerDied', () => {
      this.handleCalvinDeath();
    });
    
    // Listen for scene changes
    this.scene.events.on('sceneTransitionComplete', () => {
      this.positionAfterTransition();
    });
  }

  /**
   * Update method called each frame
   * @param {Calvin} calvin - Player character
   */
  update(calvin) {
    // Skip update if in date scene or dead
    if (this.scene.scene.key === 'DateScene' || this.state === 'dead') {
      return;
    }
    
    const relationshipTier = GAME_CONFIG.getRelationshipTier(this.stateManager.relationshipScore);
    
    // Update animation state
    let playAnimation = null;
    
    // Calculate distance to Calvin
    const dx = calvin.sprite.x - this.sprite.x;
    const dy = calvin.sprite.y - this.sprite.y;
    const distance = Phaser.Math.Distance.Between(dx, dy);
    
    // Don't update position if acting (healing or sync attack)
    if (!this.isActing) {
      // Update direction
      if (dx < 0) {
        this.lastDirection = 'left';
        this.sprite.flipX = true;
      } else {
        this.lastDirection = 'right';
        this.sprite.flipX = false;
      }
      
      // Follow player with smooth movement
      this.moveToPosition(calvin);
    }
    
    // Auto-heal based on relationship
    if (relationshipTier !== 'strained' && 
        this.stateManager.health < this.stateManager.maxHealth * 0.8 &&
        !this.isHealing &&
        this.healCooldown <= 0) {
      
      // Random chance to heal based on relationship
      const healChance = this.stateManager.combatBonuses.healChance;
      if (Math.random() < healChance) {
        this.heal(calvin);
      }
    }
    
    // Sync attack opportunity with cooldown
    if (calvin.isAttacking && 
        relationshipTier !== 'strained' &&
        this.stateManager.combatBonuses.syncAttack &&
        distance < 180 &&
        this.syncAttackCooldown <= 0) {
      this.performSyncAttack(calvin);
    }
    
    // Update cooldowns
    if (this.healCooldown > 0) {
      this.healCooldown -= this.scene.game.loop.delta / 1000;
    }
    
    if (this.syncAttackCooldown > 0) {
      this.syncAttackCooldown -= this.scene.game.loop.delta / 1000;
    }
    
    // Update animation
    if (!this.isActing && !this.blushing) {
      // Following behavior
      if (distance > this.followDistance + 50) {
        playAnimation = 'eric-follow';
      } else if (distance < this.followDistance - 40) {
        playAnimation = 'eric-follow';
      } else {
        playAnimation = 'eric-idle';
      }
      
      // Play appropriate animation
      if (playAnimation && this.state !== playAnimation.replace('eric-', '')) {
        this.sprite.anims.play(playAnimation, true);
        this.state = playAnimation.replace('eric-', '');
      }
    }
  }

  /**
   * Move toward a target position with smooth tweening
   * @param {Calvin} calvin
   */
  moveToPosition(calvin) {
    // Target position is behind Calvin with offset
    let targetX, targetY;
    
    if (calvin.lastDirection === 'right') {
      targetX = calvin.sprite.x - this.followDistance;
    } else {
      targetX = calvin.sprite.x + this.followDistance;
    }
    
    targetY = calvin.sprite.y + this.followOffsetY;
    
    // Clamp to world bounds
    targetX = GAME_CONFIG.clamp(targetX, 0, GAME_CONFIG.WORLD_BOUNDS.maxX);
    targetY = GAME_CONFIG.clamp(targetY, 0, GAME_CONFIG.WORLD_BOUNDS.maxY);
    
    // Distance to target
    const dx = targetX - this.sprite.x;
    const dy = targetY - this.sprite.y;
    const distance = Phaser.Math.Distance.Between(dx, dy);
    
    // Move with acceleration based on distance
    if (distance > 10) {
      const speed = Math.min(250, 100 + distance * 0.5);
      this.sprite.setVelocity(dx * 0.15, dy * 0.15);
    } else {
      this.sprite.setVelocity(0, 0);
    }
  }

  /**
   * Position Eric appropriately after scene transition
   */
  positionAfterTransition() {
    if (!this.scene.calvin) return;
    
    // Position behind Calvin
    const offset = this.lastDirection === 'right' ? -80 : 80;
    this.sprite.setPosition(this.scene.calvin.sprite.x + offset, this.scene.calvin.sprite.y - 30);
  }

  /**
   * Heal Calvin
   * @param {Calvin} calvin
   */
  heal(calvin) {
    if (this.isActing) return;
    
    this.isHealing = true;
    this.isActing = true;
    this.healCooldown = 4.0; // 4 second cooldown
    this.state = 'healing';
    
    // Play healing animation
    this.sprite.anims.play('eric-heal', true);
    
    // Calculate heal amount
    const healAmount = Math.floor(this.stateManager.maxHealth * 0.2);
    
    // Apply healing
    calvin.heal(healAmount);
    
    // Update relationship
    const impact = GAME_CONFIG.getRandomRelationshipImpact('positive');
    this.stateManager.updateRelationship(impact);
    
    // Create healing effect
    this.createHealingEffect(calvin.sprite.x, calvin.sprite.y);
    
    // Play heal sound
    if (this.scene.sound.exists('heal')) {
      this.scene.sound.play('heal', { volume: this.stateManager.settings.effectsVolume });
    }
    
    // Reset healing state after animation
    this.scene.time.delayedCall(1000, () => {
      this.isHealing = false;
      this.isActing = false;
      this.state = 'following';
    });
  }

  /**
   * Create healing visual effect
   * @param {number} x
   * @param {number} y
   */
  createHealingEffect(x, y) {
    const particles = this.scene.add.particles('particle');
    const emitter = particles.createEmitter({
      x: x,
      y: y,
      speed: { min: 50, max: 100 },
      angle: { min: 0, max: 360 },
      scale: { start: 0.3, end: 0 },
      tint: 0x4caf50,
      blendMode: 'ADD',
      lifespan: 800,
      quantity: 15,
      gravityY: -50,
      alpha: { start: 0.8, end: 0 }
    });
    
    // Add heart particles
    const heartEmitter = particles.createEmitter({
      x: x,
      y: y,
      speed: 30,
      angle: 0,
      scale: { start: 0.4, end: 0 },
      tint: 0xff8c42,
      blendMode: 'ADD',
      lifespan: 1000,
      quantity: 3,
      on: false
    });
    
    // Pulse hearts
    this.scene.time.addEvent({
      delay: 100,
      callback: () => {
        heartEmitter.explode(1, x, y);
      },
      repeat: 2
    });
    
    // Clean up after effect
    this.scene.time.delayedCall(1000, () => {
      particles.destroy();
    });
  }

  /**
   * Perform sync attack with Calvin
   * @param {Calvin} calvin
   */
  performSyncAttack(calvin) {
    if (this.isActing) return;
    
    this.isActing = true;
    this.syncAttackCooldown = 8.0; // 8 second cooldown
    this.state = 'sync_attack';
    this.syncAttackReady = true;
    
    // Play sync attack animation
    this.sprite.anims.play('eric-sync-attack', true);
    
    // Create sync attack hitbox
    const hitbox = this.scene.add.circle(
      calvin.sprite.x,
      calvin.sprite.y - 40,
      120,
      0x00ff00,
      0
    );
    
    hitbox.alpha = 0; // Invisible hitbox
    this.scene.physics.world.enable(hitbox);
    hitbox.body.setAllowGravity(false);
    hitbox.body.setImmovable(true);
    hitbox.body.setCircle(120);
    
    // Calculate enhanced damage
    const damage = GAME_CONFIG.PLAYER.attackDamage * 2.0;
    
    // Track hit targets
    const hitTargets = new Set();
    
    // Check for collisions with monsters
    this.scene.physics.add.overlap(hitbox, this.scene.monsters, (hitbox, monster) => {
      // Prevent multiple hits
      if (hitTargets.has(monster)) return;
      hitTargets.add(monster);
      
      monster.takeDamage(damage);
      
      // Create hit effect
      this.createHitEffect(monster.x, monster.y);
    });
    
    // Create visual effect
    this.createSyncAttackEffect(calvin.sprite.x, calvin.sprite.y);
    
    // Play sync attack sound
    if (this.scene.sound.exists('sync-attack')) {
      this.scene.sound.play('sync-attack', { volume: this.stateManager.settings.effectsVolume });
    }
    
    // Update relationship
    const impact = GAME_CONFIG.getRandomRelationshipImpact('positive');
    this.stateManager.updateRelationship(impact);
    
    // Clean up after attack
    this.scene.time.delayedCall(600, () => {
      hitbox.destroy();
      this.syncAttackReady = false;
      
      // Return to following state
      this.state = 'following';
      this.isActing = false;
    });
  }

  /**
   * Create visual effect for sync attack
   * @param {number} x
   * @param {number} y
   */
  createSyncAttackEffect(x, y) {
    // Circle particles
    const particles = this.scene.add.particles('particle');
    const emitter = particles.createEmitter({
      x: x,
      y: y - 40,
      speed: { min: 150, max: 250 },
      angle: { min: 0, max: 360 },
      scale: { start: 0.5, end: 0 },
      tint: 0x4caf50,
      blendMode: 'ADD',
      lifespan: 800,
      quantity: { min: 15, max: 25 }
    });
    
    // Heart particles
    const heartEmitter = particles.createEmitter({
      x: x,
      y: y - 40,
      speed: { min: 80, max: 120 },
      angle: 0,
      scale: { start: 0.8, end: 0.2 },
      tint: 0xff8c42,
      blendMode: 'ADD',
      lifespan: 1000,
      quantity: 5,
      on: false
    });
    
    // Pulse hearts outward
    this.scene.time.addEvent({
      delay: 120,
      callback: () => {
        heartEmitter.explode(1, x, y - 40);
      },
      repeat: 3
    });
    
    // Screen effect
    this.scene.cameras.main.flash(200, 72, 220, 62); // Flash greenish color
    
    // Clean up after effect
    this.scene.time.delayedCall(1000, () => {
      particles.destroy();
    });
  }

  /**
   * Create visual effect for attack hit
   * @param {number} x
   * @param {number} y
   */
  createHitEffect(x, y) {
    const particles = this.scene.add.particles('particle');
    const emitter = particles.createEmitter({
      x: x,
      y: y,
      speed: { min: 100, max: 200 },
      angle: { min: 0, max: 360 },
      scale: { start: 0.5, end: 0 },
      blendMode: 'ADD',
      lifespan: 500,
      quantity: { min: 8, max: 12 },
      gravityY: 200,
      alpha: { start: 1, end: 0 }
    });
    
    // Clean up after effect
    this.scene.time.delayedCall(500, () => {
      particles.destroy();
    });
  }

  /**
   * Handle Calvin's death
   */
  handleCalvinDeath() {
    // Stop following and look toward Calvin
    this.isActing = true;
    this.sprite.setVelocity(0, 0);
    
    // Look at Calvin
    if (this.scene.calvin) {
      const dx = this.scene.calvin.sprite.x - this.sprite.x;
      if (dx < 0) {
        this.sprite.flipX = true;
        this.lastDirection = 'left';
      } else {
        this.sprite.flipX = false;
        this.lastDirection = 'right';
      }
    }
    
    // Play shocked animation
    // This would require additional frames 
    // For now, just play a sound
    if (this.scene.sound.exists('eric-shock')) {
      this.scene.sound.play('eric-shock', { volume: this.stateManager.settings.effectsVolume });
    }
    
    // Update relationship negatively
    this.stateManager.updateRelationship(-15);
    
    // Create emotional effect
    const x = this.sprite.x;
    const y = this.sprite.y - 50;
    
    const particles = this.scene.add.particles('particle');
    const emitter = particles.createEmitter({
      x: x,
      y: y,
      speed: { min: 20, max: 40 },
      angle: 270,
      scale: { start: 0.5, end: 0 },
      tint: 0x6666ff,
      blendMode: 'ADD',
      lifespan: 2000,
      quantity: 5,
      gravityY: 50
    });
    
    // Clean up after delay
    this.scene.time.delayedCall(2000, () => {
      particles.destroy();
    });
  }

  /**
   * Set blush animation for date scenes
   */
  startBlushing() {
    this.sprite.anims.play('eric-blush', true);
    this.blushing = true;
    this.state = 'blushing';
  }

  /**
   * Stop blush animation
   */
  stopBlushing() {
    this.sprite.anims.stop();
    this.blushing = false;
    
    // Reset to proper frame based on current state
    if (this.isActing) {
      // Stay in current acting state
    } else {
      // Return to idle or following
      this.state = 'following';
      this.sprite.setFrame(0);
    }
  }

  /**
   * Cleanup resources
   */
  destroy() {
    // Remove event listeners
    this.scene.events.off('gameOver');
    this.scene.events.off('playerDied');
    this.scene.events.off('sceneTransitionComplete');
    
    // Destroy sprite
    if (this.sprite) {
      this.sprite.destroy();
      this.sprite = null;
    }
  }
}

// Export for module systems
if (typeof module !== 'undefined') {
  module.exports = Eric;
}
