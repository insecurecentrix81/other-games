// ============================================
// ADDICTION LOOP OPTIMIZATION
// Perfects the Play → Reward → Progress → Goal → Play cycle
// ============================================

export class EngagementLoop {
    constructor(gameState) {
        this.gameState = gameState;
        this.rewardTracker = new RewardFrequencyTracker();
        this.flowManager = new FlowStateManager();
        this.nearMissManager = new NearMissManager();
        this.variableRewardManager = new VariableRewardManager();
        
        // Session tracking
        this.sessionStartTime = Date.now();
        this.lastRewardTime = Date.now();
        this.actionCounter = 0;
        this.comboStreak = 0;
        this.perfectActionStreak = 0;
        
        // Player skill estimation
        this.playerSkillLevel = 1.0;
        this.difficultyAdjustment = 1.0;
        
        // Engagement metrics
        this.timeBetweenActions = [];
        this.engagementScore = 0;
        
        this.setupEventListeners();
    }
    
    setupEventListeners() {
        // Track player actions
        document.addEventListener('playerAction', (e) => this.onPlayerAction(e.detail));
        document.addEventListener('playerDamage', (e) => this.onPlayerDamage(e.detail));
        document.addEventListener('enemyKilled', (e) => this.onEnemyKilled(e.detail));
        document.addEventListener('objectiveComplete', (e) => this.onObjectiveComplete(e.detail));
        document.addEventListener('missionComplete', (e) => this.onMissionComplete(e.detail));
        document.addEventListener('playerDeath', (e) => this.onPlayerDeath(e.detail));
    }
    
    // CONSTANT REWARDS (Every few seconds)
    onPlayerAction(action) {
        const now = Date.now();
        const timeSinceLastAction = now - this.lastRewardTime;
        this.lastRewardTime = now;
        this.actionCounter++;
        
        // Track engagement pacing
        this.timeBetweenActions.push(timeSinceLastAction);
        if (this.timeBetweenActions.length > 10) {
            this.timeBetweenActions.shift();
        }
        
        // Award micro-XP for any action
        const microXP = this.calculateMicroXP(action);
        if (microXP > 0) {
            this.gameState.progression.addXP(microXP, 'micro_action');
            this.showMicroReward(action.type, microXP);
        }
        
        // Update flow state
        this.flowManager.recordAction(action);
        
        // Check for combo maintenance
        this.updateComboStreak(action);
        
        // Update player skill estimation
        this.updatePlayerSkill();
        
        // Trigger variable rewards
        if (Math.random() < 0.01) { // 1% chance
            this.triggerVariableReward();
        }
        
        // Award engagement points
        this.engagementScore += 1;
        
        // Check for milestone notifications
        this.checkActionMilestones();
    }
    
    calculateMicroXP(action) {
        const baseXP = {
            'shot_fired': 0.5,
            'shot_hit': 2,
            'headshot': 5,
            'enemy_killed': 10,
            'movement': 0.1,
            'ability_used': 3,
            'horse_used': 1,
            'cover_used': 0.5,
            'reload': 0.3,
            'weapon_switch': 0.2
        };
        
        const xp = baseXP[action.type] || 0;
        
        // Apply streak multiplier
        const streakBonus = 1 + (this.comboStreak * 0.01);
        
        // Apply difficulty multiplier
        const difficultyBonus = 1 + (this.difficultyAdjustment * 0.1);
        
        // Apply time-based bonus (faster actions = more reward)
        const timeBonus = Math.max(0.5, 2 - (this.getAverageActionTime() / 1000));
        
        return Math.floor(xp * streakBonus * difficultyBonus * timeBonus);
    }
    
    showMicroReward(actionType, amount) {
        // Create floating text or particle effect
        const rewardEvent = new CustomEvent('showMicroReward', {
            detail: {
                type: actionType,
                amount: amount,
                position: this.gameState.player.position
            }
        });
        document.dispatchEvent(rewardEvent);
    }
    
    updateComboStreak(action) {
        const isComboAction = ['shot_hit', 'headshot', 'enemy_killed'].includes(action.type);
        
        if (isComboAction) {
            this.comboStreak++;
            this.perfectActionStreak++;
            
            // Check combo milestones
            if (this.comboStreak % 5 === 0) {
                this.onComboMilestone(this.comboStreak);
            }
            
            // Check perfect action streak
            if (this.perfectActionStreak >= 10) {
                this.onPerfectStreak();
            }
        } else {
            this.comboStreak = Math.max(0, this.comboStreak - 1);
            this.perfectActionStreak = 0;
        }
        
        // Update combo display
        this.updateComboDisplay();
    }
    
    onComboMilestone(streak) {
        const bonusXP = streak * 5;
        this.gameState.progression.addXP(bonusXP, 'combo_milestone');
        
        // Show combo celebration
        document.dispatchEvent(new CustomEvent('showComboCelebration', {
            detail: { streak, bonusXP }
        }));
    }
    
    onPerfectStreak() {
        // Grant rare reward
        const reward = this.variableRewardManager.grantPerfectStreakReward();
        document.dispatchEvent(new CustomEvent('showPerfectStreakReward', {
            detail: { reward }
        }));
        
        // Reset streak
        this.perfectActionStreak = 0;
    }
    
    // FREQUENT REWARDS (Every 30-60 seconds)
    onEnemyKilled(details) {
        // Standard XP already handled, add engagement bonus
        this.rewardTracker.recordReward('enemy_killed', details.value);
        
        // Check for kill streaks
        const killStreak = this.rewardTracker.getStreak('enemy_killed');
        if (killStreak >= 5) {
            this.onKillStreak(killStreak);
        }
        
        // Dynamic difficulty adjustment
        this.flowManager.recordEnemyKilled();
        
        // Trigger mini-celebration for special kills
        if (details.isHeadshot || details.isCritical) {
            this.showKillCelebration(details);
        }
    }
    
    onKillStreak(streak) {
        const streakBonus = {
            xp: streak * 25,
            money: streak * 10,
            message: `${streak} Kill Streak!`
        };
        
        this.gameState.progression.addXP(streakBonus.xp, 'kill_streak');
        this.gameState.economy.money += streakBonus.money;
        
        document.dispatchEvent(new CustomEvent('showStreakBonus', {
            detail: streakBonus
        }));
    }
    
    // OCCASIONAL REWARDS (Every
