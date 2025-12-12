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
            upgradesMenu: document.getElementById('upgradesMenu'),
            achievementsMenu: document.getElementById('achievementsMenu'),
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
            pacmanWave: document.getElementById('pacmanWave'),
            pacmanMessage: document.getElementById('pacmanMessage'),
            pacmanMessageText: document.getElementById('pacmanMessageText'),
            pacmanContinue: document.getElementById('pacmanContinue'),
            endingTitle: document.getElementById('endingTitle'),
            endingText: document.getElementById('endingText'),
            newAchievement: document.getElementById('newAchievement'),
            playMiniGame: document.getElementById('playMiniGame'),
            restaurantBackground: document.getElementById('restaurantBackground'),
            currencyDisplay: document.getElementById('currencyDisplay'),
            sceneCurrency: document.getElementById('sceneCurrency'),
            shopCurrency: document.getElementById('shopCurrency'),
            dateNumber: document.getElementById('dateNumber'),
            comboDisplay: document.getElementById('comboDisplay'),
            comboText: document.getElementById('comboText'),
            upgradesGrid: document.getElementById('upgradesGrid'),
            achievementsGrid: document.getElementById('achievementsGrid'),
            achievementCount: document.getElementById('achievementCount'),
            powerupsDisplay: document.getElementById('powerupsDisplay'),
            powerupsList: document.getElementById('powerupsList')
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
                case 'upgrades':
                    this.elements.upgradesMenu.classList.remove('hidden');
                    this.elements.upgradesMenu.style.opacity = '1';
                    this.updateUpgradesDisplay();
                    break;
                case 'achievements':
                    this.elements.achievementsMenu.classList.remove('hidden');
                    this.elements.achievementsMenu.style.opacity = '1';
                    this.updateAchievementsDisplay();
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

    showUpgradesMenu() {
        this.showScene('upgrades');
    }

    hideUpgradesMenu() {
        this.elements.upgradesMenu.classList.add('hidden');
    }

    showAchievementsMenu() {
        this.showScene('achievements');
    }

    hideAchievementsMenu() {
        this.elements.achievementsMenu.classList.add('hidden');
    }

    updateUpgradesDisplay() {
        this.elements.shopCurrency.textContent = game.state.currency;
        this.elements.upgradesGrid.innerHTML = '';
        
        upgrades.upgrades.forEach(upgrade => {
            const isPurchased = upgrades.isPurchased(upgrade);
            const canAfford = upgrades.canAfford(upgrade);
            
            const card = document.createElement('div');
            card.className = `upgrade-card bg-gray-800 p-4 rounded-lg border-2 ${
                isPurchased ? 'border-green-500 purchased' : 
                canAfford ? 'border-blue-500 hover:border-blue-400' : 'border-gray-600 opacity-50'
            }`;
            
            card.innerHTML = `
                <div class="text-3xl mb-2 text-center">${upgrade.icon}</div>
                <h3 class="font-bold text-lg mb-2">${upgrade.name}</h3>
                <p class="text-sm text-gray-400 mb-3">${upgrade.description}</p>
                <div class="flex justify-between items-center">
                    <span class="text-yellow-400 font-bold">💰 ${upgrade.cost}</span>
                    ${isPurchased ? 
                        '<span class="text-green-400">✓ Owned</span>' : 
                        canAfford ? 
                        '<button class="px-3 py-1 bg-blue-600 hover:bg-blue-700 rounded text-sm">Buy</button>' :
                        '<span class="text-red-400">Too Expensive</span>'
                    }
                </div>
            `;
            
            if (!isPurchased && canAfford) {
                const buyButton = card.querySelector('button');
                buyButton.addEventListener('click', () => {
                    upgrades.purchaseUpgrade(upgrade.id);
                });
            }
            
            this.elements.upgradesGrid.appendChild(card);
        });
    }

    updateAchievementsDisplay() {
        this.elements.achievementCount.textContent = achievements.getUnlockedCount();
        this.elements.achievementsGrid.innerHTML = '';
        
        achievements.achievements.forEach(achievement => {
            const card = document.createElement('div');
            card.className = `p-3 rounded-lg border-2 ${
                achievement.unlocked ? 'bg-yellow-900 border-yellow-500' : 'bg-gray-800 border-gray-600'
            }`;
            
            card.innerHTML = `
                <div class="text-2xl mb-1 text-center">${achievement.unlocked ? achievement.icon : '🔒'}</div>
                <h4 class="font-bold text-sm mb-1">${achievement.name}</h4>
                <p class="text-xs text-gray-400">${achievement.description}</p>
                ${achievement.unlocked ? '<div class="text-xs text-green-400 mt-1">✓ Unlocked</div>' : ''}
            `;
            
            this.elements.achievementsGrid.appendChild(card);
        });
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

    updatePacmanUI(score, lives, time, wave = 1) {
        this.elements.pacmanScore.textContent = score;
        this.elements.pacmanLives.textContent = lives;
        this.elements.pacmanTime.textContent = time;
        this.elements.pacmanWave.textContent = wave;
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
        
        // Show achievement
        const achievementName = type === 'perfect' ? 'Perfect Romance' : 
                               type === 'good' ? 'Happy Ending' :
                               type === 'betrayal' ? 'The Betrayal' :
                               type === 'bad' ? 'Heartbreak' : 'Just Friends';
        this.elements.newAchievement.textContent = achievementName;
        
        // Apply ending style
        this.elements.endingScene.className = 'absolute inset-0 bg-black flex items-center justify-center';
        
        switch(type) {
            case 'perfect':
                this.elements.endingScene.style.background = 'linear-gradient(135deg, #FFD700 0%, #FFA500 100%)';
                break;
            case 'good':
                this.elements.endingScene.style.background = 'linear-gradient(135deg, #FF69B4 0%, #FFB6C1 100%)';
                break;
            case 'betrayal':
                this.elements.endingScene.style.background = 'linear-gradient(135deg, #1a0000 0%, #330000 100%)';
                break;
            case 'bad':
                this.elements.endingScene.style.background = 'linear-gradient(135deg, #2C3E50 0%, #34495E 100%)';
                break;
            default:
                this.elements.endingScene.style.background = 'linear-gradient(135deg, #2C3E50 0%, #34495E 100%)';
        }
        
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
            case 'mexican':
                bg.style.background = 'linear-gradient(rgba(0,0,0,0.4), rgba(0,0,0,0.4)), #D2691E';
                break;
            case 'chinese':
                bg.style.background = 'linear-gradient(rgba(0,0,0,0.4), rgba(0,0,0,0.4)), #8B0000';
                break;
            case 'indian':
                bg.style.background = 'linear-gradient(rgba(0,0,0,0.4), rgba(0,0,0,0.4)), #FF6347';
                break;
            case 'greek':
                bg.style.background = 'linear-gradient(rgba(0,0,0,0.4), rgba(0,0,0,0.4)), #4682B4';
                break;
            case 'secret':
                bg.style.background = 'linear-gradient(rgba(0,0,0,0.3), rgba(0,0,0,0.3)), linear-gradient(45deg, #9400D3, #4B0082, #0000FF)';
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

    showPowerUp(type, duration) {
        const powerUpElement = document.createElement('div');
        powerUpElement.className = 'text-yellow-400 font-bold';
        
        switch(type) {
            case 'speed':
                powerUpElement.textContent = '⚡ Speed Boost!';
                break;
            case 'invincible':
                powerUpElement.textContent = '🛡️ Invincible!';
                break;
            case 'magnet':
                powerUpElement.textContent = '🧲 Coin Magnet!';
                break;
            case 'double':
                powerUpElement.textContent = 'x2 Points!';
                break;
        }
        
        this.elements.powerupsList.appendChild(powerUpElement);
        
        setTimeout(() => {
            powerUpElement.remove();
        }, duration);
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

// Initialize UI
const ui = new UI();
