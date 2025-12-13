/**
 * dialogueTrees.js
 * Complex dialogue trees with memory system
 */

// Main dialogue trees
const DIALOGUE_TREES = {
  // Opening scene
  "opening": {
    startNode: "greeting",
    music: "title-music",
    nodes: [
      {
        id: "greeting",
        text: "{voice:calvin}Hey Eric, ready for another day?",
        portrait: "calvin_talk",
        choices: [
          { 
            text: "Always ready with you by my side", 
            nextNode: "strong_response",
            effect: { relationship: 3, setContext: { playerTone: "affirming" } }
          },
          { 
            text: "I guess so, though I'm a bit tired", 
            nextNode: "neutral_response",
            effect: { relationship: 1, setContext: { playerTone: "cautious" } }
          },
          { 
            text: "Do we have to? These monsters are getting worse",
            nextNode: "negative_response",
            effect: { relationship: -2, setContext: { playerTone: "negative" } }
          }
        ]
      },
      {
        id: "strong_response",
        text: "{voice:eric}Aww, that means a lot. I feel safer with you too!",
        portrait: "eric_blush",
        nextNode: "transition_to_world"
      },
      {
        id: "neutral_response",
        text: "{voice:eric}I understand. We'll go at your pace, promise.",
        portrait: "eric_pensive",
        nextNode: "transition_to_world"
      },
      {
        id: "negative_response",
        text: "{voice:eric}I know it's hard... But we can face anything together. I believe in us.",
        portrait: "eric_sincere",
        relationshipVariants: {
          strained: {
            text: "{voice:eric}I... I just hope I'm not a burden to you.",
            effect: { relationship: -1 }
          }
        },
        nextNode: "transition_to_world"
      },
      {
        id: "transition_to_world",
        text: "The two of you set off into the mysterious world, ready to face whatever challenges await.",
        showPortrait: false,
        nextNode: "mini_intro"
      },
      {
        id: "mini_intro",
        text: "{voice:calvin}Looks like we've got another mini-game coming up. Think we can handle it?",
        portrait: "calvin_confident",
        choices: [
          { 
            text: "We make a great team!", 
            nextNode: "mini_start",
            effect: { relationship: 2 }
          },
          { 
            text: "As long as we work together", 
            nextNode: "mini_start",
            effect: { relationship: 1 }
          }
        ]
      },
      {
        id: "mini_start",
        text: "{voice:eric}Let's do this! I've been practicing.",
        portrait: "eric_determined",
        nextNode: "mini_game"
      },
      {
        id: "mini_game",
        text: "A cooking mini-game appears!",
        showPortrait: false,
        nextNode: "mini_game_result"
      },
      {
        id: "mini_game_result",
        text: "The mini-game result will be handled by the game system.",
        showPortrait: false,
        choices: [
          { text: "Continue", nextNode: "story_continues" }
        ]
      },
      {
        id: "story_continues",
        text: "Your journey continues, with new challenges around every corner.",
        showPortrait: false,
        nextNode: "level_start"
      }
    ]
  },

  // First Date - Coffee Shop
  "first_date_coffee": {
    startNode: "coffee_intro",
    music: "date-music",
    miniGame: "COOKING", // Will trigger cooking mini-game
    nodes: [
      {
        id: "coffee_intro",
        text: "{voice:calvin}This coffee shop is nice. Peaceful, even with everything happening outside.",
        portrait: "calvin_looking_around",
        nextNode: "eric_response"
      },
      {
        id: "eric_response",
        text: "{voice:eric}I picked it because I knew you'd like the quiet atmosphere. Plus, they have amazing pastries!",
        portrait: "eric_excited",
        choices: [
          { 
            text: "You always know what I like", 
            nextNode: "appreciation",
            effect: { relationship: 5, memory: "attention" } 
          },
          { 
            text: "Pastries? You know me too well", 
            nextNode: "playful",
            effect: { relationship: 4, memory: "gifts" } 
          },
          { 
            text: "It's nice to have a moment of normalcy",
            nextNode: "reflective",
            effect: { relationship: 3, memory: "time" } 
          }
        ]
      },
      {
        id: "appreciation",
        text: "{voice:eric}I pay attention to what makes you happy. That's important to me.",
        portrait: "eric_warm",
        relationshipVariants: {
          growing: {
            text: "{voice:eric}I love seeing you smile. It makes everything worth it.",
            effect: { relationship: 2 }
          },
          strong: {
            text: "{voice:eric}Making you happy is one of my greatest joys. You deserve all the happiness in the world.",
            effect: { relationship: 4 }
          }
        },
        nextNode: "mini_game_invite"
      },
      {
        id: "playful",
        text: "{voice:eric}How could I forget? You nearly ate the whole display case when we first came here!",
        portrait: "eric_laughing",
        relationshipVariants: {
          strained: {
            text: "{voice:eric}I remember... though you weren't in the mood to eat last time we were here.",
            effect: { relationship: -1 }
          }
        },
        nextNode: "mini_game_invite"
      },
      {
        id: "reflective",
        text: "{voice:eric}These moments are precious. They remind us what we're fighting for.",
        portrait: "eric_thoughtful",
        relationshipVariants: {
          unbreakable: {
            text: "{voice:eric}Moments like this are why I fight. Not just for survival, but for a future where we can have peace like this every day.",
            effect: { relationship: 5 }
          }
        },
        nextNode: "mini_game_invite"
      },
      {
        id: "mini_game_invite",
        text: "{voice:eric}Speaking of food, want to try making something together? I brought ingredients!",
        portrait: "eric_holding_bags",
        choices: [
          { 
            text: "Absolutely! I love cooking with you", 
            nextNode: "mini_game",
            effect: { relationship: 3 }
          },
          { 
            text: "I'm not much of a cook, but I'll try", 
            nextNode: "mini_game",
            effect: { relationship: 2 }
          },
          { 
            text: "Maybe next time, I'm not in the mood",
            nextNode: "mini_declined",
            effect: { relationship: -2 }
          }
        ]
      },
      {
        id: "mini_game",
        text: "Time for a cooking challenge!",
        showPortrait: false,
        nextNode: "mini_game_result"
      },
      {
        id: "mini_declined",
        text: "{voice:eric}Oh... okay. Maybe another time then.",
        portrait: "eric_disappointed",
        relationshipVariants: {
          strong: {
            text: "{voice:eric}I understand. We'll do something else you enjoy instead.",
            effect: { relationship: -1 }
          }
        },
        nextNode: "story_continues"
      },
      {
        id: "mini_game_result",
        text: "The cooking result will be processed by the game system.",
        showPortrait: false,
        choices: [
          { text: "See results", nextNode: "coffee_conclusion" }
        ]
      },
      {
        id: "coffee_conclusion",
        text: "{voice:calvin}That was fun! Even if the food wasn't perfect, spending time with you made it worthwhile.",
        portrait: "calvin_smiling",
        relationshipVariants: {
          strained: {
            text: "{voice:calvin}We should probably get back to the fight...",
            nextNode: "transition_back"
          }
        },
        nextNode: "eric_conclusion"
      },
      {
        id: "eric_conclusion",
        text: "{voice:eric}The food is just a bonus. The real reward is making memories with you.",
        portrait: "eric_warm",
        nextNode: "transition_back"
      },
      {
        id: "transition_back",
        text: "With the date concluded, you both return to the main world, your bond strengthened by the shared experience.",
        showPortrait: false,
        effect: { completeDate: "firstDate", setFlag: "firstDateCompleted" },
        nextNode: "level_start"
      }
    ]
  },

  // Second Date - Movie Theater
  "second_date_movie": {
    startNode: "movie_intro",
    music: "date-music",
    miniGame: "STARGAZING", // Will trigger stargazing mini-game
    nodes: [
      {
        id: "movie_intro",
        text: "{voice:calvin}A movie theater? I didn't think anything like this still worked.",
        portrait: "calvin_surprised",
        nextNode: "eric_explanation"
      },
      {
        id: "eric_explanation",
        text: "{voice:eric}I found an old generator and got it running. I wanted to recreate a normal date experience for you.",
        portrait: "eric_proud",
        choices: [
          { 
            text: "You did all this for our date?", 
            nextNode: "touched",
            effect: { relationship: 6, memory: "acts" } 
          },
          { 
            text: "That's impressive! What are we watching?",
            nextNode: "curious",
            effect: { relationship: 4, memory: "time" } 
          },
          { 
            text: "I'm not really in the mood for a movie",
            nextNode: "reluctant",
            effect: { relationship: -3 }
          }
        ]
      },
      {
        id: "touched",
        text: "{voice:eric}Anything for you. I wanted to give you a moment of escape from all the fighting.",
        portrait: "eric_gentle",
        relationshipVariants: {
          growing: {
            text: "{voice:eric}Seeing your face light up makes all the work worth it.",
            effect: { relationship: 3 }
          },
          strong: {
            text: "{voice:eric}Making you happy is my greatest motivation. I'd rebuild the entire world if it meant seeing you smile.",
            effect: { relationship: 5 }
          }
        },
        nextNode: "movie_selection"
      },
      {
        id: "curious",
        text: "{voice:eric}I found an old classic - 'Eternal Bonds'. It's about two people who face adversity together and their love grows stronger.",
        portrait: "eric_excited",
        relationshipVariants: {
          strained: {
            text: "{voice:eric}I thought it might inspire us... though our relationship hasn't been easy lately.",
            effect: { relationship: -1 }
          }
        },
        nextNode: "movie_selection"
      },
      {
        id: "reluctant",
        text: "{voice:eric}I understand. But please, just one movie? I worked hard to make this perfect.",
        portrait: "eric_pleading",
        choices: [
          { text: "Alright, one movie", nextNode: "movie_selection", effect: { relationship: 2 } },
          { text: "No, let's go back", nextNode: "end_date_early", effect: { relationship: -4 } }
        ]
      },
      {
        id: "movie_selection",
        text: "Eric shows you the movie selection, his eyes bright with excitement.",
        portrait: "eric_excited",
        choices: [
          { 
            text: "I'd love to watch 'Eternal Bonds' with you", 
            nextNode: "watch_movie",
            effect: { relationship: 3 }
          },
          { 
            text: "How about something lighter? 'Comedy Night'?",
            nextNode: "watch_comedy",
            effect: { relationship: 2 }
          }
        ]
      },
      {
        id: "watch_movie",
        text: "{voice:eric}Perfect! I think you'll really like it. It reminds me of us.",
        portrait: "eric_warm",
        nextNode: "mini_game_invite"
      },
      {
        id: "watch_comedy",
        text: "{voice:eric}Good choice! We could all use a good laugh these days.",
        portrait: "eric_smiling",
        nextNode: "mini_game_invite"
      },
      {
        id: "mini_game_invite",
        text: "{voice:eric}After the movie, want to go outside? There's a perfect spot for stargazing on the roof.",
        portrait: "eric_hopeful",
        choices: [
          { 
            text: "I'd love to see the stars with you", 
            nextNode: "mini_game",
            effect: { relationship: 4 }
          },
          { 
            text: "Maybe next time, I'm tired",
            nextNode: "mini_declined",
            effect: { relationship: -2 }
          }
        ]
      },
      {
        id: "mini_game",
        text: "Time for a stargazing challenge!",
        showPortrait: false,
        nextNode: "mini_game_result"
      },
      {
        id: "mini_declined",
        text: "{voice:eric}Oh... okay. Another time then.",
        portrait: "eric_disappointed",
        nextNode: "movie_conclusion"
      },
      {
        id: "mini_game_result",
        text: "The stargazing result will be processed by the game system.",
        showPortrait: false,
        choices: [
          { text: "See results", nextNode: "movie_conclusion" }
        ]
      },
      {
        id: "movie_conclusion",
        text: "{voice:calvin}That movie was beautiful. It made me think about our own journey together.",
        portrait: "calvin_thoughtful",
        relationshipVariants: {
          strained: {
            text: "{voice:calvin}We should probably head back now.",
            nextNode: "transition_back"
          }
        },
        nextNode: "eric_conclusion"
      },
      {
        id: "eric_conclusion",
        text: "{voice:eric}Every challenge we've faced has brought us closer. I wouldn't change a thing about our story.",
        portrait: "eric_passionate",
        nextNode: "transition_back"
      },
      {
        id: "transition_back",
        text: "With the date concluded, you return to the main world, your connection deepened by the shared experience.",
        showPortrait: false,
        effect: { completeDate: "secondDate", setFlag: "secondDateCompleted" },
        nextNode: "level_start"
      },
      {
        id: "end_date_early",
        text: "Reluctantly, you both head back to the main world, the special moment lost.",
        showPortrait: false,
        effect: { setFlag: "dateFailed" },
        nextNode: "level_start"
      }
    ]
  },

  // Third Date - Park Picnic
  "third_date_park": {
    startNode: "park_intro",
    music: "date-music",
    miniGame: "MUSIC", // Will trigger music mini-game
    nodes: [
      {
        id: "park_intro",
        text: "{voice:calvin}The park looks beautiful today. It's hard to believe this peace exists in our world.",
        portrait: "calvin_observant",
        nextNode: "eric_memory"
      },
      {
        id: "eric_memory",
        text: "{voice:eric}This is where we had our first picnic together, remember? Before everything changed.",
        portrait: "eric_nostalgic",
        choices: [
          { 
            text: "I remember everything about that day", 
            nextNode: "memory_shared",
            effect: { relationship: 5, memory: "words" } 
          },
          { 
            text: "I remember you brought my favorite sandwiches",
            nextNode: "gift_appreciation",
            effect: { relationship: 4, memory: "gifts" } 
          },
          { 
            text: "That was a simpler time",
            nextNode: "melancholy",
            effect: { relationship: 2 }
          }
        ]
      },
      {
        id: "memory_shared",
        text: "{voice:eric}Me too. It's one of my happiest memories. I've held onto it through all the dark times.",
        portrait: "eric_emotional",
        relationshipVariants: {
          growing: {
            text: "{voice:eric}Sharing memories makes our bond stronger. I treasure every moment with you.",
            effect: { relationship: 3 }
          },
          strong: {
            text: "{voice:eric}Our memories are like stars in the darkness - they guide us and give us hope.",
            effect: { relationship: 5 }
          },
          unbreakable: {
            text: "{voice:eric}Every memory with you is etched in my heart. They're what make me fight to protect this world.",
            effect: { relationship: 7 }
          }
        },
        nextNode: "mini_game_invite"
      },
      {
        id: "gift_appreciation",
        text: "{voice:eric}I remember you smiled so much that day. Making you happy has always been my greatest joy.",
        portrait: "eric_warm",
        nextNode: "mini_game_invite"
      },
      {
        id: "melancholy",
        text: "{voice:eric}I know things have been harder since then. But I believe we can find peace again.",
        portrait: "eric_hopeful",
        nextNode: "mini_game_invite"
      },
      {
        id: "mini_game_invite",
        text: "{voice:eric}I brought my instrument. Want to play some music together?",
        portrait: "eric_holding_guitar",
        choices: [
          { 
            text: "I'd love to make music with you", 
            nextNode: "mini_game",
            effect: { relationship: 4 }
          },
          { 
            text: "You play, I'll listen",
            nextNode: "mini_game",
            effect: { relationship: 3 }
          },
          { 
            text: "Not really in the mood for music",
            nextNode: "mini_declined",
            effect: { relationship: -3 }
          }
        ]
      },
      {
        id: "mini_game",
        text: "Time for a music challenge!",
        showPortrait: false,
        nextNode: "mini_game_result"
      },
      {
        id: "mini_declined",
        text: "{voice:eric}Oh... okay. I understand.",
        portrait: "eric_disappointed",
        nextNode: "conversation_continues"
      },
      {
        id: "mini_game_result",
        text: "The music result will be processed by the game system.",
        showPortrait: false,
        choices: [
          { text: "See results", nextNode: "conversation_continues" }
        ]
      },
      {
        id: "conversation_continues",
        text: "{voice:calvin}Playing music with you always lifts my spirits, even on the darkest days.",
        portrait: "calvin_smiling",
        nextNode: "eric_deepen"
      },
      {
        id: "eric_deepen",
        text: "{voice:eric}Music connects us on a level beyond words. It's like our souls are in harmony.",
        portrait: "eric_passionate",
        relationshipVariants: {
          strong: {
            text: "{voice:eric}When we make music together, I feel a bond that transcends this world. You complete me.",
            effect: { relationship: 6 }
          },
          unbreakable: {
            text: "{voice:eric}Our harmony is more than music - it's the sound of two hearts beating as one. I've never felt this connected to anyone.",
            effect: { relationship: 8 }
          }
        },
        nextNode: "date_conclusion"
      },
      {
        id: "date_conclusion",
        text: "As the sun sets over the park, you realize how much your relationship has grown through shared experiences and overcoming challenges together.",
        showPortrait: false,
        effect: { completeDate: "thirdDate", setFlag: "thirdDateCompleted" },
        nextNode: "transition_back"
      },
      {
        id: "transition_back",
        text: "With the date concluded, you return to the main world, your bond stronger than ever.",
        showPortrait: false,
        nextNode: "level_start"
      }
    ]
  },

  // Fourth Date - Secret Garden (only accessible with high relationship)
  "fourth_date_garden": {
    startNode: "garden_intro",
    music: "secret-music",
    miniGame: "DANCE", // Will trigger dance mini-game
    condition: "relationship >= 90", // Only accessible with high relationship
    nodes: [
      {
        id: "garden_intro",
        text: "{voice:calvin}Where are we? This place feels... magical.",
        portrait: "calvin_entranced",
        nextNode: "eric_reveal"
      },
      {
        id: "eric_reveal",
        text: "{voice:eric}This is a place that only appears for those with an unbreakable bond. I've been waiting to show you this.",
        portrait: "eric_mysterious",
        choices: [
          { 
            text: "It's beautiful... just like our relationship", 
            nextNode: "romantic",
            effect: { relationship: 8, memory: "words" } 
          },
          { 
            text: "You've kept this secret from me?",
            nextNode: "playful_challenge",
            effect: { relationship: 5 }
          },
          { 
            text: "Is this real or another illusion?",
            nextNode: "cautious",
            effect: { relationship: 3 }
          }
        ]
      },
      {
        id: "romantic",
        text: "{voice:eric}Everything beautiful in my life is because of our love. This garden is just a reflection of what we've created together.",
        portrait: "eric_passionate",
        nextNode: "dance_invite"
      },
      {
        id: "playful_challenge",
        text: "{voice:eric}I wanted it to be a surprise! Good things come to those who wait... and I've been waiting for the right moment to share this with you.",
        portrait: "eric_smiling",
        nextNode: "dance_invite"
      },
      {
        id: "cautious",
        text: "{voice:eric}It's as real as our feelings for each other. This place exists because of the strength of our bond.",
        portrait: "eric_sincere",
        nextNode: "dance_invite"
      },
      {
        id: "dance_invite",
        text: "{voice:eric}The garden responds to harmony. Would you dance with me?",
        portrait: "eric_extending_hand",
        choices: [
          { 
            text: "I'd be honored to dance with you", 
            nextNode: "mini_game",
            effect: { relationship: 6 }
          },
          { 
            text: "Lead the way, my love",
            nextNode: "mini_game",
            effect: { relationship: 7 }
          }
        ]
      },
      {
        id: "mini_game",
        text: "Time for a dance challenge!",
        showPortrait: false,
        nextNode: "mini_game_result"
      },
      {
        id: "mini_game_result",
        text: "The dance result will be processed by the game system.",
        showPortrait: false,
        choices: [
          { text: "See results", nextNode: "garden_conclusion" }
        ]
      },
      {
        id: "garden_conclusion",
        text: "{voice:calvin}Dancing with you in this magical garden... it feels like we're part of something greater than ourselves.",
        portrait: "calvin_entranced",
        nextNode: "eric_reveal_power"
      },
      {
        id: "eric_reveal_power",
        text: "{voice:eric}Our love has the power to create beauty even in the darkest times. This garden is proof that love can transform reality.",
        portrait: "eric_wise",
        relationshipVariants: {
          unbreakable: {
            text: "{voice:eric}You are my home, Calvin. Wherever we are together, that's where I belong. This garden will always be here for us.",
            effect: { relationship: 10, unlockMilestone: "true_home" }
          }
        },
        nextNode: "final_garden_moment"
      },
      {
        id: "final_garden_moment",
        text: "As you stand together in the enchanted garden, you realize that your love has become more than just an emotion - it's a force that can shape the world itself.",
        showPortrait: false,
        effect: { 
          completeDate: "fourthDate", 
          setFlag: "fourthDateCompleted",
          relationship: 15,
          unlockMilestone: "garden_master" 
        },
        nextNode: "secret_ending_hint"
      },
      {
        id: "secret_ending_hint",
        text: "{voice:calvin}There's still so much we can do together. Our story is just beginning.",
        portrait: "calvin_hopeful",
        nextNode: "transition_back"
      },
      {
        id: "transition_back",
        text: "With the date concluded, you return to the main world, now aware of the true power of your bond.",
        showPortrait: false,
        nextNode: "level_start"
      }
    ]
  },

  // Shop dialogue
  "shop": {
    startNode: "shop_greeting",
    music: "title-music",
    nodes: [
      {
        id: "shop_greeting",
        text: "{voice:eric}Welcome to my little shop! I've collected some special items that might help you.",
        portrait: "eric_shopkeeper",
        nextNode: "show_inventory"
      },
      {
        id: "show_inventory",
        text: "Eric shows you his collection of special items.",
        showPortrait: false,
        effect: { setFlag: "inShop" },
        nextNode: "shop_menu"
      },
      {
        id: "shop_menu",
        text: "What would you like to do?",
        choices: [
          { text: "Browse items", nextNode: "browse_items" },
          { text: "Sell items", nextNode: "sell_items" },
          { text: "Leave shop", nextNode: "shop_goodbye" }
        ]
      },
      {
        id: "browse_items",
        text: "Here are the items I have available:",
        showPortrait: false,
        nextNode: "display_items"
      },
      {
        id: "display_items",
        text: "This would be populated dynamically by the UI.",
        showPortrait: false,
        choices: [
          { text: "Back to menu", nextNode: "shop_menu" }
        ]
      },
      {
        id: "sell_items",
        text: "What would you like to sell?",
        showPortrait: false,
        nextNode: "display_player_inventory"
      },
      {
        id: "display_player_inventory",
        text: "Your inventory would be shown here.",
        showPortrait: false,
        choices: [
          { text: "Back to menu", nextNode: "shop_menu" }
        ]
      },
      {
        id: "shop_goodbye",
        text: "{voice:eric}Come back anytime! I'm always looking for new treasures to share with you.",
        portrait: "eric_waving",
        nextNode: "shop_exit"
      },
      {
        id: "shop_exit",
        text: "You leave the shop, pondering what items might help you in your journey.",
        showPortrait: false,
        effect: { setFlag: "leftShop" },
        nextNode: "continue_game"
      }
    ]
  },

  // Challenge system dialogue
  "daily_challenge": {
    startNode: "challenge_greeting",
    music: "title-music",
    nodes: [
      {
        id: "challenge_greeting",
        text: "{voice:eric}I heard about today's special challenge. Want to give it a try?",
        portrait: "eric_explaining",
        condition: "dailyChallenge.active",
        nextNode: "challenge_description"
      },
      {
        id: "challenge_description",
        text: "Today's challenge: {challenge.description}",
        showPortrait: false,
        nextNode: "challenge_choice"
      },
      {
        id: "challenge_choice",
        text: "How do you want to approach this?",
        choices: [
          { text: "Let's do it!", nextNode: "challenge_accepted", effect: { setFlag: "challengeAccepted" } },
          { text: "Maybe later", nextNode: "challenge_postponed" }
        ]
      },
      {
        id: "challenge_accepted",
        text: "{voice:eric}That's the spirit! I believe in you.",
        portrait: "eric_encouraging",
        nextNode: "challenge_start"
      },
      {
        id: "challenge_start",
        text: "The challenge begins now!",
        showPortrait: false,
        effect: { setFlag: "challengeActive" },
        nextNode: "challenge_in_progress"
      },
      {
        id: "challenge_postponed",
        text: "{voice:eric}I understand. The challenge will still be here when you're ready.",
        portrait: "eric_understanding",
        nextNode: "challenge_exit"
      },
      {
        id: "challenge_in_progress",
        text: "You're making progress on today's challenge!",
        showPortrait: false,
        choices: [
          { text: "Continue", nextNode: "challenge_continue" }
        ]
      },
      {
        id: "challenge_continue",
        text: "Your progress: {challenge.progress}/{challenge.maxProgress}",
        showPortrait: false,
        nextNode: "challenge_choice"  // Could loop back
      },
      {
        id: "challenge_completed",
        text: "{voice:eric}You did it! That was amazing!",
        portrait: "eric_celebrating",
        nextNode: "challenge_reward"
      },
      {
        id: "challenge_reward",
        text: "As a reward, you receive {reward.description}.",
        showPortrait: false,
        effect: { 
          currency: { love: 50 }, 
          relationship: 5,
          setFlag: "challengeCompleted" 
        },
        nextNode: "challenge_exit"
      },
      {
        id: "challenge_exit",
        text: "You leave the challenge area, ready for your next adventure.",
        showPortrait: false,
        nextNode: "continue_game"
      }
    ]
  },

  // Relationship recall dialogue
  "relationship_recall": {
    startNode: "recall_intro",
    music: "date-music",
    nodes: [
      {
        id: "recall_intro",
        text: "{voice:eric}Sometimes I like to remember our special moments together. Want to revisit one?",
        portrait: "eric_nostalgic",
        condition: "hasMemoryRecall",
        nextNode: "select_memory"
      },
      {
        id: "select_memory",
        text: "Which memory would you like to revisit?",
        showPortrait: false,
        choices: [
          { text: "Our first meeting", nextNode: "first_meeting", condition: "memoryAvailable:firstMeeting" },
          { text: "Our first fight", nextNode: "first_fight", condition: "memoryAvailable:firstFight" },
          { text: "When we made up", nextNode: "resolution", condition: "memoryAvailable:resolution" },
          { text: "Another time", nextNode: "recall_exit" }
        ]
      },
      {
        id: "first_meeting",
        text: "Remember when we first met?",
        showPortrait: false,
        nextNode: "first_meeting_choice"
      },
      {
        id: "first_meeting_choice",
        text: "How do you remember our first meeting?",
        choices: [
          { text: "I remember you were nervous", nextNode: "first_meeting_response", effect: { relationship: 3, memory: "words" } },
          { text: "I remember holding your hand", nextNode: "first_meeting_response", effect: { relationship: 4, memory: "touch" } },
          { text: "I remember the flowers you gave me", nextNode: "first_meeting_response", effect: { relationship: 2, memory: "gifts" } }
        ]
      },
      {
        id: "first_meeting_response",
        text: "{voice:eric}Those details mean so much to me. You always notice the little things.",
        portrait: "eric_warm",
        nextNode: "recall_continue"
      },
      {
        id: "first_fight",
        text: "Our first argument was during that monster attack, remember?",
        showPortrait: false,
        nextNode: "first_fight_choice"
      },
      {
        id: "first_fight_choice",
        text: "How do you feel about our first fight?",
        choices: [
          { text: "I should have protected you better", nextNode: "first_fight_response", effect: { relationship: 2, memory: "acts" } },
          { text: "I was scared for both of us", nextNode: "first_fight_response", effect: { relationship: 4, memory: "words" } },
          { text: "We got through it together", nextNode: "first_fight_response", effect: { relationship: 5, memory: "connection" } }
        ]
      },
      {
        id: "first_fight_response",
        text: "{voice:eric}That moment taught me that even in our hardest times, we can find strength in each other.",
        portrait: "eric_wise",
        nextNode: "recall_continue"
      },
      {
        id: "resolution",
        text: "After the fight, we talked things out...",
        showPortrait: false,
        nextNode: "resolution_choice"
      },
      {
        id: "resolution_choice",
        text: "How do you remember making up?",
        choices: [
          { text: "I promised to always be honest", nextNode: "resolution_response", effect: { relationship: 5, memory: "words" } },
          { text: "We shared a dance under the stars", nextNode: "resolution_response", effect: { relationship: 6, memory: "time" } },
          { text: "I gave you a charm for protection", nextNode: "resolution_response", effect: { relationship: 4, memory: "gifts" } }
        ]
      },
      {
        id: "resolution_response",
        text: "{voice:eric}Those moments of reconciliation are some of the most precious in our relationship. They show how much we care.",
        portrait: "eric_emotional",
        nextNode: "recall_continue"
      },
      {
        id: "recall_continue",
        text: "More memories could be revisited as your relationship grows.",
        showPortrait: false,
        nextNode: "select_memory"  // Loop back
      },
      {
        id: "recall_exit",
        text: "{voice:eric}We can remember more another time. I cherish all our moments together.",
        portrait: "eric_affectionate",
        nextNode: "continue_game"
      }
    ]
  },

  // New Game+ dialogue
  "new_game_plus": {
    startNode: "ngp_introduction",
    music: "combat-music",
    nodes: [
      {
        id: "ngp_introduction",
        text: "{voice:calvin}After defeating the final boss, a strange energy courses through me. The world feels different...",
        portrait: "calvin_transformed",
        condition: "newGamePlus.active",
        nextNode: "ngp_changes"
      },
      {
        id: "ngp_changes",
        text: "{voice:eric}I feel it too. The darkness is stronger, but so is our connection. This is New Game+!",
        portrait: "eric_determined",
        relationshipVariants: {
          unbreakable: {
            text: "{voice:eric}Our love has evolved. We're stronger together than we ever were before. The challenges ahead will be greater, but so will our rewards.",
            effect: { relationship: 5 }
          }
        },
        nextNode: "ngp_explanation"
      },
      {
        id: "ngp_explanation",
        text: "Welcome to New Game+! Enemies are stronger, but your relationship has unlocked new abilities. Can you survive the enhanced world?",
        showPortrait: false,
        choices: [
          { text: "Let's face this new challenge", nextNode: "ngp_start", effect: { setFlag: "ngpAccepted" } },
          { text: "I need to prepare first", nextNode: "ngp_prepare" }
        ]
      },
      {
        id: "ngp_start",
        text: "The enhanced world awaits. Your journey continues with greater challenges and greater rewards.",
        showPortrait: false,
        nextNode: "level_start"
      },
      {
        id: "ngp_prepare",
        text: "{voice:eric}Take your time. I'll be here when you're ready to face the darkness together.",
        portrait: "eric_supportive",
        nextNode: "ngp_exit"
      },
      {
        id: "ngp_exit",
        text: "You leave to prepare for the enhanced challenges of New Game+.",
        showPortrait: false,
        nextNode: "continue_game"
      }
    ]
  },

  // Tutorial dialogues
  "tutorial_combat": {
    startNode: "combat_intro",
    music: "world-music",
    nodes: [
      {
        id: "combat_intro",
        text: "{voice:eric}Looks like enemies ahead! Let me show you how to fight together.",
        portrait: "eric_pointing",
        condition: "not tutorial.combat",
        nextNode: "combat_explain"
      },
      {
        id: "combat_explain",
        text: "{voice:eric}Press SPACE to attack. When our relationship grows, I can heal you and we can perform special combo attacks!",
        portrait: "eric_demonstrating",
        nextNode: "combat_practice"
      },
      {
        id: "combat_practice",
        text: "Try defeating these practice enemies.",
        showPortrait: false,
        effect: { setFlag: "combatTutorialActive", unlockMilestone: "tutorialCombat" },
        nextNode: "combat_wait"
      },
      {
        id: "combat_wait",
        text: "I'll wait here while you practice.",
        showPortrait: false,
        condition: "combatTutorialActive",
        nextNode: "combat_wait"  // Will be broken by player action
      },
      {
        id: "combat_complete",
        text: "{voice:eric}Great job! You're a natural. Remember, our bond makes us stronger together.",
        portrait: "eric_proud",
        nextNode: "tutorial_complete"
      },
      {
        id: "tutorial_complete",
        text: "Combat tutorial complete!",
        showPortrait: false,
        effect: { setFlag: "combatTutorialComplete", relationship: 3 },
        nextNode: "continue_game"
      }
    ]
  },

  // Victory dialogue
  "victory": {
    startNode: "victory_celebration",
    music: "ending-music",
    nodes: [
      {
        id: "victory_celebration",
        text: "{voice:calvin}We did it! The darkness is gone!",
        portrait: "calvin_joyful",
        condition: "victory.achieved",
        nextNode: "eric_response"
      },
      {
        id: "eric_response",
        text: "{voice:eric}We fought through every challenge together. Our love was stronger than any fear.",
        portrait: "eric_embracing",
        relationshipVariants: {
          strained: {
            text: "{voice:eric}I hope... I hope this means we can finally find peace. I'll always be here for you.",
            effect: { relationship: 5 }
          },
          growing: {
            text: "{voice:eric}Look at how far we've come! I'm so proud of us for overcoming everything together.",
            effect: { relationship: 8 }
          },
          strong: {
            text: "{voice:eric}Our bond carried us through the darkness. I can't imagine facing anything without you by my side.",
            effect: { relationship: 12 }
          },
          unbreakable: {
            text: "{voice:eric}This victory is ours, but our journey is just beginning. With our love, we can create a brighter future for everyone.",
            effect: { relationship: 15, unlockMilestone: "new_beginning" }
          }
        },
        nextNode: "victory_epilogue"
      },
      {
        id: "victory_epilogue",
        text: "With the darkness vanquished, you and Eric look toward a future filled with hope. But the world still holds mysteries, and your love continues to grow with each passing day.",
        showPortrait: false,
        nextNode: "victory_options"
      },
      {
        id: "victory_options",
        text: "What would you like to do next?",
        choices: [
          { text: "Start New Game+", nextNode: "ngp_offer", condition: "ngp.available" },
          { text: "Explore other game modes", nextNode: "explore_modes" },
          { text: "Check achievements", nextNode: "check_achievements" },
          { text: "End session", nextNode: "game_complete" }
        ]
      },
      {
        id: "ngp_offer",
        text: "{voice:eric}The darkness may be gone, but a more intense challenge awaits in New Game+. Are you ready?",
        portrait: "eric_challenging",
        choices: [
          { text: "Bring it on!", nextNode: "start_ngp", effect: { setFlag: "startNGP" } },
          { text: "I'll prepare first", nextNode: "prepare_ngp" }
        ]
      },
      {
        id: "explore_modes",
        text: "Various game modes are now available for you to explore.",
        showPortrait: false,
        nextNode: "display_modes"
      },
      {
        id: "check_achievements",
        text: "You've achieved many milestones on your journey. Your dedication is impressive.",
        showPortrait: false,
        nextNode: "display_achievements"
      },
      {
        id: "game_complete",
        text: "Thank you for playing 'Calvin with Eric'. Your journey of love and courage has inspired us all.",
        showPortrait: false,
        nextNode: "exit_game"
      },
      {
        id: "exit_game",
        text: "The screen fades to black as you and Eric walk into the sunset, ready for whatever adventures await.",
        showPortrait: false,
        effect: { setFlag: "gameCompleted" },
        nextNode: "title_screen"
      },
      {
        id: "title_screen",
        text: "Would you like to play again?",
        showPortrait: false,
        choices: [
          { text: "Yes, start over", nextNode: "restart_game" },
          { text: "No, exit", nextNode: "final_exit" }
        ]
      },
      {
        id: "restart_game",
        text: "A new journey begins...",
        showPortrait: false,
        nextNode: "main_menu"
      },
      {
        id: "final_exit",
        text: "Goodbye, friend. May love guide your path.",
        showPortrait: false,
        nextNode: "game_end"
      }
    ]
  }
};

// Export for game access
if (typeof module !== 'undefined') {
  module.exports = DIALOGUE_TREES;
}
