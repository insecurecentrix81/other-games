// ============================================
// ENDLESS/SURVIVAL MODE
// Infinite wave-based gameplay for extended engagement
// ============================================

import { ENDLESS_WAVE_CONFIG } from './constants.js';

export class EndlessMode {
    constructor(gameState) {
        this.gameState = gameState;
        this.currentSet = 0;
        this.currentWave = 0;
        this.currentArena = null;
        this.difficultyMultiplier = 1.0;
        this.score = 0;
        this.killsThisWave = 0;
        this.enemiesRemaining = 0;
        this.totalWavesCompleted = 0;
        this.highScores = new Map();
        this.rewardMultiplier = 1.0;
        
        this.loadHighScores();
    }
    
    loadHighScores() {
        try {
            const saved = localStorage.getItem('frontiercall_endless_scores');
            if (saved) {
                this.highScores = new Map(JSON.parse(saved));
            }
        } catch (e) {
            console.error('Failed to load high scores:', e);
        }
    }
    
    saveHighScores() {
        try {
            localStorage.setItem('frontiercall_endless_scores', 
                JSON.stringify(Array.from(this.highScores.entries())));
        } catch (e) {
            console.error('Failed to save high scores:', e);
        }
    }
    
    startNewGame(arenaIndex = 0) {
        this.currentSet = 0;
        this.currentWave = 0;
        this.currentArena = ENDLESS_WAVE_CONFIG.WAVE_SETS[arenaIndex];
        this.difficultyMultiplier = 1.0;
        this.score = 0;
        this.killsThisWave = 0;
        this.totalWavesCompleted = 0;
        this.rewardMultiplier = 1.0;
        
        return this.prepareNextWave();
    }
    
    prepareNextWave() {
        if (!this.currentArena) return null;
        
        // Check if we need to move to next set
        if (this.currentWave >= this.currentArena.waves.length) {
            this.currentSet++;
            this.currentWave = 0;
            this.difficultyMultiplier *= (1 + ENDLESS_WAVE_CONFIG.ENDLESS_DIFFICULTY_INCREASE);
            this.rewardMultiplier *= ENDLESS_WAVE_CONFIG.ENDLESS_REWARD_MULTIPLIER;
            
            // If we've completed all sets, loop back to first set with increased difficulty
            if (this.currentSet >= ENDLESS_WAVE_CONFIG.WAVE_SETS.length) {
                this.currentArena = ENDLESS_WAVE_CONFIG.WAVE_SETS[0];
            } else {
                this.currentArena = ENDLESS_WAVE_CONFIG.WAVE_SETS[this.currentSet];
            }
        }
        
        const waveConfig = this.currentArena.waves[this.currentWave];
        const scaledWave = this.scaleWave(waveConfig);
        
        this.enemiesRemaining = scaledWave.enemies;
        this.killsThisWave = 0;
        
        return {
            waveNumber: this.totalWavesCompleted + 1,
            setNumber: this.currentSet + 1,
            waveName: `${this.currentArena.name} - Wave ${this.currentWave + 1}`,
            enemies: scaledWave.enemies,
            enemyTypes: scaledWave.types,
            isBossWave: waveConfig.boss || false,
            difficulty: this.difficultyMultiplier.toFixed(2),
            rewardMultiplier: this.rewardMultiplier.toFixed(2)
        };
    }
    
    scaleWave(waveConfig) {
        const scaledEnemies = Math.floor(waveConfig.enemies * this.difficultyMultiplier);
        const scaledDifficulty = waveConfig.difficulty * this.difficultyMultiplier;
        
        // For boss waves, don't scale enemy count (always 1), but scale difficulty
        if (waveConfig.boss) {
            return {
                ...waveConfig,
                enemies: 1,
                difficulty: scaledDifficulty
            };
        }
        
        return {
            ...waveConfig,
            enemies: scaledEnemies,
            difficulty: scaledDifficulty
        };
    }
    
    recordEnemyKilled() {
        this.killsThisWave++;
        this.enemiesRemaining--;
        
        // Add to score
        const baseScore = 100;
        const comboBonus = this.gameState.player.combo || 1;
        const difficultyBonus = this.difficultyMultiplier;
        const waveScore = Math.floor(baseScore * comboBonus * difficultyBonus);
        
        this.score += waveScore;
        
        // Check if wave is complete
        if (this.enemiesRemaining <= 0) {
            return this.completeWave();
        }
        
        return { waveComplete: false, score: waveScore };
    }
    
    completeWave() {
        this.currentWave++;
        this.totalWavesCompleted++;
        
        // Calculate wave rewards
        const waveRewards = this.calculateWaveRewards();
        
        // Update high score if applicable
        this.updateHighScore();
        
        // Prepare next wave
        const nextWave = this.prepareNextWave();
        
        return {
            waveComplete: true,
            waveNumber: this.totalWavesCompleted,
            rewards: waveRewards,
            nextWave: nextWave,
            score: this.score
        };
    }
    
    calculateWaveRewards() {
        const baseXP = ENDLESS_WAVE_CONFIG.REWARDS_PER_WAVE.xp * this.rewardMultiplier;
        const baseMoney = ENDLESS_WAVE_CONFIG.REWARDS_PER_WAVE.money * this.rewardMultiplier;
        
        // Bonus for quick completion
        const timeBonus = 1.0; // Would be calculated based on completion time
        
        // Bonus for accuracy
        const accuracyBonus = 1.0; // Would be calculated based on accuracy
        
        // Bonus for no damage
        const damageBonus = this.gameState.player.damageTaken === 0 ? 1.2 : 1.0;
        
        const totalXP = Math.floor(baseXP * timeBonus * accuracyBonus * damageBonus);
        const totalMoney = Math.floor(baseMoney * timeBonus * accuracyBonus * damageBonus);
        
        // Special rewards for milestone waves
        const milestoneRewards = this.checkMilestoneRewards();
        
        return {
            xp: totalXP,
            money: totalMoney,
            specialRewards: milestoneRewards
        };
    }
    
    checkMilestoneRewards() {
        const milestones = [10, 25, 50, 100];
        const rewards = [];
        
        milestones.forEach(milestone => {
            if (this.totalWavesCompleted === milestone) {
                rewards.push({
                    type: 'milestone',
                    wave: milestone,
                    reward: this.getMilestoneReward(milestone)
                });
            }
        });
        
        return rewards;
    }
    
    getMilestoneReward(wave) {
        switch(wave) {
            case 10:
                return { type: 'weapon', id: 'endless_revolver', name: 'Endless Revolver' };
            case 25:
                return { type: 'title', id: 'wave_master', name: 'Wave Master' };
            case 50:
                return { type: 'ability', id: 'survivor', name: 'Survivor\'s Resilience' };
            case 100:
                return { type: 'achievement', id: 'endless_champion', name: 'Endless Champion' };
            default:
                return { type: 'money', amount: wave * 100 };
        }
    }
    
    updateHighScore() {
        const arenaName = this.currentArena.name;
        const currentHighScore = this.highScores.get(arenaName) || 0;
        
        if (this.score > currentHighScore) {
            this.highScores.set(arenaName, this.score);
            this.saveHighScores();
            return true;
        }
        
        return false;
    }
    
    getHighScores() {
        return Array.from(this.highScores.entries())
            .sort((a, b) => b[1] - a[1])
            .slice(0, 10);
    }
    
    getGameState() {
        return {
            currentSet: this.currentSet + 1,
            currentWave: this.currentWave + 1,
            totalWaves: this.totalWavesCompleted,
            score: this.score,
            difficulty: this.difficultyMultiplier.toFixed(2),
            arena: this.currentArena?.name || 'None',
            enemiesRemaining: this.enemiesRemaining,
            rewardMultiplier: this.rewardMultiplier.toFixed(2)
        };
    }
    
    // Player died or quit
    endGame() {
        const finalScore = this.score;
        const wavesCompleted = this.totalWavesCompleted;
        
        // Save run statistics
        this.saveRunStatistics(finalScore, wavesCompleted);
        
        // Reset for next game
        this.currentSet = 0;
        this.currentWave = 0;
        this.currentArena = null;
        this.difficultyMultiplier = 1.0;
        this.score = 0;
        this.enemiesRemaining = 0;
        this.rewardMultiplier = 1.0;
        
        return {
            finalScore,
            wavesCompleted,
            highScoreUpdated: this.updateHighScore(),
            rewards: this.calculateFinalRewards(finalScore, wavesCompleted)
        };
    }
    
    saveRunStatistics(score, waves) {
        try {
            const stats = JSON.parse(localStorage.getItem('frontiercall_endless_stats') || '{}');
            
            stats.totalRuns = (stats.totalRuns || 0) + 1;
            stats.totalWaves = (stats.totalWaves || 0) + waves;
            stats.highestWave = Math.max(stats.highestWave || 0, waves);
            stats.highestScore = Math.max(stats.highestScore || 0, score);
            stats.averageScore = ((stats.averageScore || 0) * (stats.totalRuns - 1) + score) / stats.totalRuns;
            
            localStorage.setItem('frontiercall_endless_stats', JSON.stringify(stats));
        } catch (e) {
            console.error('Failed to save endless stats:', e);
        }
    }
    
    calculateFinalRewards(score, waves) {
        const baseXP = score * 0.1;
        const baseMoney = score * 0.05;
        
        // Bonus for wave completion
        const waveBonus = waves * 50;
        
        return {
            xp: Math.floor(baseXP + waveBonus),
            money: Math.floor(baseMoney + (waves * 20))
        };
    }
    
    // Get leaderboard data
    getLeaderboard() {
        const scores = this.getHighScores();
        const stats = this.getStatistics();
        
        return {
            topScores: scores.map(([arena, score], index) => ({
                rank: index + 1,
                arena,
                score,
                player: 'You' // Would be player name in multiplayer
            })),
            personalStats: stats
        };
    }
    
    getStatistics() {
        try {
            return JSON.parse(localStorage.getItem('frontiercall_endless_stats') || '{}');
        } catch (e) {
            return {
                totalRuns: 0,
                totalWaves: 0,
                highestWave: 0,
                highestScore: 0,
                averageScore: 0
            };
        }
    }
}
