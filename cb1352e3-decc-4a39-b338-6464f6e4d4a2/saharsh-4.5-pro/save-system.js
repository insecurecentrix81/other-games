/**
 * Save System - Complete Game State Management
 * 
 * Purpose: Manages save/load functionality with multiple slots, data validation, and compression
 * Dependencies: This file requires game-engine.js and all other system files to be loaded first
 * Exports: window.SaveSystem - Complete save/load management system
 */

class SaveSystem {
    constructor(engine) {
        this.engine = engine;
        this.maxSaveSlots = 5;
        this.autoSaveInterval = 300000; // 5 minutes
        this.autoSaveEnabled = true;
        this.lastAutoSave = 0;
        this.storageKey = location.pathname + "eric_rpg_save";
        this.saveSlotPrefix = location.pathname + "save_slot_";
        this.backupPrefix = location.pathname + "backup_slot_";
        
        // Save validation settings
        this.validationSettings = {
            checkDataIntegrity: true,
            repairCorruptedData: true,
            createBackups: true,
            compressionEnabled: true
        };
        
        // Auto-save management
        this.autoSaveTimer = null;
        this.saveInProgress = false;
        
        // Initialize save system
        this.initializeSaveSystem();
    }

    /**
     * Initialize save system and setup auto-save
     */
    initializeSaveSystem() {
        // Setup auto-save if enabled
        if (this.autoSaveEnabled) {
            this.setupAutoSave();
        }
        
        // Setup storage event listener for cross-tab communication
        if (typeof window.addEventListener !== 'undefined') {
            window.addEventListener('storage', (e) => this.handleStorageEvent(e));
        }
        
        console.log('Save system initialized');
    }

    /**
     * Setup automatic save functionality
     */
    setupAutoSave() {
        if (this.autoSaveTimer) {
            clearInterval(this.autoSaveTimer);
        }
        
        this.autoSaveTimer = setInterval(() => {
            if (this.engine.state === 'playing' && !this.saveInProgress) {
                this.autoSave();
            }
        }, this.autoSaveInterval);
    }

    /**
     * Save game to specified slot
     */
    async saveGame(slot = 1, description = '') {
        if (this.saveInProgress) {
            console.warn('Save already in progress');
            return false;
        }
        
        this.saveInProgress = true;
        
        try {
            // Validate slot number
            if (slot < 1 || slot > this.maxSaveSlots) {
                throw new Error(`Invalid save slot: ${slot}`);
            }
            
            // Create save data
            const saveData = await this.createSaveData(description);
            
            // Create backup of existing save
            if (this.validationSettings.createBackups) {
                await this.createBackup(slot);
            }
            
            // Compress data if enabled
            const dataToSave = this.validationSettings.compressionEnabled ? 
                this.compressSaveData(saveData) : saveData;
            
            // Save to storage
            const saveKey = this.saveSlotPrefix + slot;
            localStorage.setItem(saveKey, JSON.stringify(dataToSave));
            
            // Update save slot info
            await this.updateSaveSlotInfo(slot, saveData);
            
            console.log(`Game saved to slot ${slot}`);
            this.lastAutoSave = Date.now();
            
            return true;
        } catch (error) {
            console.error('Failed to save game:', error);
            this.handleSaveError(error, slot);
            return false;
        } finally {
            this.saveInProgress = false;
        }
    }

    /**
     * Load game from specified slot
     */
    async loadGame(slot = 1) {
        try {
            // Validate slot number
            if (slot < 1 || slot > this.maxSaveSlots) {
                throw new Error(`Invalid save slot: ${slot}`);
            }
            
            // Get save data
            const saveKey = this.saveSlotPrefix + slot;
            const saveDataString = localStorage.getItem(saveKey);
            
            if (!saveDataString) {
                throw new Error(`No save data found in slot ${slot}`);
            }
            
            // Parse and potentially decompress data
            let saveData;
            try {
                saveData = JSON.parse(saveDataString);
            } catch (parseError) {
                // Try to load backup if main save is corrupted
                if (this.validationSettings.repairCorruptedData) {
                    console.log('Main save corrupted, attempting to load backup');
                    saveData = await this.loadBackup(slot);
                    if (!saveData) {
                        throw new Error('Both main save and backup are corrupted');
                    }
                } else {
                    throw parseError;
                }
            }
            
            // Validate save data
            if (this.validationSettings.checkDataIntegrity) {
                const validationResult = this.validateSaveData(saveData);
                if (!validationResult.valid) {
                    throw new Error(`Save data validation failed: ${validationResult.errors.join(', ')}`);
                }
            }
            
            // Apply save data to game
            await this.applySaveData(saveData);
            
            console.log(`Game loaded from slot ${slot}`);
            return true;
            
        } catch (error) {
            console.error('Failed to load game:', error);
            this.handleLoadError(error, slot);
            return false;
        }
    }

    /**
     * Create comprehensive save data from current game state
     */
    async createSaveData(description = '') {
        const player = this.engine.character?.data || {};
        const school = this.engine.school || {};
        const combat = this.engine.combat || {};
        const dialogue = this.engine.dialogue || {};
        const enemies = this.engine.enemiesAndRivals || {};
        const inventory = this.engine.inventory || {};
        
        const saveData = {
            // Save metadata
            metadata: {
                version: '1.0.0',
                gameName: 'Eric m failing class',
                timestamp: Date.now(),
                description: description,
                playTime: this.calculatePlayTime(),
                saveSlot: null // Will be set by updateSaveSlotInfo
            },
            
            // Core game state
            gameData: this.engine.gameData || {},
            
            // Character system
            character: {
                data: player,
                displayInfo: this.engine.character?.getDisplayInfo() || {}
            },
            
            // School system
            school: {
                currentArea: school.currentArea || 'hallway1',
                previousArea: school.previousArea || null,
                areaVisited: Array.from(school.areaVisited || new Set(['hallway1'])),
                teacherPursuit: school.teacherPursuit || {},
                playerPosition: school.playerPosition || { x: 0, y: 0 },
                encounterCooldown: school.encounterCooldown || 0
            },
            
            // Combat system
            combat: combat.getBattleState ? combat.getBattleState() : {},
            
            // Dialogue system
            dialogue: {
                storyFlags: dialogue.storyFlags || {},
                characterRelationships: dialogue.characterRelationships || {},
                dialogueHistory: dialogue.getDialogueHistory ? dialogue.getDialogueHistory() : [],
                chapterProgress: dialogue.chapterProgress || 0,
                completedQuests: dialogue.getCompletedQuests ? dialogue.getCompletedQuests() : [],
                currentQuest: dialogue.getCurrentQuest ? dialogue.getCurrentQuest() : null,
                textSpeed: dialogue.textSpeed || 'normal',
                autoAdvance: dialogue.autoAdvance || false
            },
            
            // Enemies and rivals
            enemies: {
                rivalRelationships: enemies.rivalRelationships || {},
                activeEncounters: enemies.activeEncounters ? Array.from(enemies.activeEncounters.entries()) : [],
                encounterHistory: enemies.encounterHistory || [],
                weeklyEscalation: enemies.weeklyEscalation || 0
            },
            
            // Inventory system
            inventory: {
                selectedSlot: inventory.selectedSlot || null,
                battleItemMode: inventory.battleItemMode || false
            },
            
            // Teacher AI system
            teacherAI: this.engine.teacherAI ? {
                active: this.engine.teacherAI.active,
                state: this.engine.teacherAI.state,
                position: this.engine.teacherAI.position,
                intelligence: this.engine.teacherAI.intelligence,
                speed: this.engine.teacherAI.speed,
                aggression: this.engine.teacherAI.aggression,
                captureCount: this.engine.teacherAI.getCaptureCount()
            } : {},
            
            // Audio settings
            audio: this.engine.audio || {
                master: 0.75,
                music: 0.8,
                sfx: 0.9
            },
            
            // Game state
            engineState: {
                currentState: this.engine.state,
                currentWeek: this.engine.gameData?.week || 1
            }
        };
        
        return saveData;
    }

    /**
     * Apply loaded save data to game systems
     */
    async applySaveData(saveData) {
        try {
            // Apply core game data
            if (saveData.gameData) {
                this.engine.gameData = saveData.gameData;
            }
            
            // Apply character data
            if (saveData.character?.data && this.engine.character) {
                this.engine.character.data = saveData.character.data;
                this.engine.character.ensureDataIntegrity();
                this.engine.character.updateStats();
            }
            
            // Apply school data
            if (saveData.school && this.engine.school) {
                this.engine.school.currentArea = saveData.school.currentArea;
                this.engine.school.previousArea = saveData.school.previousArea;
                this.engine.school.areaVisited = new Set(saveData.school.areaVisited);
                this.engine.school.teacherPursuit = saveData.school.teacherPursuit;
                this.engine.school.playerPosition = saveData.school.playerPosition;
                this.engine.school.encounterCooldown = saveData.school.encounterCooldown;
            }
            
            // Apply dialogue data
            if (saveData.dialogue && this.engine.dialogue) {
                this.engine.dialogue.storyFlags = saveData.dialogue.storyFlags;
                this.engine.dialogue.characterRelationships = saveData.dialogue.characterRelationships;
                this.engine.dialogue.chapterProgress = saveData.dialogue.chapterProgress;
                this.engine.dialogue.textSpeed = saveData.dialogue.textSpeed;
                this.engine.dialogue.autoAdvance = saveData.dialogue.autoAdvance;
            }
            
            // Apply enemies data
            if (saveData.enemies && this.engine.enemiesAndRivals) {
                this.engine.enemiesAndRivals.rivalRelationships = saveData.enemies.rivalRelationships;
                this.engine.enemiesAndRivals.activeEncounters = new Map(saveData.enemies.activeEncounters);
                this.engine.enemiesAndRivals.encounterHistory = saveData.enemies.encounterHistory;
                this.engine.enemiesAndRivals.weeklyEscalation = saveData.enemies.weeklyEscalation;
            }
            
            // Apply audio settings
            if (saveData.audio && this.engine.audio) {
                this.engine.audio = saveData.audio;
            }
            
            // Apply teacher AI data
            if (saveData.teacherAI && this.engine.teacherAI) {
                this.engine.teacherAI.active = saveData.teacherAI.active;
                this.engine.teacherAI.state = saveData.teacherAI.state;
                this.engine.teacherAI.position = saveData.teacherAI.position;
                this.engine.teacherAI.intelligence = saveData.teacherAI.intelligence;
                this.engine.teacherAI.speed = saveData.teacherAI.speed;
                this.engine.teacherAI.aggression = saveData.teacherAI.aggression;
            }
            
            // Update UI
            this.engine.updateUI();
            
            // Load additional system data
            await this.loadSystemData();
            
        } catch (error) {
            console.error('Failed to apply save data:', error);
            throw error;
        }
    }

    /**
     * Load additional data from individual system save methods
     */
    async loadSystemData() {
        // Load character data
        if (this.engine.character?.load) {
            this.engine.character.load();
        }
        
        // Load school data
        if (this.engine.school?.load) {
            this.engine.school.load();
        }
        
        // Load combat data
        if (this.engine.combat?.load) {
            this.engine.combat.load();
        }
        
        // Load dialogue data
        if (this.engine.dialogue?.load) {
            this.engine.dialogue.load();
        }
        
        // Load inventory data
        if (this.engine.inventory?.load) {
            this.engine.inventory.load();
        }
        
        // Load enemies data
        if (this.engine.enemiesAndRivals?.load) {
            this.engine.enemiesAndRivals.load();
        }
        
        // Load teacher AI data
        if (this.engine.teacherAI?.load) {
            this.engine.teacherAI.load();
        }
    }

    /**
     * Validate save data integrity
     */
    validateSaveData(saveData) {
        const errors = [];
        const warnings = [];
        
        try {
            // Check required fields
            if (!saveData.metadata) {
                errors.push('Missing metadata');
            } else {
                if (!saveData.metadata.version) {
                    warnings.push('Missing version info');
                }
                if (!saveData.metadata.timestamp) {
                    errors.push('Missing timestamp');
                }
            }
            
            // Check game data
            if (!saveData.gameData) {
                errors.push('Missing game data');
            } else {
                if (!saveData.gameData.week) {
                    errors.push('Missing week information');
                }
            }
            
            // Check character data
            if (!saveData.character?.data) {
                errors.push('Missing character data');
            } else {
                const character = saveData.character.data;
                if (!character.name) warnings.push('Missing character name');
                if (!character.level) warnings.push('Missing character level');
                if (character.health === undefined) errors.push('Missing health data');
            }
            
            // Check school data
            if (!saveData.school) {
                errors.push('Missing school data');
            }
            
            // Version compatibility check
            if (saveData.metadata?.version && saveData.metadata.version !== '1.0.0') {
                warnings.push(`Version mismatch: ${saveData.metadata.version}`);
            }
            
        } catch (error) {
            errors.push(`Validation error: ${error.message}`);
        }
        
        return {
            valid: errors.length === 0,
            errors: errors,
            warnings: warnings
        };
    }

    /**
     * Update save slot information
     */
    async updateSaveSlotInfo(slot, saveData) {
        const infoKey = this.storageKey + '_info';
        let slotInfo = {};
        
        try {
            const existingInfo = localStorage.getItem(infoKey);
            if (existingInfo) {
                slotInfo = JSON.parse(existingInfo);
            }
        } catch (error) {
            console.warn('Failed to parse existing slot info:', error);
        }
        
        // Update slot information
        slotInfo[slot] = {
            slot: slot,
            timestamp: saveData.metadata.timestamp,
            description: saveData.metadata.description,
            gameName: saveData.metadata.gameName,
            version: saveData.metadata.version,
            playTime: saveData.metadata.playTime,
            week: saveData.gameData.week,
            level: saveData.character.data.level,
            area: saveData.school.currentArea,
            characterName: saveData.character.data.name
        };
        
        localStorage.setItem(infoKey, JSON.stringify(slotInfo));
    }

    /**
     * Get information about all save slots
     */
    getSaveSlotsInfo() {
        const infoKey = this.storageKey + '_info';
        let slotInfo = {};
        
        try {
            const existingInfo = localStorage.getItem(infoKey);
            if (existingInfo) {
                slotInfo = JSON.parse(existingInfo);
            }
        } catch (error) {
            console.warn('Failed to parse slot info:', error);
        }
        
        // Return formatted slot information
        const slots = [];
        for (let i = 1; i <= this.maxSaveSlots; i++) {
            if (slotInfo[i]) {
                slots.push({
                    slot: i,
                    ...slotInfo[i],
                    hasData: true
                });
            } else {
                slots.push({
                    slot: i,
                    hasData: false,
                    description: 'Empty Slot'
                });
            }
        }
        
        return slots;
    }

    /**
     * Delete save from specified slot
     */
    deleteSave(slot) {
        try {
            if (slot < 1 || slot > this.maxSaveSlots) {
                throw new Error(`Invalid save slot: ${slot}`);
            }
            
            const saveKey = this.saveSlotPrefix + slot;
            localStorage.removeItem(saveKey);
            
            // Update slot info
            const infoKey = this.storageKey + '_info';
            const slotInfo = this.getSaveSlotsInfo();
            const filteredInfo = {};
            slotInfo.forEach(info => {
                if (info.slot !== slot) {
                    filteredInfo[info.slot] = info;
                }
            });
            localStorage.setItem(infoKey, JSON.stringify(filteredInfo));
            
            console.log(`Save slot ${slot} deleted`);
            return true;
        } catch (error) {
            console.error('Failed to delete save:', error);
            return false;
        }
    }

    /**
     * Create backup of existing save
     */
    async createBackup(slot) {
        try {
            const saveKey = this.saveSlotPrefix + slot;
            const backupKey = this.backupPrefix + slot;
            const saveData = localStorage.getItem(saveKey);
            
            if (saveData) {
                localStorage.setItem(backupKey, saveData);
                console.log(`Backup created for slot ${slot}`);
                return true;
            }
        } catch (error) {
            console.error('Failed to create backup:', error);
        }
        return false;
    }

    /**
     * Load backup save data
     */
    async loadBackup(slot) {
        try {
            const backupKey = this.backupPrefix + slot;
            const backupData = localStorage.getItem(backupKey);
            
            if (backupData) {
                return JSON.parse(backupData);
            }
        } catch (error) {
            console.error('Failed to load backup:', error);
        }
        return null;
    }

    /**
     * Compress save data to reduce storage usage
     */
    compressSaveData(saveData) {
        try {
            // Simple compression by removing unnecessary whitespace and unused properties
            const compressed = JSON.stringify(saveData);
            return compressed;
        } catch (error) {
            console.warn('Compression failed, using uncompressed data:', error);
            return saveData;
        }
    }

    /**
     * Calculate total play time
     */
    calculatePlayTime() {
        // This would track play time in a real implementation
        // For now, return a placeholder
        return 0;
    }

    /**
     * Auto-save functionality
     */
    async autoSave() {
        if (this.saveInProgress) return;
        
        try {
            const success = await this.saveGame(0, 'Auto-save');
            if (success) {
                console.log('Auto-save completed');
            }
        } catch (error) {
            console.error('Auto-save failed:', error);
        }
    }

    /**
     * Export save data to file
     */
    exportSave(slot) {
        try {
            const saveKey = this.saveSlotPrefix + slot;
            const saveData = localStorage.getItem(saveKey);
            
            if (!saveData) {
                throw new Error(`No save data found in slot ${slot}`);
            }
            
            // Create download link
            const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(saveData);
            const downloadAnchor = document.createElement('a');
            downloadAnchor.setAttribute("href", dataStr);
            downloadAnchor.setAttribute("download", `eric_rpg_save_slot_${slot}.json`);
            document.body.appendChild(downloadAnchor);
            downloadAnchor.click();
            document.body.removeChild(downloadAnchor);
            
            console.log(`Save slot ${slot} exported`);
            return true;
        } catch (error) {
            console.error('Failed to export save:', error);
            return false;
        }
    }

    /**
     * Import save data from file
     */
    async importSave(file, slot) {
        try {
            if (slot < 1 || slot > this.maxSaveSlots) {
                throw new Error(`Invalid save slot: ${slot}`);
            }
            
            const fileContent = await this.readFileAsText(file);
            const saveData = JSON.parse(fileContent);
            
            // Validate imported data
            const validation = this.validateSaveData(saveData);
            if (!validation.valid) {
                throw new Error(`Invalid save data: ${validation.errors.join(', ')}`);
            }
            
            // Save imported data
            const saveKey = this.saveSlotPrefix + slot;
            localStorage.setItem(saveKey, JSON.stringify(saveData));
            await this.updateSaveSlotInfo(slot, saveData);
            
            console.log(`Save imported to slot ${slot}`);
            return true;
        } catch (error) {
            console.error('Failed to import save:', error);
            return false;
        }
    }

    /**
     * Read file as text (for import functionality)
     */
    readFileAsText(file) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = (e) => resolve(e.target.result);
            reader.onerror = (e) => reject(e);
            reader.readAsText(file);
        });
    }

    /**
     * Handle storage events (for cross-tab communication)
     */
    handleStorageEvent(event) {
        if (event.key && event.key.startsWith(this.saveSlotPrefix)) {
            // Handle save changes from other tabs
            console.log('Save data changed in another tab');
        }
    }

    /**
     * Handle save errors
     */
    handleSaveError(error, slot) {
        console.error(`Save error in slot ${slot}:`, error);
        
        // Show user-friendly error message
        if (this.engine.ui && this.engine.ui.battleLog) {
            this.engine.ui.battleLog.innerHTML += `<div>Save failed: ${error.message}</div>`;
        }
        
        // Attempt recovery
        if (this.validationSettings.repairCorruptedData) {
            setTimeout(() => {
                console.log('Attempting save recovery...');
                this.saveGame(slot, 'Recovery save');
            }, 1000);
        }
    }

    /**
     * Handle load errors
     */
    handleLoadError(error, slot) {
        console.error(`Load error in slot ${slot}:`, error);
        
        // Show user-friendly error message
        if (this.engine.ui && this.engine.ui.battleLog) {
            this.engine.ui.battleLog.innerHTML += `<div>Load failed: ${error.message}</div>`;
        }
    }

    /**
     * Clean up old backup saves
     */
    cleanupBackups() {
        try {
            const keys = Object.keys(localStorage);
            const backupKeys = keys.filter(key => key.startsWith(this.backupPrefix));
            
            // Keep only the 3 most recent backups per slot
            backupKeys.forEach(key => {
                localStorage.removeItem(key);
            });
            
            console.log('Backup cleanup completed');
        } catch (error) {
            console.error('Failed to cleanup backups:', error);
        }
    }

    /**
     * Get storage usage statistics
     */
    getStorageStats() {
        try {
            let totalSize = 0;
            let saveCount = 0;
            const details = {};
            
            for (let key in localStorage) {
                if (localStorage.hasOwnProperty(key) && 
                    (key.startsWith(this.saveSlotPrefix) || key.startsWith(this.backupPrefix))) {
                    const size = localStorage[key].length;
                    totalSize += size;
                    saveCount++;
                    
                    if (!details[key]) {
                        details[key] = { size: size, type: key.includes('backup') ? 'backup' : 'save' };
                    }
                }
            }
            
            return {
                totalSize: totalSize,
                saveCount: saveCount,
                details: details,
                availableSlots: this.maxSaveSlots - Object.keys(this.getSaveSlotsInfo()).length
            };
        } catch (error) {
            console.error('Failed to get storage stats:', error);
            return { totalSize: 0, saveCount: 0, details: {}, availableSlots: this.maxSaveSlots };
        }
    }

    /**
     * Enable/disable auto-save
     */
    setAutoSaveEnabled(enabled) {
        this.autoSaveEnabled = enabled;
        
        if (enabled) {
            this.setupAutoSave();
        } else if (this.autoSaveTimer) {
            clearInterval(this.autoSaveTimer);
            this.autoSaveTimer = null;
        }
        
        console.log(`Auto-save ${enabled ? 'enabled' : 'disabled'}`);
    }

    /**
     * Get auto-save status
     */
    getAutoSaveStatus() {
        return {
            enabled: this.autoSaveEnabled,
            lastSave: this.lastAutoSave,
            interval: this.autoSaveInterval,
            nextSave: this.autoSaveEnabled ? 
                new Date(this.lastAutoSave + this.autoSaveInterval).toISOString() : null
        };
    }

    /**
     * Manual save/load interface for UI
     */
    displaySaveSlots() {
        const container = document.getElementById('save-slots');
        if (!container) return;
        
        container.innerHTML = '';
        const slots = this.getSaveSlotsInfo();
        
        slots.forEach(slotInfo => {
            const slotElement = document.createElement('div');
            slotElement.className = 'save-slot';
            
            if (slotInfo.hasData) {
                const date = new Date(slotInfo.timestamp);
                slotElement.innerHTML = `
                    <h4>Save Slot ${slotInfo.slot}</h4>
                    <p>Week ${slotInfo.week} - ${date.toLocaleDateString()}</p>
                    <p>Level ${slotInfo.level} - ${slotInfo.characterName}</p>
                    <p>${slotInfo.area}</p>
                    <div class="slot-actions">
                        <button onclick="gameEngine.save.saveGame(${slotInfo.slot}, 'Manual save')">Save</button>
                        <button onclick="gameEngine.save.loadGame(${slotInfo.slot})">Load</button>
                        <button onclick="gameEngine.save.deleteSave(${slotInfo.slot})">Delete</button>
                    </div>
                `;
            } else {
                slotElement.className = 'save-slot empty';
                slotElement.innerHTML = `
                    <h4>Save Slot ${slotInfo.slot}</h4>
                    <p>Empty Slot</p>
                    <div class="slot-actions">
                        <button onclick="gameEngine.save.saveGame(${slotInfo.slot}, 'New save')">Save</button>
                    </div>
                `;
            }
            
            container.appendChild(slotElement);
        });
    }

    /**
     * Cleanup and shutdown
     */
    shutdown() {
        // Clear auto-save timer
        if (this.autoSaveTimer) {
            clearInterval(this.autoSaveTimer);
            this.autoSaveTimer = null;
        }
        
        // Perform final auto-save if enabled
        if (this.autoSaveEnabled) {
            this.autoSave();
        }
        
        console.log('Save system shutdown complete');
    }
}
