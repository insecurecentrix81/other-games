// story.js
// Branching narrative and story engine

const storyNodes = {
  'ch1_start': {
    id: 'ch1_start',
    speaker: 'saharsh',
    text: "Hey, Anbu! Want to hang out after class?",
    expression: 'smile',
    background: 'assets/backgrounds/schoolyard.png',
    choices: [
      { text: "Sure, let's go!", nextNodeId: 'ch1_yes', effects: (gs) => gs.relationshipStats.anbuToSaharsh += 2 },
      { text: "Sorry, I'm busy.", nextNodeId: 'ch1_no', effects: (gs) => gs.relationshipStats.anbuToSaharsh -= 1 }
    ]
  },
  'ch1_yes': {
    id: 'ch1_yes',
    speaker: 'anbu',
    text: "Great! Where should we go?",
    expression: 'smile',
    choices: [
      { text: "The park.", nextNodeId: 'ch1_park' },
      { text: "The café.", nextNodeId: 'ch1_cafe' }
    ]
  },
  'ch1_no': {
    id: 'ch1_no',
    speaker: 'anbu',
    text: "Oh, maybe next time...",
    expression: 'neutral',
    next: 'ch1_end'
  },
  'ch1_park': {
    id: 'ch1_park',
    speaker: 'saharsh',
    text: "Let's go to the park! I heard the cherry blossoms are blooming.",
    expression: 'smile',
    minigame: 'memoryMatch'
  },
  'ch1_cafe': {
    id: 'ch1_cafe',
    speaker: 'saharsh',
    text: "The café has the best pastries. Let's go!",
    expression: 'smile',
    minigame: 'memoryMatch'
  },
  'ch1_end': {
    id: 'ch1_end',
    speaker: null,
    text: "End of Chapter 1.",
    next: null
  }
  // More nodes for other chapters...
};

/**
 * Get node by id
 */
function getNode(id) {
  return storyNodes[id];
}

/**
 * Get next node
 */
function getNextNode(currentId) {
  const node = storyNodes[currentId];
  if (node && node.next) return storyNodes[node.next];
  return null;
}

/**
 * Reset story state (for future expansion)
 */
function resetStoryState() {
  // For future: reset flags, etc.
}

/**
 * Get available choices (with requirements)
 */
function getAvailableChoices(node, gameState) {
  if (!node.choices) return [];
  return node.choices.filter(choice =>
    !choice.requirements || choice.requirements(gameState)
  );
}

window.story = {
  storyNodes,
  getNode,
  getNextNode,
  resetStoryState,
  getAvailableChoices
};
