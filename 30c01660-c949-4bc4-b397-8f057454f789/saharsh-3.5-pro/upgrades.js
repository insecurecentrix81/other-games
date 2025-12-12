// Upgrades System
class Upgrades {
    constructor() {
        this.upgrades = [
            {
                id: 'charm_1',
                name: 'Charm Level 1',
                description: 'Increase love gained by 10%',
                cost: 50,
                type: 'charm',
                level: 1,
                maxLevel: 5,
                icon: '💕'
            },
            {
                id: 'charm_2',
                name: 'Charm Level 2',
                description: 'Increase love gained by 20%',
                cost: 150,
                type: 'charm',
                level: 2,
                maxLevel: 5,
                icon: '💕'
            },
            {
                id: 'charm_3',
                name: 'Charm Level 3',
                description: 'Increase love gained by 30%',
                cost: 300,
                type: 'charm',
                level: 3,
                maxLevel: 5,
                icon: '💕'
            },
            {
                id: 'charm_4',
                name: 'Charm Level 4',
                description: 'Increase love gained by 40%',
                cost: 500,
                type: 'charm',
                level: 4,
                maxLevel: 5,
                icon: '💕'
            },
            {
                id: 'charm_5',
                name: 'Charm Master',
                description: 'Increase love gained by 50%',
                cost: 1000,
                type: 'charm',
                level: 5,
                maxLevel: 5,
                icon: '💕'
            },
            {
                id: 'luck_1',
                name: 'Lucky Charm',
                description: 'Increase currency earned by 20%',
                cost: 75,
                type: 'luck',
                level: 1,
                maxLevel: 5,
                icon: '🍀'
            },
            {
                id: 'luck_2',
                name: 'Four Leaf Clover',
                description: 'Increase currency earned by 40%',
                cost: 200,
                type: 'luck',
                level: 2,
                maxLevel: 5,
                icon: '🍀'
            },
            {
                id: 'luck_3',
                name: 'Rabbit\'s Foot',
                description: 'Increase currency earned by 60%',
                cost: 400,
                type: 'luck',
                level: 3,
                maxLevel: 5,
                icon: '🍀'
            },
            {
                id: 'luck_4',
                name: 'Golden Horseshoe',
                description: 'Increase currency earned by 80%',
                cost: 600,
                type: 'luck',
                level: 4,
                maxLevel: 5,
                icon: '🍀'
            },
            {
                id: 'luck_5',
                name: 'Luck Master',
                description: 'Increase currency earned by 100%',
                cost: 1200,
                type: 'luck',
                level: 5,
                maxLevel: 5,
                icon: '🍀'
            },
            {
                id: 'charisma_1',
                name: 'Smooth Talker',
                description: 'Better dialogue options appear more often',
                cost: 100,
                type: 'charisma',
                level: 1,
                maxLevel: 3,
                icon: '🗣️'
            },
            {
                id: 'charisma_2',
                name: 'Silver Tongue',
                description: 'Unlock special dialogue branches',
                cost: 250,
                type: 'charisma',
                level: 2,
                maxLevel: 3,
                icon: '🗣️'
            },
            {
                id: 'charisma_3',
                name: 'Master Orator',
                description: 'All choices have positive outcomes',
                cost: 500,
                type: 'charisma',
                level: 3,
                maxLevel: 3,
                icon: '🗣️'
            },
            {
                id: 'combo_start',
                name: 'Combo Starter',
                description: 'Start with 2x combo multiplier',
                cost: 150,
                type: 'special',
                level: 1,
                maxLevel: 1,
                icon: '⚡'
            },
            {
                id: 'extra_life',
                name: 'Extra Life',
                description: '+1 life in mini-games',
                cost: 200,
                type: 'special',
                level: 1,
                maxLevel: 3,
                icon: '❤️'
            },
            {
                id: 'time_bonus',
                name: 'Time Extension',
                description: '+10 seconds in mini-games',
                cost: 175,
                type: 'special',
                level: 1,
                maxLevel: 3,
                icon: '⏰'
            }
        ];
    }

    purchaseUpgrade(upgradeId) {
        const upgrade = this.upgrades.find(u => u.id === upgradeId);
        
        if (!upgrade) return false;
        
        // Check if player has enough currency
        if (game.state.currency < upgrade.cost) {
            ui.createFloatingText('Not enough coins!', window.innerWidth / 2, 200, '#FF0000');
            return false;
        }
        
        // Check if already purchased
        const currentLevel = game.state.upgrades[upgrade.type] || 0;
        if (currentLevel >= upgrade.level) {
            ui.createFloatingText('Already purchased!', window.innerWidth / 2, 200, '#FFA500');
            return false;
        }
        
        // Purchase upgrade
        game.state.currency -= upgrade.cost;
        game.state.upgrades[upgrade.type] = upgrade.level;
        
        // Save progress
        game.saveProgress();
        
        // Update UI
        ui.updateUpgradesDisplay();
        game.updateUI();
        
        // Show confirmation
        ui.createFloatingText(`Purchased ${upgrade.name}!`, window.innerWidth / 2, 200, '#00FF00');
        
        // Check for upgrade achievements
        achievements.checkUpgradeAchievements();
        
        return true;
    }

    canAfford(upgrade) {
        return game.state.currency >= upgrade.cost;
    }

    isPurchased(upgrade) {
        const currentLevel = game.state.upgrades[upgrade.type] || 0;
        return currentLevel >= upgrade.level;
    }

    getUpgradeEffect(type) {
        const level = game.state.upgrades[type] || 0;
        
        switch(type) {
            case 'charm':
                return level * 0.1; // 10% per level
            case 'luck':
                return level * 0.2; // 20% per level
            case 'charisma':
                return level;
            case 'combo_start':
                return level > 0 ? 2 : 1;
            case 'extra_life':
                return level;
            case 'time_bonus':
                return level * 10;
            default:
                return 0;
        }
    }

    getTotalUpgradesPurchased() {
        let total = 0;
        Object.values(game.state.upgrades).forEach(level => {
            total += level;
        });
        return total;
    }

    resetUpgrades() {
        // Refund all purchased upgrades
        let refundAmount = 0;
        
        this.upgrades.forEach(upgrade => {
            if (this.isPurchased(upgrade)) {
                refundAmount += upgrade.cost;
            }
        });
        
        // Reset upgrades
        game.state.upgrades = {
            charm: 0,
            luck: 0,
            charisma: 0
        };
        
        // Refund currency
        game.state.currency += refundAmount;
        
        // Update UI
        ui.updateUpgradesDisplay();
        game.updateUI();
        
        ui.createFloatingText(`Refunded ${refundAmount} coins!`, window.innerWidth / 2, 200, '#00FF00');
    }
}

// Initialize upgrades system
const upgrades = new Upgrades();
