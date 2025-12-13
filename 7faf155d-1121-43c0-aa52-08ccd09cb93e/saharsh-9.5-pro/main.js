/**
 * main.js - Entry Point for osu! Web Clone
 * Initializes the game, sets up canvas, and handles window events
 * Dependencies: game.js (and transitively all other modules)
 */

import { Game } from './game.js';

// Global game instance
let game = null;

/**
 * Initialize the game
 * @export
 */
export async function init() {
    try {
        // Get canvas element
        const canvas = document.getElementById('game-canvas');
        if (!canvas) {
            throw new Error('Game canvas not found');
        }

        // Set initial canvas size
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;

        // Create game instance
        game = new Game(canvas);

        // Setup window resize handler
        window.addEventListener('resize', () => {
            canvas.width = window.innerWidth;
            canvas.height = window.innerHeight;
            game.handleResize();
        });

        // Prevent default browser behaviors that interfere with gameplay
        setupInputPrevention();

        // Prevent context menu on canvas (right-click)
        canvas.addEventListener('contextmenu', (e) => {
            e.preventDefault();
        });

        // Setup visibility change handler
        document.addEventListener('visibilitychange', () => {
            if (document.hidden && game && game.state === 'playing') {
                // Auto-pause when tab loses focus
                game.pauseGame();
            }
        });

        // Cleanup on page unload
        window.addEventListener('beforeunload', () => {
            if (game) {
                game.stopGameLoop();
            }
        });

        // Initialize and start the game
        await game.initialize();
        console.log('osu! Web Clone initialized successfully');

        // Export game instance for debugging
        window.osuGame = () => game;

    } catch (error) {
        console.error('Failed to initialize game:', error);
        showErrorScreen(error.message);
    }
}

/**
 * Setup input prevention for gameplay keys
 */
function setupInputPrevention() {
    document.addEventListener('keydown', (e) => {
        // Prevent scrolling on arrow keys and space
        const preventKeys = ['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', ' ', 'Space'];
        if (preventKeys.includes(e.key) || preventKeys.includes(e.code)) {
            e.preventDefault();
        }
    });

    // Prevent drag on canvas
    const canvas = document.getElementById('game-canvas');
    if (canvas) {
        canvas.addEventListener('dragstart', (e) => e.preventDefault());
        canvas.addEventListener('drop', (e) => e.preventDefault());
    }

    // Prevent selection during gameplay
    document.addEventListener('selectstart', (e) => {
        if (game && (game.state === 'playing' || game.state === 'countdown')) {
            e.preventDefault();
        }
    });
}

/**
 * Show error screen when initialization fails
 */
function showErrorScreen(message) {
    // Hide loading screen if visible
    const loadingScreen = document.getElementById('screen-loading');
    if (loadingScreen) {
        loadingScreen.classList.remove('active');
    }

    // Show error screen
    const errorScreen = document.getElementById('screen-error');
    const errorMessage = document.getElementById('error-message');
    
    if (errorScreen && errorMessage) {
        errorMessage.textContent = message;
        errorScreen.classList.add('active');
    } else {
        // Fallback if error screen doesn't exist
        alert('Failed to load game: ' + message);
    }
}
