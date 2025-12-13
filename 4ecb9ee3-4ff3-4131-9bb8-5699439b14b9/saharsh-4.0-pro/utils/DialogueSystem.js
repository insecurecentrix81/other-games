/**
 * DialogueSystem.js
 * Manages dialogue trees, choices, and transitions
 */

class DialogueSystem {
  constructor(scene) {
    this.scene = scene;
    this.stateManager = window.stateManager;
    this.relationshipManager = null;
    this.relationshipDialogues = new Map();
    
    // Dialogue state
    this.currentTree = null;
    this.currentNode = null;
    this.isDialogueActive = false;
    this.miniGamePending = null;
    this.awaitingInput = false;
    this.isTyping = false;
    this.currentText = '';
    
    // UI elements
    this.dialogueBox = null;
    this.dialogueText = null;
    this.choiceContainer = null;
    this.portraitImg = null;
    
    // Typing effect
    this.typingSpeed = 30; // ms per character
    this.typingInterval = null;
    this.currentCharIndex = 0;
    
    // Voiceover system
    this.currentVoice = null;
    this.voiceQueue = [];
    
    // Initialize dialogue UI
    this.initializeUI();
    
    // Bind events
    this.scene.events.on('pause', this.pause.bind(this));
    this.scene.events.on('resume', this.resume.bind(this));
  }

  /**
   * Initialize dialogue UI elements
   */
  initializeUI() {
    // Create dialogue container if it doesn't exist
    if (!document.querySelector('.dialogue-box')) {
      const container = document.createElement('div');
      container.className = 'dialogue-box';
      container.style.display = 'none';
      
      const content = document.createElement('div');
      content.className = 'dialogue-content';
      
      const portrait = document.createElement('div');
      portrait.className = 'dialogue-portrait';
      portrait.innerHTML = '<img src="assets/characters/eric_idle.png" alt="Eric" style="width:100%;height:100%;">';
      
      const textContainer = document.createElement('div');
      textContainer.className = 'dialogue-text';
      textContainer.innerHTML = '...';
      
      const choices = document.createElement('div');
      choices.className = 'choice-container';
      
      content.appendChild(portrait);
      content.appendChild(textContainer);
      content.appendChild(choices);
      container.appendChild(content);
      
      document.body.appendChild(container);
      
      // Store references
      this.dialogueBox = container;
      this.dialogueText = textContainer;
      this.choiceContainer = choices;
      this.portraitImg = portrait.querySelector('img');
    } else {
      this.dialogueBox = document.querySelector('.dialogue-box');
      this.dialogueText = document.querySelector('.dialogue-text');
      this.choiceContainer = document.querySelector('.choice-container');
      this.portraitImg = document.querySelector('.dialogue-portrait img');
    }
    
    // Add click handler for advancing dialogue
    this.dialogueBox.addEventListener('click', (e) => {
      this.handleDialogueClick(e);
    });
    
    // Add keyboard handler for advancing dialogue
    this.scene.input.keyboard.on('keydown-SPACE', (e) => {
      if (this.isDialogueActive && !this.awaitingInput && this.isTyping) {
        this.completeTyping();
        e.preventDefault();
      }
    });
    
    this.scene.input.keyboard.on('keydown-ENTER', (e) => {
      if (this.isDialogueActive && !this.awaitingInput && this.isTyping) {
        this.completeTyping();
        e.preventDefault();
      } else if (this.isDialogueActive && !this.awaitingInput && this.choiceContainer.children.length === 0) {
        this.advanceDialogue();
        e.preventDefault();
      }
    });
  }

  /**
   * Handle clicks on the dialogue box
   * @param {Event} e
   */
  handleDialogueClick(e) {
    if (!this.isDialogueActive) return;
    
    // If choices are visible, ignore click
    if (this.choiceContainer.children.length > 0) {
      return;
    }
    
    // If waiting for input, ignore double clicks
    if (this.awaitingInput) {
      this.awaitingInput = false;
      return;
    }
    
    // If typing, complete typing
    if (this.isTyping) {
      this.completeTyping();
      this.awaitingInput = true;
      return;
    }
    
    // Otherwise, advance to next node
    this.advanceDialogue();
    this.awaitingInput = true;
  }

  /**
   * Start a dialogue sequence
   * @param {string} treeKey - Key of dialogue tree to use
   * @param {Object} context - Additional context for the dialogue
   */
  startDialogue(treeKey, context = {}) {
    // Get the dialogue tree
    const tree = DIALOGUE_TREES[treeKey];
    if (!tree) {
      console.error(`Dialogue tree not found: ${treeKey}`);
      return;
    }
    
    // Store reference to relationship manager
    this.relationshipManager = this.scene.relationshipManager;
    
    // Reset dialogue state
    this.currentTree = tree;
    this.isDialogueActive = true;
    this.miniGamePending = null;
    this.context = context;
    
    // Show dialogue box
    this.dialogueBox.style.display = 'block';
    
    // Start with the first node
    this.currentNode = this.getNodeById(tree.startNode);
    if (!this.currentNode) {
      console.error(`Start node not found: ${tree.startNode} in tree ${treeKey}`);
      this.endDialogue();
      return;
    }
    
    this.displayCurrentNode();
    
    // Play background music for dialogue
    if (tree.music && this.scene.sound.exists(tree.music)) {
      this.scene.sound.play(tree.music, { 
        volume: this.stateManager.settings.musicVolume * 0.7,
        loop: true 
      });
      GAME_CONFIG.setActiveMusic(tree.music);
    }
  }

  /**
   * Display the current dialogue node
   */
  displayCurrentNode() {
    // Reset typing state
    this.isTyping = true;
    this.currentCharIndex = 0;
    this.currentText = '';
    
    // Clear previous choices
    this.choiceContainer.innerHTML = '';
    
    // Apply relationship and context modifiers to node
    const currentNode = this.applyModifiers(this.currentNode);
    
    // Show or hide portrait based on node properties
    if (currentNode.showPortrait === false) {
      this.dialogueBox.classList.add('no-portrait');
    } else {
      this.dialogueBox.classList.remove('no-portrait');
    }
    
    // Update portrait if specified
    if (currentNode.portrait) {
      this.updatePortrait(currentNode.portrait);
    }
    
    // Start typing effect
    this.startTyping(currentNode.text);
    
    // If there are choices, display them after a delay
    if (currentNode.choices && currentNode.choices.length > 0) {
      setTimeout(() => {
        this.displayChoices(currentNode.choices);
      }, 500);
    }
  }

  /**
   * Apply relationship and context based modifiers to a dialogue node
   * @param {Object} node - Original dialogue node
   * @returns {Object} Modified dialogue node
   */
  applyModifiers(node) {
    let modifiedNode = {...node};
    
    // Apply context variables
    if (this.context) {
      Object.keys(this.context).forEach(key => {
        if (typeof modifiedNode.text === 'string') {
          modifiedNode.text = modifiedNode.text.replace(new RegExp(`{${key}}`, 'g'), this.context[key]);
        }
      });
    }
    
    // Check for relationship-specific variants only if score threshold is met
    if (node.relationshipVariants) {
      const tier = GAME_CONFIG.getRelationshipTier(this.stateManager.relationshipScore);
      
      // Only apply variant if it exists and meets requirements
      if (node.relationshipVariants[tier]) {
        const variant = node.relationshipVariants[tier];
        
        // Deep merge variant properties
        modifiedNode = {
          ...modifiedNode,
          ...variant,
          text: variant.text || modifiedNode.text
        };
      }
    }
    
    return modifiedNode;
  }

  /**
   * Update the portrait image
   * @param {string} portraitKey - Key for the portrait
   */
  updatePortrait(portraitKey) {
    const path = `assets/characters/${portraitKey}.png`;
    this.portraitImg.src = path;
    this.portraitImg.alt = portraitKey.replace('_', ' ');
  }

  /**
   * Start typing effect for text
   * @param {string} text - Text to display
   */
  startTyping(text) {
    if (this.typingInterval) {
      clearInterval(this.typingInterval);
    }
    
    this.dialogueText.textContent = '';
    this.currentText = '';
    this.isTyping = true;
    
    // Handle text with voice annotations
    const voiceText = this.extractVoice(text);
    if (voiceText.speaker && voiceText.message) {
      // Play voice line if available
      if (this.scene.sound.exists(`voice_${voiceText.speaker}`)) {
        // Queue the voice to play after current one
        this.voiceQueue.push({
          key: `voice_${voiceText.speaker}`,
          text: voiceText.message
        });
        
        this.playNextVoice();
      }
      
      // Display message without annotation
      text = voiceText.message;
    }
    
    this.currentText = text;
    
    // Fast mode - skip typing for already seen dialogues
    if (this.stateManager.settings.fastDialogue) {
      this.completeTyping();
      return;
    }
    
    // Regular typing effect
    let i = 0;
    this.typingInterval = setInterval(() => {
      if (i < text.length) {
        this.dialogueText.textContent = text.substring(0, i + 1);
        i++;
      } else {
        this.completeTyping();
        clearInterval(this.typingInterval);
        this.typingInterval = null;
      }
    }, this.typingSpeed);
  }

  /**
   * Extract voice speaker from text annotation
   * Format: {voice:speaker}Text here
   * @param {string} text
   * @returns {Object} { speaker, message }
   */
  extractVoice(text) {
    const voiceMatch = text.match(/\{voice:([a-zA-Z0-9_]+)\}(.*)/);
    if (voiceMatch) {
      return {
        speaker: voiceMatch[1],
        message: voiceMatch[2]
      };
    }
    return { speaker: null, message: text };
  }

  /**
   * Play the next voice in the queue
   */
  playNextVoice() {
    if (this.voiceQueue.length === 0 || this.currentVoice) return;
    
    const next = this.voiceQueue.shift();
    this.currentVoice = this.scene.sound.play(next.key, { 
      volume: this.stateManager.settings.dialogueVolume 
    });
    
    // Clean up when voice finishes
    this.currentVoice.on('ended', () => {
      this.currentVoice = null;
      this.playNextVoice();
    });
  }

  /**
   * Complete typing effect immediately
   */
  completeTyping() {
    if (this.typingInterval) {
      clearInterval(this.typingInterval);
      this.typingInterval = null;
    }
    
    if (this.currentNode) {
      // Remove voice annotation from displayed text
      const cleanText = this.currentText.replace(/\{voice:[a-zA-Z0-9_]+\}/, '');
      this.dialogueText.textContent = cleanText;
    }
    
    this.isTyping = false;
  }

  /**
   * Display choice buttons for current node
   * @param {Array} choices - Array of choice objects
   */
  displayChoices(choices) {
    choices.forEach((choice, index) => {
      const button = document.createElement('button');
      button.className = 'choice-button';
      button.textContent = choice.text;
      
      button.addEventListener('click', () => {
        this.handleChoiceSelection(index);
      });
      
      this.choiceContainer.appendChild(button);
    });
  }

  /**
   * Handle choice selection
   * @param {number} choiceIndex
   */
  handleChoiceSelection(choiceIndex) {
    const choice = this.currentNode.choices[choiceIndex];
    
    // Hide choices
    this.choiceContainer.innerHTML = '';
    
    // Apply choice effects
    if (choice.effect) {
      this.applyChoiceEffects(choice.effect);
    }
    
    // Check for mini-game trigger
    if (choice.nextNode === 'mini_game' && this.currentTree.miniGame) {
      this.miniGamePending = {
        type: this.currentTree.miniGame,
        onSuccess: choice.onSuccess,
        onFailure: choice.onFailure,
        dialogueContext: this.context
      };
      this.scene.events.emit('miniGameRequested', this.currentTree.miniGame, this.miniGamePending);
      this.isDialogueActive = false;
      this.dialogueBox.style.display = 'none';
      return;
    }
    
    // Move to next node
    if (choice.nextNode) {
      this.currentNode = this.getNodeById(choice.nextNode);
      if (!this.currentNode) {
        console.error(`Next node not found: ${choice.nextNode}`);
        this.endDialogue();
        return;
      }
      this.displayCurrentNode();
    } else {
      // End of dialogue
      this.endDialogue();
    }
  }

  /**
   * Apply effects from a selected choice
   * @param {Object} effect
   */
  applyChoiceEffects(effect) {
    // Relationship change
    if (effect.relationship !== undefined) {
      this.relationshipManager.createRelationshipEffect(effect.relationship);
      
      // Update relationship through state manager
      this.stateManager.updateRelationship(effect.relationship);
    }
    
    // Relationship set to specific value
    if (effect.setRelationship !== undefined) {
      const change = effect.setRelationship - this.stateManager.relationshipScore;
      this.relationshipManager.createRelationshipEffect(change);
      this.stateManager.updateRelationship(change);
    }
    
    // Unlock milestone
    if (effect.unlockMilestone) {
      this.stateManager.unlockedMilestones.add(effect.unlockMilestone);
    }
    
    // Add item
    if (effect.addItem) {
      const [item, count] = Array.isArray(effect.addItem) ? effect.addItem : [effect.addItem, 1];
      this.stateManager.addItem(item, count);
    }
    
    // Set flag
    if (effect.setFlag) {
      this.stateManager.setFlag(effect.setFlag);
    }
    
    // Complete date
    if (effect.completeDate) {
      this.stateManager.completeDate(effect.completeDate);
    }
    
    // Defeat boss
    if (effect.defeatBoss) {
      this.stateManager.defeatBoss(effect.defeatBoss);
    }
    
    // Play sound
    if (effect.sound && this.scene.sound.exists(effect.sound)) {
      this.scene.sound.play(effect.sound, { volume: this.stateManager.settings.effectsVolume });
    }
    
    // Trigger dialogue event
    if (effect.event) {
      this.scene.events.emit(effect.event);
    }
    
    // Update context variable
    if (effect.setContext) {
      this.context = { ...this.context, ...effect.setContext };
    }
    
    // Heal player
    if (effect.heal) {
      const amount = typeof effect.heal === 'number' ? effect.heal : GAME_CONFIG.PLAYER.healAmount;
      this.scene.calvin?.heal(amount);
    }
  }

  /**
   * Get node by ID from current tree
   * @param {string} nodeId
   * @returns {Object|null}
   */
  getNodeById(nodeId) {
    return this.currentTree.nodes.find(node => node.id === nodeId) || null;
  }

  /**
   * Advance to next dialogue node (for nodes without choices)
   */
  advanceDialogue() {
    if (!this.currentNode) {
      this.endDialogue();
      return;
    }
    
    if (this.currentNode.nextNode) {
      this.currentNode = this.getNodeById(this.currentNode.nextNode);
      if (!this.currentNode) {
        console.error(`Next node not found: ${this.currentNode.nextNode}`);
        this.endDialogue();
        return;
      }
      this.displayCurrentNode();
    } else {
      this.endDialogue();
    }
  }

  /**
   * End the current dialogue sequence
   */
  endDialogue() {
    // Clean up any active typing
    this.completeTyping();
    
    // Clear voice queue
    this.voiceQueue = [];
    if (this.currentVoice) {
      this.currentVoice.stop();
      this.currentVoice = null;
    }
    
    // Hide dialogue box
    this.isDialogueActive = false;
    this.dialogueBox.style.display = 'none';
    
    // Notify scene that dialogue has ended
    this.scene.events.emit('dialogueComplete', this.context);
  }

  /**
   * Handle mini-game completion
   * @param {boolean} success
   * @param {Object} resultData - Additional data from mini-game
   */
  handleMiniGameResult(success, resultData = {}) {
    if (!this.miniGamePending) return;
    
    // Get the appropriate next node based on result
    const nextNodeId = success ? 
      this.miniGamePending.onSuccess : 
      this.miniGamePending.onFailure;
    
    // Reset mini-game state
    this.miniGamePending = null;
    
    // Merge result data into context
    this.context = { ...this.context, ...resultData };
    
    // Continue dialogue
    this.currentNode = this.getNodeById(nextNodeId);
    if (!this.currentNode) {
      console.error(`Next node not found: ${nextNodeId}`);
      this.endDialogue();
      return;
    }
    
    this.isDialogueActive = true;
    this.dialogueBox.style.display = 'block';
    this.displayCurrentNode();
  }

  /**
   * Pause the dialogue system
   */
  pause() {
    if (this.typingInterval) {
      clearInterval(this.typingInterval);
      this.typingInterval = null;
    }
    
    if (this.currentVoice && this.currentVoice.playing) {
      this.currentVoice.pause();
    }
  }

  /**
   * Resume the dialogue system
   */
  resume() {
    if (this.isTyping && !this.typingInterval) {
      this.startTyping(this.currentText);
    }
    
    if (this.currentVoice && this.currentVoice.paused) {
      this.currentVoice.play();
    }
  }
}

// Export for module systems
if (typeof module !== 'undefined') {
  module.exports = DialogueSystem;
}
