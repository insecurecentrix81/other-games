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
    roundPixels: false,
    // Disable context menu
    disableContextMenu: true
  });
  
  // Global game reference
  window.game = game;
  
  // Handle window resize
  window.addEventListener('resize', () => {
    if (game && game.scale) {
      game.scale.refresh();
    }
  });
  
  // Initialize audio
  initializeAudio();
});

// Global game sounds object
window.gameSounds = {};

/**
 * Initialize game audio
 */
function initializeAudio() {
  // Sound configuration
  const soundConfig = {
    volume: GAME_CONFIG.AUDIO.volume.effects,
    loop: false
  };
  
  // Music configuration
  const musicConfig = {
    volume: GAME_CONFIG.AUDIO.volume.music,
    loop: true
  };
  
  // List of sound keys
  const soundKeys = [
    'jump', 'hit', 'hurt', 'heal', 'tier-up-1', 'tier-up-2', 'tier-up-3', 
    'tier-down', 'sync-attack', 'button-hover', 'button-click', 'menu-open'
  ];
  
  // List of music keys
  const musicKeys = [
    'title-music', 'world-music', 'combat-music', 'date-music', 'ending-music'
  ];
  
  // List of voice keys
  const voiceKeys = [
    'voice-eric-hello', 'voice-eric-thanks', 'voice-eric-surprised'
  ];
  
  // Create sound objects
  window.gameSounds.effects = {};
  window.gameSounds.music = {};
  window.gameSounds.voices = {};
  
  // Load effect sounds
  soundKeys.forEach(key => {
    window.gameSounds.effects[key] = new Howl({
      src: [`assets/sounds/${key}.mp3`, `assets/sounds/${key}.ogg`],
      volume: soundConfig.volume,
      loop: soundConfig.loop
    });
  });
  
  // Load music tracks
  musicKeys.forEach(key => {
    window.gameSounds.music[key] = new Howl({
      src: [`assets/music/${key}.mp3`, `assets/music/${key}.ogg`],
      volume: musicConfig.volume,
      loop: true
    });
  });
  
  // Load voice lines
  voiceKeys.forEach(key => {
    window.gameSounds.voices[key] = new Howl({
      src: [`assets/sounds/voices/${key}.mp3`, `assets/sounds/voices/${key}.ogg`],
      volume: GAME_CONFIG.AUDIO.volume.dialogue,
      loop: false
    });
  });
}

/**
 * Helper function to play sound with safety check
 * @param {string} key - Sound key
 * @param {Object} options - Sound options (volume, loop, etc.)
 */
function playSound(key, options = {}) {
  if (!window.gameSounds || !window.gameSounds.effects) {
    return;
  }
  
  const sound = window.gameSounds.effects[key];
  if (sound) {
    // Apply volume from options or use default
    const volume = options.volume !== undefined ? 
      options.volume : window.stateManager?.settings.effectsVolume || 1.0;
      
    sound.volume(volume);
    
    // Apply loop setting
    if (options.loop !== undefined) {
      sound.loop(options.loop);
    }
    
    sound.play();
  }
}

/**
 * Play music track
 * @param {string} key - Music track key
 * @param {boolean} fade - Whether to fade between tracks
 */
function playMusic(key, fade = true) {
  if (!window.gameSounds || !window.gameSounds.music) {
    return;
  }
  
  const newMusic = window.gameSounds.music[key];
  if (!newMusic) {
    console.warn(`Music track not found: ${key}`);
    return;
  }
  
  const currentKey = GAME_CONFIG.getActiveMusic();
  const currentMusic = currentKey ? window.gameSounds.music[currentKey] : null;
  
  // If already playing this track, do nothing
  if (currentKey === key && currentMusic?.playing()) {
    return;
  }
  
  if (currentMusic && fade) {
    // Fade out current music
    currentMusic.fade(currentMusic.volume(), 0, GAME_CONFIG.AUDIO.fadeDuration);
    
    // Schedule new music to start when fade is complete
    setTimeout(() => {
      // Stop current music
      currentMusic.stop();
      
      // Start new music
      newMusic.volume(window.stateManager?.settings.musicVolume || 0.5);
      newMusic.play();
      
      // Update active music
      GAME_CONFIG.setActiveMusic(key);
    }, GAME_CONFIG.AUDIO.fadeDuration);
  } else {
    // Stop current music if playing
    if (currentMusic) {
      currentMusic.stop();
    }
    
    // Start new music immediately
    newMusic.volume(window.stateManager?.settings.musicVolume || 0.5);
    newMusic.play();
    
    // Update active music
    GAME_CONFIG.setActiveMusic(key);
  }
}

/**
 * Stop current music
 * @param {boolean} fade - Whether to fade out
 */
function stopMusic(fade = true) {
  const currentKey = GAME_CONFIG.getActiveMusic();
  if (!currentKey) return;
  
  const currentMusic = window.gameSounds.music[currentKey];
  if (!currentMusic) return;
  
  if (fade) {
    currentMusic.fade(currentMusic.volume(), 0, GAME_CONFIG.AUDIO.fadeDuration);
    setTimeout(() => {
      currentMusic.stop();
      GAME_CONFIG.setActiveMusic(null);
    }, GAME_CONFIG.AUDIO.fadeDuration);
  } else {
    currentMusic.stop();
    GAME_CONFIG.setActiveMusic(null);
  }
}

/**
 * Play voice line
 * @param {string} key - Voice key
 * @param {number} volume - Volume level
 */
function playVoice(key, volume = 1.0) {
  if (!window.gameSounds || !window.gameSounds.voices) {
    return;
  }
  
  const voice = window.gameSounds.voices[key];
  if (voice) {
    const finalVolume = volume * (window.stateManager?.settings.dialogueVolume || 1.0);
    voice.volume(finalVolume);
    voice.play();
  }
}

/**
 * Set global audio volumes
 * @param {Object} volumes - { music, effects, dialogue }
 */
function setAudioVolumes(volumes) {
  // Update config
  if (volumes.music !== undefined) {
    GAME_CONFIG.AUDIO.volume.music = volumes.music;
  }
  if (volumes.effects !== undefined) {
    GAME_CONFIG.AUDIO.volume.effects = volumes.effects;
  }
  if (volumes.dialogue !== undefined) {
    GAME_CONFIG.AUDIO.volume.dialogue = volumes.dialogue;
  }
  
  // Update playing sounds
  if (window.gameSounds) {
    // Update music volumes
    Object.values(window.gameSounds.music || {}).forEach(sound => {
      if (sound.playing()) {
        sound.volume(volumes.music !== undefined ? 
          volumes.music * (window.stateManager?.settings.musicVolume || 1.0) : 
          sound.volume()
        );
      }
    });
    
    // Update effect volumes
    Object.values(window.gameSounds.effects || {}).forEach(sound => {
      sound.volume(volumes.effects !== undefined ? 
        volumes.effects * (window.stateManager?.settings.effectsVolume || 1.0) : 
        sound.volume()
      );
    });
    
    // Update voice volumes
    Object.values(window.gameSounds.voices || {}).forEach(sound => {
      sound.volume(volumes.dialogue !== undefined ? 
        volumes.dialogue * (window.stateManager?.settings.dialogueVolume || 1.0) : 
        sound.volume()
      );
    });
  }
}

// Make audio functions available globally
window.playSound = playSound;
window.playMusic = playMusic;
window.stopMusic = stopMusic;
window.playVoice = playVoice;
window.setAudioVolumes = setAudioVolumes;
