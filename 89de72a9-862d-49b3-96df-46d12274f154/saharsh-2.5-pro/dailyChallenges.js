// ============================================
// DAILY CHALLENGE SYSTEM
// Daily rotating challenges for replayability
// ============================================

import { DAILY_CHALLENGE_POOL, ENGAGEMENT_CONFIG } from './constants.js';

export class DailyChallengeSystem {
    constructor() {
        this.currentDate = this.getCurrentDateString();
        this.challenges = [];
        this.completedChallenges = new Set();
        this.dailyStats = {
            kills: 0,
            headshots: 0,
            missions: 0,
            treasures: 0,
            bounties: 0,
            damageTaken: 0
        };
        
        this.loadChallenges();
    }
    
    getCurrentDateString() {
        const now = new Date();
        return `${now.getFullYear()}-${now.getMonth() + 1}-${now.getDate()}`;
    }
    
    loadChallenges() {
        const saved = this.loadFromStorage();
        
        // Check if we need new challenges
        if (!saved || saved.date !== this.currentDate) {
            this.generateNewChallenges();
        } else {
            this.challenges = saved.challenges;
            this.completedChallenges = new Set(saved.completedChallenges || []);
            this.dailyStats = saved.dailyStats || this.dailyStats;
        }
    }
    
    generateNewChallenges() {
        this.challenges = [];
        this.completedChallenges.clear();
        this.dailyStats = {
            kills: 0,
            headshots: 0,
            missions: 0,
            treasures: 0,
            bounties: 0,
            damageTaken: 0
        };
        
        // Use seeded random for consistent daily challenges
        const seed = this.getDailySeed();
        const random = this.seededRandom(seed);
        
        // Select random challenges
        const shuffled = [...DAILY_CHALLENGE_POOL]
            .sort(() => random() - 0.5)
            .slice(0, ENGAGEMENT_CONFIG.DAILY_CHALLENGE_COUNT);
        
        this.challenges = shuffled.map(challenge => ({
            ...challenge,
            progress: 0,
            completed: false
        }));
        
        this.saveToStorage();
    }
    
    seededRandom(seed) {
        let value = seed;
        return function() {
            value = (value * 9301 + 49297) % 233280;
            return value / 233280;
        };
    }
    
    getDailySeed() {
        const date = new Date();
        return date.getFullYear() * 10000 + (date.getMonth() + 1) * 100 + date.getDate();
    }
    
    updateChallengeProgress(type, amount = 1) {
        let updated = [];
        
        // Update daily stats
        switch(type) {
            case 'kill':
                this.dailyStats.kills += amount;
                break;
            case 'headshot':
                this.dailyStats.headshots += amount;
                break;
            case 'mission_complete':
                this.dailyStats.missions += amount;
                break;
            case 'treasure_found':
                this.dailyStats.treasures += amount;
                break;
            case 'bounty_complete':
                this.dailyStats.bounties += amount;
                break;
        }
        
        // Update challenge progress
        this.challenges.forEach(challenge => {
            if (challenge.completed) return;
            
            switch(challenge.id) {
                case 'daily_kills':
                    if (type === 'kill') {
                        challenge.progress = Math.min(this.dailyStats.kills, challenge.requirement.target);
                        if (this.checkChallengeComplete(challenge)) {
                            updated.push(challenge);
                        }
                    }
                    break;
                    
                case 'daily_headshots':
                    if (type === 'headshot') {
                        challenge.progress = Math.min(this.dailyStats.headshots, challenge.requirement.target);
                        if (this.checkChallengeComplete(challenge)) {
                            updated.push(challenge);
                        }
                    }
                    break;
                    
                case 'daily_treasure':
                    if (type === 'treasure_found') {
                        challenge.progress = Math.min(this.dailyStats.treasures, challenge.requirement.target);
                        if (this.checkChallengeComplete(challenge)) {
                            updated.push(challenge);
                        }
                    }
                    break;
                    
                case 'daily_mission':
                    if (type === 'mission_complete') {
                        challenge.progress = Math.min(this.dailyStats.missions, challenge.requirement.target);
                        if (this.checkChallengeComplete(challenge)) {
                            updated.push(challenge);
                        }
                    }
                    break;
                    
                case 'daily_no_damage':
                    if (type === 'damageless_mission') {
                        challenge.progress = Math.min(1, challenge.requirement.target);
                        if (this.checkChallengeComplete(challenge)) {
                            updated.push(challenge);
                        }
                    }
                    break;
                    
                case 'daily_bounties':
                    if (type === 'bounty_complete') {
                        challenge.progress = Math.min(this.dailyStats.bounties, challenge.requirement.target);
                        if (this.checkChallengeComplete(challenge)) {
                            updated.push(challenge);
                        }
                    }
                    break;
            }
        });
        
        if (updated.length > 0) {
            this.saveToStorage();
        }
        
        return updated;
    }
    
    checkChallengeComplete(challenge) {
        if (challenge.progress >= challenge.requirement.target) {
            challenge.completed = true;
            this.completedChallenges.add(challenge.id);
            return true;
        }
        return false;
    }
    
    getChallengeRewards(challengeId) {
        const challenge = this.challenges.find(c => c.id === challengeId);
        return challenge ? challenge.reward : null;
    }
    
    getDailyProgress() {
        const totalChallenges = this.challenges.length;
        const completed = this.challenges.filter(c => c.completed).length;
        
        return {
            date: this.currentDate,
            totalChallenges,
            completed,
            progress: (completed / totalChallenges) * 100,
            challenges: this.challenges,
            stats: this.dailyStats,
            timeUntilRefresh: this.getTimeUntilRefresh()
        };
    }
    
    getTimeUntilRefresh() {
        const now = new Date();
        const tomorrow = new Date(now);
        tomorrow.setDate(tomorrow.getDate() + 1);
        tomorrow.setHours(ENGAGEMENT_CONFIG.CHALLENGE_REFRESH_HOUR, 0, 0, 0);
        
        return tomorrow.getTime() - now.getTime();
    }
    
    loadFromStorage() {
        try {
            const data = localStorage.getItem('frontiercall_daily_challenges');
            return data ? JSON.parse(data) : null;
        } catch (e) {
            return null;
        }
    }
    
    saveToStorage() {
        const data = {
            date: this.currentDate,
            challenges: this.challenges,
            completedChallenges: Array.from(this.completedChallenges),
            dailyStats: this.dailyStats
        };
        
        try {
            localStorage.setItem('frontiercall_daily_challenges', JSON.stringify(data));
        } catch (e) {
            console.error('Failed to save daily challenges:', e);
        }
    }
    
    // Get streak information
    getStreakInfo() {
        try {
            const streakData = localStorage.getItem('frontiercall_challenge_streak');
            if (!streakData) return { current: 0, longest: 0, lastDate: null };
            
            const data = JSON.parse(streakData);
            const lastDate = new Date(data.lastDate);
            const today = new Date(this.currentDate);
            
            // Check if streak is broken
            const dayDiff = Math.floor((today - lastDate) / (1000 * 60 * 60 * 24));
            
            let currentStreak = data.current;
            if (dayDiff > 1) {
                currentStreak = 0; // Streak broken
            } else if (dayDiff === 1) {
                currentStreak++; // Streak continues
            }
            
            const longestStreak = Math.max(currentStreak, data.longest || 0);
            
            // Save updated streak
            const newData = {
                current: currentStreak,
                longest: longestStreak,
                lastDate: today.toISOString()
            };
            
            localStorage.setItem('frontiercall_challenge_streak', JSON.stringify(newData));
            
            return newData;
            
        } catch (e) {
            return { current: 0, longest: 0, lastDate: null };
        }
    }
    
    // Check if player completed all daily challenges
    isDailyComplete() {
        return this.challenges.every(c => c.completed);
    }
}
