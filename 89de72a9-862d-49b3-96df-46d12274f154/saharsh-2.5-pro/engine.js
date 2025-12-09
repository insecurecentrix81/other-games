// ============================================
// GAME ENGINE - Enhanced with Polish Features
// ============================================

import * as THREE from 'https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.module.js';
import { EffectsManager } from './effects.js';
import { GameState } from './gameState.js';
import { InputManager } from './input.js';
import { PhysicsManager } from './physics.js';

export class GameEngine {
    constructor() {
        // Core Three.js setup
        this.scene = null;
        this.camera = null;
        this.renderer = null;
        this.clock = new THREE.Clock();
        
        // Managers
        this.gameState = null;
        this.inputManager = null;
        this.physicsManager = null;
        this.effectsManager = null;
        
        // Game loop control
        this.isRunning = false;
        this.lastFrameTime = 0;
        this.targetFPS = 60;
        this.frameInterval = 1000 / this.targetFPS;
        this.frameCount = 0;
        this.fps = 60;
        this.fpsUpdateInterval = 1000; // Update FPS counter every second
        
        // Performance tracking
        this.frameTimes = [];
        this.averageFrameTime = 16.67; // 60 FPS default
        
        // Polish features
        this.dayNightCycleSpeed = 0.01; // Real-time minutes per frame
        this.weatherTransitionSpeed = 0.005;
        this.currentWeather = 'clear';
        this.targetWeather = 'clear';
        this.weatherIntensity = 0;
        
        // Initialize
        this.init();
    }
    
    async init() {
        try {
            // Create scene
            this.scene = new THREE.Scene();
            this.scene.fog = new THREE.Fog(0x87CEEB, 100, 1000);
            
            // Create camera
            this.camera = new THREE.PerspectiveCamera(
                75,
                window.innerWidth / window.innerHeight,
                0.1,
                5000
            );
            this.camera.position.set(0, 5, 10);
            
            // Create renderer with enhanced settings
            this.renderer = new THREE.WebGLRenderer({
                canvas: document.getElementById('game-canvas'),
                antialias: true,
                alpha: false,
                powerPreference: 'high-performance'
            });
            this.renderer.setSize(window.innerWidth, window.innerHeight);
            this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
            this.renderer.shadowMap.enabled = true;
            this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
            this.renderer.outputEncoding = THREE.sRGBEncoding;
            this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
            this.renderer.toneMappingExposure = 1.0;
            
            // Add basic lighting
            const ambientLight = new THREE.AmbientLight(0x404040, 0.6);
            this.scene.add(ambientLight);
            
            const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
            directionalLight.position.set(50, 100, 50);
            directionalLight.castShadow = true;
            directionalLight.shadow.mapSize.width = 2048;
            directionalLight.shadow.mapSize.height = 2048;
            directionalLight.shadow.camera.near = 0.5;
            directionalLight.shadow.camera.far = 500;
            directionalLight.shadow.camera.left = -100;
            directionalLight.shadow.camera.right = 100;
            directionalLight.shadow.camera.top = 100;
            directionalLight.shadow.camera.bottom = -100;
            this.scene.add(directionalLight);
            
            // Initialize managers
            this.gameState = new GameState();
            this.inputManager = new InputManager();
            this.physicsManager = new PhysicsManager();
            this.effectsManager = new EffectsManager(this.camera, this.scene);
            
            // Set up event listeners for polish
            this.setupEventListeners();
            
            // Create initial environment
            this.createEnvironment();
            
            // Start game loop
            this.startGameLoop();
            
            // Initial screen transition
            setTimeout(() => {
                this.effectsManager.fadeFromBlack(1.0, () => {
                    console.log('Game fully loaded and ready');
                });
            }, 500);
            
        } catch (error) {
            console.error('Failed to initialize game engine:', error);
            this.showErrorScreen(error.message);
        }
    }
    
    setupEventListeners() {
        // Window resize handling
        window.addEventListener('resize', () => {
            this.onWindowResize();
            this.effectsManager.onWindowResize();
        });
        
        // Prevent scrolling with arrow keys and space
        window.addEventListener('keydown', (e) => {
            if ([32, 37, 38, 39, 40].indexOf(e.keyCode) > -1) {
                e.preventDefault();
            }
        }, false);
        
        // Handle tab visibility changes
        document.addEventListener('visibilitychange', () => {
            if (document.hidden) {
                this.pauseGame();
            } else {
                this.resumeGame();
            }
        });
        
        // Handle page before unload
        window.addEventListener('beforeunload', () => {
            if (this.gameState) {
                this.gameState.saveGame();
            }
        });
        
        // Handle gamepad connection/disconnection
        window.addEventListener('gamepadconnected', (e) => {
            console.log('Gamepad connected:', e.gamepad.id);
            this.inputManager.handleGamepadConnected(e.gamepad);
        });
        
        window.addEventListener('gamepaddisconnected', (e) => {
            console.log('Gamepad disconnected:', e.gamepad.id);
            this.inputManager.handleGamepadDisconnected(e.gamepad);
        });
    }
    
    onWindowResize() {
        this.camera.aspect = window.innerWidth / window.innerHeight;
        this.camera.updateProjectionMatrix();
        this.renderer.setSize(window.innerWidth, window.innerHeight);
        
        // Update minimap canvas size
        const minimap = document.getElementById('minimap');
        if (minimap) {
            minimap.width = 150;
            minimap.height = 150;
        }
    }
    
    createEnvironment() {
        // Add skybox
        const skyGeometry = new THREE.SphereGeometry(2000, 32, 32);
        const skyMaterial = new THREE.MeshBasicMaterial({
            color: 0x87CEEB,
            side: THREE.BackSide
        });
        const skybox = new THREE.Mesh(skyGeometry, skyMaterial);
        this.scene.add(skybox);
        
        // Add ground
        const groundGeometry = new THREE.PlaneGeometry(1000, 1000);
        const groundMaterial = new THREE.MeshStandardMaterial({
            color: 0x8B4513,
            roughness: 0.8,
            metalness: 0.2
        });
        const ground = new THREE.Mesh(groundGeometry, groundMaterial);
        ground.rotation.x = -Math.PI / 2;
        ground.receiveShadow = true;
        this.scene.add(ground);
        
        // Add distant mountains (low poly for performance)
        for (let i = 0; i < 10; i++) {
            const mountainGeometry = new THREE.ConeGeometry(
                30 + Math.random() * 50,
                50 + Math.random() * 100,
                8
            );
            const mountainMaterial = new THREE.MeshStandardMaterial({
                color: 0x696969,
                roughness: 0.9
            });
            const mountain = new THREE.Mesh(mountainGeometry, mountainMaterial);
            mountain.position.set(
                (Math.random() - 0.5) * 800,
                0,
                (Math.random() - 0.5) * 800
            );
            mountain.castShadow = true;
            mountain.receiveShadow = true;
            this.scene.add(mountain);
        }
        
        // Add some trees
        for (let i = 0; i < 20; i++) {
            const trunkGeometry = new THREE.CylinderGeometry(0.5, 0.7, 5, 8);
            const trunkMaterial = new THREE.MeshStandardMaterial({ color: 0x8B4513 });
            const trunk = new THREE.Mesh(trunkGeometry, trunkMaterial);
            
            const leavesGeometry = new THREE.ConeGeometry(3, 8, 8);
            const leavesMaterial = new THREE.MeshStandardMaterial({ color: 0x228B22 });
            const leaves = new THREE.Mesh(leavesGeometry, leavesMaterial);
            leaves.position.y = 4;
            
            const tree = new THREE.Group();
            tree.add(trunk);
            tree.add(leaves);
            tree.position.set(
                (Math.random() - 0.5) * 300,
                0,
                (Math.random() - 0.5) * 300
            );
            tree.castShadow = true;
            tree.receiveShadow = true;
            this.scene.add(tree);
        }
    }
    
    startGameLoop() {
        this.isRunning = true;
        this.lastFrameTime = performance.now();
        this.animate();
    }
    
    pauseGame() {
        if (this.gameState.currentState === 'PLAYING') {
            this.gameState.transitionTo('PAUSED');
            console.log('Game paused due to tab change');
        }
    }
    
    resumeGame() {
        if (this.gameState.currentState === 'PAUSED') {
            this.gameState.transitionTo('PLAYING');
            console.log('Game resumed');
        }
    }
    
    animate(currentTime = 0) {
        if (!this.isRunning) return;
        
        // Calculate delta time with frame rate limiting
        const now = performance.now();
        const deltaTime = Math.min((now - this.lastFrameTime) / 1000, 0.1); // Cap at 100ms
        this.lastFrameTime = now;
        
        // Track FPS
        this.updateFPS(now);
        
        // Only update at target FPS
        if (now - this.frameCount * this.frameInterval >= this.frameInterval) {
            this.frameCount++;
            
            // Update game state
            this.update(deltaTime);
            
            // Render scene
            this.render();
            
            // Update performance tracking
            this.updatePerformanceMetrics(now);
        }
        
        // Request next frame
        requestAnimationFrame((time) => this.animate(time));
    }
    
    update(deltaTime) {
        // Update game state
        if (this.gameState.currentState === 'PLAYING') {
            // Update input
            this.inputManager.update();
            
            // Update physics
            this.physicsManager.update(deltaTime);
            
            // Update effects
            this.effectsManager.update(deltaTime);
            
            // Update day/night cycle
            this.updateDayNightCycle(deltaTime);
            
            // Update weather
            this.updateWeather(deltaTime);
            
            // Update game logic (this would be expanded with actual game systems)
            this.updateGameLogic(deltaTime);
            
            // Update HUD
            this.updateHUD(deltaTime);
            
            // Check for game state transitions
            this.checkGameState();
        }
        
        // Update UI based on game state
        this.updateUI();
    }
    
    updateDayNightCycle(deltaTime) {
        // Simple day/night cycle
        const timeUniforms = this.scene.children.find(child => 
            child.material && child.material.uniforms && child.material.uniforms.time
        );
        
        if (timeUniforms) {
            timeUniforms.material.uniforms.time.value += deltaTime * this.dayNightCycleSpeed;
        }
        
        // Update lighting based on time
        const sunAngle = Math.sin(Date.now() * 0.0001) * Math.PI;
        const sunLight = this.scene.children.find(child => 
            child instanceof THREE.DirectionalLight
        );
        
        if (sunLight) {
            sunLight.position.y = Math.sin(sunAngle) * 100;
            sunLight.position.x = Math.cos(sunAngle) * 100;
            sunLight.intensity = Math.max(0.3, Math.sin(sunAngle + Math.PI/2) * 0.8);
            
            // Update sky color based on time
            const skyColor = new THREE.Color();
            if (sunAngle > 0) {
                // Day
                skyColor.setHSL(0.6, 0.5, 0.7);
            } else {
                // Night
                skyColor.setHSL(0.7, 0.8, 0.1);
            }
            
            const skybox = this.scene.children.find(child => 
                child.geometry instanceof THREE.SphereGeometry
            );
            if (skybox) {
                skybox.material.color.copy(skyColor);
            }
        }
    }
    
    updateWeather(deltaTime) {
        // Smooth weather transitions
        if (this.currentWeather !== this.targetWeather) {
            this.weatherIntensity += this.weatherTransitionSpeed * deltaTime;
            if (this.weatherIntensity >= 1) {
                this.currentWeather = this.targetWeather;
                this.weatherIntensity = 0;
            }
        }
        
        // Apply weather effects
        switch(this.currentWeather) {
            case 'rain':
                // Add rain particles
                if (Math.random() < 0.1) {
                    const rainPosition = new THREE.Vector3(
                        (Math.random() - 0.5) * 100,
                        50,
                        (Math.random() - 0.5) * 100
                    );
                    this.effectsManager.spawnSmokeEffect(rainPosition);
                }
                break;
                
            case 'fog':
                // Increase fog density
                this.scene.fog.density = 0.02;
                break;
                
            case 'clear':
                this.scene.fog.density = 0.001;
                break;
        }
    }
    
    updateGameLogic(deltaTime) {
        // This would be expanded with actual game systems
        // For now, just update player and enemies if they exist
        
        // Check for random events
        if (Math.random() < 0.001 * deltaTime) {
            this.triggerRandomEvent();
        }
    }
    
    triggerRandomEvent() {
        const events = [
            'animal_encounter',
            'treasure_found',
            'ambush',
            'stranger_quest',
            'weather_change'
        ];
        
        const randomEvent = events[Math.floor(Math.random() * events.length)];
        
        switch(randomEvent) {
            case 'weather_change':
                const weatherTypes = ['clear', 'rain', 'fog'];
                this.targetWeather = weatherTypes[Math.floor(Math.random() * weatherTypes.length)];
                console.log(`Weather changing to: ${this.targetWeather}`);
                break;
                
            case 'animal_encounter':
                console.log('Random animal encounter!');
                // Would spawn animals
                break;
                
            case 'treasure_found':
                console.log('Treasure discovered!');
                // Would add treasure to player inventory
                break;
        }
    }
    
    updateHUD(deltaTime) {
        // Update health bar
        const healthFill = document.getElementById('health-fill');
        const healthText = document.getElementById('health-text');
        if (healthFill && healthText && this.gameState.player) {
            const healthPercent = (this.gameState.player.health / this.gameState.player.maxHealth) * 100;
            healthFill.style.width = `${healthPercent}%`;
            healthText.textContent = Math.round(this.gameState.player.health);
            
            // Pulse animation if health is low
            if (healthPercent < 30) {
                healthFill.style.animation = 'pulse 1s infinite';
                healthText.style.color = '#ff0000';
            } else {
                healthFill.style.animation = '';
                healthText.style.color = '#f44336';
            }
        }
        
        // Update minimap
        this.updateMinimap();
        
        // Update mission objectives
        this.updateMissionObjectives();
    }
    
    updateMinimap() {
        const minimap = document.getElementById('minimap');
        if (!minimap) return;
        
        const ctx = minimap.getContext('2d');
        ctx.clearRect(0, 0, minimap.width, minimap.height);
        
        // Draw minimap background
        ctx.fillStyle = 'rgba(15, 52, 96, 0.7)';
        ctx.fillRect(0, 0, minimap.width, minimap.height);
        
        // Draw player position
        const playerX = minimap.width / 2;
        const playerY = minimap.height / 2;
        
        ctx.fillStyle = '#d4af37';
        ctx.beginPath();
        ctx.arc(playerX, playerY, 4, 0, Math.PI * 2);
        ctx.fill();
        
        // Draw player direction
        const directionLength = 10;
        const playerRotation = this.camera ? this.camera.rotation.y : 0;
        const dirX = playerX + Math.sin(playerRotation) * directionLength;
        const dirY = playerY - Math.cos(playerRotation) * directionLength;
        
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(playerX, playerY);
        ctx.lineTo(dirX, dirY);
        ctx.stroke();
        
        // Draw discovered areas (simplified)
        ctx.fillStyle = 'rgba(76, 175, 80, 0.3)';
        ctx.beginPath();
        ctx.arc(playerX, playerY, 40, 0, Math.PI * 2);
        ctx.fill();
    }
    
    updateMissionObjectives() {
        const objectivesList = document.getElementById('objectives-list');
        if (!objectivesList || !this.gameState.mission) return;
        
        // Clear and rebuild objectives list
        objectivesList.innerHTML = '';
        
        if (this.gameState.mission.objectives && this.gameState.mission.objectives.length > 0) {
            this.gameState.mission.objectives.forEach((objective, index) => {
                const objectiveItem = document.createElement('div');
                objectiveItem.className = `objective-item ${objective.completed ? 'completed' : ''}`;
                objectiveItem.innerHTML = `
                    <i class="fas ${objective.completed ? 'fa-check-circle' : 'fa-circle'}"></i>
                    <span>${objective.description}</span>
                    ${objective.currentCount ? `<span class="objective-count">${objective.currentCount}/${objective.requiredCount}</span>` : ''}
                `;
                objectivesList.appendChild(objectiveItem);
            });
        } else {
            objectivesList.innerHTML = '<div class="objective-item">No active objectives</div>';
        }
    }
    
    updateUI() {
        // Update UI based on game state
        const gameContainer = document.getElementById('game-container');
        const pauseMenu = document.getElementById('pause-menu');
        const missionComplete = document.getElementById('mission-complete');
        const gameOver = document.getElementById('game-over');
        
        if (!gameContainer || !pauseMenu || !missionComplete || !gameOver) return;
        
        // Show/hide UI elements based on game state
        switch(this.gameState.currentState) {
            case 'PLAYING':
                gameContainer.style.display = 'block';
                pauseMenu.classList.add('hidden');
                missionComplete.classList.add('hidden');
                gameOver.classList.add('hidden');
                document.body.classList.add('no-scroll');
                break;
                
            case 'PAUSED':
                pauseMenu.classList.remove('hidden');
                break;
                
            case 'MISSION_COMPLETE':
                missionComplete.classList.remove('hidden');
                break;
                
            case 'GAME_OVER':
                gameOver.classList.remove('hidden');
                break;
                
            default:
                gameContainer.style.display = 'none';
                document.body.classList.remove('no-scroll');
                break;
        }
    }
    
    checkGameState() {
        // Check win/loss conditions
        if (this.gameState.player.health <= 0) {
            this.gameState.transitionTo('GAME_OVER', {
                cause: 'health_zero',
                message: 'Shot dead in the streets of the frontier'
            });
            this.effectsManager.fadeToBlack(0.5);
        }
        
        // Check mission completion
        if (this.gameState.mission.currentMission && 
            this.gameState.mission.objectives.every(obj => obj.completed || obj.optional)) {
            this.gameState.transitionTo('MISSION_COMPLETE', {
                missionData: this.gameState.mission.currentMission
            });
            this.effectsManager.triggerScreenShake(0.3, 0.5);
        }
    }
    
    updateFPS(currentTime) {
        // Calculate FPS
        if (!this.lastFPSUpdate) this.lastFPSUpdate = currentTime;
        if (currentTime - this.lastFPSUpdate >= this.fpsUpdateInterval) {
            this.fps = Math.round((this.frameCount * 1000) / (currentTime - this.lastFPSUpdate));
            this.frameCount = 0;
            this.lastFPSUpdate = currentTime;
            
            // Update debug display if visible
            const debugFPS = document.getElementById('debug-fps');
            if (debugFPS) {
                debugFPS.textContent = this.fps;
            }
            
            // Auto-adjust settings for performance
            if (this.fps < 30) {
                this.autoAdjustQuality('low');
            } else if (this.fps < 45) {
                this.autoAdjustQuality('medium');
            } else if (this.fps < 55) {
                this.autoAdjustQuality('high');
            }
        }
    }
    
    updatePerformanceMetrics(currentTime) {
        // Track frame times for performance analysis
        const frameTime = currentTime - this.lastFrameTime;
        this.frameTimes.push(frameTime);
        
        if (this.frameTimes.length > 60) {
            this.frameTimes.shift();
            
            // Calculate average frame time
            const avg = this.frameTimes.reduce((a, b) => a + b) / this.frameTimes.length;
            this.averageFrameTime = avg;
            
            // Update debug display
            const debugMemory = document.getElementById('debug-memory');
            if (debugMemory) {
                const memory = performance.memory;
                if (memory) {
                    debugMemory.textContent = `${Math.round(memory.usedJSHeapSize / 1048576)} MB`;
                }
            }
        }
    }
    
    autoAdjustQuality(level) {
        // Auto-adjust graphics quality based on performance
        switch(level) {
            case 'low':
                this.renderer.setPixelRatio(1);
                this.renderer.shadowMap.enabled = false;
                break;
            case 'medium':
                this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.5));
                this.renderer.shadowMap.enabled = true;
                break;
            case 'high':
                this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
                this.renderer.shadowMap.enabled = true;
                this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
                break;
        }
    }
    
    render() {
        // Render the scene
        this.renderer.render(this.scene, this.camera);
        
        // Post-processing effects would go here
        // (screen shake is handled in EffectsManager via camera position)
    }
    
    showErrorScreen(message) {
        // Create error screen
        const errorScreen = document.createElement('div');
        errorScreen.style.position = 'fixed';
        errorScreen.style.top = '0';
        errorScreen.style.left = '0';
        errorScreen.style.width = '100%';
        errorScreen.style.height = '100%';
        errorScreen.style.background = 'linear-gradient(135deg, #0c2461 0%, #1e3799 50%, #0c2461 100%)';
        errorScreen.style.display = 'flex';
        errorScreen.style.flexDirection = 'column';
        errorScreen.style.justifyContent = 'center';
        errorScreen.style.alignItems = 'center';
        errorScreen.style.zIndex = '99999';
        errorScreen.style.color = 'white';
        errorScreen.style.fontFamily = 'Arial, sans-serif';
        
        errorScreen.innerHTML = `
            <h1 style="color: #f44336; font-size: 3rem; margin-bottom: 1rem;">Error Loading Game</h1>
            <p style="font-size: 1.2rem; margin-bottom: 2rem; max-width: 600px; text-align: center;">
                ${message || 'An unknown error occurred while loading the game.'}
            </p>
            <p style="margin-bottom: 1rem;">Please try:</p>
            <ul style="text-align: left; margin-bottom: 2rem;">
                <li>Refreshing the page</li>
                <li>Checking your internet connection</li>
                <li>Updating your browser</li>
                <li>Enabling JavaScript</li>
            </ul>
            <button id="retry-load" style="padding: 1rem 2rem; background: #d4af37; border: none; border-radius: 5px; color: white; font-size: 1.2rem; cursor: pointer;">
                Retry Loading
            </button>
        `;
        
        document.body.appendChild(errorScreen);
        
        // Add retry button functionality
        document.getElementById('retry-load').addEventListener('click', () => {
            window.location.reload();
        });
    }
    
    // Cleanup on game exit
    dispose() {
        this.isRunning = false;
        
        if (this.effectsManager) {
            this.effectsManager.dispose();
        }
        
        if (this.renderer) {
            this.renderer.dispose();
        }
        
        // Remove event listeners
        window.removeEventListener('resize', this.onWindowResize);
        document.removeEventListener('visibilitychange', this.handleVisibilityChange);
    }
}

// Initialize game when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.gameEngine = new GameEngine();
});
