/**
 * Eric m failing class - Core Game Engine
 * 
 * Purpose: Main game engine handling state management, input, rendering, and scene transitions
 * Dependencies: This file requires index.html to be loaded first
 * Exports: window.GameEngine - Main game engine instance
 */

class GameEngine {
    constructor() {
        this.canvas = null;
        this.ctx = null;
        this.scene = null;
        this.state = 'menu'; // menu, playing, battle, dialogue, inventory, map, settings
        this.gameData = {};
        this.input = {};
        this.ui = {};
        this.audio = null;
        this.renderer = null;
        this.camera = null;
        this.loadingProgress = 0;
        
        // Game systems
        this.character = null;
        this.inventory = null;
        this.combat = null;
        this.school = null;
        this.dialogue = null;
        this.save = null;
        
        // Time management
        this.lastTime = 0;
        this.deltaTime = 0;
        this.fps = 60;
        
        // Initialize when DOM is ready
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', () => this.init());
        } else {
            this.init();
        }
    }

    async init() {
        try {
            // Get canvas and context
            this.canvas = document.getElementById('game-canvas');
            this.ctx = this.canvas.getContext('2d');
            
            // Setup canvas
            this.setupCanvas();
            
            // Initialize UI references
            this.initUI();
            
            // Setup event listeners
            this.setupEventListeners();
            
            // Initialize game systems
            await this.initGameSystems();
            
            // Start game loop
            this.gameLoop(0);
            
            console.log('Game Engine initialized successfully');
        } catch (error) {
            console.error('Failed to initialize game engine:', error);
            this.showError('Failed to initialize game. Please refresh the page.');
        }
    }

    setupCanvas() {
        // Set canvas size
        this.resizeCanvas();
        
        // Setup 2D context
        this.ctx.imageSmoothingEnabled = false;
        this.ctx.textBaseline = 'top';
        
        // Handle window resize
        window.addEventListener('resize', () => this.resizeCanvas());
    }

    resizeCanvas() {
        if (!this.canvas) return;
        
        const container = document.getElementById('game-canvas-container');
        const rect = container.getBoundingClientRect();
        
        this.canvas.width = rect.width;
        this.canvas.height = rect.height;
    }

    initUI() {
        // Store UI element references
        this.ui = {
            // Main menu
            mainMenu: document.getElementById('main-menu'),
            newGameBtn: document.getElementById('new-game-btn'),
            continueBtn: document.getElementById('continue-btn'),
            helpBtn: document.getElementById('help-btn'),
            
            // Header
            currentWeekSpan: document.getElementById('current-week'),
            
            // HUD
            playerHUD: document.getElementById('player-hud'),
            healthFill: document.getElementById('health-fill'),
            healthText: document.getElementById('health-text'),
            stressFill: document.getElementById('stress-fill'),
            stressText: document.getElementById('stress-text'),
            knowledgeText: document.getElementById('knowledge-text'),
            levelText: document.getElementById('level-text'),
            expText: document.getElementById('exp-text'),
            
            // Panels
            inventoryPanel: document.getElementById('inventory-panel'),
            inventoryToggle: document.getElementById('inventory-toggle'),
            inventoryGrid: document.getElementById('inventory-grid'),
            settingsPanel: document.getElementById('settings-panel'),
            settingsBtn: document.getElementById('settings-btn'),
            settingsClose: document.getElementById('settings-close'),
            helpPanel: document.getElementById('help-panel'),
            helpClose: document.getElementById('help-close'),
            saveLoadPanel: document.getElementById('save-load-panel'),
            saveLoadTitle: document.getElementById('save-load-title'),
            saveLoadClose: document.getElementById('save-load-close'),
            
            // Save/Load buttons
            saveBtn: document.getElementById('save-btn'),
            loadBtn: document.getElementById('load-btn'),
            
            // School map
            schoolMap: document.getElementById('school-map'),
            mapClose: document.getElementById('map-close'),
            
            // Dialogue
            dialogueContainer: document.getElementById('dialogue-container'),
            dialogueName: document.getElementById('dialogue-name'),
            dialogueText: document.getElementById('dialogue-text'),
            dialogueChoices: document.getElementById('dialogue-choices'),
            dialoguePortrait: document.getElementById('dialogue-portrait'),
            
            // Battle interface
            battleInterface: document.getElementById('battle-interface'),
            enemyName: document.getElementById('enemy-name'),
            enemyHealthFill: document.getElementById('enemy-health-fill'),
            enemyHealthText: document.getElementById('enemy-health-text'),
            playerHealthFill: document.getElementById('player-health-fill'),
            playerHealthText: document.getElementById('player-health-text'),
            battleLog: document.getElementById('battle-log'),
            attackBtn: document.getElementById('attack-btn'),
            defendBtn: document.getElementById('defend-btn'),
            itemBtn: document.getElementById('item-btn'),
            specialBtn: document.getElementById('special-btn'),
            
            // Loading screen
            loadingScreen: document.getElementById('loading-screen'),
            loadingProgress: document.getElementById('loading-progress'),
            loadingText: document.getElementById('loading-text'),
            
            // Settings controls
            masterVolume: document.getElementById('master-volume'),
            musicVolume: document.getElementById('music-volume'),
            sfxVolume: document.getElementById('sfx-volume'),
            textSpeed: document.getElementById('text-speed')
        };
    }

    setupEventListeners() {
        // Keyboard input
        document.addEventListener('keydown', (e) => this.handleKeyDown(e));
        document.addEventListener('keyup', (e) => this.handleKeyUp(e));
        
        // Mouse input for UI
        document.addEventListener('click', (e) => this.handleMouseClick(e));
        
        // Menu buttons
        this.ui.newGameBtn?.addEventListener('click', () => this.newGame());
        this.ui.continueBtn?.addEventListener('click', () => this.loadGame());
        this.ui.helpBtn?.addEventListener('click', () => this.showHelp());
        
        // Panel toggles
        this.ui.inventoryToggle?.addEventListener('click', () => this.toggleInventory());
        this.ui.settingsBtn?.addEventListener('click', () => this.showSettings());
        this.ui.settingsClose?.addEventListener('click', () => this.hideSettings());
        this.ui.helpClose?.addEventListener('click', () => this.hideHelp());
        this.ui.saveLoadClose?.addEventListener('click', () => this.hideSaveLoad());
        this.ui.mapClose?.addEventListener('click', () => this.hideMap());
        
        // Save/Load buttons
        this.ui.saveBtn?.addEventListener('click', () => this.showSave());
        this.ui.loadBtn?.addEventListener('click', () => this.showLoad());
        
        // Settings controls
        this.ui.masterVolume?.addEventListener('input', (e) => this.updateVolume('master', e.target.value));
        this.ui.musicVolume?.addEventListener('input', (e) => this.updateVolume('music', e.target.value));
        this.ui.sfxVolume?.addEventListener('input', (e) => this.updateVolume('sfx', e.target.value));
        this.ui.textSpeed?.addEventListener('change', (e) => this.updateTextSpeed(e.target.value));
        
        // Battle actions
        this.ui.attackBtn?.addEventListener('click', () => this.handleBattleAction('attack'));
        this.ui.defendBtn?.addEventListener('click', () => this.handleBattleAction('defend'));
        this.ui.itemBtn?.addEventListener('click', () => this.handleBattleAction('item'));
        this.ui.specialBtn?.addEventListener('click', () => this.handleBattleAction('special'));
        
        // Prevent context menu on canvas
        this.canvas?.addEventListener('contextmenu', (e) => e.preventDefault());
    }

    async initGameSystems() {
        try {
            this.updateLoadingProgress(10, 'Initializing audio system...');
            
            // Initialize audio system
            if (typeof Howl !== 'undefined') {
                this.audio = {
                    master: 0.75,
                    music: 0.8,
                    sfx: 0.9,
                    sounds: {}
                };
            }
            
            this.updateLoadingProgress(25, 'Loading game data...');
            
            // Initialize game data structure
            this.gameData = {
                week: 1,
                maxWeeks: 10,
                player: {
                    name: 'Eric M.',
                    level: 1,
                    exp: 0,
                    expToNext: 100,
                    health: 100,
                    maxHealth: 100,
                    stress: 0,
                    maxStress: 100,
                    knowledge: 50,
                    stats: {
                        attack: 15,
                        defense: 10,
                        speed: 12,
                        intelligence: 18
                    },
                    abilities: ['Speed Dash'],
                    inventory: [
                        { id: 'notebook', name: 'Notebook', type: 'tool', quantity: 1 },
                        { id: 'pencil', name: 'Pencil', type: 'weapon', quantity: 3 },
                        { id: 'energy_drink', name: 'Energy Drink', type: 'consumable', quantity: 2 }
                    ]
                },
                school: {
                    currentArea: 'hallway1',
                    unlockedAreas: ['hallway1', 'classroom1', 'library'],
                    visitedAreas: ['hallway1'],
                    teacherPursuit: {
                        active: false,
                        strength: 1,
                        lastSeen: null
                    }
                },
                story: {
                    flags: {},
                    completedQuests: [],
                    currentQuest: null
                }
            };
            
            this.updateLoadingProgress(50, 'Setting up character system...');
            
            // Initialize character system
            this.character = new CharacterSystem(this);
            
            this.updateLoadingProgress(65, 'Initializing inventory system...');
            
            // Initialize inventory system
            this.inventory = new InventorySystem(this);
            
            this.updateLoadingProgress(80, 'Loading school areas...');
            
            // Initialize school system
            this.school = new SchoolSystem(this);
            
            this.updateLoadingProgress(90, 'Finalizing setup...');
            
            // Initialize dialogue system
            this.dialogue = new DialogueSystem(this);
            
            // Initialize combat system
            this.combat = new CombatSystem(this);
            
            // Initialize save system
            this.save = new SaveSystem(this);
            
            this.updateLoadingProgress(100, 'Ready!');
            
            // Hide loading screen after a brief delay
            setTimeout(() => {
                this.hideLoadingScreen();
                this.showMainMenu();
            }, 500);
            
        } catch (error) {
            console.error('Failed to initialize game systems:', error);
            throw error;
        }
    }

    updateLoadingProgress(progress, text) {
        this.loadingProgress = progress;
        if (this.ui.loadingProgress) {
            this.ui.loadingProgress.style.width = `${progress}%`;
        }
        if (this.ui.loadingText && text) {
            this.ui.loadingText.textContent = text;
        }
    }

    hideLoadingScreen() {
        if (this.ui.loadingScreen) {
            this.ui.loadingScreen.style.display = 'none';
        }
    }

    showMainMenu() {
        this.state = 'menu';
        if (this.ui.mainMenu) {
            this.ui.mainMenu.classList.add('menu-visible');
        }
        this.updateUI();
    }

    hideMainMenu() {
        if (this.ui.mainMenu) {
            this.ui.mainMenu.classList.remove('menu-visible');
        }
    }

    newGame() {
        this.hideMainMenu();
        this.startGame();
    }

    async startGame() {
        this.state = 'playing';
        this.gameData.week = 1;
        this.gameData.player = {
            name: 'Eric M.',
            level: 1,
            exp: 0,
            expToNext: 100,
            health: 100,
            maxHealth: 100,
            stress: 0,
            maxStress: 100,
            knowledge: 50,
            stats: {
                attack: 15,
                defense: 10,
                speed: 12,
                intelligence: 18
            },
            abilities: ['Speed Dash'],
            inventory: [
                { id: 'notebook', name: 'Notebook', type: 'tool', quantity: 1 },
                { id: 'pencil', name: 'Pencil', type: 'weapon', quantity: 3 },
                { id: 'energy_drink', name: 'Energy Drink', type: 'consumable', quantity: 2 }
            ]
        };
        
        this.character.updateStats();
        this.updateUI();
    }

    // Input handling
    handleKeyDown(e) {
        this.input[e.code] = true;
        
        // Global shortcuts
        if (e.code === 'Escape') {
            if (this.state === 'playing') {
                this.showMap();
            } else if (this.state === 'map') {
                this.hideMap();
            } else if (this.state === 'inventory') {
                this.toggleInventory();
            } else if (this.state === 'settings') {
                this.hideSettings();
            }
        }
        
        if (e.code === 'Tab') {
            e.preventDefault();
            this.toggleInventory();
        }
        
        if (e.code === 'KeyM') {
            e.preventDefault();
            if (this.state === 'playing') {
                this.showMap();
            }
        }
        
        // Game-specific input
        if (this.state === 'playing') {
            this.handleGameInput(e);
        } else if (this.state === 'battle') {
            this.handleBattleInput(e);
        }
    }

    handleKeyUp(e) {
        this.input[e.code] = false;
    }

    handleMouseClick(e) {
        // Handle UI clicks that don't have specific handlers
        if (e.target.classList.contains('map-area')) {
            this.handleMapClick(e.target.dataset.area);
        }
    }

    handleGameInput(e) {
        // Movement handling will be implemented in school system
        if (this.school) {
            this.school.handleInput(e);
        }
    }

    handleBattleInput(e) {
        // Battle input handling
        if (e.code === 'Digit1' || e.code === 'Numpad1') {
            this.handleBattleAction('attack');
        } else if (e.code === 'Digit2' || e.code === 'Numpad2') {
            this.handleBattleAction('defend');
        } else if (e.code === 'Digit3' || e.code === 'Numpad3') {
            this.handleBattleAction('item');
        } else if (e.code === 'Digit4' || e.code === 'Numpad4') {
            this.handleBattleAction('special');
        }
    }

    // UI Management
    toggleInventory() {
        if (this.state !== 'playing') return;
        
        const panel = this.ui.inventoryPanel;
        if (panel.classList.contains('visible')) {
            panel.classList.remove('visible');
            this.state = 'playing';
        } else {
            panel.classList.add('visible');
            this.state = 'inventory';
            this.inventory.updateDisplay();
        }
    }

    showSettings() {
        this.state = 'settings';
        this.ui.settingsPanel.classList.remove('panel-hidden');
    }

    hideSettings() {
        this.state = 'playing';
        this.ui.settingsPanel.classList.add('panel-hidden');
    }

    showHelp() {
        this.ui.helpPanel.classList.remove('panel-hidden');
    }

    hideHelp() {
        this.ui.helpPanel.classList.add('panel-hidden');
    }

    showSave() {
        this.state = 'save';
        this.ui.saveLoadTitle.textContent = 'Save Game';
        this.ui.saveLoadPanel.classList.remove('panel-hidden');
        this.save.displaySaveSlots();
    }

    showLoad() {
        this.state = 'load';
        this.ui.saveLoadTitle.textContent = 'Load Game';
        this.ui.saveLoadPanel.classList.remove('panel-hidden');
        this.save.displaySaveSlots();
    }

    hideSaveLoad() {
        this.state = 'playing';
        this.ui.saveLoadPanel.classList.add('panel-hidden');
    }

    showMap() {
        if (this.state !== 'playing') return;
        
        this.state = 'map';
        this.ui.schoolMap.classList.add('map-visible');
        this.school.updateMapDisplay();
    }

    hideMap() {
        this.state = 'playing';
        this.ui.schoolMap.classList.remove('map-visible');
    }

    handleMapClick(areaId) {
        this.school.travelToArea(areaId);
        this.hideMap();
    }

    // Battle system integration
    startBattle(enemy) {
        this.state = 'battle';
        this.ui.battleInterface.classList.add('battle-visible');
        this.combat.startBattle(enemy);
    }

    endBattle(victory = true) {
        this.state = 'playing';
        this.ui.battleInterface.classList.remove('battle-visible');
        
        if (victory) {
            this.character.gainExperience(25);
        }
    }

    handleBattleAction(action) {
        if (this.state !== 'battle') return;
        this.combat.handlePlayerAction(action);
    }

    // Dialogue system integration
    startDialogue(character, text, choices = []) {
        this.state = 'dialogue';
        this.ui.dialogueContainer.classList.add('dialogue-visible');
        this.dialogue.start(character, text, choices);
    }

    endDialogue() {
        this.state = 'playing';
        this.ui.dialogueContainer.classList.remove('dialogue-visible');
    }

    // UI Updates
    updateUI() {
        if (!this.character) return;
        
        const player = this.character.data;
        
        // Update week indicator
        if (this.ui.currentWeekSpan) {
            this.ui.currentWeekSpan.textContent = this.gameData.week;
        }
        
        // Update health
        const healthPercent = (player.health / player.maxHealth) * 100;
        if (this.ui.healthFill) {
            this.ui.healthFill.style.width = `${healthPercent}%`;
        }
        if (this.ui.healthText) {
            this.ui.healthText.textContent = `${player.health}/${player.maxHealth}`;
        }
        
        // Update stress
        const stressPercent = (player.stress / player.maxStress) * 100;
        if (this.ui.stressFill) {
            this.ui.stressFill.style.width = `${stressPercent}%`;
        }
        if (this.ui.stressText) {
            this.ui.stressText.textContent = `${player.stress}/${player.maxStress}`;
        }
        
        // Update other stats
        if (this.ui.knowledgeText) {
            this.ui.knowledgeText.textContent = player.knowledge;
        }
        if (this.ui.levelText) {
            this.ui.levelText.textContent = player.level;
        }
        if (this.ui.expText) {
            this.ui.expText.textContent = `${player.exp}/${player.expToNext}`;
        }
        
        // Update inventory display
        if (this.state === 'inventory') {
            this.inventory.updateDisplay();
        }
    }

    updateVolume(type, value) {
        if (this.audio) {
            this.audio[type] = value / 100;
            
            // Apply volume to all sounds
            Object.values(this.audio.sounds).forEach(sound => {
                if (sound) {
                    sound.volume(this.audio[type]);
                }
            });
        }
    }

    updateTextSpeed(speed) {
        this.gameData.settings = this.gameData.settings || {};
        this.gameData.settings.textSpeed = speed;
    }

    // Error handling
    showError(message) {
        console.error(message);
        // Could implement a proper error dialog here
        alert(message);
    }

    // Game Loop
    gameLoop(currentTime) {
        this.deltaTime = currentTime - this.lastTime;
        this.lastTime = currentTime;
        
        // Update
        this.update(this.deltaTime);
        
        // Render
        this.render();
        
        // Continue loop
        requestAnimationFrame((time) => this.gameLoop(time));
    }

    update(deltaTime) {
        // Update based on current state
        switch (this.state) {
            case 'playing':
                this.updatePlaying(deltaTime);
                break;
            case 'battle':
                this.updateBattle(deltaTime);
                break;
            case 'dialogue':
                this.updateDialogue(deltaTime);
                break;
        }
        
        // Update UI periodically
        this.uiUpdateTimer = (this.uiUpdateTimer || 0) + deltaTime;
        if (this.uiUpdateTimer > 100) { // Update UI every 100ms
            this.updateUI();
            this.uiUpdateTimer = 0;
        }
    }

    updatePlaying(deltaTime) {
        // Update school system
        if (this.school) {
            this.school.update(deltaTime);
        }
        
        // Update character
        if (this.character) {
            this.character.update(deltaTime);
        }
    }

    updateBattle(deltaTime) {
        // Update combat system
        if (this.combat) {
            this.combat.update(deltaTime);
        }
    }

    updateDialogue(deltaTime) {
        // Update dialogue system
        if (this.dialogue) {
            this.dialogue.update(deltaTime);
        }
    }

    render() {
        // Clear canvas
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        
        // Render based on current state
        switch (this.state) {
            case 'menu':
                this.renderMenu();
                break;
            case 'playing':
                this.renderPlaying();
                break;
            case 'battle':
                this.renderBattle();
                break;
            case 'dialogue':
                this.renderDialogue();
                break;
            default:
                this.renderPlaying();
        }
    }

    renderMenu() {
        // Menu is rendered by CSS, just show a simple background
        this.ctx.fillStyle = '#2c3e50';
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
    }

    renderPlaying() {
        // Render school area
        if (this.school) {
            this.school.render(this.ctx);
        }
        
        // Render player
        if (this.character) {
            this.character.render(this.ctx);
        }
    }

    renderBattle() {
        // Battle interface is rendered by CSS/HTML
        // Just render battle background effects if needed
        this.ctx.fillStyle = '#1a252f';
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
    }

    renderDialogue() {
        // Dialogue is rendered by CSS/HTML
        // Could add background effects here
        this.ctx.fillStyle = 'rgba(26, 37, 47, 0.8)';
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
    }
}

// Game System Classes (Basic implementations for now)

class CharacterSystem {
    constructor(engine) {
        this.engine = engine;
        this.data = engine.gameData.player;
    }

    update(deltaTime) {
        // Handle character updates
    }

    updateStats() {
        // Recalculate character stats based on level and equipment
    }

    gainExperience(amount) {
        this.data.exp += amount;
        
        while (this.data.exp >= this.data.expToNext) {
            this.levelUp();
        }
        
        this.engine.updateUI();
    }

    levelUp() {
        this.data.exp -= this.data.expToNext;
        this.data.level++;
        this.data.expToNext = Math.floor(this.data.expToNext * 1.5);
        
        // Increase stats
        this.data.maxHealth += 10;
        this.data.health = this.data.maxHealth;
        this.data.knowledge += 5;
        
        // Unlock new abilities occasionally
        if (this.data.level % 3 === 0) {
            this.unlockRandomAbility();
        }
    }

    unlockRandomAbility() {
        const availableAbilities = ['Study Shield', 'Homework Strike', 'Excuse Escape', 'Knowledge Boost'];
        const unlocked = this.data.abilities;
        const newAbilities = availableAbilities.filter(ability => !unlocked.includes(ability));
        
        if (newAbilities.length > 0) {
            const randomAbility = newAbilities[Math.floor(Math.random() * newAbilities.length)];
            this.data.abilities.push(randomAbility);
        }
    }

    render(ctx) {
        // Render character sprite
        const x = this.canvas.width / 2;
        const y = this.canvas.height / 2;
        
        ctx.fillStyle = '#3498db';
        ctx.fillRect(x - 15, y - 15, 30, 30);
    }
}

class InventorySystem {
    constructor(engine) {
        this.engine = engine;
        this.selectedItem = null;
    }

    updateDisplay() {
        const grid = this.engine.ui.inventoryGrid;
        if (!grid) return;
        
        grid.innerHTML = '';
        
        const inventory = this.engine.gameData.player.inventory;
        inventory.forEach((item, index) => {
            const itemElement = document.createElement('div');
            itemElement.className = 'inventory-item';
            if (this.selectedItem === index) {
                itemElement.classList.add('selected');
            }
            
            itemElement.innerHTML = `
                <div class="item-icon">${this.getItemIcon(item.id)}</div>
                <div class="item-name">${item.name}</div>
                <div class="item-quantity">${item.quantity}</div>
            `;
            
            itemElement.addEventListener('click', () => this.selectItem(index));
            grid.appendChild(itemElement);
        });
    }

    getItemIcon(itemId) {
        const icons = {
            'notebook': '📓',
            'pencil': '✏️',
            'energy_drink': '⚡',
            'hall_pass': '🎫',
            'study_guide': '📚'
        };
        return icons[itemId] || '❓';
    }

    selectItem(index) {
        this.selectedItem = index;
        this.updateDisplay();
    }

    useItem(index) {
        const item = this.engine.gameData.player.inventory[index];
        if (!item || item.quantity <= 0) return;
        
        // Use item logic here
        item.quantity--;
        if (item.quantity <= 0) {
            this.engine.gameData.player.inventory.splice(index, 1);
        }
        
        this.updateDisplay();
        this.engine.updateUI();
    }
}

class SchoolSystem {
    constructor(engine) {
        this.engine = engine;
        this.currentArea = 'hallway1';
        this.areas = this.initializeAreas();
    }

    initializeAreas() {
        return {
            'hallway1': { name: 'Main Hallway', type: 'neutral', enemies: ['stress_monster'] },
            'classroom1': { name: 'Math Class', type: 'battle', enemies: ['homework_creature'] },
            'library': { name: 'Library', type: 'safe', enemies: [] },
            'cafeteria': { name: 'Cafeteria', type: 'danger', enemies: ['lunch_monster', 'anxiety_beast'] },
            'gym': { name: 'Gymnasium', type: 'boss', enemies: ['sports_stress'] }
        };
    }

    update(deltaTime) {
        // Handle area updates, enemy encounters, etc.
    }

    handleInput(e) {
        // Handle movement input
        if (e.code === 'KeyW' || e.code === 'ArrowUp') {
            this.movePlayer(0, -1);
        } else if (e.code === 'KeyS' || e.code === 'ArrowDown') {
            this.movePlayer(0, 1);
        } else if (e.code === 'KeyA' || e.code === 'ArrowLeft') {
            this.movePlayer(-1, 0);
        } else if (e.code === 'KeyD' || e.code === 'ArrowRight') {
            this.movePlayer(1, 0);
        }
    }

    movePlayer(dx, dy) {
        // Basic movement logic
        console.log(`Moving player: ${dx}, ${dy}`);
    }

    render(ctx) {
        // Render current area
        ctx.fillStyle = '#34495e';
        ctx.fillRect(0, 0, this.engine.canvas.width, this.engine.canvas.height);
        
        // Render area name
        ctx.fillStyle = '#ecf0f1';
        ctx.font = '20px Arial';
        ctx.textAlign = 'center';
        ctx.fillText(this.areas[this.currentArea].name, this.engine.canvas.width / 2, 50);
    }

    updateMapDisplay() {
        // Update map UI with current area status
        const areas = document.querySelectorAll('.map-area');
        areas.forEach(area => {
            const areaId = area.dataset.area;
            const areaData = this.areas[areaId];
            
            if (areaData) {
                area.classList.remove('locked');
                
                const statusElement = area.querySelector('.area-status');
                if (areaData.type === 'safe') {
                    statusElement.className = 'area-status safe';
                } else if (areaData.type === 'danger') {
                    statusElement.className = 'area-status danger';
                } else {
                    statusElement.className = 'area-status';
                }
            }
        });
    }

    travelToArea(areaId) {
        if (this.areas[areaId]) {
            this.currentArea = areaId;
            this.engine.gameData.school.currentArea = areaId;
            this.engine.gameData.school.visitedAreas.push(areaId);
            
            // Check for random encounters
            this.checkForEncounters();
        }
    }

    checkForEncounters() {
        const areaData = this.areas[this.currentArea];
        if (areaData.enemies.length > 0 && Math.random() < 0.3) {
            const enemyType = areaData.enemies[Math.floor(Math.random() * areaData.enemies.length)];
            this.startRandomEncounter(enemyType);
        }
    }

    startRandomEncounter(enemyType) {
        // Create enemy and start battle
        const enemy = this.createEnemy(enemyType);
        this.engine.startBattle(enemy);
    }

    createEnemy(type) {
        const enemies = {
            'stress_monster': { name: 'Stress Monster', health: 30, attack: 12, defense: 8 },
            'homework_creature': { name: 'Homework Creature', health: 25, attack: 10, defense: 6 },
            'lunch_monster': { name: 'Lunch Monster', health: 40, attack: 15, defense: 10 },
            'anxiety_beast': { name: 'Anxiety Beast', health: 35, attack: 18, defense: 12 },
            'sports_stress': { name: 'Sports Stress', health: 60, attack: 20, defense: 15 }
        };
        
        return enemies[type] || enemies['stress_monster'];
    }
}

class CombatSystem {
    constructor(engine) {
        this.engine = engine;
        this.battleActive = false;
        this.currentEnemy = null;
        this.playerTurn = true;
    }

    startBattle(enemy) {
        this.battleActive = true;
        this.currentEnemy = enemy;
        this.playerTurn = true;
        
        // Update battle UI
        this.updateBattleUI();
        
        // Add battle log message
        this.addBattleLog(`A ${enemy.name} appears!`);
    }

    updateBattleUI() {
        if (!this.currentEnemy) return;
        
        // Update enemy info
        this.engine.ui.enemyName.textContent = this.currentEnemy.name;
        this.updateHealthBar('enemy', this.currentEnemy.health, this.currentEnemy.maxHealth || 100);
        
        // Update player info
        const player = this.engine.gameData.player;
        this.updateHealthBar('player', player.health, player.maxHealth);
    }

    updateHealthBar(type, current, max) {
        const percent = (current / max) * 100;
        
        if (type === 'enemy') {
            this.engine.ui.enemyHealthFill.style.width = `${percent}%`;
            this.engine.ui.enemyHealthText.textContent = `${current}/${max}`;
        } else {
            this.engine.ui.playerHealthFill.style.width = `${percent}%`;
            this.engine.ui.playerHealthText.textContent = `${current}/${max}`;
        }
    }

    handlePlayerAction(action) {
        if (!this.playerTurn || !this.battleActive) return;
        
        switch (action) {
            case 'attack':
                this.playerAttack();
                break;
            case 'defend':
                this.playerDefend();
                break;
            case 'item':
                this.playerUseItem();
                break;
            case 'special':
                this.playerSpecial();
                break;
        }
    }

    playerAttack() {
        const player = this.engine.gameData.player;
        const damage = Math.max(1, player.stats.attack + Math.random() * 10 - this.currentEnemy.defense);
        
        this.currentEnemy.health -= Math.floor(damage);
        this.addBattleLog(`Eric attacks for ${Math.floor(damage)} damage!`);
        
        this.playerTurn = false;
        setTimeout(() => this.enemyTurn(), 1000);
    }

    playerDefend() {
        this.addBattleLog('Eric defends! Damage will be reduced.');
        this.playerTurn = false;
        setTimeout(() => this.enemyTurn(), 1000);
    }

    playerUseItem() {
        // Open inventory for item selection
        this.engine.toggleInventory();
        this.addBattleLog('Choose an item to use.');
    }

    playerSpecial() {
        const player = this.engine.gameData.player;
        if (player.abilities.length > 0) {
            const ability = player.abilities[0];
            const damage = player.stats.intelligence + Math.random() * 15;
            
            this.currentEnemy.health -= Math.floor(damage);
            this.addBattleLog(`Eric uses ${ability} for ${Math.floor(damage)} damage!`);
        } else {
            this.addBattleLog('No special abilities available!');
        }
        
        this.playerTurn = false;
        setTimeout(() => this.enemyTurn(), 1000);
    }

    enemyTurn() {
        const damage = Math.max(1, this.currentEnemy.attack + Math.random() * 8 - this.engine.gameData.player.stats.defense);
        
        this.engine.gameData.player.health -= Math.floor(damage);
        this.addBattleLog(`${this.currentEnemy.name} attacks for ${Math.floor(damage)} damage!`);
        
        this.updateBattleUI();
        
        if (this.engine.gameData.player.health <= 0) {
            this.addBattleLog('Eric has been defeated!');
            setTimeout(() => this.engine.endBattle(false), 2000);
        } else {
            this.playerTurn = true;
        }
    }

    addBattleLog(message) {
        if (this.engine.ui.battleLog) {
            this.engine.ui.battleLog.innerHTML += `<div>${message}</div>`;
            this.engine.ui.battleLog.scrollTop = this.engine.ui.battleLog.scrollHeight;
        }
    }

    update(deltaTime) {
        if (this.battleActive && this.currentEnemy.health <= 0) {
            this.addBattleLog(`${this.currentEnemy.name} is defeated!`);
            setTimeout(() => {
                this.battleActive = false;
                this.engine.endBattle(true);
            }, 2000);
        }
    }
}

class DialogueSystem {
    constructor(engine) {
        this.engine = engine;
        this.currentDialogue = null;
    }

    start(character, text, choices = []) {
        this.currentDialogue = { character, text, choices };
        this.updateDisplay();
    }

    updateDisplay() {
        if (!this.currentDialogue) return;
        
        this.engine.ui.dialogueName.textContent = this.currentDialogue.character;
        this.engine.ui.dialogueText.textContent = this.currentDialogue.text;
        
        // Clear and populate choices
        this.engine.ui.dialogueChoices.innerHTML = '';
        this.currentDialogue.choices.forEach((choice, index) => {
            const button = document.createElement('button');
            button.className = 'dialogue-choice';
            button.textContent = choice.text;
            button.addEventListener('click', () => this.selectChoice(index));
            this.engine.ui.dialogueChoices.appendChild(button);
        });
    }

    selectChoice(index) {
        const choice = this.currentDialogue.choices[index];
        if (choice.action) {
            choice.action();
        }
        this.engine.endDialogue();
    }

    update(deltaTime) {
        // Handle dialogue-specific updates
    }
}

class SaveSystem {
    constructor(engine) {
        this.engine = engine;
        this.storageKey = location.pathname + 'eric_rpg_save';
    }

    saveGame(slot = 1) {
        try {
            const saveData = {
                gameData: this.engine.gameData,
                timestamp: Date.now(),
                version: '1.0'
            };
            
            const key = this.storageKey + '_slot_' + slot;
            localStorage.setItem(key, JSON.stringify(saveData));
            
            console.log(`Game saved to slot ${slot}`);
            return true;
        } catch (error) {
            console.error('Failed to save game:', error);
            return false;
        }
    }

    loadGame(slot = 1) {
        try {
            const key = this.storageKey + '_slot_' + slot;
            const saveData = localStorage.getItem(key);
            
            if (!saveData) {
                return false;
            }
            
            const parsed = JSON.parse(saveData);
            this.engine.gameData = parsed.gameData;
            
            // Update all systems with loaded data
            this.engine.character.data = this.engine.gameData.player;
            this.engine.updateUI();
            
            console.log(`Game loaded from slot ${slot}`);
            return true;
        } catch (error) {
            console.error('Failed to load game:', error);
            return false;
        }
    }

    displaySaveSlots() {
        const container = document.getElementById('save-slots');
        if (!container) return;
        
        container.innerHTML = '';
        
        for (let i = 1; i <= 5; i++) {
            const slot = document.createElement('div');
            slot.className = 'save-slot';
            
            const saveData = localStorage.getItem(this.storageKey + '_slot_' + i);
            
            if (saveData) {
                try {
                    const parsed = JSON.parse(saveData);
                    const date = new Date(parsed.timestamp);
                    
                    slot.innerHTML = `
                        <h4>Save Slot ${i}</h4>
                        <p>Week ${parsed.gameData.week} - ${date.toLocaleDateString()}</p>
                        <p>Level ${parsed.gameData.player.level} - ${parsed.gameData.player.name}</p>
                    `;
                    
                    slot.addEventListener('click', () => {
                        if (this.engine.state === 'save') {
                            if (this.saveGame(i)) {
                                this.engine.hideSaveLoad();
                            }
                        } else {
                            if (this.loadGame(i)) {
                                this.engine.hideSaveLoad();
                                this.engine.hideMainMenu();
                                this.engine.state = 'playing';
                                this.engine.updateUI();
                            }
                        }
                    });
                } catch (error) {
                    slot.classList.add('empty');
                    slot.innerHTML = `<h4>Save Slot ${i}</h4><p>Corrupted Save</p>`;
                }
            } else {
                slot.classList.add('empty');
                slot.innerHTML = `<h4>Save Slot ${i}</h4><p>Empty Slot</p>`;
                
                slot.addEventListener('click', () => {
                    if (this.engine.state === 'save') {
                        if (this.saveGame(i)) {
                            this.engine.hideSaveLoad();
                        }
                    }
                });
            }
            
            container.appendChild(slot);
        }
    }
}

// Initialize the game engine
window.GameEngine = new GameEngine();
