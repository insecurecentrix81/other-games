/**
 * Enemies and Rivals System - All Characters and AI Management
 * 
 * Purpose: Manages all enemies, rival characters, their AI, stats, abilities, and encounter mechanics
 * Dependencies: This file requires game-engine.js, character-system.js, and school-areas.js to be loaded first
 * Exports: window.EnemiesAndRivals - Enemy and rival management system
 */

class EnemiesAndRivals {
    constructor(engine) {
        this.engine = engine;
        this.rivalCharacters = this.initializeRivalCharacters();
        this.enemyDatabase = this.initializeEnemyDatabase();
        this.bossDatabase = this.initializeBossDatabase();
        this.activeEncounters = new Map();
        this.rivalRelationships = {};
        this.encounterHistory = [];
        this.weeklyEscalation = 0;
        
        // Rival relationship system
        this.relationshipThresholds = {
            hostile: -50,
            unfriendly: -25,
            neutral: 0,
            friendly: 25,
            ally: 50
        };
        
        this.initializeRivalRelationships();
    }

    /**
     * Initialize all rival characters with full characterizations
     */
    initializeRivalCharacters() {
        return {
            'anbu': {
                name: 'Anbu',
                fullName: 'Anbu Krishnan',
                type: 'academic_rival',
                personality: 'competitive',
                description: 'The class valedictorian who sees everyone as competition',
                portrait: '🎓',
                stats: {
                    attack: 20,
                    defense: 15,
                    speed: 18,
                    intelligence: 25,
                    charisma: 12,
                    luck: 8
                },
                abilities: ['Study Shield', 'Academic Focus', 'Grade Boost', 'Note Taking'],
                preferredBattleStyle: 'defensive',
                weaknesses: ['social_situations', 'group_projects'],
                strengths: ['individual_work', 'test_taking'],
                catchphrases: [
                    'Study harder, maybe then you\'ll catch up!',
                    'I\'ve already finished this chapter...',
                    'Did you even read the assignment?'
                ],
                background: 'Coming from a family of doctors, Anbu feels pressure to be perfect in everything',
                unlockRequirements: { week: 1, knowledge: 30 },
                encounterLocations: ['classroom1', 'library', 'hallway1'],
                relationshipStart: 'unfriendly',
                specialAbilities: {
                    'grade_analysis': 'Can predict enemy attack patterns based on difficulty',
                    'study_session': 'Restores health during long battles'
                },
                dropTable: [
                    { item: 'study_guide', chance: 0.8 },
                    { item: 'highlighters', chance: 0.6 },
                    { item: 'smart_pill', chance: 0.4 }
                ]
            },
            
            'saharsh': {
                name: 'Saharsh',
                fullName: 'Saharsh Gobinath',
                type: 'social_rival',
                personality: 'charming',
                description: 'The popular student who uses social connections to get ahead',
                portrait: '😎',
                stats: {
                    attack: 18,
                    defense: 12,
                    speed: 22,
                    intelligence: 16,
                    charisma: 28,
                    luck: 20
                },
                abilities: ['Peer Pressure', 'Excuse Escape', 'Detention Dodge', 'Study Group'],
                preferredBattleStyle: 'cunning',
                weaknesses: ['isolation', 'quiet_environments'],
                strengths: ['group_situations', 'persuasion'],
                catchphrases: [
                    'Everyone loves me, why don\'t you?',
                    'I know people who know people...',
                    'Let me tell you about my weekend...'
                ],
                background: 'Son of a politician, used to getting what he wants through connections',
                unlockRequirements: { week: 2, social: 20 },
                encounterLocations: ['cafeteria', 'hallway1', 'hallway2'],
                relationshipStart: 'neutral',
                specialAbilities: {
                    'social_network': 'Can call in reinforcements during battles',
                    'charm_offensive': 'Reduces enemy effectiveness through charisma'
                },
                dropTable: [
                    { item: 'lucky_charm', chance: 0.7 },
                    { item: 'energy_drink', chance: 0.9 },
                    { item: 'hall_pass', chance: 0.3 }
                ]
            },
            
            'calvin': {
                name: 'Calvin',
                fullName: 'Calvin Williams',
                type: 'troublemaker_rival',
                personality: 'rebellious',
                description: 'The class clown who challenges authority and breaks rules',
                portrait: '😈',
                stats: {
                    attack: 25,
                    defense: 18,
                    speed: 20,
                    intelligence: 14,
                    charisma: 16,
                    luck: 15
                },
                abilities: ['Detention Dodge', 'Stress Resistance', 'Quick Think', 'Homework Strike'],
                preferredBattleStyle: 'aggressive',
                weaknesses: ['authority_figures', 'structured_situations'],
                strengths: ['creative_solutions', 'improvisation'],
                catchphrases: [
                    'Rules are more like guidelines, right?',
                    'I\'ll show you how it\'s really done!',
                    'Who needs homework when you have talent?'
                ],
                background: 'Grew up in a chaotic household, learned to break rules to survive',
                unlockRequirements: { week: 3, stress: 40 },
                encounterLocations: ['hallway1', 'cafeteria', 'classroom2'],
                relationshipStart: 'hostile',
                specialAbilities: {
                    'rule_breaker': 'Can ignore certain battle restrictions',
                    'chaos_theory': 'Introduces random elements that benefit him'
                },
                dropTable: [
                    { item: 'stress_pill', chance: 0.8 },
                    { item: 'energy_bar', chance: 0.6 },
                    { item: 'mystery_meat', chance: 0.4 }
                ]
            },
            
            'teacher': {
                name: 'The Teacher',
                fullName: 'Ms. Johnson',
                type: 'authority_boss',
                personality: 'stern',
                description: 'The main antagonist - a relentless authority figure',
                portrait: '👩‍🏫',
                stats: {
                    attack: 35,
                    defense: 25,
                    speed: 15,
                    intelligence: 30,
                    charisma: 8,
                    luck: 5
                },
                abilities: ['Pop Quiz', 'Detention Sentence', 'Parent Conference', 'Grade Penalty'],
                preferredBattleStyle: 'systematic',
                weaknesses: ['creative_thinking', 'unpredictable_actions'],
                strengths: ['structured_approach', 'persistent_pursuit'],
                catchphrases: [
                    'Eric! My office. Now.',
                    'This is unacceptable behavior!',
                    'Your parents will hear about this!'
                ],
                background: '25 years of teaching experience, zero tolerance for excuses',
                unlockRequirements: { week: 1, always: true },
                encounterLocations: ['any'],
                relationshipStart: 'watchful',
                specialAbilities: {
                    'detention_trap': 'Can force player into punishment state',
                    'authority_aura': 'Reduces player stats when nearby',
                    'parent_call': 'Deals massive stress damage'
                },
                dropTable: [
                    { item: 'hall_pass', chance: 0.2 },
                    { item: 'teacher_approval', chance: 0.1 }
                ]
            }
        };
    }

    /**
     * Initialize comprehensive enemy database
     */
    initializeEnemyDatabase() {
        return {
            // Stress and Anxiety Enemies
            'stress_monster': {
                name: 'Stress Monster',
                category: 'emotional',
                description: 'A writhing mass of academic anxiety and pressure',
                baseStats: { health: 30, attack: 12, defense: 8, speed: 10 },
                abilities: ['Overwhelming Pressure', 'Anxiety Attack'],
                loot: ['stress_pill', 'energy_drink'],
                expReward: 15,
                rarity: 'common',
                behavior: 'aggressive',
                weaknesses: ['calm_environment', 'stress_relief'],
                strengths: ['time_pressure', 'difficult_subjects'],
                encounterRate: 0.3,
                specialMechanics: ['stress_amplification', 'panic_trigger']
            },
            
            'anxiety_wisp': {
                name: 'Anxiety Wisp',
                category: 'emotional',
                description: 'A floating spirit of worry and self-doubt',
                baseStats: { health: 25, attack: 15, defense: 5, speed: 15 },
                abilities: ['Doubt Whisper', 'Paralyzing Fear'],
                loot: ['focus_cookie'],
                expReward: 12,
                rarity: 'common',
                behavior: 'cunning',
                weaknesses: ['confidence_boosts', 'supportive_friends'],
                strengths: ['isolated_situations', 'high_stakes'],
                encounterRate: 0.25,
                specialMechanics: ['confidence_drain', 'isolation_penalty']
            },
            
            'test_anxiety': {
                name: 'Test Anxiety',
                category: 'academic',
                description: 'The crushing weight of upcoming examinations',
                baseStats: { health: 40, attack: 18, defense: 10, speed: 12 },
                abilities: ['Time Pressure', 'Blank Mind'],
                loot: ['smart_pill', 'study_guide'],
                expReward: 20,
                rarity: 'uncommon',
                behavior: 'defensive',
                weaknesses: ['adequate_preparation', 'study_groups'],
                strengths: ['surprise_tests', 'complex_problems'],
                encounterRate: 0.2,
                specialMechanics: ['timer_stress', 'knowledge_block']
            },
            
            // Homework and Assignment Enemies
            'homework_creature': {
                name: 'Homework Creature',
                category: 'academic',
                description: 'A monstrous pile of assignments that never seems to end',
                baseStats: { health: 35, attack: 10, defense: 12, speed: 8 },
                abilities: ['Endless Tasks', 'Deadline Pressure'],
                loot: ['notebook', 'pencil'],
                expReward: 18,
                rarity: 'common',
                behavior: 'persistent',
                weaknesses: ['good_planning', 'help_from_others'],
                strengths: ['procrastination', 'complex_assignments'],
                encounterRate: 0.35,
                specialMechanics: ['task_overload', 'deadline_countdown']
            },
            
            'calculator_ghost': {
                name: 'Calculator Ghost',
                category: 'academic',
                description: 'The spirit of failed math problems haunting students',
                baseStats: { health: 50, attack: 20, defense: 15, speed: 14 },
                abilities: ['Math Trauma', 'Formula Confusion'],
                loot: ['calculator', 'smart_pill'],
                expReward: 25,
                rarity: 'rare',
                behavior: 'intelligent',
                weaknesses: ['step_by_step_solutions', 'peer_help'],
                strengths: ['complex_calculations', 'time_limits'],
                encounterRate: 0.15,
                specialMechanics: ['calculation_errors', 'number_confusion']
            },
            
            // Cafeteria and Social Enemies
            'lunch_monster': {
                name: 'Lunch Monster',
                category: 'social',
                description: 'A greedy creature that hoards all the good food',
                baseStats: { health: 55, attack: 19, defense: 14, speed: 12 },
                abilities: ['Food Hoarding', 'Lunch Line Chaos'],
                loot: ['pizza_slice', 'energy_bar'],
                expReward: 22,
                rarity: 'uncommon',
                behavior: 'aggressive',
                weaknesses: ['sharing', 'healthy_options'],
                strengths: ['crowded_situations', 'limited_time'],
                encounterRate: 0.25,
                specialMechanics: ['food_shortage', 'queue_jumping']
            },
            
            'cafeteria_lady': {
                name: 'Cafeteria Lady',
                category: 'authority',
                description: 'The imposing figure who controls the lunch line with an iron fist',
                baseStats: { health: 80, attack: 30, defense: 25, speed: 5 },
                abilities: ['Portion Control', 'Rule Enforcement'],
                loot: ['mystery_meat'],
                expReward: 30,
                rarity: 'rare',
                behavior: 'authoritative',
                weaknesses: ['polite_requests', 'following_rules'],
                strengths: ['long_lines', 'complex_orders'],
                encounterRate: 0.1,
                specialMechanics: ['serving_size_penalty', 'line_delay']
            },
            
            'food_fight_chaos': {
                name: 'Food Fight Chaos',
                category: 'social',
                description: 'The pure chaos that erupts when lunch goes wrong',
                baseStats: { health: 65, attack: 24, defense: 16, speed: 16 },
                abilities: ['Random Mess', 'Social Breakdown'],
                loot: ['energy_drink'],
                expReward: 28,
                rarity: 'rare',
                behavior: 'chaotic',
                weaknesses: ['calm_leadership', 'cleanup_efforts'],
                strengths: ['crowded_spaces', 'stressful_situations'],
                encounterRate: 0.08,
                specialMechanics: ['area_disruption', 'social_panic']
            },
            
            'mystery_meat_beast': {
                name: 'Mystery Meat Beast',
                category: 'dangerous',
                description: 'An ancient evil that lurks in the cafeteria depths',
                baseStats: { health: 90, attack: 35, defense: 30, speed: 4 },
                abilities: ['Unknown Ingredients', 'Digestive Doom'],
                loot: ['health_potion'],
                expReward: 40,
                rarity: 'legendary',
                behavior: 'predatory',
                weaknesses: ['fresh_foods', 'ingredient_inspection'],
                strengths: ['late_hours', 'poor_lighting'],
                encounterRate: 0.03,
                specialMechanics: ['poison_effect', 'unknown_risks']
            },
            
            // Lab and Science Enemies
            'cauldron_monster': {
                name: 'Cauldron Monster',
                category: 'scientific',
                description: 'A bubbling creature formed from failed chemistry experiments',
                baseStats: { health: 45, attack: 16, defense: 18, speed: 6 },
                abilities: ['Chemical Reaction', 'Toxic Fumes'],
                loot: ['health_potion', 'focus_cookie'],
                expReward: 20,
                rarity: 'uncommon',
                behavior: 'reactive',
                weaknesses: ['proper_safety', 'careful_handling'],
                strengths: ['rushed_experiments', 'safety_violations'],
                encounterRate: 0.2,
                specialMechanics: ['chemical_damage', 'safety_penalty']
            },
            
            'lab_accident': {
                name: 'Lab Accident',
                category: 'scientific',
                description: 'The inevitable consequence of ignoring safety protocols',
                baseStats: { health: 60, attack: 22, defense: 12, speed: 10 },
                abilities: ['Chain Reaction', 'Safety Violation'],
                loot: ['smart_pill'],
                expReward: 30,
                rarity: 'rare',
                behavior: 'explosive',
                weaknesses: ['safety_equipment', 'proper_procedures'],
                strengths: ['time_pressure', 'complex_experiments'],
                encounterRate: 0.12,
                specialMechanics: ['area_damage', 'safety_breach']
            },
            
            'periodic_table_beast': {
                name: 'Periodic Table Beast',
                category: 'scientific',
                description: 'A massive creature made of all the elements gone wrong',
                baseStats: { health: 70, attack: 25, defense: 20, speed: 8 },
                abilities: ['Elemental Fury', 'Atomic Confusion'],
                loot: ['study_guide', 'smart_pill'],
                expReward: 35,
                rarity: 'rare',
                behavior: 'elemental',
                weaknesses: ['balanced_approach', 'careful_study'],
                strengths: ['complex_reactions', 'advanced_concepts'],
                encounterRate: 0.08,
                specialMechanics: ['elemental_damage', 'periodic_disruption']
            },
            
            // Physical Education Enemies
            'sports_stress': {
                name: 'Sports Stress',
                category: 'physical',
                description: 'The overwhelming pressure of athletic performance',
                baseStats: { health: 100, attack: 40, defense: 35, speed: 18 },
                abilities: ['Performance Anxiety', 'Team Pressure'],
                loot: ['lucky_charm', 'energy_drink'],
                expReward: 45,
                rarity: 'boss',
                behavior: 'intimidating',
                weaknesses: ['individual_support', 'personal_best_focus'],
                strengths: ['team_competition', 'public_performance'],
                encounterRate: 0.05,
                specialMechanics: ['team_pressure', 'public_failure']
            },
            
            'team_captain_ghost': {
                name: 'Team Captain Ghost',
                category: 'physical',
                description: 'The spirit of a former star athlete still haunting the gym',
                baseStats: { health: 120, attack: 45, defense: 40, speed: 20 },
                abilities: ['Legacy Pressure', 'Championship Ghost'],
                loot: ['teacher_approval'],
                expReward: 50,
                rarity: 'boss',
                behavior: 'haunting',
                weaknesses: ['personal_growth', 'individual_achievement'],
                strengths: ['team_competition', 'legacy_expectations'],
                encounterRate: 0.03,
                specialMechanics: ['legacy_burden', 'ghost_possession']
            },
            
            'gym_teacher_shadow': {
                name: 'Gym Teacher Shadow',
                category: 'authority',
                description: 'The dark reflection of athletic authority',
                baseStats: { health: 150, attack: 50, defense: 45, speed: 15 },
                abilities: ['Maximum Effort', 'No Pain No Gain'],
                loot: ['teacher_approval', 'hall_pass'],
                expReward: 60,
                rarity: 'final_boss',
                behavior: 'ruthless',
                weaknesses: ['alternative_approaches', 'personal_limits'],
                strengths: ['intensity', 'persistence'],
                encounterRate: 0.01,
                specialMechanics: ['intensity_scaling', 'limit_break']
            }
        };
    }

    /**
     * Initialize boss database with special mechanics
     */
    initializeBossDatabase() {
        return {
            'week1_boss': {
                name: 'First Week Panic',
                type: 'progression_boss',
                description: 'The overwhelming anxiety of starting a new school year',
                baseStats: { health: 80, attack: 25, defense: 20, speed: 12 },
                abilities: ['Syllabus Shock', 'First Day Jitters'],
                phases: [
                    { threshold: 0.7, name: 'Orientation Chaos' },
                    { threshold: 0.4, name: 'Schedule Confusion' },
                    { threshold: 0.2, name: 'Final Panic' }
                ],
                specialMechanics: ['time_pressure', 'orientation_overload'],
                uniqueRewards: ['unlock_classroom2'],
                expReward: 60,
                unlockConditions: { week: 1, areas_visited: 2 }
            },
            
            'midterm_crisis': {
                name: 'Midterm Crisis',
                type: 'academic_boss',
                description: 'The academic pressure reaches its peak',
                baseStats: { health: 120, attack: 35, defense: 30, speed: 15 },
                abilities: ['Cramming Chaos', 'Sleep Deprivation', 'Coffee Overdose'],
                phases: [
                    { threshold: 0.8, name: 'Study Overload' },
                    { threshold: 0.6, name: 'Sleep Debt' },
                    { threshold: 0.4, name: 'Caffeine Crash' },
                    { threshold: 0.2, name: 'Final Push' }
                ],
                specialMechanics: ['study_burnout', 'time_management', 'resource_depletion'],
                uniqueRewards: ['unlock_gym', 'ability_study_shield'],
                expReward: 80,
                unlockConditions: { week: 5, knowledge: 100, enemies_defeated: 10 }
            },
            
            'final_exam_terror': {
                name: 'Final Exam Terror',
                type: 'final_boss',
                description: 'The ultimate test of everything learned',
                baseStats: { health: 200, attack: 50, defense: 40, speed: 20 },
                abilities: ['Ultimate Question', 'Time Limit Terror', 'Grade Determinator'],
                phases: [
                    { threshold: 0.9, name: 'Question 1: Basics' },
                    { threshold: 0.7, name: 'Question 2: Application' },
                    { threshold: 0.5, name: 'Question 3: Analysis' },
                    { threshold: 0.3, name: 'Question 4: Synthesis' },
                    { threshold: 0.1, name: 'Final Question' },
                    { threshold: 0.05, name: 'Bonus Round' }
                ],
                specialMechanics: ['knowledge_test', 'time_pressure', 'grade_determinator'],
                uniqueRewards: ['class_completion', 'final_grade'],
                expReward: 150,
                unlockConditions: { week: 10, all_areas: true, knowledge: 200 }
            }
        };
    }

    /**
     * Initialize rival relationship system
     */
    initializeRivalRelationships() {
        Object.keys(this.rivalCharacters).forEach(rivalId => {
            this.rivalRelationships[rivalId] = {
                level: 0, // -100 to 100
                encounters: 0,
                victories: 0,
                defeats: 0,
                lastEncounter: null,
                unlocked: false,
                specialEvents: [],
                memoryFlags: []
            };
        });
    }

    /**
     * Check if rival should appear based on game progress
     */
    shouldRivalAppear(rivalId, currentWeek, playerStats) {
        const rival = this.rivalCharacters[rivalId];
        if (!rival) return false;
        
        const requirements = rival.unlockRequirements;
        
        // Check week requirement
        if (requirements.week && currentWeek < requirements.week) {
            return false;
        }
        
        // Check always requirement
        if (requirements.always) {
            return Math.random() < 0.1; // 10% chance per area transition
        }
        
        // Check knowledge requirement
        if (requirements.knowledge && playerStats.knowledge < requirements.knowledge) {
            return false;
        }
        
        // Check social requirement
        if (requirements.social) {
            // Simplified social stat check
            const socialScore = playerStats.charisma + playerStats.luck;
            if (socialScore < requirements.social) {
                return false;
            }
        }
        
        // Check stress requirement
        if (requirements.stress && playerStats.stress < requirements.stress) {
            return false;
        }
        
        return true;
    }

    /**
     * Trigger rival encounter
     */
    triggerRivalEncounter(rivalId, location) {
        const rival = this.rivalCharacters[rivalId];
        if (!rival) return null;
        
        // Check if rival should appear
        if (!this.shouldRivalAppear(rivalId, this.engine.gameData.week, this.engine.character.data)) {
            return null;
        }
        
        // Create rival encounter data
        const rivalEncounter = this.createRivalEncounter(rival, location);
        
        // Store active encounter
        this.activeEncounters.set(rivalId, {
            ...rivalEncounter,
            startTime: Date.now(),
            location: location
        });
        
        // Update relationship
        this.updateRivalRelationship(rivalId, 'encounter_start');
        
        return rivalEncounter;
    }

    /**
     * Create rival encounter data
     */
    createRivalEncounter(rival, location) {
        const player = this.engine.character.data;
        
        // Scale rival stats based on player level and week
        const weekMultiplier = 1 + (this.engine.gameData.week * 0.1);
        const levelMultiplier = 1 + (player.level * 0.05);
        const difficultyScale = weekMultiplier * levelMultiplier;
        
        return {
            id: `rival_${rival.name.toLowerCase().replace(/\s+/g, '_')}`,
            name: rival.name,
            fullName: rival.fullName,
            type: 'rival',
            category: rival.type,
            description: rival.description,
            portrait: rival.portrait,
            health: Math.floor(rival.stats.attack * 30 * difficultyScale),
            maxHealth: Math.floor(rival.stats.attack * 30 * difficultyScale),
            stress: 0,
            maxStress: 50,
            energy: 100,
            maxEnergy: 100,
            level: player.level + Math.floor(this.engine.gameData.week / 2),
            stats: {
                attack: Math.floor(rival.stats.attack * difficultyScale),
                defense: Math.floor(rival.stats.defense * difficultyScale),
                speed: Math.floor(rival.stats.speed * difficultyScale),
                intelligence: Math.floor(rival.stats.intelligence * difficultyScale),
                charisma: Math.floor(rival.stats.charisma * difficultyScale),
                luck: Math.floor(rival.stats.luck * difficultyScale)
            },
            abilities: [...rival.abilities],
            equipment: {},
            statusEffects: [],
            ai: {
                type: rival.preferredBattleStyle,
                personality: rival.personality,
                catchphrases: rival.catchphrases,
                background: rival.background,
                specialAbilities: rival.specialAbilities,
                relationship: this.getRivalRelationshipLevel(rival.name.toLowerCase())
            },
            drops: rival.dropTable,
            expReward: Math.floor(30 * difficultyScale),
            moneyReward: Math.floor(10 * difficultyScale),
            isRival: true,
            uniqueAbilities: rival.specialAbilities,
            background: rival.background,
            catchphrase: rival.catchphrases[Math.floor(Math.random() * rival.catchphrases.length)]
        };
    }

    /**
     * Get rival relationship level
     */
    getRivalRelationshipLevel(rivalId) {
        const relationship = this.rivalRelationships[rivalId];
        if (!relationship) return 'neutral';
        
        const level = relationship.level;
        if (level <= this.relationshipThresholds.hostile) return 'hostile';
        if (level <= this.relationshipThresholds.unfriendly) return 'unfriendly';
        if (level <= this.relationshipThresholds.neutral) return 'neutral';
        if (level <= this.relationshipThresholds.friendly) return 'friendly';
        return 'ally';
    }

    /**
     * Update rival relationship based on player actions
     */
    updateRivalRelationship(rivalId, action, value = 0) {
        const relationship = this.rivalRelationships[rivalId];
        if (!relationship) return;
        
        relationship.encounters++;
        relationship.lastEncounter = Date.now();
        
        let relationshipChange = 0;
        
        switch (action) {
            case 'encounter_start':
                relationshipChange = 0;
                break;
            case 'player_victory':
                relationshipChange = -5; // Rivals don't like being beaten
                relationship.victories++;
                break;
            case 'player_defeat':
                relationshipChange = +3; // They feel superior
                relationship.defeats++;
                break;
            case 'diplomatic_choice':
                relationshipChange = +value;
                break;
            case 'aggressive_choice':
                relationshipChange = -value;
                break;
            case 'help_them':
                relationshipChange = +10;
                break;
            case 'ignore_them':
                relationshipChange = -2;
                break;
            case 'academic_success':
                relationshipChange = -8; // They get jealous
                break;
            case 'social_success':
                relationshipChange = -5; // Social rivals get jealous
                break;
        }
        
        relationship.level = Math.max(-100, Math.min(100, relationship.level + relationshipChange));
        
        // Unlock rival if relationship improves enough
        if (!relationship.unlocked && relationship.level > this.relationshipThresholds.friendly) {
            relationship.unlocked = true;
            this.unlockRivalContent(rivalId);
        }
        
        console.log(`${rivalId} relationship changed by ${relationshipChange}. New level: ${relationship.level}`);
    }

    /**
     * Unlock rival-specific content
     */
    unlockRivalContent(rivalId) {
        const rival = this.rivalCharacters[rivalId];
        if (!rival) return;
        
        // Unlock special abilities
        if (rival.specialAbilities) {
            // Add rival's special abilities to player's potential abilities
            Object.keys(rival.specialAbilities).forEach(ability => {
                this.engine.character.data.abilities.push(ability);
            });
        }
        
        // Unlock areas
        if (rival.encounterLocations) {
            rival.encounterLocations.forEach(location => {
                this.engine.school.unlockArea(location);
            });
        }
        
        console.log(`Unlocked content for rival: ${rival.name}`);
    }

    /**
     * Process rival battle outcome
     */
    processRivalBattleOutcome(rivalId, victory) {
        const relationship = this.rivalRelationships[rivalId];
        if (!relationship) return;
        
        if (victory) {
            this.updateRivalRelationship(rivalId, 'player_victory');
            this.addRivalMemory(rivalId, 'defeated_by_player');
        } else {
            this.updateRivalRelationship(rivalId, 'player_defeat');
            this.addRivalMemory(rivalId, 'defeated_player');
        }
        
        // Check for special events based on relationship
        this.checkSpecialRivalEvents(rivalId);
    }

    /**
     * Add memory flag for rival
     */
    addRivalMemory(rivalId, memory) {
        const relationship = this.rivalRelationships[rivalId];
        if (!relationship) return;
        
        if (!relationship.memoryFlags.includes(memory)) {
            relationship.memoryFlags.push(memory);
        }
    }

    /**
     * Check for special rival events
     */
    checkSpecialRivalEvents(rivalId) {
        const relationship = this.rivalRelationships[rivalId];
        if (!relationship) return;
        
        // Anbu events
        if (rivalId === 'anbu') {
            if (relationship.level > this.relationshipThresholds.friendly && 
                !relationship.memoryFlags.includes('study_partner_event')) {
                this.triggerStudyPartnerEvent(rivalId);
            }
        }
        
        // Saharsh events
        if (rivalId === 'saharsh') {
            if (relationship.level > this.relationshipThresholds.ally && 
                !relationship.memoryFlags.includes('social_alliance_event')) {
                this.triggerSocialAllianceEvent(rivalId);
            }
        }
        
        // Calvin events
        if (rivalId === 'calvin') {
            if (relationship.level > this.relationshipThresholds.friendly && 
                !relationship.memoryFlags.includes('rebellion_ally_event')) {
                this.triggerRebellionAllyEvent(rivalId);
            }
        }
    }

    /**
     * Trigger study partner event with Anbu
     */
    triggerStudyPartnerEvent(rivalId) {
        this.addRivalMemory(rivalId, 'study_partner_event');
        this.engine.dialogue.start('Anbu', 
            'You know what? Maybe we\'re not so different. Want to study together?', [
                { text: 'Yes, let\'s work together', action: () => this.acceptStudyPartnership(rivalId) },
                { text: 'I work better alone', action: () => this.declineStudyPartnership(rivalId) }
            ]);
    }

    /**
     * Trigger social alliance event with Saharsh
     */
    triggerSocialAllianceEvent(rivalId) {
        this.addRivalMemory(rivalId, 'social_alliance_event');
        this.engine.dialogue.start('Saharsh', 
            'You\'ve grown on me. We should team up and take on this school together.', [
                { text: 'Count me in!', action: () => this.acceptSocialAlliance(rivalId) },
                { text: 'I prefer to handle things myself', action: () => this.declineSocialAlliance(rivalId) }
            ]);
    }

    /**
     * Trigger rebellion ally event with Calvin
     */
    triggerRebellionAllyEvent(rivalId) {
        this.addRivalMemory(rivalId, 'rebellion_ally_event');
        this.engine.dialogue.start('Calvin', 
            'You\'re not so bad. Want to shake things up around here with me?', [
                { text: 'Let\'s cause some chaos!', action: () => this.acceptRebellion(rivalId) },
                { text: 'I like following the rules', action: () => this.declineRebellion(rivalId) }
            ]);
    }

    /**
     * Accept study partnership with Anbu
     */
    acceptStudyPartnership(rivalId) {
        this.updateRivalRelationship(rivalId, 'diplomatic_choice', 15);
        this.engine.character.data.stats.intelligence += 3;
        this.engine.character.data.stats.charisma += 2;
        this.addRivalMemory(rivalId, 'study_partnership');
        this.engine.dialogue.start('Anbu', 'Great! Together we\'ll be unstoppable.');
        this.engine.character.addAchievement('Study Partner Alliance');
    }

    /**
     * Decline study partnership
     */
    declineStudyPartnership(rivalId) {
        this.updateRivalRelationship(rivalId, 'aggressive_choice', 5);
        this.engine.dialogue.start('Anbu', 'Suit yourself. But remember, teamwork makes dreams work.');
    }

    /**
     * Accept social alliance with Saharsh
     */
    acceptSocialAlliance(rivalId) {
        this.updateRivalRelationship(rivalId, 'diplomatic_choice', 20);
        this.engine.character.data.stats.charisma += 5;
        this.engine.character.data.stats.luck += 3;
        this.addRivalMemory(rivalId, 'social_alliance');
        this.engine.dialogue.start('Saharsh', 'Perfect! With my connections and your... whatever this is, we\'ll rule the school!');
        this.engine.character.addAchievement('Social Alliance');
    }

    /**
     * Decline social alliance
     */
    declineSocialAlliance(rivalId) {
        this.updateRivalRelationship(rivalId, 'aggressive_choice', 8);
        this.engine.dialogue.start('Saharsh', 'Your loss. I could have made you popular.');
    }

    /**
     * Accept rebellion with Calvin
     */
    acceptRebellion(rivalId) {
        this.updateRivalRelationship(rivalId, 'diplomatic_choice', 25);
        this.engine.character.data.stats.attack += 4;
        this.engine.character.data.stats.speed += 3;
        this.addRivalMemory(rivalId, 'rebellion_alliance');
        this.engine.dialogue.start('Calvin', 'Yes! Finally someone with spirit! Let\'s show them how it\'s really done!');
        this.engine.character.addAchievement('Rebellion Alliance');
    }

    /**
     * Decline rebellion
     */
    declineRebellion(rivalId) {
        this.updateRivalRelationship(rivalId, 'aggressive_choice', 10);
        this.engine.dialogue.start('Calvin', 'Boring! You\'re missing out on all the fun.');
    }

    /**
     * Generate random enemy encounter
     */
    generateRandomEncounter(areaType, difficulty) {
        const areaEnemies = this.getEnemiesForArea(areaType);
        if (areaEnemies.length === 0) return null;
        
        const enemyId = areaEnemies[Math.floor(Math.random() * areaEnemies.length)];
        return this.createEnemyInstance(enemyId, difficulty);
    }

    /**
     * Get enemies available in specific area
     */
    getEnemiesForArea(areaType) {
        const enemyMap = {
            'neutral': ['stress_monster', 'anxiety_wisp', 'homework_creature'],
            'battle': ['homework_creature', 'test_anxiety', 'calculator_ghost', 'lab_accident'],
            'danger': ['lunch_monster', 'cafeteria_lady', 'food_fight_chaos', 'mystery_meat_beast'],
            'boss': ['sports_stress', 'team_captain_ghost', 'gym_teacher_shadow']
        };
        
        return enemyMap[areaType] || ['stress_monster'];
    }

    /**
     * Create enemy instance with scaled stats
     */
    createEnemyInstance(enemyId, difficulty = 1) {
        const enemyTemplate = this.enemyDatabase[enemyId];
        if (!enemyTemplate) return null;
        
        const player = this.engine.character.data;
        const week = this.engine.gameData.week;
        
        // Calculate difficulty scaling
        const difficultyMultiplier = 1 + (difficulty * 0.2) + (week * 0.1);
        const levelBonus = player.level * 0.1;
        
        return {
            id: enemyId,
            name: enemyTemplate.name,
            type: 'enemy',
            category: enemyTemplate.category,
            description: enemyTemplate.description,
            health: Math.floor(enemyTemplate.baseStats.health * difficultyMultiplier + levelBonus * 10),
            maxHealth: Math.floor(enemyTemplate.baseStats.health * difficultyMultiplier + levelBonus * 10),
            stress: 0,
            maxStress: 50,
            energy: 100,
            maxEnergy: 100,
            level: player.level + Math.floor(difficulty / 2),
            stats: {
                attack: Math.floor(enemyTemplate.baseStats.attack * difficultyMultiplier + levelBonus * 2),
                defense: Math.floor(enemyTemplate.baseStats.defense * difficultyMultiplier + levelBonus * 2),
                speed: Math.floor(enemyTemplate.baseStats.speed * difficultyMultiplier + levelBonus),
                intelligence: Math.floor(enemyTemplate.baseStats.intelligence * difficultyMultiplier + levelBonus),
                charisma: 5,
                luck: Math.floor(enemyTemplate.baseStats.attack * 0.1 + levelBonus)
            },
            abilities: [...enemyTemplate.abilities],
            equipment: {},
            statusEffects: [],
            ai: {
                type: enemyTemplate.behavior,
                weaknesses: enemyTemplate.weaknesses,
                strengths: enemyTemplate.strengths,
                specialMechanics: enemyTemplate.specialMechanics
            },
            drops: enemyTemplate.loot.map(item => ({
                item: item,
                chance: 0.7 - (difficulty * 0.1)
            })),
            expReward: Math.floor(enemyTemplate.expReward * difficultyMultiplier),
            moneyReward: Math.floor(enemyTemplate.expReward * 0.3 * difficultyMultiplier),
            rarity: enemyTemplate.rarity,
            isBoss: enemyTemplate.rarity === 'boss' || enemyTemplate.rarity === 'final_boss'
        };
    }

    /**
     * Generate boss encounter
     */
    generateBossEncounter(bossId, difficulty) {
        const bossTemplate = this.bossDatabase[bossId];
        if (!bossTemplate) return null;
        
        const player = this.engine.character.data;
        const week = this.engine.gameData.week;
        
        const difficultyMultiplier = 1 + (difficulty * 0.3) + (week * 0.15);
        const levelBonus = player.level * 0.15;
        
        return {
            id: bossId,
            name: bossTemplate.name,
            type: 'boss',
            category: bossTemplate.type,
            description: bossTemplate.description,
            health: Math.floor(bossTemplate.baseStats.health * difficultyMultiplier + levelBonus * 15),
            maxHealth: Math.floor(bossTemplate.baseStats.health * difficultyMultiplier + levelBonus * 15),
            stress: 0,
            maxStress: 100,
            energy: 150,
            maxEnergy: 150,
            level: player.level + Math.floor(difficulty / 2) + 2,
            stats: {
                attack: Math.floor(bossTemplate.baseStats.attack * difficultyMultiplier + levelBonus * 3),
                defense: Math.floor(bossTemplate.baseStats.defense * difficultyMultiplier + levelBonus * 3),
                speed: Math.floor(bossTemplate.baseStats.speed * difficultyMultiplier + levelBonus * 2),
                intelligence: Math.floor(bossTemplate.baseStats.intelligence * difficultyMultiplier + levelBonus * 3),
                charisma: 10,
                luck: Math.floor(bossTemplate.baseStats.attack * 0.15 + levelBonus)
            },
            abilities: [...bossTemplate.abilities],
            equipment: {},
            statusEffects: [],
            ai: {
                type: 'boss',
                phases: bossTemplate.phases,
                specialMechanics: bossTemplate.specialMechanics,
                uniqueRewards: bossTemplate.uniqueRewards
            },
            phases: bossTemplate.phases,
            specialMechanics: bossTemplate.specialMechanics,
            uniqueRewards: bossTemplate.uniqueRewards,
            expReward: bossTemplate.expReward,
            moneyReward: Math.floor(bossTemplate.expReward * 0.5),
            isBoss: true,
            isFinalBoss: bossTemplate.type === 'final_boss'
        };
    }

    /**
     * Get available boss encounters
     */
    getAvailableBossEncounters() {
        const available = [];
        const player = this.engine.character.data;
        const week = this.engine.gameData.week;
        
        Object.keys(this.bossDatabase).forEach(bossId => {
            const boss = this.bossDatabase[bossId];
            const conditions = boss.unlockConditions;
            
            if (this.checkBossUnlockConditions(conditions, week, player)) {
                available.push(bossId);
            }
        });
        
        return available;
    }

    /**
     * Check if boss unlock conditions are met
     */
    checkBossUnlockConditions(conditions, week, player) {
        if (conditions.week && week < conditions.week) return false;
        if (conditions.knowledge && player.knowledge < conditions.knowledge) return false;
        if (conditions.enemies_defeated) {
            // Simplified check - would need actual count
            if (player.level < conditions.enemies_defeated / 2) return false;
        }
        if (conditions.all_areas) {
            // Simplified check - would need actual area count
            if (player.unlockedAreas.length < 5) return false;
        }
        
        return true;
    }

    /**
     * Update all rivals and enemies
     */
    update(deltaTime) {
        // Update rival relationship decay over time
        Object.keys(this.rivalRelationships).forEach(rivalId => {
            this.updateRivalRelationshipDecay(rivalId, deltaTime);
        });
        
        // Check for random rival encounters
        this.checkRandomRivalEncounters(deltaTime);
        
        // Update encounter difficulty scaling
        this.updateDifficultyScaling(deltaTime);
    }

    /**
     * Update rival relationship decay over time
     */
    updateRivalRelationshipDecay(rivalId, deltaTime) {
        const relationship = this.rivalRelationships[rivalId];
        if (!relationship || !relationship.lastEncounter) return;
        
        const timeSinceLastEncounter = Date.now() - relationship.lastEncounter;
        const daysSinceEncounter = timeSinceLastEncounter / (1000 * 60 * 60 * 24);
        
        // Gradual relationship decay if no recent encounters
        if (daysSinceEncounter > 7) {
            const decayRate = Math.min(1, (daysSinceEncounter - 7) * 0.1);
            relationship.level = Math.max(-100, relationship.level - decayRate);
        }
    }

    /**
     * Check for random rival encounters
     */
    checkRandomRivalEncounters(deltaTime) {
        // 1% chance per minute of encountering a rival
        const encounterChance = 0.01 * (deltaTime / 60000);
        
        if (Math.random() < encounterChance) {
            this.triggerRandomRivalEncounter();
        }
    }

    /**
     * Trigger random rival encounter
     */
    triggerRandomRivalEncounter() {
        const currentArea = this.engine.school.currentArea;
        const availableRivals = [];
        
        // Check which rivals can appear in current area
        Object.keys(this.rivalCharacters).forEach(rivalId => {
            const rival = this.rivalCharacters[rivalId];
            if (rival.encounterLocations.includes(currentArea) || rival.encounterLocations.includes('any')) {
                if (this.shouldRivalAppear(rivalId, this.engine.gameData.week, this.engine.character.data)) {
                    availableRivals.push(rivalId);
                }
            }
        });
        
        if (availableRivals.length > 0) {
            const randomRival = availableRivals[Math.floor(Math.random() * availableRivals.length)];
            this.triggerRivalEncounter(randomRival, currentArea);
        }
    }

    /**
     * Update difficulty scaling based on game progress
     */
    updateDifficultyScaling(deltaTime) {
        this.weeklyEscalation += deltaTime * 0.001;
        
        // Increase difficulty every week
        if (this.weeklyEscalation >= 1) {
            this.weeklyEscalation = 0;
            this.increaseGlobalDifficulty();
        }
    }

    /**
     * Increase global difficulty
     */
    increaseGlobalDifficulty() {
        // Make enemies stronger each week
        console.log('Global difficulty increased due to weekly progression');
    }

    /**
     * Get rival status for UI display
     */
    getRivalStatus(rivalId) {
        const rival = this.rivalCharacters[rivalId];
        const relationship = this.rivalRelationships[rivalId];
        
        if (!rival || !relationship) return null;
        
        return {
            name: rival.name,
            portrait: rival.portrait,
            relationship: this.getRivalRelationshipLevel(rivalId),
            relationshipLevel: relationship.level,
            encounters: relationship.encounters,
            victories: relationship.victories,
            defeats: relationship.defeats,
            unlocked: relationship.unlocked,
            available: this.shouldRivalAppear(rivalId, this.engine.gameData.week, this.engine.character.data)
        };
    }

    /**
     * Get all rival statuses
     */
    getAllRivalStatuses() {
        const statuses = {};
        Object.keys(this.rivalCharacters).forEach(rivalId => {
            statuses[rivalId] = this.getRivalStatus(rivalId);
        });
        return statuses;
    }

    /**
     * Save enemies and rivals data
     */
    save() {
        const storageKey = location.pathname + "enemies_rivals_data";
        try {
            const enemiesRivalsData = {
                rivalRelationships: this.rivalRelationships,
                activeEncounters: Array.from(this.activeEncounters.entries()),
                encounterHistory: this.encounterHistory,
                weeklyEscalation: this.weeklyEscalation
            };
            localStorage.setItem(storageKey, JSON.stringify(enemiesRivalsData));
        } catch (error) {
            console.error('Failed to save enemies and rivals data:', error);
        }
    }

    /**
     * Load enemies and rivals data
     */
    load() {
        const storageKey = location.pathname + "enemies_rivals_data";
        try {
            const saved = localStorage.getItem(storageKey);
            if (saved) {
                const data = JSON.parse(saved);
                this.rivalRelationships = data.rivalRelationships || this.rivalRelationships;
                this.activeEncounters = new Map(data.activeEncounters || []);
                this.encounterHistory = data.encounterHistory || [];
                this.weeklyEscalation = data.weeklyEscalation || 0;
                return true;
            }
        } catch (error) {
            console.error('Failed to load enemies and rivals data:', error);
        }
        return false;
    }
}
