/**
 * ui.js - UI Management for osu! Web Clone
 * Handles all screen transitions, HUD updates, mod buttons, and results display
 * Dependencies: constants.js, mods.js, scoring.js (for display data)
 */

import { GRADES, MOD_FLAGS } from './constants.js';

export class UIManager {
    constructor() {
        this.screens = {};
        this.currentScreen = null;
        this.hud = {};
        this.modButtons = [];
        this.resultsElements = {};
        this.callbacks = {};
        this.countdownElement = null;
        this.countdownTimeout = null;
    }

    /**
     * Initialize all UI elements and cache DOM references
     */
    init() {
        this.initScreens();
        this.initHUD();
        this.initResultsElements();
        this.initModButtons();
        this.initEventListeners();
    }

    /**
     * Cache all screen DOM elements
     */
    initScreens() {
        // Updated to match HTML IDs (screen-* format)
        const screenIds = [
            'screen-loading',
            'screen-menu',
            'screen-song-select',
            'screen-mod-select',
            'screen-countdown',
            'screen-paused',
            'screen-results',
            'screen-failed',
            'screen-settings',
            'screen-help',
            'screen-error'
        ];

        screenIds.forEach(id => {
            const element = document.getElementById(id);
            if (element) {
                this.screens[id] = element;
            }
        });

        // Loading specific elements
        this.loadingBar = document.getElementById('loading-bar');
        this.loadingText = document.getElementById('loading-text');
        
        // Gameplay HUD (not a screen, but needs to be toggled)
        this.gameplayHud = document.getElementById('gameplay-hud');
    }

    /**
     * Initialize HUD elements
     */
    initHUD() {
        this.hud = {
            score: document.getElementById('hud-score'),
            combo: document.getElementById('hud-combo'),
            comboLabel: document.getElementById('hud-combo-label'),
            accuracy: document.getElementById('hud-accuracy'),
            healthBar: document.getElementById('health-bar')
        };
    }

    /**
     * Initialize results screen elements
     */
    initResultsElements() {
        // Updated to match HTML IDs (results-* format)
        this.resultsElements = {
            grade: document.getElementById('results-grade'),
            score: document.getElementById('results-score'),
            accuracy: document.getElementById('results-accuracy'),
            maxCombo: document.getElementById('results-max-combo'),
            count300: document.getElementById('results-count-300'),
            count100: document.getElementById('results-count-100'),
            count50: document.getElementById('results-count-50'),
            countMiss: document.getElementById('results-count-miss'),
            title: document.getElementById('results-title'),
            beatmap: document.getElementById('results-beatmap'),
            mods: document.getElementById('results-mods-list'),
            pp: document.getElementById('results-pp')
        };
    }

    /**
     * Initialize mod buttons from existing HTML structure
     */
    initModButtons() {
        // Get all mod buttons from HTML
        const buttons = document.querySelectorAll('.mod-btn[data-flag]');
        
        buttons.forEach(button => {
            const flag = parseInt(button.dataset.flag);
            
            button.addEventListener('click', () => {
                this.emit('modToggle', flag);
            });
            
            this.modButtons.push({ element: button, flag: flag });
        });
    }

    /**
     * Initialize main event listeners for UI buttons
     */
    initEventListeners() {
        // Menu buttons
        this.addClickListener('btn-play', () => this.emit('play'));
        this.addClickListener('btn-settings', () => this.showScreen('screen-settings'));
        this.addClickListener('btn-help', () => this.showScreen('screen-help'));
        
        // Song select buttons
        this.addClickListener('btn-mods', () => this.emit('openMods'));
        this.addClickListener('btn-back-menu', () => this.emit('backToMenu'));
        this.addClickListener('btn-play-beatmap', () => this.emit('startGame'));
        
        // Mod select buttons
        this.addClickListener('btn-close-mods', () => this.emit('closeMods'));
        this.addClickListener('btn-reset-mods', () => this.emit('resetMods'));
        
        // Pause screen buttons
        this.addClickListener('btn-resume', () => this.emit('resume'));
        this.addClickListener('btn-retry', () => this.emit('retry'));
        this.addClickListener('btn-quit', () => this.emit('quit'));
        
        // Results screen buttons
        this.addClickListener('btn-retry-results', () => this.emit('retry'));
        this.addClickListener('btn-back-results', () => this.emit('quit'));
        
        // Failed screen buttons
        this.addClickListener('btn-retry-failed', () => this.emit('retry'));
        this.addClickListener('btn-quit-failed', () => this.emit('quit'));
        
        // Settings close button
        this.addClickListener('btn-close-settings', () => this.showScreen('screen-menu'));
        this.addClickListener('btn-save-settings', () => this.showScreen('screen-menu'));
        
        // Help close button
        this.addClickListener('btn-close-help', () => this.showScreen('screen-menu'));
        
        // Error dismiss button
        this.addClickListener('btn-error-dismiss', () => {
            const errorScreen = this.screens['screen-error'];
            if (errorScreen) {
                errorScreen.classList.remove('active');
            }
        });
    }

    /**
     * Helper to add click listener to element by ID
     */
    addClickListener(id, callback) {
        const element = document.getElementById(id);
        if (element) {
            element.addEventListener('click', callback);
        }
    }

    /**
     * Event emitter pattern for UI events
     */
    on(event, callback) {
        if (!this.callbacks[event]) {
            this.callbacks[event] = [];
        }
        this.callbacks[event].push(callback);
    }

    emit(event, data) {
        if (this.callbacks[event]) {
            this.callbacks[event].forEach(cb => cb(data));
        }
    }

    /**
     * Show a specific screen, hiding all others
     */
    showScreen(screenId) {
        // Hide all screens
        Object.values(this.screens).forEach(screen => {
            if (screen) {
                screen.classList.remove('active');
            }
        });

        // Hide gameplay HUD by default
        if (this.gameplayHud) {
            this.gameplayHud.classList.add('hidden');
        }

        // Handle gameplay state separately (show HUD, hide screens)
        if (screenId === 'gameplay' || screenId === 'gameplay-screen') {
            if (this.gameplayHud) {
                this.gameplayHud.classList.remove('hidden');
            }
            this.currentScreen = 'gameplay';
            return;
        }

        // Show the requested screen
        const screen = this.screens[screenId];
        if (screen) {
            screen.classList.add('active');
            this.currentScreen = screenId;
        } else {
            console.warn(`Screen not found: ${screenId}`);
        }
    }

    /**
     * Update loading screen progress
     */
    updateLoadingProgress(progress, text = '') {
        if (this.loadingBar) {
            this.loadingBar.style.width = `${progress * 100}%`;
        }
        if (this.loadingText && text) {
            this.loadingText.textContent = text;
        }
    }

    /**
     * Update HUD elements during gameplay
     */
    updateHUD(data) {
        if (this.hud.score) {
            this.hud.score.textContent = String(Math.floor(data.score)).padStart(8, '0');
        }
        
        if (this.hud.combo) {
            if (data.combo > 0) {
                this.hud.combo.textContent = `${data.combo}`;
                if (this.hud.comboLabel) {
                    this.hud.comboLabel.textContent = 'x';
                }
            } else {
                this.hud.combo.textContent = '';
                if (this.hud.comboLabel) {
                    this.hud.comboLabel.textContent = '';
                }
            }
        }
        
        if (this.hud.accuracy) {
            this.hud.accuracy.textContent = `${data.accuracy.toFixed(2)}%`;
        }
        
        if (this.hud.healthBar) {
            this.hud.healthBar.style.width = `${data.health}%`;
            
            // Color based on health level
            if (data.health > 50) {
                this.hud.healthBar.style.backgroundColor = '#4ade80';
            } else if (data.health > 25) {
                this.hud.healthBar.style.backgroundColor = '#fb923c';
            } else {
                this.hud.healthBar.style.backgroundColor = '#ef4444';
            }
        }
    }

    /**
     * Update mod button visual states
     */
    updateModButtons(activeMods) {
        this.modButtons.forEach(({ element, flag }) => {
            if (activeMods & flag) {
                element.classList.add('active');
            } else {
                element.classList.remove('active');
            }
        });

        // Update score multiplier display
        this.updateScoreMultiplier(activeMods);
    }

    /**
     * Update score multiplier display based on active mods
     */
    updateScoreMultiplier(activeMods) {
        const multiplierElement = document.getElementById('score-multiplier');
        const modMultiplierElement = document.getElementById('mod-total-multiplier');
        
        let multiplier = 1.0;
        
        if (activeMods & MOD_FLAGS.EASY) multiplier *= 0.5;
        if (activeMods & MOD_FLAGS.NO_FAIL) multiplier *= 0.5;
        if (activeMods & MOD_FLAGS.HALF_TIME) multiplier *= 0.3;
        if (activeMods & MOD_FLAGS.HARD_ROCK) multiplier *= 1.06;
        if (activeMods & MOD_FLAGS.DOUBLE_TIME) multiplier *= 1.12;
        if (activeMods & MOD_FLAGS.HIDDEN) multiplier *= 1.06;
        if (activeMods & MOD_FLAGS.FLASHLIGHT) multiplier *= 1.12;
        
        // Unranked mods
        if (activeMods & (MOD_FLAGS.RELAX | MOD_FLAGS.AUTOPILOT | MOD_FLAGS.AUTO)) {
            multiplier = 0;
        }

        const displayText = multiplier === 0 
            ? 'Unranked' 
            : `${multiplier.toFixed(2)}x`;
            
        if (multiplierElement) {
            multiplierElement.textContent = displayText;
        }
        if (modMultiplierElement) {
            modMultiplierElement.textContent = displayText;
        }
    }

    /**
     * Show countdown before gameplay starts
     */
    async showCountdown() {
        return new Promise(resolve => {
            const countdownScreen = this.screens['screen-countdown'];
            const countdownNumber = document.getElementById('countdown-number');
            
            if (!countdownScreen || !countdownNumber) {
                resolve();
                return;
            }

            countdownScreen.classList.add('active');
            let count = 3;
            
            const updateCountdown = () => {
                if (count > 0) {
                    countdownNumber.textContent = count;
                    countdownNumber.classList.remove('pulse');
                    void countdownNumber.offsetWidth; // Force reflow
                    countdownNumber.classList.add('pulse');
                    count--;
                    this.countdownTimeout = setTimeout(updateCountdown, 1000);
                } else if (count === 0) {
                    countdownNumber.textContent = 'GO!';
                    countdownNumber.classList.remove('pulse');
                    void countdownNumber.offsetWidth;
                    countdownNumber.classList.add('pulse');
                    count--;
                    this.countdownTimeout = setTimeout(updateCountdown, 500);
                } else {
                    countdownScreen.classList.remove('active');
                    resolve();
                }
            };
            
            updateCountdown();
        });
    }

    /**
     * Cancel any active countdown
     */
    cancelCountdown() {
        if (this.countdownTimeout) {
            clearTimeout(this.countdownTimeout);
            this.countdownTimeout = null;
        }
        const countdownScreen = this.screens['screen-countdown'];
        if (countdownScreen) {
            countdownScreen.classList.remove('active');
        }
    }

    /**
     * Show results screen with game data
     */
    showResults(data) {
        // Update all result fields
        if (this.resultsElements.grade) {
            this.resultsElements.grade.textContent = data.grade;
            this.resultsElements.grade.className = `grade-letter grade-${data.grade.toLowerCase().replace('+', 'plus')}`;
        }
        
        if (this.resultsElements.score) {
            this.resultsElements.score.textContent = data.score.toLocaleString();
        }
        
        if (this.resultsElements.accuracy) {
            this.resultsElements.accuracy.textContent = `${data.accuracy.toFixed(2)}%`;
        }
        
        if (this.resultsElements.maxCombo) {
            this.resultsElements.maxCombo.textContent = `${data.maxCombo}x`;
        }
        
        if (this.resultsElements.count300) {
            this.resultsElements.count300.textContent = data.count300;
        }
        
        if (this.resultsElements.count100) {
            this.resultsElements.count100.textContent = data.count100;
        }
        
        if (this.resultsElements.count50) {
            this.resultsElements.count50.textContent = data.count50;
        }
        
        if (this.resultsElements.countMiss) {
            this.resultsElements.countMiss.textContent = data.countMiss;
        }
        
        if (this.resultsElements.title) {
            this.resultsElements.title.textContent = 'Results';
        }
        
        if (this.resultsElements.beatmap) {
            this.resultsElements.beatmap.textContent = `${data.title || 'Unknown'} [${data.version || ''}]`;
        }

        this.showScreen('screen-results');
    }

    /**
     * Show failed screen
     */
    showFailed() {
        this.showScreen('screen-failed');
    }

    /**
     * Show pause overlay
     */
    showPause() {
        const pauseScreen = this.screens['screen-paused'];
        if (pauseScreen) {
            pauseScreen.classList.add('active');
        }
    }

    /**
     * Hide pause overlay
     */
    hidePause() {
        const pauseScreen = this.screens['screen-paused'];
        if (pauseScreen) {
            pauseScreen.classList.remove('active');
        }
    }

    /**
     * Update song info display in song select
     */
    updateSongInfo(beatmap) {
        const titleEl = document.getElementById('beatmap-title');
        const artistEl = document.getElementById('beatmap-artist');
        const mapperEl = document.getElementById('beatmap-mapper');
        const versionEl = document.getElementById('beatmap-version');
        
        if (titleEl) titleEl.textContent = beatmap.title || 'Unknown';
        if (artistEl) artistEl.textContent = beatmap.artist || 'Unknown Artist';
        if (mapperEl) mapperEl.textContent = beatmap.creator || 'Unknown';
        if (versionEl) versionEl.textContent = beatmap.version || '';

        // Update difficulty stats
        this.updateDifficultyStats(beatmap);
        
        // Enable play button
        const playBtn = document.getElementById('btn-play-beatmap');
        if (playBtn) {
            playBtn.disabled = false;
        }
    }

    /**
     * Update difficulty stats display
     */
    updateDifficultyStats(beatmap) {
        const stats = [
            { id: 'stat-cs', value: beatmap.circleSize },
            { id: 'stat-ar', value: beatmap.approachRate },
            { id: 'stat-od', value: beatmap.overallDifficulty },
            { id: 'stat-hp', value: beatmap.hpDrainRate }
        ];

        stats.forEach(stat => {
            const barEl = document.getElementById(stat.id);
            const valueEl = document.getElementById(`${stat.id}-value`);
            
            const value = stat.value || 0;
            
            if (barEl) {
                barEl.style.width = `${value * 10}%`;
            }
            if (valueEl) {
                valueEl.textContent = value.toFixed(1);
            }
        });

        // Update object counts
        const circleCount = document.getElementById('count-circles');
        const sliderCount = document.getElementById('count-sliders');
        const spinnerCount = document.getElementById('count-spinners');
        
        if (beatmap.hitObjects) {
            let circles = 0, sliders = 0, spinners = 0;
            beatmap.hitObjects.forEach(obj => {
                if (obj.type & 1) circles++;
                else if (obj.type & 2) sliders++;
                else if (obj.type & 8) spinners++;
            });
            
            if (circleCount) circleCount.textContent = circles;
            if (sliderCount) sliderCount.textContent = sliders;
            if (spinnerCount) spinnerCount.textContent = spinners;
        }
        
        // Update star rating
        const starValue = document.getElementById('star-value');
        if (starValue && beatmap.starRating) {
            starValue.textContent = beatmap.starRating.toFixed(2);
        }
    }

    /**
     * Show error message to user
     */
    showError(message) {
        const errorScreen = this.screens['screen-error'];
        const errorMessage = document.getElementById('error-message');
        
        if (errorScreen && errorMessage) {
            errorMessage.textContent = message;
            errorScreen.classList.add('active');
        } else {
            console.error('Game Error:', message);
            alert('Error: ' + message);
        }
    }

    /**
     * Reset HUD to initial values
     */
    resetHUD() {
        this.updateHUD({
            score: 0,
            combo: 0,
            accuracy: 100,
            health: 100
        });
    }

    /**
     * Cleanup UI state
     */
    cleanup() {
        this.cancelCountdown();
        this.hidePause();
        this.resetHUD();
    }
}

export default UIManager;
