// Main Game Controller
class Game {
    constructor() {
        this.state = {
            currentScene: 'menu',
            currentChapter: 1,
            currentRestaurant: 0,
            currentDate: 0,
            loveMeter: 0,
            score: 0,
            isPaused: false,
            dialogueActive: false,
            miniGameActive: false,
            storyProgress: {}
        };

        this.characters = {
            yussef: {
                id: 'yussef',
                name: 'Yussef',
                emotion: 'neutral',
                element: null
            },
            saharsh: {
                id: 'saharsh',
                name: 'Saharsh',
                emotion: 'neutral',
                element: null
            }
        };

        this.restaurants = [
            {
                id: 0,
                name: 'Romantic Italian Bistro',
                theme: 'italian',
                difficulty: 1,
                backgroundClass: 'italian-bg'
            },
            {
                id: 1,
                name: 'Elegant Japanese Sushi Bar',
                theme: 'japanese',
                difficulty: 2,
                backgroundClass: 'japanese-bg'
            },
            {
                id: 2,
                name: 'Classic American Diner',
                theme: 'american',
                difficulty: 3,
                backgroundClass: 'american-bg'
            },
            {
                id: 3,
                name: 'Charming French Café',
                theme: 'french',
                difficulty: 4,
                backgroundClass: 'french-bg'
            },
            {
                id: 4,
                name: 'Rooftop Fine Dining',
                theme: 'rooftop',
                difficulty: 5,
                backgroundClass: 'rooftop-bg'
            }
        ];

        this.lastTime = 0;
        this.isRunning = false;
    }

    init() {
        this.setupEventListeners();
        this.cacheElements();
        this.isRunning = true;
        this.gameLoop();
    }

    cacheElements() {
        this.elements = {
            mainMenu: document.getElementById('mainMenu'),
            restaurantScene: document.getElementById('restaurantScene'),
            pacmanScene: document.getElementById('pacmanScene'),
            endingScene: document.getElementById('endingScene'),
            dialogueBox: document.getElementById('dialogueBox'),
            loveMeter: document.getElementById('loveMeter'),
            lovePercentage: document.getElementById('lovePercentage'),
            yussef: document.getElementById('yussef'),
            saharsh: document.getElementById('saharsh')
        };

        this.characters.yussef.element = this.elements.yussef;
        this.characters.saharsh.element = this.elements.saharsh;
    }

    setupEventListeners() {
        // Start button
        document.getElementById('startBtn').addEventListener('click', () => {
            this.startGame();
        });

        // Restart button
        document.getElementById('restartBtn').addEventListener('click', () => {
            this.restartGame();
        });

        // Mini game button
        document.getElementById('playMiniGame').addEventListener('click', () => {
            this.startMiniGame();
        });

        // Prevent scrolling with arrow keys and space
        window.addEventListener('keydown', (e) => {
            if(['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', ' '].includes(e.key)) {
                e.preventDefault();
            }
        });
    }

    startGame() {
        this.switchScene('restaurant');
        this.state.currentChapter = 1;
        this.state.loveMeter = 20; // Start with some initial attraction
        this.updateLoveMeter(0);
        
        // Display chapter title
        story.displayChapterTitle();
        
        // Start audio
        audio.playSceneAudio('restaurant');
        
        // Start first date
        setTimeout(() => {
            dating.startDate(0);
            story.advanceStory();
        }, 3500);
    }

    restartGame() {
        this.state = {
            currentScene: 'menu',
            currentChapter: 1,
            currentRestaurant: 0,
            currentDate: 0,
            loveMeter: 0,
            score: 0,
            isPaused: false,
            dialogueActive: false,
            miniGameActive: false,
            storyProgress: {}
        };
        
        this.switchScene('menu');
        this.updateLoveMeter(0);
    }

    switchScene(sceneName) {
        // Hide all scenes
        this.elements.mainMenu.classList.add('hidden');
        this.elements.restaurantScene.classList.add('hidden');
        this.elements.pacmanScene.classList.add('hidden');
        this.elements.endingScene.classList.add('hidden');

        // Show target scene
        switch(sceneName) {
            case 'menu':
                this.elements.mainMenu.classList.remove('hidden');
                audio.playSceneAudio('menu');
                break;
            case 'restaurant':
                this.elements.restaurantScene.classList.remove('hidden');
                audio.playSceneAudio('restaurant');
                break;
            case 'pacman':
                this.elements.pacmanScene.classList.remove('hidden');
                audio.playSceneAudio('pacman');
                pacman.init();
                break;
            case 'ending':
                this.elements.endingScene.classList.remove('hidden');
                audio.playSceneAudio('ending');
                break;
        }

        this.state.currentScene = sceneName;
    }

    updateLoveMeter(amount) {
        this.state.loveMeter = Math.max(0, Math.min(100, this.state.loveMeter + amount));
        this.elements.loveMeter.style.width = this.state.loveMeter + '%';
        this.elements.lovePercentage.textContent = Math.floor(this.state.loveMeter) + '%';
        
        // Add animation
        this.elements.loveMeter.classList.add('love-increase');
        setTimeout(() => {
            this.elements.loveMeter.classList.remove('love-increase');
        }, 500);

        // Check win/lose conditions
        if (this.state.loveMeter >= 100) {
            this.triggerFinalChapter();
        } else if (this.state.loveMeter <= 0) {
            this.triggerBadEnding();
        }
    }

    triggerFinalChapter() {
        this.state.currentChapter = 5;
        story.playBetrayalScene();
    }

    triggerBadEnding() {
        story.showBadEnding();
    }

    startMiniGame() {
        if (this.state.currentScene === 'restaurant') {
            this.switchScene('pacman');
            const restaurant = this.restaurants[this.state.currentRestaurant];
            pacman.startLevel(restaurant.difficulty);
        }
    }

    gameLoop(currentTime = 0) {
        if (!this.isRunning) return;

        const deltaTime = (currentTime - this.lastTime) / 1000;
        this.lastTime = currentTime;

        if (!this.state.isPaused) {
            this.update(deltaTime);
        }

        this.render();
        requestAnimationFrame((time) => this.gameLoop(time));
    }

    update(deltaTime) {
        // Update based on current scene
        switch(this.state.currentScene) {
            case 'pacman':
                if (pacman && pacman.isRunning) {
                    pacman.update(deltaTime);
                }
                break;
        }
    }

    render() {
        // Rendering handled by individual modules
    }

    pause() {
        this.state.isPaused = true;
    }

    resume() {
        this.state.isPaused = false;
    }
}

// Initialize game
const game = new Game();

// Start when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    game.init();
});
