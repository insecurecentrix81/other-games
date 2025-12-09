// ============================================
// GAME STATE MANAGEMENT - Extended
// ============================================

import { ProgressionSystem } from './progression.js';
import { AchievementSystem } from './achievements.js';
import { DailyChallengeSystem } from './dailyChallenges.js';
import { EndlessMode } from './endlessMode.js';
import { NewGamePlus } from './newGamePlus.js';

export class GameState {
    constructor() {
        // Core game state
        this.currentState = 'BOOT';
        
        // Player state
        this.player = {
            health: 100,
            maxHealth: 100,
            stamina: 100,
            maxStamina: 100,
            deadEye: 100,
            maxDeadEye: 100,
            position: { x: 0, y: 0, z: 0 },
            rotation: { x: 0, y: 0, z: 0 },
            isOnHorse: false,
            isAiming: false,
            isSprinting: false,
            combo: 0,
            comboMultiplier: 1.0,
            damageTaken: 0,
            accuracy: 0,
            headshots: 0,
            totalShots: 0
        };
        
        // Mission state
        this.mission = {
            currentMission: null,
            availableMissions: new Set(),
            completedMissions: new Set(),
            missionStartTime: null,
            objectives: [],
            missionScore: 0
        };
        
        // World state
        this.world = {
            time: 12.0, // 12:00 PM
            day: 1,
            weather: 'CLEAR',
            temperature: 22,
            discoveredAreas: new Set(),
            currentRegion: 'heartlands'
        };
        
        // Economy state
        this.economy = {
            money: 100,
            reputation: {
                lawful: 0,
                outlaw: 0
            },
            inventory: new Map()
        };
        
        // Engagement systems
        this.progression = new ProgressionSystem();
        this.achievements = new AchievementSystem(this.progression);
        this.dailyChallenges = new DailyChallengeSystem();
        this.endlessMode = new EndlessMode(this);
        this.newGamePlus = new NewGamePlus();
        
        // Statistics
        this.statistics = {
            playTime: 0,
            totalKills: 0,
            totalDeaths: 0,
            totalMoneyEarned: 0,
            totalDistance: 0,
            missionsAttempted: 0,
            missionsCompleted: 0,
            dailyChallengesCompleted: 0,
            endlessWavesCompleted: 0,
            ngPlusCycles: 0
        };
        
        // Session data
        this.session = {
            startTime: Date.now(),
            currentPlayTime: 0,
            dailyLoginCount: 0,
            consecutiveDays: 0
        };
        
        this.loadGame();
    }
    
    // Save/Load methods with namespace
    saveGame() {
        const saveData = {
            player: this.player,
            mission: {
                ...this.mission,
                availableMissions: Array.from(this.mission.availableMissions),
                completedMissions: Array.from(this.mission.completedMissions)
            },
            world: {
                ...this.world,
                discoveredAreas: Array.from(this.world.discoveredAreas)
            },
            economy: {
                ...this.economy,
                inventory: Array.from(this.economy.inventory.entries())
            },
            progression: this.progression.saveToState(),
            achievements: this.achievements.saveToState(),
            statistics: this.statistics,
            session: this.session,
            timestamp: Date.now(),
            version: '1.0.0'
        };
        
        try {
            localStorage.setItem(this.getStorageKey('savegame'), JSON.stringify(saveData));
            
            // Also save session statistics
            this.saveSessionStatistics();
            
            return true;
        } catch (e) {
            console.error('Failed to save game:', e);
            return false;
        }
    }
    
    loadGame() {
        try {
            const saveData = localStorage.getItem(this.getStorageKey('savegame'));
            if (saveData) {
                const data = JSON.parse(saveData);
                
                // Load core data
                Object.assign(this.player, data.player || {});
                
                // Load mission data
                if (data.mission) {
                    this.mission = {
                        ...data.mission,
                        availableMissions: new Set(data.mission.availableMissions || []),
                        completedMissions: new Set(data.mission.completedMissions || [])
                    };
                }
                
                // Load world data
                if (data.world) {
                    this.world = {
                        ...data.world,
                        discoveredAreas: new Set(data.world.discoveredAreas || [])
                    };
                }
                
                // Load economy data
                if (data.economy) {
                    this.economy = {
                        ...data.economy,
                        inventory: new Map(data.economy.inventory || [])
                    };
                }
                
                // Load engagement systems
                if (data.progression) {
                    this.progression.loadFromSave(data);
                }
                
                if (data.achievements) {
                    this.achievements.loadFromSave(data);
                }
                
                // Load statistics
                if (data.statistics) {
                    Object.assign(this.statistics, data.statistics);
                }
                
                // Load session data
                if (data.session) {
                    this.session = data.session;
                }
                
                return true;
            }
        } catch (e) {
            console.error('Failed to load game:', e);
        }
        
        return false;
    }
    
    getStorageKey(key) {
        // Use pathname to avoid conflicts with other games on same domain
        return `frontiercall_${location.pathname.replace(/\//g, '_')}_${key}`;
    }
    
    saveSessionStatistics() {
        try {
            const statsKey = this.getStorageKey('session_stats');
            const stats = JSON.parse(localStorage.getItem(statsKey) || '{}');
            
            stats.totalSessions = (stats.totalSessions || 0) + 1;
            stats.totalPlayTime = (stats.totalPlayTime || 0) + this.session.currentPlayTime;
            stats.lastPlayed = Date.now();
            
            // Update daily login streak
            const today = new Date().toDateString();
            if (stats.lastLoginDate !== today) {
                stats.dailyLogins = (stats.dailyLogins || 0) + 1;
                stats.lastLoginDate = today;
                
                // Check for consecutive days
                const yesterday = new Date(Date.now() - 86400000).toDateString();
                if (stats.lastLoginDateYesterday === yesterday) {
                    stats.consecutiveDays = (stats.consecutiveDays || 0) + 1;
                } else {
                    stats.consecutiveDays = 1;
                }
                stats.lastLoginDateYesterday = today;
            }
            
            localStorage.setItem(statsKey, JSON.stringify(stats));
        } catch (e) {
            console.error('Failed to save session statistics:', e);
        }
    }
    
    // State transitions with engagement hooks
    transitionTo(newState, data = {}) {
        const oldState = this.currentState;
        this.currentState = newState;
        
        // Handle engagement hooks on state changes
        this.onStateTransition(oldState, newState, data);
        
        return { oldState, newState };
    }
    
    onStateTransition(oldState, newState, data) {
        // Track play time
        if (oldState === 'PLAYING' && newState !== 'PLAYING') {
            this.recordPlayTime();
        }
        
        // Handle mission completion
        if (oldState === 'PLAYING' && newState === 'MISSION_COMPLETE') {
            this.handleMissionCompletion(data);
        }
        
        // Handle game over
        if (newState === 'GAME_OVER') {
            this.handleGameOver(data);
        }
        
        // Handle new game start
        if (newState === 'PLAYING' && data.isNewGame) {
            this.handleNewGameStart(data);
        }
    }
    
    recordPlayTime() {
        const currentTime = Date.now();
        const sessionTime = (currentTime - this.session.startTime) / 1000; // seconds
        this.statistics.playTime += sessionTime;
        this.session.currentPlayTime += sessionTime;
        this.session.startTime = currentTime;
    }
    
    handleMissionCompletion(data) {
        const missionData = data.missionData || {};
        
        // Update statistics
        this.statistics.missionsCompleted++;
        this.progression.recordMissionComplete();
        
        // Update achievements
        const withoutDamage = this.player.damageTaken === 0;
        this.achievements.updateMissionComplete(withoutDamage);
        
        // Update daily challenges
        this.dailyChallenges.updateChallengeProgress('mission_complete', 1);
        if (withoutDamage) {
            this.dailyChallenges.updateChallengeProgress('damageless_mission', 1);
        }
        
        // Add XP and money
        if (missionData.rewards) {
            const xpReward = this.calculateXPReward(missionData);
            const moneyReward = this.calculateMoneyReward(missionData);
            
            this.progression.addXP(xpReward, 'mission');
            this.economy.money += moneyReward;
            this.progression.recordMoneyEarned(moneyReward);
            
            // Apply NG+ multipliers if applicable
            if (this.newGamePlus.unlocked) {
                const multipliers = this.newGamePlus.getNGPlusMultipliers();
                const bonusXP = Math.floor(xpReward * (multipliers.rewardXP - 1));
                const bonusMoney = Math.floor(moneyReward * (multipliers.rewardMoney - 1));
                
                if (bonusXP > 0) this.progression.addXP(bonusXP, 'ngplus_bonus');
                if (bonusMoney > 0) {
                    this.economy.money += bonusMoney;
                    this.progression.recordMoneyEarned(bonusMoney);
                }
            }
        }
        
        // Check for NG+ unlock
        if (!this.newGamePlus.unlocked && this.newGamePlus.checkQualification(this)) {
            this.newGamePlus.unlock();
        }
        
        // Save game
        this.saveGame();
    }
    
    calculateXPReward(missionData) {
        let baseXP = missionData.rewards?.xp || 500;
        
        // Bonus for accuracy
        const accuracy = this.player.totalShots > 0 ? 
            (this.player.headshots / this.player.totalShots) * 100 : 0;
        const accuracyBonus = accuracy >= 80 ? 1.5 : accuracy >= 60 ? 1.2 : 1.0;
        
        // Bonus for time
        const missionTime = missionData.completionTime || 300; // 5 minutes default
        const timeBonus = missionTime <= 120 ? 1.5 : missionTime <= 240 ? 1.2 : 1.0;
        
        // Bonus for no damage
        const damageBonus = this.player.damageTaken === 0 ? 2.0 : 1.0;
        
        // Combo bonus
        const comboBonus = 1 + (this.player.combo * 0.1);
        
        return Math.floor(baseXP * accuracyBonus * timeBonus * damageBonus * comboBonus);
    }
    
    calculateMoneyReward(missionData) {
        let baseMoney = missionData.rewards?.money || 200;
        
        // Apply reputation bonus
        const reputation = this.economy.reputation.lawful > 0 ? 
            this.economy.reputation.lawful : 
            Math.abs(this.economy.reputation.outlaw);
        const reputationBonus = 1 + (reputation / 200); // Up to 1.5x bonus
        
        return Math.floor(baseMoney * reputationBonus);
    }
    
    handleGameOver(data) {
        this.statistics.totalDeaths++;
        
        // Reset player state but keep progression
        this.player.health = this.player.maxHealth;
        this.player.stamina = this.player.maxStamina;
        this.player.deadEye = this.player.maxDeadEye;
        this.player.damageTaken = 0;
        this.player.combo = 0;
        
        // Save game
        this.saveGame();
    }
    
    handleNewGameStart(data) {
        this.session.startTime = Date.now();
        
        // Record daily login
        this.updateDailyLogin();
        
        // Check for daily reset
        this.dailyChallenges.loadChallenges();
        
        // Initialize engagement systems
        this.progression.addXP(0); // Initialize if needed
    }
    
    updateDailyLogin() {
        const today = new Date().toDateString();
        if (this.session.lastLoginDate !== today) {
            this.session.dailyLoginCount++;
            this.session.lastLoginDate = today;
            
            // Check for consecutive days
            const yesterday = new Date(Date.now() - 86400000).toDateString();
            if (this.session.lastLoginDateYesterday === yesterday) {
                this.session.consecutiveDays++;
            } else {
                this.session.consecutiveDays = 1;
            }
            this.session.lastLoginDateYesterday = today;
            
            // Grant login bonus
            this.grantDailyLoginBonus();
        }
    }
    
    grantDailyLoginBonus() {
        const consecutiveBonus = Math.min(this.session.consecutiveDays * 10, 100);
        const bonus = {
            xp: 100 + consecutiveBonus,
            money: 50 + (consecutiveBonus / 2)
        };
        
        this.progression.addXP(bonus.xp, 'daily_login');
        this.economy.money += bonus.money;
        
        // Special reward for 7 consecutive days
        if (this.session.consecutiveDays % 7 === 0) {
            this.economy.money += 500;
            // Show special notification
        }
    }
    
    // Engagement statistics getter
    getEngagementStatistics() {
        return {
            playTime: this.formatPlayTime(this.statistics.playTime),
            missions: {
                completed: this.statistics.missionsCompleted,
                attempted: this.statistics.missionsAttempted,
                successRate: this.statistics.missionsAttempted > 0 ?
                    (this.statistics.missionsCompleted / this.statistics.missionsAttempted) * 100 : 0
            },
            combat: {
                kills: this.statistics.totalKills,
                deaths: this.statistics.totalDeaths,
                kdRatio: this.statistics.totalDeaths > 0 ?
                    this.statistics.totalKills / this.statistics.totalDeaths : this.statistics.totalKills,
                accuracy: this.player.totalShots > 0 ?
                    ((this.player.headshots + (this.player.totalShots - this.player.headshots) * 0.5) / this.player.totalShots) * 100 : 0
            },
            progression: this.progression.getProgressionSummary(),
            achievements: this.achievements.getCompletionStats(),
            dailyChallenges: this.dailyChallenges.getDailyProgress(),
            endlessMode: this.endlessMode.getStatistics(),
            ngPlus: this.newGamePlus.getNGPlusStatus(),
            session: {
                dailyLoginCount: this.session.dailyLoginCount,
                consecutiveDays: this.session.consecutiveDays,
                currentPlayTime: this.formatPlayTime(this.session.currentPlayTime)
            }
        };
    }
    
    formatPlayTime(seconds) {
        const hours = Math.floor(seconds / 3600);
        const minutes = Math.floor((seconds % 3600) / 60);
        return `${hours}h ${minutes}m`;
    }
    
    // Clear game data (with namespace safety)
    clearGameData() {
        try {
            // Only clear keys with our game's prefix
            const prefix = this.getStorageKey('');
            for (let i = 0; i < localStorage.length; i++) {
                const key = localStorage.key(i);
                if (key && key.startsWith(prefix)) {
                    localStorage.removeItem(key);
                }
            }
            
            // Reset state
            this.__init(); // Reinitialize
            
            return true;
        } catch (e) {
            console.error('Failed to clear game data:', e);
            return false;
        }
    }
}
