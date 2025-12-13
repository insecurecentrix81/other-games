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
    
    // Animation states
    this.state = 'following'; // 'following', 'healing', 'sync_attack', 'idle'
    this.isHealing = false;
    this.healCooldown = 0;
    
    // Movement properties
    this.lastDirection = 'right'; // 'left' or 'right'
    this.followDistance = 120; // How far Eric stays behind Calvin
    
    // Initialize animations
    this.createAnimations();
    
    // Start with idle animation
    this.sprite.anims.play('eric-idle', true);
  }

  /**
   * Create character animations
   */
  createAnimations() {
    // Idle animation
    this.scene.anims.create({
      key: 'eric-idle',
      frames: this.scene.anims.generateFrameNumbers('eric', { start: 0, end: 3 }),
      frameRate: 5,
      repeat: -1
    });
    
    // Following animation
    this.scene.anims.create({
      key: 'eric-follow',
      frames: this.scene.anims.generateFrameNumbers('eric', { start: 4, end: 7 }),
      frameRate: 10,
      repeat: -1
    });
    
    // Healing animation
    this.scene.anims.create({
      key: 'eric-heal',
      frames: this.scene.anims.generateFrameNumbers('eric', { start: 8, end: 10 }),
      frameRate: 10,
      repeat: 0
    });
    
    // Sync attack animation
    this.scene.anims.create({
      key: 'eric-sync-attack',
      frames: this.scene.anims.generateFrameNumbers('eric', { start: 11, end: 13 }),
      frameRate: 15,
      repeat: 0
    });
    
    // Blush animation (for dates)
    this.scene.anims.create({
      key: 'eric-blush',
      frames: this.scene.anims.generateFrameNumbers('eric', { start: 14, end: 16 }),
      frameRate: 5,
      repeat: -1
    });
  }

  /**
   * Update method called each frame
   * @param {Calvin} calvin - Player character
   */
  update(calvin) {
    // Skip update if in date scene
    if (this.scene.scene.key === 'DateScene') {
      return;
    }
    
    const relationshipTier = GAME_CONFIG.getRelationshipTier(this.stateManager.relationshipScore);
    
    // Update animation state
    let playAnimation = null;
    
    // Calculate distance to Calvin
    const distance = Phaser.Math.Distance.Between(
      calvin.sprite.x, calvin.sprite.y,
      this.sprite.x, this.sprite.y
    );
    
    // Following behavior
    if (distance > this.followDistance + 50) {
      // Move toward Calvin
      this.moveToCalvin(calvin);
      playAnimation = 'eric-follow';
    } else if (distance < this.followDistance - 30) {
      // Maintain distance
      this.maintainDistance(calvin);
      playAnimation = 'eric-follow';
    } else {
      // Idle when at proper distance
      playAnimation = 'eric-idle';
    }
    
    // Auto-heal based on relationship
    if (relationshipTier !== 'strained' && 
        this.stateManager.health < this.stateManager.maxHealth * 0.7 &&
        !this.isHealing &&
        Math.random() < this.stateManager.combatBonuses.healChance) {
      
      this.heal(calvin);
    }
    
    // Sync attack opportunity
    if (calvin.isAttacking && 
        relationshipTier !== 'strained' &&
        this.stateManager.combatBonuses.syncAttack &&
        distance < 150) {
      this.performSyncAttack(calvin);
    }
    
    // Play appropriate animation
    if (playAnimation && this.state !== playAnimation.replace('eric-', '')) {
      this.sprite.anims.play(playAnimation, true);
      this.state = playAnimation.replace('eric-', '');
    }
    
    // Update cooldowns
    if (this.healCooldown > 0) {
      this.healCooldown -= this.scene.game.loop.delta / 1000;
    }
  }

  /**
   * Move toward Calvin
   * @param {Calvin} calvin
   */
  moveToCalvin(calvin) {
    const dx = calvin.sprite.x - this.sprite.x;
    const dy = calvin.sprite.y - this.sprite.y;
    const angle = Math.atan2(dy, dx);
    
    // Calculate movement speed based on distance
    const speed = Math.min(200, distance * 0.5);
    
    this.sprite.setVelocity(
      Math.cos(angle) * speed,
      Math.sin(angle) * speed
    );
    
    // Update direction
    if (dx < 0) {
      this.lastDirection = 'left';
      this.sprite.flipX = true;
    } else {
      this.lastDirection = 'right';
      this.sprite.flipX = false;
    }
  }

  /**
   * Maintain optimal distance from Calvin
   * @param {Calvin} calvin
   */
  maintainDistance(calvin) {
    const dx = this.sprite.x - calvin.sprite.x;
    const dy = this.sprite.y - calvin.sprite.y;
    const angle = Math.atan2(dy, dx);
    
    // Move away slightly
    this.sprite.setVelocity(
      Math.cos(angle) * 50,
      Math.sin(angle) * 50
    );
  }

  /**
   * Heal Calvin
   * @param {Calvin} calvin
   */
  heal(calvin) {
    if (this.healCooldown > 0) return;
    
    this.isHealing = true;
    this.healCooldown = 3.0; // 3 second cooldown
    
    // Play healing animation
    this.sprite.anims.play('eric-heal', true);
    this.state = 'healing';
    
    // Calculate heal amount
    const healAmount = Math.floor(this.stateManager.maxHealth * 0.15);
    
    // Apply healing
    calvin.heal(healAmount);
    
    // Create healing effect
    this.createHealingEffect(calvin.sprite.x, calvin.sprite.y);
    
    // Play heal sound
    if (this.scene.sound.exists('heal')) {
      this.scene.sound.play('heal');
    }
    
    // Reset healing state after animation
    this.scene.time.delayedCall(1000, () => {
      this.isHealing = false;
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
      gravityY: -50
    });
    
    // Clean up after effect
    this.scene.time.delayedCall(800, () => {
      particles.destroy();
    });
  }

  /**
   * Perform sync attack with Calvin
   * @param {Calvin} calvin
   */
  performSyncAttack(calvin) {
    if (this.state === 'sync_attack') return;
    
    this.state = 'sync_attack';
    
    // Play sync attack animation
    this.sprite.anims.play('eric-sync-attack', true);
    
    // Create sync attack hitbox
    const hitbox = this.scene.add.rectangle(
      calvin.sprite.x,
      calvin.sprite.y - 50,
      150,
      150,
      0x4caf50,
      0
    );
    
    hitbox.alpha = 0; // Invisible hitbox
    this.scene.physics.world.enable(hitbox);
    hitbox.body.setAllowGravity(false);
    hitbox.body.setImmovable(true);
    
    // Calculate enhanced damage
    const damage = GAME_CONFIG.PLAYER.attackDamage * 1.5;
    
    // Check for collisions with monsters
    this.scene.physics.add.overlap(hitbox, this.scene.monsters, (hitbox, monster) => {
      monster.takeDamage(damage);
      
      // Create hit effect
      this.createHitEffect(monster.x, monster.y);
    });
    
    // Create visual effect
    this.createSyncAttackEffect(calvin.sprite.x, calvin.sprite.y);
    
    // Play sync attack sound
    if (this.scene.sound.exists('sync-attack')) {
      this.scene.sound.play('sync-attack');
    }
    
    // Clean up after attack
    this.scene.time.delayedCall(500, () => {
      hitbox.destroy();
      
      // Return to following state
      this.state = 'following';
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
      y: y,
      speed: { min: 150, max: 250 },
      angle: { min: 0, max: 360 },
      scale: { start: 0.5, end: 0 },
      tint: 0x4caf50,
      blendMode: 'ADD',
      lifespan: 800,
      quantity: 20
    });
    
    // Heart particles
    const heartEmitter = particles.createEmitter({
      x: x,
      y: y,
      speed: 50,
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
      delay: 100,
      callback: () => {
        heartEmitter.explode(1, x, y);
      },
      repeat: 4
    });
    
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
      quantity: 10,
      gravityY: 200
    });
    
    // Clean up after effect
    this.scene.time.delayedCall(500, () => {
      particles.destroy();
    });
  }

  /**
   * Set blush animation for date scenes
   */
  startBlushing() {
    this.sprite.anims.play('eric-blush', true);
  }

  /**
   * Stop blush animation
   */
  stopBlushing() {
    this.sprite.anims.stop();
    this.sprite.setFrame(0); // Reset to first frame
  }

  /**
   * Cleanup resources
   */
  destroy() {
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
