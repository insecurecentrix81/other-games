// Dialogue System
class Dialogue {
    constructor() {
        this.currentNode = null;
        this.dialogueTree = this.createDialogueTree();
        this.isActive = false;
    }

    createDialogueTree() {
        return {
            // Chapter 1: First Meeting
            'italian_intro': {
                speaker: 'saharsh',
                text: 'This Italian restaurant is beautiful, Yussef! How did you find it?',
                emotion: 'happy',
                choices: [
                    { text: 'Not as beautiful as you, my dear', loveImpact: 10, nextNode: 'italian_compliment' },
                    { text: 'I hoped you would like it', loveImpact: 5, nextNode: 'italian_neutral' },
                    { text: 'It was expensive, but worth it', loveImpact: -5, nextNode: 'italian_expensive' }
                ]
            },
            'italian_compliment': {
                speaker: 'saharsh',
                text: 'Oh Yussef, you always know what to say! You make me feel so special.',
                emotion: 'happy',
                loveImpact: 5,
                nextNode: 'italian_food'
            },
            'italian_neutral': {
                speaker: 'saharsh',
                text: 'It\'s lovely! The atmosphere is perfect for a first date.',
                emotion: 'neutral',
                loveImpact: 2,
                nextNode: 'italian_food'
            },
            'italian_expensive': {
                speaker: 'saharsh',
                text: 'You didn\'t have to spend so much... but I appreciate the gesture.',
                emotion: 'neutral',
                loveImpact: 0,
                nextNode: 'italian_food'
            },
            'italian_food': {
                speaker: 'yussef',
                text: 'The pasta here is supposed to be amazing. Should we order?',
                emotion: 'neutral',
                nextNode: 'italian_minigame'
            },
            'italian_minigame': {
                speaker: 'narrator',
                text: 'To impress Saharsh, you need to show your skills! Play the mini-game to earn love points!',
                emotion: 'neutral',
                nextNode: 'start_minigame'
            },

            // Chapter 2: Growing Connection
            'japanese_intro': {
                speaker: 'saharsh',
                text: 'Wow, a Japanese sushi bar! You\'re full of surprises, Yussef.',
                emotion: 'surprised',
                choices: [
                    { text: 'I wanted to try something new with you', loveImpact: 8, nextNode: 'japanese_romantic' },
                    { text: 'I heard this place has the best sushi', loveImpact: 4, nextNode: 'japanese_casual' },
                    { text: 'Hope you like raw fish', loveImpact: -3, nextNode: 'japanese_concerned' }
                ]
            },
            'japanese_romantic': {
                speaker: 'saharsh',
                text: 'That\'s so sweet! I love experiencing new things with you.',
                emotion: 'happy',
                loveImpact: 5,
                nextNode: 'japanese_deepening'
            },
            'japanese_casual': {
                speaker: 'saharsh',
                text: 'Great choice! I\'ve been wanting to try this place.',
                emotion: 'happy',
                loveImpact: 3,
                nextNode: 'japanese_deepening'
            },
            'japanese_concerned': {
                speaker: 'saharsh',
                text: 'I love sushi! Don\'t worry about me.',
                emotion: 'neutral',
                loveImpact: 1,
                nextNode: 'japanese_deepening'
            },
            'japanese_deepening': {
                speaker: 'yussef',
                text: 'I\'m really enjoying these dates with you, Saharsh.',
                emotion: 'neutral',
                nextNode: 'japanese_minigame'
            },
            'japanese_minigame': {
                speaker: 'narrator',
                text: 'Your connection is growing! Prove your worth in this challenging mini-game!',
                emotion: 'neutral',
                nextNode: 'start_minigame'
            },

            // Chapter 3: Deep Connection
            'american_intro': {
                speaker: 'saharsh',
                text: 'A classic American diner! This brings back memories.',
                emotion: 'happy',
                choices: [
                    { text: 'Tell me about your memories', loveImpact: 10, nextNode: 'american_personal' },
                    { text: 'I thought you might enjoy something casual', loveImpact: 6, nextNode: 'american_casual' },
                    { text: 'Milkshakes and burgers!', loveImpact: 3, nextNode: 'american_fun' }
                ]
            },
            'american_personal': {
                speaker: 'saharsh',
                text: 'My family used to come to places like this... I feel comfortable sharing this with you.',
                emotion: 'happy',
                loveImpact: 8,
                nextNode: 'american_trust'
            },
            'american_casual': {
                speaker: 'saharsh',
                text: 'Sometimes casual is the most romantic. Thanks for understanding.',
                emotion: 'happy',
                loveImpact: 4,
                nextNode: 'american_trust'
            },
            'american_fun': {
                speaker: 'saharsh',
                text: 'Haha, you know me so well! Let\'s get the biggest milkshake they have!',
                emotion: 'happy',
                loveImpact: 5,
                nextNode: 'american_trust'
            },
            'american_trust': {
                speaker: 'yussef',
                text: 'I feel like I can tell you anything, Saharsh. You\'ve become so important to me.',
                emotion: 'neutral',
                nextNode: 'american_minigame'
            },
            'american_minigame': {
                speaker: 'narrator',
                text: 'Trust is building! This mini-game will test your dedication!',
                emotion: 'neutral',
                nextNode: 'start_minigame'
            },

            // Chapter 4: Commitment
            'french_intro': {
                speaker: 'saharsh',
                text: 'Mon Dieu! A French café! Yussef, this is incredibly romantic.',
                emotion: 'surprised',
                choices: [
                    { text: 'Only the best for you, mon amour', loveImpact: 10, nextNode: 'french_commitment' },
                    { text: 'I wanted tonight to be special', loveImpact: 7, nextNode: 'french_special' },
                    { text: 'Croissants and coffee?', loveImpact: 2, nextNode: 'french_lighthearted' }
                ]
            },
            'french_commitment': {
                speaker: 'saharsh',
                text: 'Yussef... are you saying what I think you\'re saying?',
                emotion: 'surprised',
                loveImpact: 10,
                nextNode: 'french_future'
            },
            'french_special': {
                speaker: 'saharsh',
                text: 'Every moment with you is special. This is perfect.',
                emotion: 'happy',
                loveImpact: 6,
                nextNode: 'french_future'
            },
            'french_lighthearted': {
                speaker: 'saharsh',
                text: 'Haha, you always make me smile! But seriously, this is wonderful.',
                emotion: 'happy',
                loveImpact: 4,
                nextNode: 'french_future'
            },
            'french_future': {
                speaker: 'yussef',
                text: 'Saharsh, I\'ve been thinking about our future together...',
                emotion: 'neutral',
                nextNode: 'french_minigame'
            },
            'french_minigame': {
                speaker: 'narrator',
                text: 'The future is bright! One final challenge to prove your love!',
                emotion: 'neutral',
                nextNode: 'start_minigame'
            },

            // Chapter 5: The Betrayal
            'rooftop_intro': {
                speaker: 'saharsh',
                text: 'A rooftop restaurant under the stars... Yussef, this is the most romantic night of my life.',
                emotion: 'happy',
                choices: [
                    { text: 'I have something important to tell you', loveImpact: 5, nextNode: 'rooftop_serious' },
                    { text: 'I love you more than words can say', loveImpact: 10, nextNode: 'rooftop_love' },
                    { text: 'Let\'s celebrate our journey', loveImpact: 5, nextNode: 'rooftop_celebrate' }
                ]
            },
            'rooftop_serious': {
                speaker: 'saharsh',
                text: 'You seem serious... Is everything okay?',
                emotion: 'concerned',
                loveImpact: 0,
                nextNode: 'rooftop_wine'
            },
            'rooftop_love': {
                speaker: 'saharsh',
                text: 'Oh Yussef! I love you too! I\'ve never been this happy.',
                emotion: 'happy',
                loveImpact: 10,
                nextNode: 'rooftop_wine'
            },
            'rooftop_celebrate': {
                speaker: 'saharsh',
                text: 'Yes! To us! To our beautiful journey together!',
                emotion: 'happy',
                loveImpact: 5,
                nextNode: 'rooftop_wine'
            },
            'rooftop_wine': {
                speaker: 'yussef',
                text: 'I brought us some special wine to celebrate... Here, let me pour you a glass.',
                emotion: 'neutral',
                nextNode: 'rooftop_poison'
            },
            'rooftop_poison': {
                speaker: 'narrator',
                text: 'Yussef pours the wine with a steady hand. A small, almost invisible powder dissolves instantly in the red liquid...',
                emotion: 'neutral',
                nextNode: 'rooftop_drink'
            },
            'rooftop_drink': {
                speaker: 'saharsh',
                text: 'To our future! *drinks the wine* Mmm, this is... different... but good.',
                emotion: 'happy',
                nextNode: 'rooftop_effect'
            },
            'rooftop_effect': {
                speaker: 'saharsh',
                text: 'Yussef... I feel... dizzy... What\'s happening...?',
                emotion: 'scared',
                nextNode: 'rooftop_reveal'
            },
            'rooftop_reveal': {
                speaker: 'yussef',
                text: 'It\'s over, Saharsh. This was never about love. It was always about the end game.',
                emotion: 'cold',
                nextNode: 'rooftop_final'
            },
            'rooftop_final': {
                speaker: 'yussef',
                text: 'You were just a pawn in my game. Goodbye.',
                emotion: 'cold',
                nextNode: 'betrayal_ending'
            },

            // Endings
            'betrayal_ending': {
                speaker: 'narrator',
                text: 'And so, the romance that burned so bright ended in darkness. A tragic tale of love and betrayal.',
                emotion: 'neutral',
                nextNode: 'end_game'
            },
            'start_minigame': {
                speaker: 'narrator',
                text: '',
                emotion: 'neutral',
                nextNode: 'trigger_minigame'
            },
            'end_game': {
                speaker: 'narrator',
                text: '',
                emotion: 'neutral',
                nextNode: null
            }
        };
    }

    showDialogue(nodeId) {
        const node = this.dialogueTree[nodeId];
        if (!node) return;

        this.currentNode = node;
        this.isActive = true;
        game.state.dialogueActive = true;

        // Set character emotion
        if (node.speaker !== 'narrator') {
            const character = game.characters[node.speaker];
            if (character) {
                ui.setCharacterEmotion(character, node.emotion);
            }
        }

        // Check for special nodes
        if (node.nextNode === 'trigger_minigame') {
            ui.hideDialogue();
            game.startMiniGame();
            return;
        }

        if (node.nextNode === 'end_game') {
            ui.hideDialogue();
            story.showBetrayalEnding();
            return;
        }

        // Show dialogue
        const speakerName = node.speaker === 'narrator' ? '' : node.speaker + ':';
        ui.showDialogue(speakerName, node.text, node.choices || []);

        // Apply love impact if no choices
        if (!node.choices && node.loveImpact) {
            setTimeout(() => {
                game.updateLoveMeter(node.loveImpact);
            }, 1000);
        }
    }

    selectChoice(choiceIndex) {
        if (!this.currentNode || !this.currentNode.choices) return;

        const choice = this.currentNode.choices[choiceIndex];
        
        // Apply love impact
        if (choice.loveImpact) {
            game.updateLoveMeter(choice.loveImpact);
            
            // Show floating text for love changes
            const loveText = choice.loveImpact > 0 ? `+${choice.loveImpact} ❤️` : `${choice.loveImpact} 💔`;
            ui.createFloatingText(loveText, window.innerWidth / 2, window.innerHeight / 2);
        }

        // Hide current dialogue
        ui.hideDialogue();

        // Continue to next node
        if (choice.nextNode) {
            setTimeout(() => {
                this.showDialogue(choice.nextNode);
            }, 500);
        }
    }

    getDialogueForRestaurant(restaurantId, dateNumber) {
        // Return appropriate dialogue based on restaurant and date
        switch(restaurantId) {
            case 0: return 'italian_intro';
            case 1: return 'japanese_intro';
            case 2: return 'american_intro';
            case 3: return 'french_intro';
            case 4: return 'rooftop_intro';
            default: return 'italian_intro';
        }
    }
}

// Initialize dialogue system
const dialogue = new Dialogue();
