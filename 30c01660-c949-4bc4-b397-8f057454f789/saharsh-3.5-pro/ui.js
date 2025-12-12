// UI Management System
class UI {
    constructor() {
        this.elements = {};
        this.animations = [];
        this.cacheElements();
    }

    cacheElements() {
        this.elements = {
            mainMenu: document.getElementById('mainMenu'),
            restaurantScene: document.getElementById('restaurantScene'),
            pacmanScene: document.getElementById('pacmanScene'),
            endingScene: document.getElementById('endingScene'),
            dialogueBox: document.getElementById('dialogueBox'),
            characterName: document.getElementById('characterName'),
            dialogueText: document.getElementById('dialogueText'),
            choices: document.getElementById('choices'),
            loveMeter: document.getElementById('loveMeter'),
            lovePercentage: document.getElementById('lovePercentage'),
            pacmanScore: document.getElementById('pacmanScore'),
            pacmanLives: document.getElementById('pacmanLives'),
            pacmanTime: document.getElementById('pacmanTime'),
            pacmanMessage: document.getElementById('pacmanMessage'),
            pacmanMessageText: document.getElementById('pacmanMessageText'),
            pacmanContinue: document.getElementById('pacmanContinue'),
            endingTitle: document.getElementById('endingTitle'),
            endingText: document.getElementById('endingText'),
            playMiniGame: document.getElementById('playMiniGame'),
            restaurantBackground: document.getElementById('restaurantBackground')
        };
    }

    showScene(sceneName) {
        // Hide all scenes with fade effect
        Object.values(this.elements).forEach(element => {
            if (element && element.classList && element.classList.contains('absolute')) {
                element.style.opacity = '0';
                setTimeout(() => {
                    element.classList.add('hidden');
                }, 300);
            }
        });

        // Show target scene
        setTimeout(() => {
            switch(sceneName) {
                case 'menu':
                    this.elements.mainMenu.classList.remove('hidden');
                    this.elements.mainMenu.style.opacity = '1';
                    break;
                case 'restaurant':
                    this.elements.restaurantScene.classList.remove('hidden');
                    this.elements.restaurantScene.style.opacity = '1';
                    break;
                case 'pacman':
                    this.elements.pacmanScene.classList.remove('hidden');
                    this.elements.pacmanScene.style.opacity = '1';
                    break;
                case 'ending':
                    this.elements.endingScene.classList.remove('hidden');
                    this.elements.endingScene.style.opacity = '1';
                    break;
            }
        }, 300);
    }

    showDialogue(characterName, text, choices = []) {
        this.elements.dialogueBox.classList.remove('hidden');
        this.elements.characterName.textContent = characterName;
        this.elements.dialogueText.textContent = text;
        
        // Clear previous choices
        this.elements.choices.innerHTML = '';
        
        // Add choice buttons
        choices.forEach((choice, index) => {
            const button = document.createElement('button');
            button.className = 'choice-button';
            button.textContent = choice.text;
            button.addEventListener('click', () => {
                dialogue.selectChoice(index);
            });
            this.elements.choices.appendChild(button);
        });

        // Auto-advance if no choices
        if (choices.length === 0) {
            setTimeout(() => {
                this.hideDialogue();
            }, 3000);
        }
    }

    hideDialogue() {
        this.elements.dialogueBox.classList.add('hidden');
        game.state.dialogueActive = false;
    }

    updateLoveMeter(percentage) {
        this.elements.loveMeter.style.width = percentage + '%';
        this.elements.lovePercentage.textContent = Math.floor(percentage) + '%';
        
        // Add pulse animation for increases
        if (percentage > game.state.loveMeter) {
            this.elements.loveMeter.classList.add('love-increase');
            setTimeout(() => {
                this.elements.loveMeter.classList.remove('love-increase');
            }, 500);
        }
    }

    updatePacmanUI(score, lives, time) {
        this.elements.pacmanScore.textContent = score;
        this.elements.pacmanLives.textContent = lives;
        this.elements.pacmanTime.textContent = time;
    }

    showPacmanMessage(message, showContinue = true) {
        this.elements.pacmanMessage.classList.remove('hidden');
        this.elements.pacmanMessageText.textContent = message;
        this.elements.pacmanContinue.style.display = showContinue ? 'block' : 'none';
    }

    hidePacmanMessage() {
        this.elements.pacmanMessage.classList.add('hidden');
    }

    showEnding(title, text, type = 'neutral') {
        this.elements.endingTitle.textContent = title;
        this.elements.endingText.textContent = text;
        
        // Apply ending style
        this.elements.endingScene.className = 'absolute inset-0 bg-black flex items-center justify-center';
        this.elements.endingScene.classList.add(`ending-${type}`);
        
        this.showScene('ending');
    }

    setRestaurantBackground(restaurant) {
        const bg = this.elements.restaurantBackground;
        bg.className = 'w-full h-full bg-cover bg-center';
        
        // Apply theme-based background
        switch(restaurant.theme) {
            case 'italian':
                bg.style.background = 'linear-gradient(rgba(0,0,0,0.4), rgba(0,0,0,0.4)), #8B4513';
                break;
            case 'japanese':
                bg.style.background = 'linear-gradient(rgba(0,0,0,0.4), rgba(0,0,0,0.4)), #1C1C1C';
                break;
            case 'american':
                bg.style.background = 'linear-gradient(rgba(0,0,0,0.4), rgba(0,0,0,0.4)), #2C5F2D';
                break;
            case 'french':
                bg.style.background = 'linear-gradient(rgba(0,0,0,0.4), rgba(0,0,0,0.4)), #4A4A4A';
                break;
            case 'rooftop':
                bg.style.background = 'linear-gradient(rgba(0,0,0,0.3), rgba(0,0,0,0.3)), linear-gradient(to bottom, #87CEEB, #FFB6C1)';
                break;
        }
    }

    animateCharacterEntry(character, delay = 0) {
        setTimeout(() => {
            character.element.classList.add('character-enter');
        }, delay);
    }

    setCharacterEmotion(character, emotion) {
        character.emotion = emotion;
        character.element.className = character.element.className.replace(/emotion-\w+/g, '');
        character.element.classList.add(`emotion-${emotion}`);
        
        // Apply emotion-based visual changes
        switch(emotion) {
            case 'happy':
                character.element.style.filter = 'brightness(1.2) saturate(1.3)';
                break;
            case 'sad':
                character.element.style.filter = 'brightness(0.7) grayscale(0.5)';
                break;
            case 'angry':
                character.element.style.filter = 'hue-rotate(180deg) saturate(1.5)';
                break;
            case 'surprised':
                character.element.style.transform = 'scale(1.1)';
                break;
            default:
                character.element.style.filter = 'none';
                character.element.style.transform = 'none';
        }
    }

    showMiniGameButton(show = true) {
        this.elements.playMiniGame.style.display = show ? 'block' : 'none';
    }

    addScreenEffect(effect) {
        const body = document.body;
        
        switch(effect) {
            case 'shake':
                body.classList.add('screen-shake');
                setTimeout(() => body.classList.remove('screen-shake'), 500);
                break;
            case 'flash-red':
                body.classList.add('flash-red');
                setTimeout(() => body.classList.remove('flash-red'), 500);
                break;
            case 'fade-to-black':
                body.style.transition = 'opacity 1s';
                body.style.opacity = '0';
                setTimeout(() => {
                    body.style.opacity = '1';
                }, 1000);
                break;
        }
    }

    createFloatingText(text, x, y, color = '#FFD700') {
        const floatingText = document.createElement('div');
        floatingText.textContent = text;
        floatingText.style.cssText = `
            position: absolute;
            left: ${x}px;
            top: ${y}px;
            color: ${color};
            font-size: 24px;
            font-weight: bold;
            pointer-events: none;
            z-index: 1000;
            animation: floatUp 2s ease-out forwards;
        `;
        
        document.body.appendChild(floatingText);
        
        setTimeout(() => {
            floatingText.remove();
        }, 2000);
    }

    showLoadingScreen(show = true) {
        const loadingScreen = document.getElementById('loadingScreen');
        if (show) {
            loadingScreen.classList.remove('hidden');
        } else {
            loadingScreen.classList.add('hidden');
        }
    }
}

// Add floating animation
const style = document.createElement('style');
style.textContent = `
    @keyframes floatUp {
        0% {
            transform: translateY(0);
            opacity: 1;
        }
        100% {
            transform: translateY(-100px);
            opacity: 0;
        }
    }
`;
document.head.appendChild(style);

// Initialize UI
const ui = new UI();
