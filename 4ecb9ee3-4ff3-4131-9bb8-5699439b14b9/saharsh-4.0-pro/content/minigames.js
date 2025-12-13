/**
 * miniGames.js
 * Comprehensive mini-game system with progression
 */

const MINIGAMES = {
  COOKING: {
    id: "cooking",
    name: "Cooking Challenge",
    description: "Prepare a delicious meal with Eric",
    difficulty: 2,
    duration: 10,
    ingredients: [
      { id: "flour", name: "Flour", icon: "🌾" },
      { id: "sugar", name: "Sugar", icon: "🍬" },
      { id: "eggs", name: "Eggs", icon: "🥚" },
      { id: "milk", name: "Milk", icon: "🥛" },
      { id: "butter", name: "Butter", icon: "🧈" }
    ],
    recipes: {
      cake: {
        name: "Cake",
        ingredients: ["flour", "sugar", "eggs", "milk", "butter"],
        difficulty: 3,
        time: 8,
        description: "A classic dessert that requires precise measurements"
      },
      cookies: {
        name: "Cookies",
        ingredients: ["flour", "sugar", "butter", "eggs"],
        difficulty: 2,
        time: 6,
        description: "Simple but delicious treats"
      },
      pancakes: {
        name: "Pancakes",
        ingredients: ["flour", "milk", "eggs"],
        difficulty: 1,
        time: 4,
        description: "Quick breakfast option"
      }
    },
    successThreshold: 0.5, // seconds to be considered perfect
    failPenalty: -2,
    rewards: {
      perfect: { relationship: 8, currency: { love: 15, courage: 8 } },
      good: { relationship: 5, currency: { love: 10, courage: 5 } },
      fair: { relationship: 2, currency: { love: 5 } },
      poor: { relationship: -1, currency: { courage: 2 } },
      fail: { relationship: -2 }
    }
  },

  STARGAZING: {
    id: "stargazing",
    name: "Stargazing",
    description: "Connect the stars to form constellations",
    difficulty: 3,
    duration: 90,
    constellations: [
      {
        id: "lovers",
        name: "Lovers",
        points: [
          { x: 0.2, y: 0.3 },
          { x: 0.3, y: 0.4 },
          { x: 0.4, y: 0.3 },
          { x: 0.5, y: 0.5 },
          { x: 0.6, y: 0.3 },
          { x: 0.7, y: 0.4 },
          { x: 0.8, y: 0.3 }
        ],
        description: "Two figures reaching toward each other across the sky"
      },
      {
        id: "shield",
        name: "Shield",
        points: [
          { x: 0.2, y: 0.2 },
          { x: 0.3, y: 0.3 },
          { x: 0.4, y: 0.2 },
          { x: 0.5, y: 0.3 },
          { x: 0.6, y: 0.2 },
          { x: 0.7, y: 0.3 },
          { x: 0.8, y: 0.2 }
        ],
        description: "A protective formation that guards the night sky"
      },
      {
        id: "harmony",
        name: "Harmony",
        points: [
          { x: 0.25, y: 0.4 },
          { x: 0.35, y: 0.3 },
          { x: 0.45, y: 0.4 },
          { x: 0.55, y: 0.3 },
          { x: 0.65, y: 0.4 },
          { x: 0.75, y: 0.3 }
        ],
        description: "A balanced pattern representing perfect understanding"
      }
    ],
    connectionThreshold: 0.3, // seconds to connect stars
    maxAttempts: 3,
    rewards: {
      perfect: { relationship: 10, currency: { trust: 20, love: 12 } },
      good: { relationship: 7, currency: { trust: 15, love: 8 } },
      fair: { relationship: 4, currency: { trust: 10 } },
      poor: { relationship: 1, currency: { trust: 5 } },
      fail: { relationship: -3 }
    }
  },

  MUSIC: {
    id: "music",
    name: "Duet",
    description: "Play music together with Eric",
    difficulty: 4,
    duration: 60,
    instruments: [
      { id: "piano", name: "Piano", icon: "🎹" },
      { id: "guitar", name: "Guitar", icon: "🎸" },
      { id: "violin", name: "Violin", icon: "🎻" },
      { id: "flute", name: "Flute", icon: "🪈" }
    ],
    songs: {
      harmony: {
        name: "Harmony",
        notes: ["C", "E", "G", "C5", "G", "E", "C"],
        difficulty: 2,
        description: "A simple melody representing unity"
      },
      passion: {
        name: "Passion",
        notes: ["E", "G", "A", "B", "C5", "B", "A", "G"],
        difficulty: 3,
        description: "An intense piece reflecting deep emotion"
      },
      eternity: {
        name: "Eternity",
        notes: ["C", "D", "E", "F", "G", "A", "B", "C5", "B", "A", "G", "F", "E", "D", "C"],
        difficulty: 4,
        description: "A complex composition symbolizing endless love"
      }
    },
    reactionTime: 0.8, // seconds to press before note passes
    rewards: {
      perfect: { relationship: 12, currency: { love: 25, courage: 15 } },
      good: { relationship: 8, currency: { love: 15, courage: 10 } },
      fair: { relationship: 5, currency: { love: 10 } },
      poor: { relationship: 2 },
      fail: { relationship: -4 }
    }
  },

  PUZZLE: {
    id: "puzzle",
    name: "Memory Puzzle",
    description: "Test your memory with matching tiles",
    difficulty: 3,
    gridSize: { width: 3, height: 3 },
    pairs: 4,
    timeLimit: 60,
    themes: {
      relationship: {
        name: "Our Journey",
        cards: [
          { id: "firstMeeting", image: "assets/miniGames/first_meeting.png", matchId: "firstMeeting" },
          { id: "firstDate", image: "assets/miniGames/first_date.png", matchId: "firstDate" },
          { id: "firstFight", image: "assets/miniGames/first_fight.png", matchId: "firstFight" },
          { id: "resolution", image: "assets/miniGames/resolution.png", matchId: "resolution" },
          { id: "growth", image: "assets/miniGames/growth.png", matchId: "growth" },
          { id: "strength", image: "assets/miniGames/strength.png", matchId: "strength" },
          { id: "bond", image: "assets/miniGames/bond.png", matchId: "bond" },
          { id: "future", image: "assets/miniGames/future.png", matchId: "future" }
        ]
      },
      elements: {
        name: "Elements of Love",
        cards: [
          { id: "fire", icon: "🔥", matchId: "fire" },
          { id: "water", icon: "💧", matchId: "water" },
          { id: "earth", icon: "🌍", matchId: "earth" },
          { id: "air", icon: "💨", matchId: "air" },
          { id: "light", icon: "✨", matchId: "light" },
          { id: "dark", icon: "🌑", matchId: "dark" },
          { id: "heart", icon: "❤️", matchId: "heart" },
          { id: "soul", icon: "🫀", matchId: "soul" }
        ]
      }
    },
    rewards: {
      perfect: { relationship: 10, currency: { trust: 25, love: 15 } },
      good: { relationship: 7, currency: { trust: 20 } },
      fair: { relationship: 4, currency: { trust: 15 } },
      poor: { relationship: 1, currency: { trust: 10 } },
      fail: { relationship: -5 }
    }
  },

  DANCE: {
    id: "dance",
    name: "Dance Off",
    description: "Follow the rhythm and dance with Eric",
    difficulty: 5,
    duration: 90,
    danceStyles: {
      romantic: {
        name: "Romantic Waltz",
        sequence: ["left", "forward", "right", "back", "left", "forward", "right", "back"],
        difficulty: 2,
        description: "A graceful dance of connection"
      },
      energetic: {
        name: "Energetic Boogie",
        sequence: ["up", "down", "left", "right", "up", "left", "down", "right", "up", "right", "down", "left"],
        difficulty: 4,
        description: "A lively expression of joy"
      },
      passionate: {
        name: "Passionate Tango",
        sequence: ["forward", "left", "forward", "right", "back", "left", "back", "right", "forward", "forward", "back", "back"],
        difficulty: 5,
        description: "An intense dance of emotion"
      }
    },
    reactionTime: 1.0,
    rewards: {
      perfect: { relationship: 15, currency: { love: 30, courage: 20 } },
      good: { relationship: 10, currency: { love: 20, courage: 15 } },
      fair: { relationship: 6, currency: { love: 15 } },
      poor: { relationship: 3 },
      fail: { relationship: -5 }
    }
  },

  MEMORY_MATCH: {
    id: "memoryMatch",
    name: "Relationship Memory",
    description: "Match memories from your journey together",
    difficulty: 4,
    gridSize: { width: 4, height: 3 },
    pairs: 6,
    timeLimit: 75,
    memoryTypes: {
      moments: {
        name: "Special Moments",
        cards: [
          { id: "coffeeDate", image: "assets/miniGames/coffee_date.png", matchId: "coffeeDate", description: "Our first date at the coffee shop" },
          { id: "movieNight", image: "assets/miniGames/movie_night.png", matchId: "movieNight", description: "Watching movies together" },
          { id: "picnic", image: "assets/miniGames/picnic.png", matchId: "picnic", description: "Our peaceful picnic" },
          { id: "stargazing", image: "assets/miniGames/stargazing.png", matchId: "stargazing", description: "Connecting the stars" },
          { id: "cooking", image: "assets/miniGames/cooking.png", matchId: "cooking", description: "Preparing meals together" },
          { id: "music", image: "assets/miniGames/music.png", matchId: "music", description: "Making music as a duet" }
        ]
      },
      feelings: {
        name: "Emotions",
        cards: [
          { id: "happiness", icon: "😊", matchId: "happiness", description: "Moments of pure joy" },
          { id: "sadness", icon: "😢", matchId: "sadness", description: "Times we comforted each other" },
          { id: "excitement", icon: "🤩", matchId: "excitement", description: "Adventures we shared" },
          { id: "peace", icon: "😌", matchId: "peace", description: "Calm moments together" },
          { id: "passion", icon: "😍", matchId: "passion", description: "Intense connections" },
          { id: "hope", icon: "✨", matchId: "hope", description: "Looking toward the future" }
        ]
      }
    },
    rewards: {
      perfect: { relationship: 12, currency: { love: 25, trust: 20 } },
      good: { relationship: 8, currency: { love: 20, trust: 15 } },
      fair: { relationship: 5, currency: { love: 15 } },
      poor: { relationship: 2, currency: { trust: 10 } },
      fail: { relationship: -3 }
    }
  },

  RHYTHM: {
    id: "rhythm",
    name: "Heartbeat Rhythm",
    description: "Sync your heartbeats through rhythm",
    difficulty: 4,
    duration: 75,
    patterns: {
      steady: {
        name: "Steady Beat",
        sequence: [1, 1, 0, 1, 1, 0, 1, 1],
        difficulty: 2,
        description: "A consistent rhythm representing stability"
      },
      accelerating: {
        name: "Growing Intensity",
        sequence: [1, 0, 1, 0, 1, 1, 0, 1, 1, 1, 0, 1],
        difficulty: 3,
        description: "Building excitement and connection"
      },
      passionate: {
        name: "Passionate Pulse",
        sequence: [1, 1, 1, 0, 1, 1, 0, 1, 1, 1, 1, 0, 1, 1, 0, 1],
        difficulty: 5,
        description: "An intense rhythm of deep emotion"
      }
    },
    reactionTime: 0.7,
    rewards: {
      perfect: { relationship: 11, currency: { love: 22, courage: 18 } },
      good: { relationship: 7, currency: { love: 18, courage: 12 } },
      fair: { relationship: 4, currency: { love: 12 } },
      poor: { relationship: 2 },
      fail: { relationship: -4 }
    }
  },

  GARDENING: {
    id: "gardening",
    name: "Love Garden",
    description: "Cultivate a garden of emotions together",
    difficulty: 3,
    duration: 120,
    plants: {
      rose: {
        name: "Rose of Love",
        growthStages: ["seed", "sprout", "bud", "flower"],
        care: { water: 3, sunshine: 4, attention: 5 },
        description: "Represents deep romantic love"
      },
      violet: {
        name: "Violet of Trust",
        growthStages: ["seed", "sprout", "bloom"],
        care: { water: 4, sunshine: 3, attention: 6 },
        description: "Symbolizes trust and faithfulness"
      },
      daisy: {
        name: "Daisy of Joy",
        growthStages: ["seed", "sprout", "bloom"],
        care: { water: 2, sunshine: 5, attention: 4 },
        description: "Represents simple happiness"
      },
      orchid: {
        name: "Orchid of Passion",
        growthStages: ["seed", "sprout", "bud", "bloom"],
        care: { water: 5, sunshine: 2, attention: 7 },
        description: "Symbolizes intense passion"
      }
    },
    rewards: {
      perfect: { relationship: 13, currency: { love: 28, trust: 22 } },
      good: { relationship: 9, currency: { love: 20, trust: 18 } },
      fair: { relationship: 6, currency: { love: 15, trust: 12 } },
      poor: { relationship: 3, currency: { trust: 8 } },
      fail: { relationship: -2 }
    }
  },

  STORYTELLING: {
    id: "storytelling",
    name: "Our Story",
    description: "Create a story of your relationship",
    difficulty: 5,
    duration: 150,
    storyElements: {
      beginnings: [
        { id: "meeting", text: "Our first meeting was...", options: ["fateful", "unexpected", "destined"] },
        { id: "connection", text: "I knew we had a connection when...", options: ["our eyes met", "we spoke", "we touched hands"] },
        { id: "firstWords", text: "Your first words to me were...", options: ["Hello", "I'm glad to meet you", "You look interesting"] }
      ],
      challenges: [
        { id: "firstFight", text: "Our first fight was about...", options: ["misunderstanding", "fear", "protection"] },
        { id: "separation", text: "When we were separated, I felt...", options: ["lost", "determined", "heartbroken"] },
        { id: "doubt", text: "I doubted our relationship when...", options: ["danger increased", "we argued", "I felt weak"] }
      ],
      resolutions: [
        { id: "makingUp", text: "We made up by...", options: ["talking honestly", "sharing memories", "promising to improve"] },
        { id: "renewal", text: "Our bond was renewed when...", options: "we protected each other", "we shared a quiet moment", "we faced danger together"] },
        { id: "growth", text: "I realized our love had grown when...", options: ["I put you first", "we understood each other", "we fought as one"] }
      ],
      futures: [
        { id: "promise", text: "I promise to always...", options: ["protect you", "be honest", "stand by you"] },
        { id: "dream", text: "My dream for us is...", options: ["peace", "adventure", "eternity together"] },
        { id: "forever", text: "I know we'll be together forever because...", options: ["our love is strong", "we complete each other", "we've overcome everything"] }
      ]
    },
    rewards: {
      perfect: { relationship: 18, currency: { love: 35, trust: 30 } },
      good: { relationship: 12, currency: { love: 25, trust: 20 } },
      fair: { relationship: 8, currency: { love: 18, trust: 15 } },
      poor: { relationship: 4 },
      fail: { relationship: -3 }
    }
  },

  QUIZ: {
    id: "quiz",
    name: "Relationship Quiz",
    description: "Test how well you know Eric",
    difficulty: 3,
    questions: [
      {
        id: "favoriteColor",
        question: "What is Eric's favorite color?",
        options: ["Blue", "Green", "Red", "Purple"],
        answer: "Purple",
        explanation: "Eric loves purple because it represents creativity and mystery.",
        relationshipImpact: { correct: 4, incorrect: -1 }
      },
      {
        id: "fear",
        question: "What is Eric most afraid of?",
        options: ["Being alone", "Failing you", "The dark", "Losing memories"],
        answer: "Failing you",
        explanation: "Eric's greatest fear is not being able to protect you.",
        relationshipImpact: { correct: 5, incorrect: -2 }
      },
      {
        id: "relax",
        question: "How does Eric like to relax?",
        options: ["Reading", "Walking in nature", "Playing music", "Cooking"],
        answer: "Playing music",
        explanation: "Music helps Eric express emotions he can't put into words.",
        relationshipImpact: { correct: 3, incorrect: -1 }
      },
      {
        id: "gift",
        question: "What kind of gift would Eric appreciate most?",
        options: ["Handmade item", "Book", "Concert tickets", "Cooking supplies"],
        answer: "Handmade item",
        explanation: "Eric values the thought and effort behind handmade gifts.",
        relationshipImpact: { correct: 6, incorrect: -1 }
      },
      {
        id: "support",
        question: "How does Eric prefer to receive support?",
        options: ["Words of encouragement", "Physical comfort", "Help with tasks", "Quality time", "Gifts"],
        answer: "Words of encouragement",
        explanation: "Eric's primary love language is words of affirmation.",
        relationshipImpact: { correct: 7, incorrect: -2 }
      }
    ],
    rewards: {
      perfect: { relationship: 10, currency: { trust: 20, love: 15 } },
      good: { relationship: 6, currency: { trust: 15 } },
      fair: { relationship: 3, currency: { trust: 10 } },
      poor: { relationship: 1 },
      fail: { relationship: -4 }
    }
  },

  PUZZLE_3D: {
    id: "puzzle3d",
    name: "Heart Puzzle",
    description: "Assemble a 3D heart from fragments",
    difficulty: 6,
    pieces: 12,
    timeLimit: 180,
    complexity: "3D",
    rewards: {
      perfect: { relationship: 15, currency: { love: 30, trust: 25 } },
      good: { relationship: 10, currency: { love: 20, trust: 20 } },
      fair: { relationship: 6, currency: { love: 15 } },
      poor: { relationship: 3, currency: { trust: 10 } },
      fail: { relationship: -5 }
    }
  },

  TIMED_CHALLENGE: {
    id: "timedChallenge",
    name: "Love Race",
    description: "Complete tasks before time runs out",
    difficulty: 4,
    tasks: [
      { id: "findItems", description: "Find 5 hidden love tokens", time: 30 },
      { id: "answerQuestions", description: "Answer 3 relationship questions", time: 45 },
      { id: "solvePuzzle", description: "Complete a quick puzzle", time: 60 },
      { id: "rhythmGame", description: "Play a short rhythm game", time: 40 }
    ],
    totalDuration: 175,
    rewards: {
      perfect: { relationship: 12, currency: { love: 25, courage: 20 } },
      good: { relationship: 8, currency: { love: 18, courage: 15 } },
      fair: { relationship: 5, currency: { love: 12 } },
      poor: { relationship: 2 },
      fail: { relationship: -3 }
    }
  }
};

// Endless Arena mini-games - special challenges
const ENDLESS_MINIGAMES = {
  SURVIVAL_COOKING: {
    id: "survivalCooking",
    name: "Survival Cooking",
    description: "Prepare meals under pressure as enemies approach",
    difficulty: 8,
    waves: [
      { enemies: 2, time: 45, ingredients: 3 },
      { enemies: 4, time: 40, ingredients: 4 },
      { enemies: 6, time: 35, ingredients: 5 },
      { enemies: 8, time: 30, ingredients: 5 }
    ],
    rewards: {
      base: { relationship: 5, currency: { love: 20, courage: 15 } },
      waveBonus: { relationship: 2, currency: { love: 10 } },
      survivalBonus: { relationship: 8, currency: { love: 30, courage: 25 } }
    }
  },

  DEFENSIVE_STARGAZING: {
    id: "defensiveStargazing",
    name: "Defensive Stargazing",
    description: "Connect constellations while defending against attacks",
    difficulty: 7,
    attackPatterns: [
      { frequency: 0.3, type: "distraction", effect: "blur screen for 1s" },
      { frequency: 0.2, type: "obstruction", effect: "cover stars temporarily" },
      { frequency: 0.1, type: "timeSlow", effect: "reduce time by 2s" }
    ],
    rewards: {
      base: { relationship: 6, currency: { trust: 25, love: 15 } },
      accuracyBonus: { relationship: 3, currency: { trust: 15 } },
      defenseBonus: { relationship: 5, currency: { trust: 20 } }
    }
  },

  COMBAT_DANCE: {
    id: "combatDance",
    name: "Combat Dance",
    description: "Dance while fighting off enemies",
    difficulty: 9,
    mechanics: {
      dance: "follow rhythm sequence",
      combat: "defend against enemies",
      synergy: "combine dance moves with attacks"
    },
    rewards: {
      base: { relationship: 8, currency: { love: 30, courage: 20 } },
      comboBonus: { relationship: 4, currency: { love: 15 } },
      perfectSync: { relationship: 10, currency: { love: 40, courage: 30 } }
    }
  }
};

// Special event mini-games
const EVENT_MINIGAMES = {
  // Valentine's Day event
  VALENTINES: {
    id: "valentines",
    name: "Valentine's Challenge",
    description: "Special Valentine's Day mini-games",
    season: "february",
    games: [
      "COOKING", "STARGAZING", "MUSIC", "DANCE"
    ],
    specialRewards: {
      exclusive: ["valentinesCard", "heartNecklace", "lovePotion"],
      relationship: 15,
      currency: { love: 50, trust: 40 }
    }
  },

  // Anniversary event
  ANNIVERSARY: {
    id: "anniversary",
    name: "Anniversary Celebration",
    description: "Celebrate your journey together",
    season: "anniversary",
    games: [
      "MEMORY_MATCH", "STORYTELLING", "QUIZ", "PUZZLE_3D"
    ],
    specialRewards: {
      exclusive: ["anniversaryBadge", "eternityRing", "memoryBook"],
      relationship: 20,
      currency: { love: 75, trust: 60 }
    }
  },

  // New Year event
  NEW_YEAR: {
    id: "newYear",
    name: "New Year's Resolution",
    description: "Set goals for the coming year",
    season: "january",
    games: [
      "TIMED_CHALLENGE", "RHYTHM", "GARDENING", "QUIZ"
    ],
    specialRewards: {
      exclusive: ["newYearHat", "resolutionJournal", "futureCrystal"],
      relationship: 12,
      currency: { love: 40, courage: 35 }
    }
  }
};

// Mini-game progression system
const MINIGAME_PROGRESSION = {
  unlockConditions: {
    DANCE: { relationship: 75, level: 8 },
    MEMORY_MATCH: { relationship: 80, level: 10 },
    RHYTHM: { relationship: 85, level: 12 },
    GARDENING: { relationship: 90, level: 13 },
    STORYTELLING: { relationship: 95, level: 14 },
    PUZZLE_3D: { relationship: 98, level: 15 },
    TIMED_CHALLENGE: { achievements: ["completionist"] },
    QUIZ: { datesCompleted: 3 }
  },

  difficultyScaling: {
    baseMultiplier: 1.0,
    levelScaling: 0.1, // Increase per level
    relationshipScaling: 0.05, // Increase per 10 relationship points
    consecutiveWins: 0.08 // Increase after each win
  },

  rewardScaling: {
    baseMultiplier: 1.0,
    levelBonus: 0.05, // Bonus per level
    relationshipBonus: 0.03, // Bonus per 10 relationship points
    streakBonus: 0.1 // Bonus for consecutive wins
  },

  masterySystem: {
    ranks: [
      { name: "Beginner", threshold: 0 },
      { name: "Novice", threshold: 25 },
      { name: "Apprentice", threshold: 50 },
      { name: "Journeyer", threshold: 75 },
      { name: "Master", threshold: 90 },
      { name: "Legend", threshold: 100 }
    ],
    rewards: {
      Master: { relationship: 10, currency: { love: 50, trust: 40 }, unlock: "miniGameMaster" },
      Legend: { relationship: 15, currency: { love: 75, trust: 60 }, unlock: "legendaryLover" }
    }
  }
};

// Export for game access
if (typeof module !== 'undefined') {
  module.exports = {
    MINIGAMES,
    ENDLESS_MINIGAMES,
    EVENT_MINIGAMES,
    MINIGAME_PROGRESSION
  };
}
