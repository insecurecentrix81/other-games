// ============================================
// GAME CONSTANTS - Extended for Engagement
// ============================================

export const ENGAGEMENT_CONFIG = {
    // Progression Systems
    MAX_PLAYER_LEVEL: 50,
    XP_PER_LEVEL: 1000,
    LEVEL_REWARDS: {
        5: { type: 'weapon', id: 'schofield_revolver' },
        10: { type: 'ability', id: 'dead_eye_mastery' },
        15: { type: 'horse', id: 'thoroughbred' },
        20: { type: 'ability', id: 'fast_reload' },
        25: { type: 'weapon', id: 'springfield_rifle' },
        30: { type: 'ability', id: 'health_regeneration' },
        35: { type: 'horse', id: 'arabian' },
        40: { type: 'ability', id: 'bullet_time' },
        45: { type: 'weapon', id: 'rare_shotgun' },
        50: { type: 'title', id: 'legend_of_the_west' }
    },

    // Reputation Tiers
    REPUTATION_TIERS: [
        { name: 'Notorious Outlaw', level: -100, rewards: ['bounty_hunters', 'outlaw_gear'] },
        { name: 'Outlaw', level: -50, rewards: ['discount_outlaw'] },
        { name: 'Neutral', level: 0, rewards: [] },
        { name: 'Respected', level: 50, rewards: ['discount_lawful'] },
        { name: 'Legendary Lawman', level: 100, rewards: ['deputy_badge', 'lawman_gear'] }
    ],

    // Daily Challenges
    DAILY_CHALLENGE_COUNT: 3,
    CHALLENGE_REFRESH_HOUR: 0, // Midnight UTC
    
    // Achievement System
    ACHIEVEMENT_CATEGORIES: {
        COMBAT: { color: '#f44336', icon: 'fa-crosshairs' },
        EXPLORATION: { color: '#4CAF50', icon: 'fa-map' },
        PROGRESSION: { color: '#2196F3', icon: 'fa-trophy' },
        COLLECTION: { color: '#FF9800', icon: 'fa-star' },
        MASTERY: { color: '#9C27B0', icon: 'fa-crown' }
    },

    // Endless Mode
    ENDLESS_WAVES_PER_SET: 10,
    ENDLESS_DIFFICULTY_INCREASE: 0.15, // 15% per set
    ENDLESS_REWARD_MULTIPLIER: 1.1,

    // New Game+
    NEW_GAME_PLUS_MULTIPLIERS: {
        ENEMY_HEALTH: 1.5,
        ENEMY_DAMAGE: 1.3,
        ENEMY_ACCURACY: 1.2,
        REWARD_XP: 1.5,
        REWARD_MONEY: 1.5
    },

    // Randomized Elements
    RANDOM_EVENT_CHANCE: 0.01, // 1% chance per minute
    RANDOM_ENCOUNTERS: [
        'ambush', 'bounty_hunters', 'wagon_robbery', 'stranger_quest',
        'animal_attack', 'treasure_hunt', 'duel_challenge'
    ]
};

export const ACHIEVEMENT_DATA = {
    // Combat Achievements
    'first_blood': {
        id: 'first_blood',
        title: 'First Blood',
        description: 'Defeat your first enemy',
        category: 'COMBAT',
        reward: { xp: 100, money: 50 },
        requirement: { type: 'kill_count', target: 1 }
    },
    'gunslinger': {
        id: 'gunslinger',
        title: 'Gunslinger',
        description: 'Defeat 100 enemies',
        category: 'COMBAT',
        reward: { xp: 500, money: 200 },
        requirement: { type: 'kill_count', target: 100 }
    },
    'marksman': {
        id: 'marksman',
        title: 'Marksman',
        description: 'Get 50 headshots',
        category: 'COMBAT',
        reward: { xp: 800, money: 300 },
        requirement: { type: 'headshot_count', target: 50 }
    },
    'survivor': {
        id: 'survivor',
        title: 'Survivor',
        description: 'Complete a mission without taking damage',
        category: 'COMBAT',
        reward: { xp: 1000, money: 500 },
        requirement: { type: 'damageless_mission', target: 1 }
    },
    'legendary_hunter': {
        id: 'legendary_hunter',
        title: 'Legendary Hunter',
        description: 'Defeat 1000 enemies',
        category: 'COMBAT',
        reward: { xp: 5000, money: 2000, item: 'legendary_rifle' },
        requirement: { type: 'kill_count', target: 1000 }
    },

    // Exploration Achievements
    'frontier_explorer': {
        id: 'frontier_explorer',
        title: 'Frontier Explorer',
        description: 'Discover all regions',
        category: 'EXPLORATION',
        reward: { xp: 1500, money: 1000 },
        requirement: { type: 'regions_discovered', target: 8 }
    },
    'treasure_hunter': {
        id: 'treasure_hunter',
        title: 'Treasure Hunter',
        description: 'Find 10 hidden treasures',
        category: 'EXPLORATION',
        reward: { xp: 2000, money: 1500 },
        requirement: { type: 'treasures_found', target: 10 }
    },

    // Progression Achievements
    'story_complete': {
        id: 'story_complete',
        title: 'End of an Era',
        description: 'Complete the main story',
        category: 'PROGRESSION',
        reward: { xp: 5000, money: 5000, title: 'Story Champion' },
        requirement: { type: 'missions_completed', target: 15 }
    },
    'max_level': {
        id: 'max_level',
        title: 'Living Legend',
        description: 'Reach level 50',
        category: 'PROGRESSION',
        reward: { xp: 10000, money: 10000, title: 'Legend of the West' },
        requirement: { type: 'player_level', target: 50 }
    },

    // Collection Achievements
    'weapon_collector': {
        id: 'weapon_collector',
        title: 'Arsenal',
        description: 'Collect all weapons',
        category: 'COLLECTION',
        reward: { xp: 3000, money: 2000 },
        requirement: { type: 'weapons_collected', target: 12 }
    },
    'horse_master': {
        id: 'horse_master',
        title: 'Horse Master',
        description: 'Own all horse breeds',
        category: 'COLLECTION',
        reward: { xp: 2500, money: 1500 },
        requirement: { type: 'horses_owned', target: 5 }
    },

    // Mastery Achievements
    'dead_eye_master': {
        id: 'dead_eye_master',
        title: 'Dead Eye Master',
        description: 'Kill 100 enemies in Dead Eye mode',
        category: 'MASTERY',
        reward: { xp: 4000, money: 3000, ability: 'extended_dead_eye' },
        requirement: { type: 'dead_eye_kills', target: 100 }
    },
    'quick_draw': {
        id: 'quick_draw',
        title: 'Quick Draw',
        description: 'Win 25 duels',
        category: 'MASTERY',
        reward: { xp: 3500, money: 2500 },
        requirement: { type: 'duels_won', target: 25 }
    }
};

export const DAILY_CHALLENGE_POOL = [
    {
        id: 'daily_kills',
        title: 'Bandit Cleanup',
        description: 'Defeat 15 enemies today',
        reward: { xp: 500, money: 200 },
        requirement: { type: 'daily_kills', target: 15 }
    },
    {
        id: 'daily_headshots',
        title: 'Precision Practice',
        description: 'Get 5 headshots today',
        reward: { xp: 300, money: 150 },
        requirement: { type: 'daily_headshots', target: 5 }
    },
    {
        id: 'daily_treasure',
        title: 'Treasure Hunt',
        description: 'Find 3 hidden treasures today',
        reward: { xp: 700, money: 300 },
        requirement: { type: 'daily_treasures', target: 3 }
    },
    {
        id: 'daily_mission',
        title: 'Mission Specialist',
        description: 'Complete 2 missions today',
        reward: { xp: 600, money: 250 },
        requirement: { type: 'daily_missions', target: 2 }
    },
    {
        id: 'daily_no_damage',
        title: 'Untouchable',
        description: 'Complete a mission without taking damage',
        reward: { xp: 1000, money: 500 },
        requirement: { type: 'daily_damageless', target: 1 }
    },
    {
        id: 'daily_bounties',
        title: 'Bounty Hunter',
        description: 'Complete 3 bounty missions',
        reward: { xp: 800, money: 400 },
        requirement: { type: 'daily_bounties', target: 3 }
    }
];

export const ENDLESS_WAVE_CONFIG = {
    WAVE_SETS: [
        {
            name: 'Frontier Town',
            waves: [
                { enemies: 8, types: ['bandit'], difficulty: 1.0 },
                { enemies: 12, types: ['bandit', 'bandit'], difficulty: 1.2 },
                { enemies: 15, types: ['bandit', 'bandit', 'bandit_leader'], difficulty: 1.5 },
                { enemies: 10, types: ['bandit', 'lawmen'], difficulty: 1.8 },
                { enemies: 18, types: ['bandit', 'bandit', 'bandit_leader'], difficulty: 2.0 },
                { enemies: 12, types: ['bounty_hunter'], difficulty: 2.2 },
                { enemies: 20, types: ['bandit', 'bounty_hunter'], difficulty: 2.5 },
                { enemies: 15, types: ['bandit_leader', 'bandit_leader'], difficulty: 2.8 },
                { enemies: 25, types: ['bandit', 'bandit', 'bounty_hunter'], difficulty: 3.0 },
                { enemies: 1, types: ['boss_outlaw'], difficulty: 3.5, boss: true }
            ]
        },
        {
            name: 'Indian Territory',
            waves: [
                { enemies: 10, types: ['bandit'], difficulty: 1.0 },
                { enemies: 8, types: ['wolf', 'wolf'], difficulty: 1.3 },
                { enemies: 15, types: ['bandit', 'wolf'], difficulty: 1.6 },
                { enemies: 12, types: ['bounty_hunter', 'bounty_hunter'], difficulty: 1.9 },
                { enemies: 20, types: ['bandit', 'wolf', 'wolf'], difficulty: 2.2 },
                { enemies: 10, types: ['bear'], difficulty: 2.5 },
                { enemies: 18, types: ['bounty_hunter', 'wolf'], difficulty: 2.8 },
                { enemies: 22, types: ['bandit', 'bounty_hunter', 'wolf'], difficulty: 3.2 },
                { enemies: 15, types: ['bear', 'wolf'], difficulty: 3.5 },
                { enemies: 1, types: ['boss_bounty_hunter'], difficulty: 4.0, boss: true }
            ]
        },
        {
            name: 'Mining Camp',
            waves: [
                { enemies: 12, types: ['bandit'], difficulty: 1.0 },
                { enemies: 15, types: ['bandit', 'bandit'], difficulty: 1.4 },
                { enemies: 10, types: ['lawmen', 'lawmen'], difficulty: 1.8 },
                { enemies: 20, types: ['bandit', 'lawmen'], difficulty: 2.2 },
                { enemies: 8, types: ['bandit_leader'], difficulty: 2.6 },
                { enemies: 25, types: ['bandit', 'bandit_leader'], difficulty: 3.0 },
                { enemies: 15, types: ['lawmen', 'lawmen', 'lawmen'], difficulty: 3.4 },
                { enemies: 30, types: ['bandit', 'bandit', 'bandit_leader'], difficulty: 3.8 },
                { enemies: 18, types: ['bounty_hunter', 'bounty_hunter'], difficulty: 4.2 },
                { enemies: 1, types: ['boss_lawman'], difficulty: 5.0, boss: true }
            ]
        }
    ],
    
    REWARDS_PER_WAVE: {
        xp: 100,
        money: 50,
        multiplier: 1.1 // 10% increase per wave
    }
};

export const PROGRESSION_DATA = {
    // Skill Tree
    SKILL_TREE: {
        COMBAT: [
            { id: 'fast_reload', name: 'Fast Reload', description: '25% faster reload speed', cost: 2, maxLevel: 3 },
            { id: 'steady_aim', name: 'Steady Aim', description: '20% less weapon sway', cost: 2, maxLevel: 3 },
            { id: 'bullet_time', name: 'Bullet Time', description: 'Slow time when aiming', cost: 5, maxLevel: 1 },
            { id: 'critical_hit', name: 'Critical Hit', description: '10% chance for double damage', cost: 3, maxLevel: 3 },
            { id: 'health_on_kill', name: 'Vampire', description: 'Heal 5 HP on kill', cost: 4, maxLevel: 2 }
        ],
        SURVIVAL: [
            { id: 'max_health', name: 'Toughness', description: '+20 max health', cost: 2, maxLevel: 5 },
            { id: 'max_stamina', name: 'Endurance', description: '+25 max stamina', cost: 2, maxLevel: 5 },
            { id: 'health_regen', name: 'Recovery', description: 'Regenerate 1 HP/sec out of combat', cost: 3, maxLevel: 3 },
            { id: 'damage_reduction', name: 'Thick Skin', description: '10% damage reduction', cost: 4, maxLevel: 2 },
            { id: 'fall_damage', name: 'Sure Footed', description: '50% less fall damage', cost: 2, maxLevel: 1 }
        ],
        DEAD_EYE: [
            { id: 'dead_eye_duration', name: 'Focus', description: '+50% Dead Eye duration', cost: 2, maxLevel: 3 },
            { id: 'dead_eye_regen', name: 'Concentration', description: 'Faster Dead Eye regeneration', cost: 2, maxLevel: 3 },
            { id: 'dead_eye_damage', name: 'Killer Instinct', description: '+25% damage in Dead Eye', cost: 3, maxLevel: 2 },
            { id: 'mark_multiple', name: 'Master Marksman', description: 'Mark multiple targets', cost: 5, maxLevel: 1 },
            { id: 'auto_reload', name: 'Gunslinger', description: 'Auto reload after Dead Eye', cost: 4, maxLevel: 1 }
        ],
        HORSE: [
            { id: 'horse_speed', name: 'Speed Demon', description: '+20% horse speed', cost: 2, maxLevel: 3 },
            { id: 'horse_stamina', name: 'Endurance Rider', description: '+50% horse stamina', cost: 2, maxLevel: 3 },
            { id: 'horse_health', name: 'Sturdy Steed', description: '+100% horse health', cost: 3, maxLevel: 2 },
            { id: 'horse_combat', name: 'War Horse', description: 'Horse doesn\'t flee in combat', cost: 4, maxLevel: 1 },
            { id: 'horse_recovery', name: 'Quick Recovery', description: 'Horse recovers faster', cost: 2, maxLevel: 2 }
        ]
    },

    // Weapon Unlocks
    WEAPON_UNLOCKS: [
        { id: 'colt_45', name: 'Colt .45', type: 'pistol', unlocked: true },
        { id: 'schofield_revolver', name: 'Schofield Revolver', type: 'revolver', unlockLevel: 5 },
        { id: 'volcanic_pistol', name: 'Volcanic Pistol', type: 'pistol', unlockLevel: 12 },
        { id: 'double_barrel', name: 'Double Barrel Shotgun', type: 'shotgun', unlockLevel: 8 },
        { id: 'repeating_shotgun', name: 'Repeating Shotgun', type: 'shotgun', unlockLevel: 20 },
        { id: 'carbine_repeater', name: 'Carbine Repeater', type: 'rifle', unlockLevel: 3 },
        { id: 'lancaster_repeater', name: 'Lancaster Repeater', type: 'rifle', unlockLevel: 15 },
        { id: 'springfield_rifle', name: 'Springfield Rifle', type: 'rifle', unlockLevel: 25 },
        { id: 'rolling_block', name: 'Rolling Block Rifle', type: 'sniper', unlockLevel: 30 },
        { id: 'rare_shotgun', name: 'Rare Shotgun', type: 'shotgun', achievement: 'legendary_hunter' }
    ],

    // Horse Unlocks
    HORSE_UNLOCKS: [
        { id: 'morgan', name: 'Morgan', speed: 5, stamina: 100, unlocked: true },
        { id: 'thoroughbred', name: 'Thoroughbred', speed: 7, stamina: 120, unlockLevel: 15 },
        { id: 'mustang', name: 'Mustang', speed: 6, stamina: 150, unlockLevel: 10 },
        { id: 'arabian', name: 'Arabian', speed: 8, stamina: 140, unlockLevel: 35 },
        { id: 'appaloosa', name: 'Appaloosa', speed: 5.5, stamina: 130, achievement: 'horse_master' }
    ]
};

export const COLLECTIBLE_DATA = {
    COLLECTIBLE_TYPES: {
        CIGARETTE_CARDS: {
            name: 'Cigarette Cards',
            total: 50,
            reward: { xp: 5000, money: 2500, achievement: 'card_collector' }
        },
        DREAMCATCHERS: {
            name: 'Dreamcatchers',
            total: 20,
            reward: { xp: 3000, money: 1500, ability: 'native_tracking' }
        },
        DINOSAUR_BONES: {
            name: 'Dinosaur Bones',
            total: 30,
            reward: { xp: 4000, money: 2000, title: 'Paleontologist' }
        },
        ROCK_CARVINGS: {
            name: 'Rock Carvings',
            total: 10,
            reward: { xp: 2000, money: 1000, weapon: 'ancient_tomahawk' }
        }
    },

    // Regions with collectibles
    REGIONS: [
        { id: 'new_austin', name: 'New Austin', collectibles: ['cigarette_cards', 'dinosaur_bones'] },
        { id: 'west_elizabeth', name: 'West Elizabeth', collectibles: ['dreamcatchers', 'cigarette_cards'] },
        { id: 'ambarino', name: 'Ambarino', collectibles: ['rock_carvings', 'dinosaur_bones'] },
        { id: 'lemoyne', name: 'Lemoyne', collectibles: ['cigarette_cards', 'dreamcatchers'] },
        { id: 'heartlands', name: 'Heartlands', collectibles: ['dinosaur_bones', 'rock_carvings'] }
    ]
};

export const SIDE_ACTIVITIES = {
    // Random Encounters
    RANDOM_ENCOUNTERS: [
        {
            id: 'stranger_quest',
            name: 'Stranger in Need',
            description: 'Help a traveler with their problem',
            rewards: { xp: 300, money: 150, reputation: 10 },
            rarity: 'common'
        },
        {
            id: 'treasure_map',
            name: 'Treasure Map',
            description: 'Follow clues to find hidden treasure',
            rewards: { xp: 500, money: 300, item: 'random' },
            rarity: 'uncommon'
        },
        {
            id: 'duel_challenge',
            name: 'Duel Challenge',
            description: 'Face off in a quick-draw duel',
            rewards: { xp: 400, money: 200, reputation: 5 },
            rarity: 'common'
        },
        {
            id: 'bounty_notice',
            name: 'Wanted Poster',
            description: 'Capture or kill a wanted criminal',
            rewards: { xp: 600, money: 400, reputation: 15 },
            rarity: 'common'
        },
        {
            id: 'animal_attack',
            name: 'Wild Animal Attack',
            description: 'Defend against aggressive wildlife',
            rewards: { xp: 350, money: 100, item: 'animal_pelt' },
            rarity: 'common'
        },
        {
            id: 'wagon_robbery',
            name: 'Wagon Robbery',
            description: 'Stop bandits from robbing a wagon',
            rewards: { xp: 450, money: 250, reputation: 20 },
            rarity: 'uncommon'
        },
        {
            id: 'rare_encounter',
            name: 'Mysterious Stranger',
            description: 'Encounter a mysterious figure with unique rewards',
            rewards: { xp: 1000, money: 500, item: 'rare' },
            rarity: 'rare'
        }
    ],

    // Mini-games
    MINI_GAMES: [
        {
            id: 'poker',
            name: 'Poker',
            description: 'Texas Hold\'em against AI opponents',
            minBet: 10,
            maxBet: 100,
            locations: ['valentine_saloon', 'rhodes_saloon', 'saint_denis_casino']
        },
        {
            id: 'five_finger_fillet',
            name: 'Five Finger Fillet',
            description: 'Test your speed and precision',
            difficulty: ['easy', 'medium', 'hard'],
            rewards: { easy: 50, medium: 150, hard: 500 }
        },
        {
            id: 'hunting',
            name: 'Hunting',
            description: 'Track and hunt wildlife',
            animals: ['deer', 'wolf', 'bear', 'buffalo'],
            rewards: { pelt: 10, meat: 5, trophy: 100 }
        },
        {
            id: 'fishing',
            name: 'Fishing',
            description: 'Relaxing fishing minigame',
            fish: ['bluegill', 'largemouth_bass', 'steelhead_trout', 'channel_catfish'],
            rewards: { common: 5, uncommon: 15, rare: 50 }
        }
    ]
};

// Extended mission data with side missions
export const MISSION_DATA_EXTENDED = {
    MAIN_STORY: 15, // Original 15 missions
    SIDE_MISSIONS: 25, // New side missions
    BOUNTY_MISSIONS: 50, // Generated bounty missions
    TOTAL_MISSIONS: 90 // Total mission count
};

// Time estimates for extended gameplay
export const PLAY_TIME_ESTIMATES = {
    MAIN_STORY: { min: 90, max: 120 }, // 1.5-2 hours
    SIDE_CONTENT: { min: 180, max: 240 }, // 3-4 hours
    ENDLESS_MODE: { min: 60, max: 9999 }, // 1+ hours to infinite
    COMPLETIONIST: { min: 600, max: 1200 }, // 10-20 hours
    DAILY_PLAY: { min: 15, max: 30 } // 15-30 minutes daily
};
