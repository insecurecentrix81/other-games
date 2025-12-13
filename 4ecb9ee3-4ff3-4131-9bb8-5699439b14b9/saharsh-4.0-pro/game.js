/**
 * game.js
 * Main game initialization and configuration
 */

// Wait for DOM content to load
document.addEventListener('DOMContentLoaded', () => {
  // Initialize game
  const game = new Phaser.Game({
    type: Phaser.AUTO,
    width: GAME_CONFIG.WIDTH,
    height: GAME_CONFIG.HEIGHT,
    scale: {
      mode: GAME_CONFIG.SCALE_MODE,
      autoCenter: GAME_CONFIG.AUTO_CENTER
    },
    physics: GAME_CONFIG.PHYSICS,
    scene: [
      BootScene,
      TitleScene,
      WorldScene,
      CombatScene,
      DateScene,
      MiniGameScene,
      GameOverScene,
      WinScene
    ],
    parent: 'game-container',
    backgroundColor: '#000000',
    pixelArt: false,
    roundPixels: false
  });
  
  // Global game reference
  window.game = game;
  
  // Handle window resize
  window.addEventListener('resize', () => {
    if (game && game.scale) {
      game.scale.refresh();
    }
  });
  
  // Prevent context menu on right-click
  document.getElementById('game-container').addEventListener('contextmenu', (e) => {
    e.preventDefault();
  });
  
  // Initialize audio
  initializeAudio();
});

/**
 * Initialize game audio
 */
function initializeAudio() {
  // Preload common sounds
  const soundConfig = {
    volume: GAME_CONFIG.AUDIO.volume.effects,
    loop: false
  };
  
  // Create sound objects (will be populated when assets load)
  window.gameSounds = {
    jump: null,
    hit: null,
    hurt: null,
    heal: null,
    'tier-up-1': null,
    'tier-up-2': null,
    'tier-up-3': null,
    'tier-down': null,
    'sync-attack': null
  };
  
  // Load sound files
  Object.keys(window.gameSounds).forEach(key => {
    window.gameSounds[key] = new Howl({
      src: [`assets/sounds/${key}.mp3`],
      volume: soundConfig.volume,
      loop: soundConfig.loop
    });
  });
}

/**
 * Helper function to play sound with safety check
 * @param {string} key - Sound key
 */
function playSound(key) {
  if (window.gameSounds && window.gameSounds[key]) {
    window.gameSounds[key].play();
  }
}

// Make playSound available globally for scenes
window.playSound = playSound;
