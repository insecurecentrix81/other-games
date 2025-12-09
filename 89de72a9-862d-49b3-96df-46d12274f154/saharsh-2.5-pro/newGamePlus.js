// ============================================
// NEW GAME+ SYSTEM
// Replay story with increased difficulty and rewards
// ============================================

import { ENGAGEMENT_CONFIG } from './constants.js';

export class NewGamePlus {
    constructor() {
        this.currentCycle = 0;
        this.unlocked = false;
        this.completedCycles = new Set();
        this.ngPlusBonuses = new Map();
        
        this.loadNGPlusData();
    }
    
    loadNGPlusData() {
        try {
            const saved = localStorage.getItem('frontiercall_ngplus');
            if (saved) {
                const data = JSON.parse(saved);
                this.currentCycle = data.currentCycle || 0;
                this.unlocked = data.unlocked || false;
                this.completedCycles = new Set(data.completedCycles || []);
                this.ngPlusBonuses = new Map(data.ngPlusBonuses || []);
            }
        } catch (e) {
            console.error('Failed to load NG+ data:', e);
        }
    }
    
    saveNGPlusData() {
        const data = {
            currentCycle: this.currentCycle,
            unlocked: this.unlocked,
            completedCycles: Array.from(this.completedCycles),
            ngPlusBonuses: Array.from(this.ngPlusBonuses.entries())
        };
        
        try {
            localStorage.setItem('frontiercall_ngplus', JSON.stringify(data));
        } catch (e) {
            console.error('Failed to save NG+ data:', e);
        }
    }
    
    unlock() {
        this.unlocked = true;
        this.currentCycle = 1;
        this.saveNGPlusData();
        return true;
    }
    
    startNewCycle(previousSaveData) {
        if (!this.unlocked) return null;
        
        this.currentCycle++;
        this.completedCycles.add(this.currentCycle - 1);
        
        // Calculate NG+ multipliers
        const multipliers = this.getNGPlusMultipliers();
        
        // Prepare player data for NG+
        const ngPlusSave = this.prepareNGPlusSave(previousSaveData, multipliers);
        
        // Grant NG+ cycle bonus
        const cycleBonus = this.grantCycleBonus(this.currentCycle);
        
        this.saveNGPlusData();
        
        return {
            cycle: this.currentCycle,
            multipliers,
            ngPlusSave,
            cycleBonus
        };
    }
    
    getNGPlusMultipliers() {
        const baseMultipliers = ENGAGEMENT_CONFIG.NEW_GAME_PLUS_MULTIPLIERS;
        const cycleMultiplier = Math.pow(1.2, this.currentCycle - 1);
        
        return {
            enemyHealth: baseMultipliers.ENEMY_HEALTH * cycleMultiplier,
            enemyDamage: baseMultipliers.ENEMY_DAMAGE * cycleMultiplier,
            enemyAccuracy: baseMultipliers.ENEMY_ACCURACY * cycleMultiplier,
            rewardXP: baseMultipliers.REWARD_XP * cycleMultiplier,
            rewardMoney: baseMultipliers.REWARD_MONEY * cycleMultiplier,
            cycle: this.currentCycle
        };
    }
    
    prepareNGPlusSave(previousSave, multipliers) {
        // Keep player progression but reset story progress
        const ngPlusSave = {
            ...previousSave,
            mission: {
                currentMission: null,
                availableMissions: ['first_blood'], // Start from beginning
                completedMissions: new Set()
            },
            world: {
                ...previousSave.world,
                discoveredAreas: new Set() // Reset discovery for exploration
            },
            ngPlus: {
                cycle: this.currentCycle,
                multipliers,
                startTime: Date.now(),
                previousCycle: this.currentCycle - 1
            }
        };
        
        // Add NG+ specific bonuses
        const bonuses = this.getCurrentBonuses();
        ngPlusSave.ngPlus.bonuses = bonuses;
        
        return ngPlusSave;
    }
    
    grantCycleBonus(cycle) {
        const bonuses = [
            { cycle: 1, reward: { type: 'ability', id: 'ngplus_mastery', name: 'Cycle Master' } },
            { cycle: 2, reward: { type: 'weapon', id: 'ngplus_revolver', name: 'Cycle Revolver' } },
            { cycle: 3, reward: { type: 'title', id: 'cycle_champion', name: 'Cycle Champion' } },
            { cycle: 5, reward: { type: 'ability', id: 'true_mastery', name: 'True Mastery' } },
            { cycle: 10, reward: { type: 'achievement', id: 'ngplus_legend', name: 'NG+ Legend' } }
        ];
        
        const bonus = bonuses.find(b => b.cycle === cycle);
        if (bonus) {
            this.ngPlusBonuses.set(`cycle_${cycle}`, bonus.reward);
            return bonus.reward;
        }
        
        return null;
    }
    
    getCurrentBonuses() {
        return Array.from(this.ngPlusBonuses.values());
    }
    
    // Adjust mission difficulty for NG+
    adjustMissionForNGPlus(missionData, multipliers) {
        const adjustedMission = { ...missionData };
        
        // Scale enemy counts and stats
        if (adjustedMission.enemies) {
            adjustedMission.enemies = adjustedMission.enemies.map(enemy => ({
                ...enemy,
                count: Math.ceil(enemy.count * multipliers.enemyHealth),
                difficulty: enemy.difficulty * multipliers.enemyDamage
            }));
        }
        
        // Adjust mission constraints
        if (adjustedMission.constraints) {
            if (adjustedMission.constraints.timeLimit) {
                adjustedMission.constraints.timeLimit *= 0.8; // 20% less time
            }
        }
        
        // Increase rewards
        if (adjustedMission.rewards) {
            adjustedMission.rewards = {
                money: Math.floor(adjustedMission.rewards.money * multipliers.rewardMoney),
                reputation: adjustedMission.rewards.reputation,
                items: [...(adjustedMission.rewards.items || [])],
                xp: Math.floor((adjustedMission.rewards.xp || 0) * multipliers.rewardXP)
            };
        }
        
        // Add NG+ specific objectives
        if (!adjustedMission.ngPlusObjectives) {
            adjustedMission.ngPlusObjectives = this.generateNGPlusObjectives(multipliers.cycle);
        }
        
        return adjustedMission;
    }
    
    generateNGPlusObjectives(cycle) {
        const objectives = [];
        
        // Time challenge for higher cycles
        if (cycle >= 2) {
            objectives.push({
                id: `ngplus_time_${cycle}`,
                type: 'TIME_LIMIT',
                description: `Complete within ${5 - cycle} minutes`,
                optional: true,
                reward: { xp: 500 * cycle, money: 200 * cycle }
            });
        }
        
        // No damage challenge
        if (cycle >= 3) {
            objectives.push({
                id: `ngplus_nodamage_${cycle}`,
                type: 'NO_DAMAGE',
                description: 'Complete without taking damage',
                optional: true,
                reward: { xp: 1000 * cycle, money: 500 * cycle }
            });
        }
        
        // Headshot challenge
        if (cycle >= 4) {
            objectives.push({
                id: `ngplus_headshots_${cycle}`,
                type: 'HEADSHOT_COUNT',
                target: 10 * cycle,
                description: `Get ${10 * cycle} headshots`,
                optional: true,
                reward: { xp: 800 * cycle, money: 300 * cycle }
            });
        }
        
        return objectives;
    }
    
    // Check if player qualifies for NG+
    checkQualification(saveData) {
        if (this.unlocked) return true;
        
        // Requirements for first NG+ unlock
        const requirements = {
            storyCompleted: saveData.mission?.completedMissions?.size >= 15,
            playerLevel: saveData.player?.level >= 20,
            achievements: saveData.achievements?.completed?.size >= 10
        };
        
        return Object.values(requirements).every(req => req);
    }
    
    getNGPlusStatus() {
        return {
            unlocked: this.unlocked,
            currentCycle: this.currentCycle,
            completedCycles: Array.from(this.completedCycles),
            bonuses: this.getCurrentBonuses(),
            nextCycleMultipliers: this.getNGPlusMultipliers()
        };
    }
    
    // Get leaderboard for NG+ cycles
    getCycleLeaderboard() {
        try {
            const leaderboard = JSON.parse(localStorage.getItem('frontiercall_ngplus_leaderboard') || '[]');
            return leaderboard
                .sort((a, b) => b.cycle - a.cycle || b.score - a.score)
                .slice(0, 10);
        } catch (e) {
            return [];
        }
    }
    
    recordCycleCompletion(cycle, score, completionTime) {
        const entry = {
            cycle,
            score,
            completionTime,
            date: Date.now(),
            player: 'You' // Would be player name
        };
        
        try {
            const leaderboard = JSON.parse(localStorage.getItem('frontiercall_ngplus_leaderboard') || '[]');
            leaderboard.push(entry);
            localStorage.setItem('frontiercall_ngplus_leaderboard', JSON.stringify(leaderboard));
        } catch (e) {
            console.error('Failed to save NG+ leaderboard:', e);
        }
    }
}
