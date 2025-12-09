// minigames.js
// Mini-game logic

/**
 * Initialize Memory Match mini-game
 */
function initMemoryMatch() {
  const pairs = ['🍎','🍌','🍇','🍓','🍒','🍑'];
  let cards = window.utils.shuffle([...pairs, ...pairs]).map((emoji, i) => ({
    id: i,
    emoji,
    revealed: false,
    matched: false
  }));
  return {
    type: 'memoryMatch',
    board: cards,
    selectedCards: [],
    movesLeft: 16,
    timer: 0,
    isComplete: false,
    result: null
  };
}

/**
 * Update Memory Match mini-game state
 */
function updateMemoryMatch(state, action) {
  if (state.isComplete) return;
  if (action && action.type === 'select' && state.selectedCards.length < 2) {
    const card = state.board[action.index];
    if (!card || card.revealed || card.matched) return;
    card.revealed = true;
    state.selectedCards.push(card);
    if (state.selectedCards.length === 2) {
      state.movesLeft = Math.max(0, state.movesLeft - 1);
      if (state.selectedCards[0].emoji === state.selectedCards[1].emoji) {
        state.selectedCards[0].matched = true;
        state.selectedCards[1].matched = true;
        window.audio.playSFX('success');
      } else {
        window.audio.playSFX('fail');
        setTimeout(() => {
          state.selectedCards[0].revealed = false;
          state.selectedCards[1].revealed = false;
        }, 800);
      }
      state.selectedCards = [];
    }
    if (state.board.every(c => c.matched)) {
      state.isComplete = true;
      state.result = 'win';
    } else if (state.movesLeft <= 0) {
      state.isComplete = true;
      state.result = 'lose';
    }
  }
}

/**
 * Get mini-game result
 */
function getMiniGameResult(state) {
  return state.result;
}

/**
 * Reset mini-game state (for future expansion)
 */
function resetMiniGameState() {
  // For future expansion
}

window.minigames = {
  initMemoryMatch,
  updateMemoryMatch,
  getMiniGameResult,
  resetMiniGameState
};
