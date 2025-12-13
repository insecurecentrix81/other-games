/**
 * audio.js
 * Audio management using Howler.js for game music and sound effects
 * Dependencies: Howler.js (global, loaded via CDN in index.html)
 * Exports: AudioManager class
 * 
 * Integration Notes:
 * - Must have Howler.js loaded before this module
 * - Falls back to performance.now() timing if Howler unavailable
 * - getCurrentTime() is the source of truth for game timing
 */

/**
 * AudioManager - Handles all audio playback using Howler.js
 * Provides precise timing for rhythm game synchronization
 */
export class AudioManager {
    constructor() {
        /** @type {Howl|null} Current loaded sound */
        this.currentSound = null;
        
        /** @type {boolean} Whether audio is currently playing */
        this.isPlaying = false;
        
        /** @type {number} Playback rate multiplier (1.0 = normal) */
        this.playbackRate = 1.0;
        
        /** @type {number} Master volume (0-1) */
        this.volume = 0.7;
        
        /** @type {number} Music volume (0-1) */
        this.musicVolume = 0.8;
        
        /** @type {number} Effects volume (0-1) */
        this.effectsVolume = 1.0;
        
        /** @type {number} Timestamp when audio started (for fallback timing) */
        this.startTime = 0;
        
        /** @type {number} Position when audio was paused */
        this.pausePosition = 0;
        
        /** @type {number} Audio offset in milliseconds (for sync adjustment) */
        this.audioOffset = 0;
        
        /** @type {boolean} Whether audio has been loaded */
        this.isLoaded = false;
        
        /** @type {string|null} Current audio URL */
        this.currentUrl = null;
        
        /** @type {Function|null} Callback for when audio ends */
        this.onEndCallback = null;
        
        /** @type {Object} Sound effect cache */
        this.effectsCache = new Map();
        
        // Check if Howler is available
        this.howlerAvailable = typeof Howl !== 'undefined';
        
        if (!this.howlerAvailable) {
            console.warn('Howler.js not loaded. Audio will be disabled, using performance.now() for timing.');
        }
    }

    /**
     * Load audio from URL
     * @param {string} url - URL to audio file
     * @returns {Promise<void>} Resolves when audio is loaded
     */
    loadAudio(url) {
        return new Promise((resolve, reject) => {
            // Unload previous sound if exists
            this.unload();
            
            this.currentUrl = url;
            this.isLoaded = false;
            
            if (!this.howlerAvailable) {
                // Fallback: No audio, but allow timing
                console.warn('Running without audio - using timing fallback');
                this.isLoaded = true;
                resolve();
                return;
            }

            try {
                this.currentSound = new Howl({
                    src: [url],
                    html5: true, // Use HTML5 audio for large files
                    preload: true,
                    volume: this.volume * this.musicVolume,
                    rate: this.playbackRate,
                    onload: () => {
                        this.isLoaded = true;
                        console.log('Audio loaded successfully:', url);
                        resolve();
                    },
                    onloaderror: (id, error) => {
                        console.error('Audio load error:', error);
                        // Still allow game to run without audio
                        this.isLoaded = true;
                        resolve();
                    },
                    onplayerror: (id, error) => {
                        console.error('Audio play error:', error);
                        // Try to unlock audio context
                        if (this.currentSound) {
                            this.currentSound.once('unlock', () => {
                                this.currentSound.play();
                            });
                        }
                    },
                    onend: () => {
                        this.isPlaying = false;
                        if (this.onEndCallback) {
                            this.onEndCallback();
                        }
                    }
                });
            } catch (error) {
                console.error('Error creating Howl:', error);
                this.isLoaded = true;
                resolve();
            }
        });
    }

    /**
     * Play audio from specified position
     * @param {number} startOffset - Start position in milliseconds
     */
    play(startOffset = 0) {
        this.startTime = performance.now() - startOffset;
        this.pausePosition = 0;
        
        if (this.currentSound && this.howlerAvailable) {
            // Seek to position and play
            this.currentSound.seek(startOffset / 1000);
            this.currentSound.play();
            this.isPlaying = true;
        } else {
            // Fallback: Just track timing
            this.isPlaying = true;
        }
    }

    /**
     * Pause audio playback
     */
    pause() {
        if (this.currentSound && this.howlerAvailable) {
            this.pausePosition = this.currentSound.seek() * 1000;
            this.currentSound.pause();
        } else {
            this.pausePosition = this.getCurrentTime();
        }
        this.isPlaying = false;
    }

    /**
     * Resume audio playback
     */
    resume() {
        if (this.currentSound && this.howlerAvailable) {
            this.currentSound.play();
        }
        
        // Adjust start time to account for pause duration
        this.startTime = performance.now() - this.pausePosition;
        this.isPlaying = true;
    }

    /**
     * Stop audio playback
     */
    stop() {
        if (this.currentSound && this.howlerAvailable) {
            this.currentSound.stop();
        }
        this.isPlaying = false;
        this.pausePosition = 0;
    }

    /**
     * Unload current audio
     */
    unload() {
        if (this.currentSound && this.howlerAvailable) {
            this.currentSound.unload();
            this.currentSound = null;
        }
        this.isLoaded = false;
        this.isPlaying = false;
        this.currentUrl = null;
    }

    /**
     * Get current playback time in milliseconds
     * This is the source of truth for game timing
     * @returns {number} Current time in milliseconds
     */
    getCurrentTime() {
        if (this.currentSound && this.howlerAvailable && this.isPlaying) {
            // Get time from Howler (more accurate)
            return this.currentSound.seek() * 1000;
        }
        
        if (!this.isPlaying) {
            return this.pausePosition;
        }
        
        // Fallback: Calculate from performance.now()
        return (performance.now() - this.startTime) * this.playbackRate;
    }

    /**
     * Get adjusted time with audio offset
     * @returns {number} Adjusted time in milliseconds
     */
    getAdjustedTime() {
        return this.getCurrentTime() + this.audioOffset;
    }

    /**
     * Seek to specific position
     * @param {number} position - Position in milliseconds
     */
    seek(position) {
        if (this.currentSound && this.howlerAvailable) {
            this.currentSound.seek(position / 1000);
        }
        this.startTime = performance.now() - position;
        this.pausePosition = position;
    }

    /**
     * Set playback rate
     * @param {number} rate - Playback rate multiplier (0.5 = half speed, 1.5 = 1.5x speed)
     */
    setPlaybackRate(rate) {
        this.playbackRate = Math.max(0.25, Math.min(4.0, rate));
        
        if (this.currentSound && this.howlerAvailable) {
            this.currentSound.rate(this.playbackRate);
        }
    }

    /**
     * Set master volume
     * @param {number} volume - Volume (0-1)
     */
    setVolume(volume) {
        this.volume = Math.max(0, Math.min(1, volume));
        this.updateVolume();
    }

    /**
     * Set music volume
     * @param {number} volume - Volume (0-1)
     */
    setMusicVolume(volume) {
        this.musicVolume = Math.max(0, Math.min(1, volume));
        this.updateVolume();
    }

    /**
     * Update the actual volume of current sound
     */
    updateVolume() {
        if (this.currentSound && this.howlerAvailable) {
            this.currentSound.volume(this.volume * this.musicVolume);
        }
    }

    /**
     * Set audio offset for sync adjustment
     * @param {number} offset - Offset in milliseconds (positive = audio ahead)
     */
    setAudioOffset(offset) {
        this.audioOffset = offset;
    }

    /**
     * Get duration of current audio in milliseconds
     * @returns {number} Duration in milliseconds
     */
    getDuration() {
        if (this.currentSound && this.howlerAvailable) {
            return this.currentSound.duration() * 1000;
        }
        return 0;
    }

    /**
     * Check if audio is currently playing
     * @returns {boolean}
     */
    getIsPlaying() {
        if (this.currentSound && this.howlerAvailable) {
            return this.currentSound.playing();
        }
        return this.isPlaying;
    }

    /**
     * Set callback for when audio ends
     * @param {Function} callback 
     */
    setOnEndCallback(callback) {
        this.onEndCallback = callback;
    }

    /**
     * Play a sound effect
     * @param {string} name - Effect name
     * @param {number} volume - Volume (0-1)
     */
    playEffect(name, volume = 1.0) {
        // Sound effects would be loaded here
        // For now, this is a stub for future implementation
        const effectVolume = this.volume * this.effectsVolume * volume;
        
        // Hit sounds could be implemented here
        // Example: this.effectsCache.get(name)?.play()
    }

    /**
     * Mute/unmute audio
     * @param {boolean} muted 
     */
    setMuted(muted) {
        if (this.currentSound && this.howlerAvailable) {
            this.currentSound.mute(muted);
        }
    }

    /**
     * Fade audio volume
     * @param {number} from - Start volume (0-1)
     * @param {number} to - End volume (0-1)
     * @param {number} duration - Duration in milliseconds
     */
    fade(from, to, duration) {
        if (this.currentSound && this.howlerAvailable) {
            this.currentSound.fade(from, to, duration);
        }
    }

    /**
     * Clean up resources
     */
    destroy() {
        this.unload();
        this.effectsCache.forEach(effect => effect.unload());
        this.effectsCache.clear();
    }
}

// Create singleton instance
export const audioManager = new AudioManager();

export default AudioManager;
