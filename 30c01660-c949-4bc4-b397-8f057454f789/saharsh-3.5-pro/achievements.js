// Achievements System
class Achievements {
    constructor() {
        this.achievements = [
            // Love achievements
            {
                id: 'first_love',
                name: 'First Love',
                description: 'Reach 25% love meter',
                icon: '💕',
                requirement: () => game.state.loveMeter >= 25,
                unlocked: false
            },
            {
                id: 'falling_hard',
                name: 'Falling Hard',
                description: 'Reach 50% love meter',
                icon: '💖',
                requirement: () => game.state.loveMeter >= 50,
                unlocked: false
            },
            {
                id: 'head_over_heels',
                name: 'Head Over Heels',
                description: 'Reach 75% love meter',
                icon: '💝',
                requirement: () => game.state.loveMeter >= 75,
                unlocked: false
            },
            {
                id: 'true_love',
                name: 'True Love',
                description: 'Reach 100% love meter',
                icon: '💗',
                requirement: () => game.state.loveMeter >= 100,
                unlocked: false
            },
            
            // Currency achievements
            {
                id: 'first_coins',
                name: 'First Coins',
                description: 'Earn 100 coins',
                icon: '💰',
                requirement: () => game.state.currency >= 100,
                unlocked: false
            },
            {
                id: 'coin_collector',
                name: 'Coin Collector',
                description: 'Earn 500 coins',
                icon: '💎',
                requirement: () => game.state.currency >= 500,
                unlocked: false
            },
            {
                id: 'wealthy',
                name: 'Wealthy',
                description: 'Earn 1000 coins',
                icon: '🏆',
                requirement: () => game.state.currency >= 1000,
                unlocked: false
            },
            {
                id: 'millionaire',
                name: 'Millionaire',
                description: 'Earn 5000 coins',
                icon: '👑',
                requirement: () => game.state.currency >= 5000,
                unlocked: false
            },
            
            // Mini-game achievements
            {
                id: 'first_win',
                name: 'First Victory',
                description: 'Win your first mini-game',
                icon: '🎮',
                requirement: () => game.state.lastMiniGameScore > 0,
                unlocked: false
            },
            {
                id: 'high_scorer',
                name: 'High Scorer',
                description: 'Score over 1000 in a mini-game',
                icon: '⭐',
                requirement: () => game.state.lastMiniGameScore >= 1000,
                unlocked: false
            },
            {
                id: 'perfect_game',
                name: 'Perfect Game',
                description: 'Score over 5000 in a mini-game',
                icon: '🌟',
                requirement: () => game.state.lastMiniGameScore >= 5000,
                unlocked: false
            },
            {
                id: 'combo_master',
                name: 'Combo Master',
                description: 'Reach 5x combo multiplier',
                icon: '⚡',
                requirement: () => game.state.comboMultiplier >= 5,
                unlocked: false
            },
            
            // Dating achievements
            {
                id: 'first_date',
                name: 'First Date',
                description: 'Complete your first date',
                icon: '🍽️',
                requirement: () => game.state.totalDates >= 1,
                unlocked: false
            },
            {
                id: 'serial_dater',
                name: 'Serial Dater',
                description: 'Complete 10 dates',
                icon: '💑',
                requirement: () => game.state.totalDates >= 10,
                unlocked: false
            },
            {
                id: 'restaurant_hopper',
                name: 'Restaurant Hopper',
                description: 'Visit all 10 restaurants',
                icon: '🍴',
                requirement: () => game.state.currentRestaurant >= 9,
                unlocked: false
            },
            
            // Endings achievements
            {
                id: 'ending_bad',
                name: 'Bad Ending',
                description: 'Unlock the bad ending',
                icon: '💔',
                requirement: () => game.state.endingsUnlocked.includes('bad'),
                unlocked: false
            },
            {
                id: 'ending_neutral',
                name: 'Neutral Ending',
                description: 'Unlock the neutral ending',
                icon: '🤝',
                requirement: () => game.state.endingsUnlocked.includes('neutral'),
                unlocked: false
            },
            {
                id: 'ending_good',
                name: 'Good Ending',
                description: 'Unlock the good ending',
                icon: '😊',
                requirement: () => game.state.endingsUnlocked.includes('good'),
                unlocked: false
            },
            {
                id: 'ending_perfect',
                name: 'Perfect Ending',
                description: 'Unlock the perfect ending',
                icon: '👑',
                requirement: () => game.state.endingsUnlocked.includes('perfect'),
                unlocked: false
            },
            {
                id: 'ending_betrayal',
                name: 'The Betrayal',
                description: 'Unlock the betrayal ending',
                icon: '🗡️',
                requirement: () => game.state.endingsUnlocked.includes('betrayal'),
                unlocked: false
            },
            
            // Special achievements
            {
                id: 'upgrade_beginner',
                name: 'Upgrade Beginner',
                description: 'Purchase 5 upgrades',
                icon: '📈',
                requirement: () => upgrades.getTotalUpgradesPurchased() >= 5,
                unlocked: false
            },
            {
                id: 'upgrade_master',
                name: 'Upgrade Master',
                description: 'Purchase 15 upgrades',
                icon: '🚀',
                requirement: () => upgrades.getTotalUpgradesPurchased() >= 15,
                unlocked: false
            },
            {
                id: 'endless_warrior',
                name: 'Endless Warrior',
                description: 'Reach wave 10 in endless mode',
                icon: '♾️',
                requirement: () => game.state.endlessHighScore >= 1000,
                unlocked: false
            },
            {
                id: 'time_invested',
                name: 'Time Invested',
                description: 'Play for 30 minutes',
                icon: '⏰',
                requirement: () => game.state.playTime >= 1800,
                unlocked: false
            },
            {
                id: 'completionist',
                name: 'Completionist',
                description: 'Unlock all achievements',
                icon: '🏆',
                requirement: () => this.getUnlockedCount() >= 24,
                unlocked: false
            }
        ];
        
        this.loadAchievements();
    }

    unlock(achievementId) {
        const achievement = this.achievements.find(a => a.id === achievementId);
        
        if (!achievement || achievement.unlocked) return false;
        
        achievement.unlocked = true;
        game.state.achievements.push(achievementId);
        
        // Give reward
        this.giveReward(achievement);
        
        // Show popup
        this.showAchievementPopup(achievement);
        
        // Save progress
        game.saveProgress();
        
        // Check for completionist achievement
        if (this.getUnlockedCount() >= this.achievements.length - 1) {
            this.unlock('completionist');
        }
        
        return true;
    }

    giveReward(achievement) {
        let reward = 0;
        
        // Different rewards for different achievement types
        if (achievement.id.includes('ending')) {
            reward = 100;
        } else if (achievement.id.includes('love') && achievement.id !== 'first_love') {
            reward = 50;
        } else if (achievement.id.includes('coin')) {
            reward = 25;
        } else if (achievement.id.includes('upgrade')) {
            reward = 75;
        } else {
            reward = 10;
        }
        
        game.addCurrency(reward);
    }

    showAchievementPopup(achievement) {
        const popup = document.getElementById('achievementPopup');
        const nameElement = document.getElementById('popupAchievementName');
        
        nameElement.textContent = achievement.name;
        popup.classList.remove('hidden');
        
        // Play sound
        audio.playSound('winLevel');
        
        // Hide after animation
        setTimeout(() => {
            popup.classList.add('hidden');
        }, 3000);
    }

    checkLoveAchievements(loveLevel) {
        if (loveLevel >= 25) this.unlock('first_love');
        if (loveLevel >= 50) this.unlock('falling_hard');
        if (loveLevel >= 75) this.unlock('head_over_heels');
        if (loveLevel >= 100) this.unlock('true_love');
    }

    checkCurrencyAchievements(currency) {
        if (currency >= 100) this.unlock('first_coins');
        if (currency >= 500) this.unlock('coin_collector');
        if (currency >= 1000) this.unlock('wealthy');
        if (currency >= 5000) this.unlock('millionaire');
    }

    checkMiniGameAchievements(score, won) {
        if (won && score > 0) this.unlock('first_win');
        if (score >= 1000) this.unlock('high_scorer');
        if (score >= 5000) this.unlock('perfect_game');
    }

    checkUpgradeAchievements() {
        const totalUpgrades = upgrades.getTotalUpgradesPurchased();
        if (totalUpgrades >= 5) this.unlock('upgrade_beginner');
        if (totalUpgrades >= 15) this.unlock('upgrade_master');
    }

    checkAllAchievements() {
        this.achievements.forEach(achievement => {
            if (!achievement.unlocked && achievement.requirement()) {
                this.unlock(achievement.id);
            }
        });
    }

    getUnlockedCount() {
        return this.achievements.filter(a => a.unlocked).length;
    }

    getTotalCount() {
        return this.achievements.length;
    }

    getUnlockedAchievements() {
        return this.achievements.filter(a => a.unlocked);
    }

    saveAchievements() {
        const unlockedIds = this.achievements
            .filter(a => a.unlocked)
            .map(a => a.id);
        
        localStorage.setItem('yussefSaharshAchievements', JSON.stringify(unlockedIds));
    }

    loadAchievements() {
        const savedIds = localStorage.getItem('yussefSaharshAchievements');
        
        if (savedIds) {
            const unlockedIds = JSON.parse(savedIds);
            this.achievements.forEach(achievement => {
                if (unlockedIds.includes(achievement.id)) {
                    achievement.unlocked = true;
                }
            });
        }
    }

    resetAchievements() {
        this.achievements.forEach(achievement => {
            achievement.unlocked = false;
        });
        
        game.state.achievements = [];
        this.saveAchievements();
        
        ui.updateAchievementsDisplay();
    }
}

// Initialize achievements system
const achievements = new Achievements();
