/**
 * DialogueSystem.js
 * Manages dialogue trees, choices, and transitions
 */

class DialogueSystem {
  constructor(scene) {
    this.scene = scene;
    this.stateManager = window.stateManager;
    this.relationshipManager = null;
    
    // Dialogue state
    this.currentTree = null;
    this.currentNode = null;
    this.isDialogueActive = false;
    this.miniGamePending = null;
    
    // DOM elements
    this.dialogueBox = null;
    this.dialogueText = null;
    this.choiceContainer = null;
    
    // Typing effect
    this.typingSpeed = 30; // ms per character
    this.typingComplete = false;
    this.currentText = '';
    
    // Initialize dialogue UI
    this.initializeUI();
  }

  /**
   * Initialize dialogue UI elements
   */
  initializeUI() {
    // Create dialogue box if it doesn't exist
    if (!document.querySelector('.dialogue-box')) {
      const container = document.createElement('div');
      container.className = 'dialogue-box';
      container.style.display = 'none';
      
      const portrait = document.createElement('div');
      portrait.className = 'dialogue-portrait';
      portrait.innerHTML = '<img src="assets/characters/eric_idle.png" alt="Eric" style="width:100%;height:100%;">';
      
      const textContainer = document.createElement('div');
      textContainer.className = 'dialogue-text';
      
      const choices = document.createElement('div');
      choices.className = 'choice-container';
      
      container.appendChild(portrait);
      container.appendChild(textContainer);
      container.appendChild(choices);
      
      document.body.appendChild(container);
      
      // Store references
      this.dialogueBox = container;
      this.dialogueText = textContainer;
      this.choiceContainer = choices;
    } else {
      this.dialogueBox = document.querySelector('.dialogue-box');
      this.dialogueText = document.querySelector('.dialogue-text');
      this.choiceContainer = document.querySelector('.choice-container');
    }
    
    // Add click handler for advancing dialogue
    this.dialogueBox.addEventListener('click', (e) => {
      if (!this.isDialogueActive) return;
      
      // If typing, complete typing
      if (!this.typingComplete) {
        this.completeTyping();
        return;
      }
      
      // If choices are visible, ignore click
      if (this.choiceContainer.children.length > 0) {
        return;
      }
      
      // Otherwise, advance to next node
      this.advanceDialogue();
    });
  }

  /**
   * Start a dialogue sequence
   * @param {string} treeKey - Key of dialogue tree to use
   */
  startDialogue(treeKey) {
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
    
    // Show dialogue box
    this.dialogueBox.style.display = 'block';
    
    // Start with the first node
    this.currentNode = tree.startNode;
    this.displayCurrentNode();
  }

  /**
   * Display the current dialogue node
   */
  displayCurrentNode() {
    // Reset typing state
    this.typingComplete = false;
    this.currentText = '';
    
    // Clear previous choices
    this.choiceContainer.innerHTML = '';
    
    // Apply relationship modifiers to node
    const currentNode = this.applyRelationshipModifiers(this.currentNode);
    
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
   * Apply relationship-based modifiers to a dialogue node
   * @param {Object} node - Original dialogue node
   * @returns {Object} Modified dialogue node
   */
  applyRelationshipModifiers(node) {
    let modifiedNode = {...node};
    
    // Check for relationship-specific variants
    if (node.relationshipVariants) {
      const tier = GAME_CONFIG.getRelationshipTier(this.stateManager.relationshipScore);
      
      if (node.relationshipVariants[tier]) {
        const variant = node.relationshipVariants[tier];
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
   * Start typing effect for text
   * @param {string} text - Text to display
   */
  startTyping(text) {
    this.dialogueText.textContent = '';
    this.currentText = '';
    this.typingComplete = false;
    
    let i = 0;
    const type = () => {
      if (i < text.length) {
        this.currentText += text.charAt(i);
        this.dialogueText.textContent = this.currentText;
        i++;
        setTimeout(type, this.typingSpeed);
      } else {
        this.typingComplete = true;
      }
    };
    
    type();
  }

  /**
   * Complete typing effect immediately
   */
  completeTyping() {
    if (!this.typingComplete) {
      this.typingComplete = true;
      this.dialogueText.textContent = this.currentNode.text;
    }
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
        onFailure: choice.onFailure
      };
      this.scene.events.emit('miniGameRequested', this.currentTree.miniGame);
      this.isDialogueActive = false;
      this.dialogueBox.style.display = 'none';
      return;
    }
    
    // Move to next node
    if (choice.nextNode) {
      this.currentNode = this.getNodeById(choice.nextNode);
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
      this.relationshipManager.changeRelationship(effect.relationship);
    }
    
    // Unlock milestone
    if (effect.unlockMilestone) {
      this.stateManager.unlockedMilestones.add(effect.unlockMilestone);
    }
    
    // Add item
    if (effect.addItem) {
      const [item, count] = effect.addItem;
      this.stateManager.inventory.set(item, 
        (this.stateManager.inventory.get(item) || 0) + (count || 1));
    }
    
    // Play sound
    if (effect.sound && this.scene.sound.exists(effect.sound)) {
      this.scene.sound.play(effect.sound);
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
    if (this.currentNode.nextNode) {
      this.currentNode = this.getNodeById(this.currentNode.nextNode);
      this.displayCurrentNode();
    } else {
      this.endDialogue();
    }
  }

  /**
   * End the current dialogue sequence
   */
  endDialogue() {
    this.isDialogueActive = false;
    this.dialogueBox.style.display = 'none';
    
    // Notify scene that dialogue has ended
    this.scene.events.emit('dialogueComplete');
  }

  /**
   * Handle mini-game completion
   * @param {boolean} success
   */
  handleMiniGameResult(success) {
    if (!this.miniGamePending) return;
    
    // Get the appropriate next node based on result
    const nextNodeId = success ? 
      this.miniGamePending.onSuccess : 
      this.miniGamePending.onFailure;
    
    // Reset mini-game state
    this.miniGamePending = null;
    
    // Continue dialogue
    this.currentNode = this.getNodeById(nextNodeId);
    this.isDialogueActive = true;
    this.dialogueBox.style.display = 'block';
    this.displayCurrentNode();
  }
}

// Export for module systems
if (typeof module !== 'undefined') {
  module.exports = DialogueSystem;
}
