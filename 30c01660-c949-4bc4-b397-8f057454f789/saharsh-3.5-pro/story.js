// Story Progression System
class Story {
    constructor() {
        this.currentChapter = 1;
        this.isInEnding = false;
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
        
        // Start betrayal dialogue
        setTimeout(() => {
            dialogue.showDialogue('rooftop_intro');
        }, 1000);
    }

    showBetrayalEnding() {
        this.isInEnding = true;
        
        // Dramatic screen effects
        ui.addScreenEffect('shake');
        ui.addScreenEffect('flash-red');
        
        // Show ending after a delay
        setTimeout(() => {
            ui.showEnding(
                'The Betrayal',
                'In a shocking twist of fate, the romance that burned so bright was extinguished by darkness. Yussef, the charming suitor, revealed his true intentions as poison took effect. What began as a beautiful love story ended in tragedy, leaving Saharsh as just another victim in Yussef\'s deadly game. Some promises are meant to be broken...',
                'bad'
            );
        }, 3000);
    }

    showBadEnding() {
        ui.showEnding(
            'Lost Love',
            'The romance faded before it could truly blossom. Without enough connection built through your adventures together, Saharsh realized that perhaps this wasn\'t meant to be. Sometimes, even the most promising beginnings don\'t lead to happy endings. Maybe next time, the stars will align differently...',
            'neutral'
        );
    }

    showGoodEnding() {
        ui.showEnding(
            'True Love',
            'Against all odds, your love conquered every challenge! Through romantic dinners and thrilling adventures, you and Saharsh built a connection that will last forever. This is just the beginning of your beautiful journey together...',
            'good'
        );
    }

    updateEnding(endingType) {
        const endingScene = document.getElementById('endingScene');
        
        switch(endingType) {
            case 'good':
                endingScene.style.background = 'linear-gradient(135deg, #FF69B4 0%, #FFB6C1 100%)';
                break;
            case 'bad':
                endingScene.style.background = 'linear-gradient(135deg, #1a0000 0%, #330000 100%)';
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
}

// Initialize story system
const story = new Story();
