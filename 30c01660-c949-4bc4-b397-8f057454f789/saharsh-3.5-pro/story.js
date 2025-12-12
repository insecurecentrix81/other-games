// Enhanced Story Progression System
class Story {
    constructor() {
        this.currentChapter = 1;
        this.isInEnding = false;
        this.endings = {
            perfect: {
                title: 'Perfect Love Story',
                text: 'Against all odds, your love conquered every challenge! Through romantic dinners and thrilling adventures, you and Saharsh built a connection that transcends time. This wasn\'t just a romance - it was destiny. Your charm, dedication, and genuine affection created a love story that will be told for generations. The stars aligned, and you found your soulmate.',
                requirements: { love: 95, charm: 3, dates: 10 }
            },
            good: {
                title: 'Happy Ever After',
                text: 'Your journey together was filled with laughter, adventure, and growing affection. Through dates at wonderful restaurants and exciting mini-games, you built a strong foundation of trust and love. Saharsh fell deeply for you, and together you\'ve started a beautiful chapter that promises many more happy memories to come.',
                requirements: { love: 80, dates: 8 }
            },
            neutral: {
                title: 'Just Friends',
                text: 'While the spark was there, it never quite ignited into the flame of true love. You shared some nice moments together, but in the end, you both realized you were better as friends. Sometimes the most mature decision is acknowledging when something isn\'t meant to be, and moving forward with mutual respect.',
                requirements: { love: 60, dates: 5 }
            },
            betrayal: {
                title: 'The Betrayal',
                text: 'In a shocking twist of fate, the romance that burned so bright was extinguished by darkness. Yussef, the charming suitor, revealed his true intentions as poison took effect. What began as a beautiful love story ended in tragedy, leaving Saharsh as just another victim in Yussef\'s deadly game. Some promises are meant to be broken...',
                requirements: { love: 40, dates: 3 }
            },
            bad: {
                title: 'Heartbreak',
                text: 'The romance faded before it could truly blossom. Without enough connection built through your adventures together, Saharsh realized that perhaps this wasn\'t meant to be. The dates felt forced, the conversations never deepened, and eventually, you both drifted apart. Not every story has a happy ending, but there\'s always a lesson learned.',
                requirements: { love: 0, dates: 2 }
            }
        };
    }

    advanceStory() {
        this.currentChapter = game.state.currentChapter;
        
        switch(this.currentChapter) {
            case 1:
                this.playFirstMeetingScene();
                break;
            case 2:
                this.playDevelopingRelationshipScene();
                break;
            case 3:
                this.playDeepConnectionScene();
                break;
            case 4:
                this.playCommitmentScene();
                break;
            case 5:
                this.playBetrayalScene();
                break;
        }
    }

    playFirstMeetingScene() {
        // Set the mood for first meeting
        dating.createRomanticAtmosphere();
        
        // Characters start neutral
        ui.setCharacterEmotion(game.characters.yussef, 'neutral');
        ui.setCharacterEmotion(game.characters.saharsh, 'neutral');
        
        // Start with restaurant dialogue
        const dialogueId = dialogue.getDialogueForRestaurant(game.state.currentRestaurant, 0);
        dialogue.showDialogue(dialogueId);
    }

    playDevelopingRelationshipScene() {
        // Characters are becoming more comfortable
        ui.setCharacterEmotion(game.characters.yussef, 'happy');
        ui.setCharacterEmotion(game.characters.saharsh, 'happy');
        
        // Move characters closer
        dating.updateCharacterPositionsBasedOnEmotion();
        
        // Start restaurant dialogue
        const dialogueId = dialogue.getDialogueForRestaurant(game.state.currentRestaurant, 0);
        dialogue.showDialogue(dialogueId);
    }

    playDeepConnectionScene() {
        // Deep emotional connection
        ui.setCharacterEmotion(game.characters.yussef, 'happy');
        ui.setCharacterEmotion(game.characters.saharsh, 'happy');
        
        // Create romantic atmosphere
        dating.createRomanticAtmosphere();
        
        // Start restaurant dialogue
        const dialogueId = dialogue.getDialogueForRestaurant(game.state.currentRestaurant, 0);
        dialogue.showDialogue(dialogueId);
    }

    playCommitmentScene() {
        // Serious romantic commitment
        ui.setCharacterEmotion(game.characters.yussef, 'neutral');
        ui.setCharacterEmotion(game.characters.saharsh, 'surprised');
        
        // Special romantic moment
        dating.triggerSpecialMoment();
        
        // Start restaurant dialogue
        const dialogueId = dialogue.getDialogueForRestaurant(game.state.currentRestaurant, 0);
        dialogue.showDialogue(dialogueId);
    }

    playBetrayalScene() {
        this.isInEnding = true;
        
        // Determine which ending based on player performance
        const ending = this.determineEnding();
        game.state.currentEnding = ending;
        
        // Set dramatic atmosphere
        ui.setRestaurantBackground({
            theme: 'rooftop',
            backgroundClass: 'rooftop-bg'
        });
        
        // Position characters for final scene
        const yussef = game.characters.yussef.element;
        const saharsh = game.characters.saharsh.element;
        
        yussef.style.left = '40%';
        saharsh.style.left = '50%';
        
        // Start appropriate dialogue
        if (ending === 'betrayal') {
            setTimeout(() => {
                dialogue.showDialogue('rooftop_intro');
            }, 1000);
        } else {
            this.showAlternateEnding(ending);
        }
    }

    determineEnding() {
        const love = game.state.loveMeter;
        const charm = game.state.upgrades.charm;
        const dates = game.state.currentDate;
        const charisma = game.state.upgrades.charisma;
        
        // Check perfect ending requirements
        if (love >= 95 && charm >= 3 && dates >= 10) {
            return 'perfect';
        }
        
        // Check good ending requirements
        if (love >= 80 && dates >= 8) {
            return 'good';
        }
        
        // Check neutral ending requirements
        if (love >= 60 && dates >= 5) {
            return 'neutral';
        }
        
        // Check betrayal ending requirements
        if (love >= 40 && dates >= 3 && charisma < 2) {
            return 'betrayal';
        }
        
        // Default to bad ending
        return 'bad';
    }

    showAlternateEnding(endingType) {
        const ending = this.endings[endingType];
        
        // Create appropriate scene
        setTimeout(() => {
            ui.showEnding(ending.title, ending.text, endingType);
            game.unlockEnding(endingType);
            
            // Give rewards based on ending quality
            const rewards = {
                perfect: 500,
                good: 300,
                neutral: 150,
                bad: 50
            };
            
            game.addCurrency(rewards[endingType] || 0);
            
            // Check achievements
            achievements.unlock(`ending_${endingType}`);
            
            // Save progress
            game.saveProgress();
        }, 2000);
    }

    showBetrayalEnding() {
        this.isInEnding = true;
        
        // Dramatic screen effects
        ui.addScreenEffect('shake');
        ui.addScreenEffect('flash-red');
        
        // Show ending after a delay
        setTimeout(() => {
            const ending = this.endings.betrayal;
            ui.showEnding(ending.title, ending.text, 'betrayal');
            game.unlockEnding('betrayal');
            game.addCurrency(100);
            achievements.unlock('ending_betrayal');
            game.saveProgress();
        }, 3000);
    }

    showBadEnding() {
        const ending = this.endings.bad;
        ui.showEnding(ending.title, ending.text, 'bad');
        game.unlockEnding('bad');
        game.addCurrency(50);
        achievements.unlock('ending_bad');
        game.saveProgress();
    }

    showGoodEnding() {
        const ending = this.endings.good;
        ui.showEnding(ending.title, ending.text, 'good');
        game.unlockEnding('good');
        game.addCurrency(300);
        achievements.unlock('ending_good');
        game.saveProgress();
    }

    showPerfectEnding() {
        const ending = this.endings.perfect;
        ui.showEnding(ending.title, ending.text, 'perfect');
        game.unlockEnding('perfect');
        game.addCurrency(500);
        achievements.unlock('ending_perfect');
        game.saveProgress();
    }

    updateEnding(endingType) {
        const endingScene = document.getElementById('endingScene');
        
        switch(endingType) {
            case 'perfect':
                endingScene.style.background = 'linear-gradient(135deg, #FFD700 0%, #FFA500 100%)';
                break;
            case 'good':
                endingScene.style.background = 'linear-gradient(135deg, #FF69B4 0%, #FFB6C1 100%)';
                break;
            case 'betrayal':
                endingScene.style.background = 'linear-gradient(135deg, #1a0000 0%, #330000 100%)';
                break;
            case 'bad':
                endingScene.style.background = 'linear-gradient(135deg, #2C3E50 0%, #34495E 100%)';
                break;
            case 'neutral':
                endingScene.style.background = 'linear-gradient(135deg, #2C3E50 0%, #34495E 100%)';
                break;
        }
    }

    createCutscene(scenes) {
        // Create a series of visual scenes
        let currentScene = 0;
        
        const playNextScene = () => {
            if (currentScene >= scenes.length) {
                return;
            }
            
            const scene = scenes[currentScene];
            
            // Apply scene effects
            if (scene.effect) {
                ui.addScreenEffect(scene.effect);
            }
            
            // Show dialogue
            if (scene.dialogue) {
                dialogue.showDialogue(scene.dialogue);
            }
            
            // Position characters
            if (scene.positions) {
                Object.entries(scene.positions).forEach(([character, position]) => {
                    const char = game.characters[character];
                    if (char && char.element) {
                        char.element.style.left = position.x;
                        char.element.style.top = position.y;
                    }
                });
            }
            
            currentScene++;
            
            // Auto-advance to next scene
            if (scene.duration) {
                setTimeout(playNextScene, scene.duration);
            }
        };
        
        playNextScene();
    }

    getChapterTitle(chapter) {
        const titles = {
            1: 'Chapter 1: First Glance',
            2: 'Chapter 2: Growing Closer',
            3: 'Chapter 3: Deep Connection',
            4: 'Chapter 4: The Promise',
            5: 'Chapter 5: The Final Night'
        };
        
        return titles[chapter] || 'Chapter ' + chapter;
    }

    displayChapterTitle() {
        const title = this.getChapterTitle(this.currentChapter);
        
        // Create title overlay
        const titleOverlay = document.createElement('div');
        titleOverlay.className = 'absolute inset-0 flex items-center justify-center bg-black/80 z-50';
        titleOverlay.innerHTML = `
            <div class="text-4xl font-bold text-pink-300 animate-pulse">
                ${title}
            </div>
        `;
        
        document.getElementById('gameContainer').appendChild(titleOverlay);
        
        // Remove after delay
        setTimeout(() => {
            titleOverlay.remove();
        }, 3000);
    }

    getEndingProgress() {
        const totalEndings = Object.keys(this.endings).length;
        const unlockedEndings = game.state.endingsUnlocked.length;
        return {
            total: totalEndings,
            unlocked: unlockedEndings,
            percentage: Math.floor((unlockedEndings / totalEndings) * 100)
        };
    }

    getEndingHint(endingType) {
        const hints = {
            perfect: 'Reach 95% love, max charm, and complete 10+ dates',
            good: 'Reach 80% love and complete 8+ dates',
            neutral: 'Reach 60% love and complete 5+ dates',
            betrayal: 'Moderate love (40-60%) with low charisma',
            bad: 'Low love and few dates'
        };
        
        return hints[endingType] || 'Unknown requirements';
    }
}

// Initialize story system
const story = new Story();
