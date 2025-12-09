// characters.js
// Character data and logic

const characters = {
  saharsh: {
    id: 'saharsh',
    name: 'Saharsh',
    portrait: {
      neutral: 'assets/portraits/saharsh_neutral.png',
      smile: 'assets/portraits/saharsh_smile.png',
      blush: 'assets/portraits/saharsh_blush.png',
      surprised: 'assets/portraits/saharsh_surprised.png'
    },
    currentExpression: 'neutral',
    traits: ['thoughtful', 'funny'],
    relationshipPoints: 0
  },
  anbu: {
    id: 'anbu',
    name: 'Anbu',
    portrait: {
      neutral: 'assets/portraits/anbu_neutral.png',
      smile: 'assets/portraits/anbu_smile.png',
      blush: 'assets/portraits/anbu_blush.png',
      surprised: 'assets/portraits/anbu_surprised.png'
    },
    currentExpression: 'neutral',
    traits: ['shy', 'creative'],
    relationshipPoints: 0
  }
};

/**
 * Get character by id
 */
function getCharacter(id) {
  return characters[id];
}

/**
 * Set character expression
 */
function setCharacterExpression(id, expression) {
  if (characters[id] && characters[id].portrait[expression]) {
    characters[id].currentExpression = expression;
  } else if (characters[id]) {
    characters[id].currentExpression = 'neutral';
  }
}

/**
 * Reset all character states
 */
function resetCharacters() {
  Object.values(characters).forEach(char => {
    char.currentExpression = 'neutral';
    char.relationshipPoints = 0;
  });
}

/**
 * Get current portrait image
 */
function getCurrentPortrait(id) {
  const char = characters[id];
  return char && char.portrait[char.currentExpression]
    ? char.portrait[char.currentExpression]
    : (char ? char.portrait['neutral'] : '');
}

/**
 * Get all expressions for a character
 */
function getExpressions(id) {
  return characters[id] ? Object.keys(characters[id].portrait) : [];
}

/**
 * Set relationship points (clamped 0-10)
 */
function setRelationshipPoints(id, points) {
  if (characters[id]) {
    characters[id].relationshipPoints = window.utils.clamp(points, 0, 10);
  }
}

window.characters = {
  characters,
  getCharacter,
  setCharacterExpression,
  resetCharacters,
  getCurrentPortrait,
  getExpressions,
  setRelationshipPoints
};
