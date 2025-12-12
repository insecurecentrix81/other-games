// Pac-Man Mini-Game Engine
class PacMan {
    constructor() {
        this.canvas = null;
        this.ctx = null;
        this.isRunning = false;
        this.isPaused = false;
        
        // Game state
        this.player = {
            x: 1,
            y: 1,
            direction: 'right',
            nextDirection: 'right',
            speed: 2,
            isPowered: false,
            powerTimer: 0,
            animationFrame: 0
        };
        
        this.ghosts = [];
        this.maze = [];
        this.pellets = [];
        this.powerPellets = [];
        
        // Game stats
        this.score = 0;
        this.lives = 3;
        this.timeLeft = 60;
        this.pelletsCollected = 0;
        this.totalPellets = 0;
        
        // Maze dimensions
        this.cellSize = 20;
        this.mazeWidth = 19;
        this.mazeHeight = 21;
        
        // Timing
        this.lastTime = 0;
        this.accumulator = 0;
        this.stepTime = 100; // MS per movement step
        
        this.setupEventListeners();
    }

    init() {
        this.canvas = document.getElementById('pacmanCanvas');
        this.ctx = this.canvas.getContext('2d');
        
        // Set canvas size
        this.canvas.width = this.mazeWidth * this.cellSize;
        this.canvas.height = this.mazeHeight * this.cellSize;
        
        // Center the canvas
        this.canvas.style.position = 'absolute';
        this.canvas.style.left = '50%';
        this.canvas.style.top = '50%';
        this.canvas.style.transform = 'translate(-50%, -50%)';
        
        this.generateMaze();
        this.resetGame();
    }

    generateMaze() {
        // Create a simple but interesting maze layout
        // 0 = wall, 1 = pellet, 2 = power pellet, 3 = empty
        const mazeTemplate = [
            [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
            [0,1,1,1,1,1,1,1,1,0,1,1,1,1,1,1,1,1,0],
            [0,2,0,0,1,0,0,0,1,0,1,0,0,0,1,0,0,2,0],
            [0,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,0],
            [0,1,0,0,1,0,1,0,0,0,0,0,1,0,1,0,0,1,0],
            [0,1,1,1,1,0,1,1,1,0,1,1,1,0,1,1,1,1,0],
            [0,0,0,0,1,0,0,0,1,0,1,0,0,0,1,0,0,0,0],
            [3,3,3,0,1,0,1,1,1,1,1,1,1,0,1,0,3,3,3],
            [0,0,0,0,1,0,1,0,0,3,0,0,1,0,1,0,0,0,0],
            [1,1,1,1,1,1,1,0,3,3,3,0,1,1,1,1,1,1,1],
            [0,0,0,0,1,0,1,0,0,0,0,0,1,0,1,0,0,0,0],
            [3,3,3,0,1,0,1,1,1,1,1,1,1,0,1,0,3,3,3],
            [0,0,0,0,1,0,1,0,0,0,0,0,1,0,1,0,0,0,0],
            [0,1,1,1,1,1,1,1,1,0,1,1,1,1,1,1,1,1,0],
            [0,1,0,0,1,0,0,0,1,0,1,0,0,0,1,0,0,1,0],
            [0,2,1,0,1,1,1,1,1,1,1,1,1,1,1,0,1,2,0],
            [0,0,1,0,1,0,1,0,0,0,0,0,1,0,1,0,1,0,0],
            [0,1,1,1,1,0,1,1,1,0,1,1,1,0,1,1,1,1,0],
            [0,1,0,0,0,0,0,0,1,0,1,0,0,0,0,0,0,1,0],
            [0,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,0],
            [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0]
        ];
        
        this.maze = JSON.parse(JSON.stringify(mazeTemplate));
        
        // Extract pellets and power pellets
        this.pellets = [];
        this.powerPellets = [];
        this.totalPellets = 0;
        
        for (let y = 0; y < this.mazeHeight; y++) {
            for (let x = 0; x < this.mazeWidth; x++) {
                if (this.maze[y][x] === 1) {
                    this.pellets.push({x, y});
                    this.totalPellets++;
                } else if (this.maze[y][x] === 2) {
                    this.powerPellets.push({x, y});
                    this.totalPellets++;
                }
            }
        }
    }

    resetGame() {
        // Reset player position
        this.player.x = 9;
        this.player.y = 15;
        this.player.direction = 'right';
        this.player.nextDirection = 'right';
        this.player.isPowered = false;
        this.player.powerTimer = 0;
        
        // Reset ghosts
        this.ghosts = [
            {
                x: 9,
                y: 9,
                direction: 'up',
                color: '#FF0000',
                ai: 'chase',
                speed: 1.5,
                isScared: false,
                targetX: 9,
                targetY: 9
            },
            {
                x: 8,
                y: 9,
                direction: 'left',
                color: '#00FFFF',
                ai: 'random',
                speed: 1.3,
                isScared: false,
                targetX: 8,
                targetY: 9
            },
            {
                x: 10,
                y: 9,
                direction: 'right',
                color: '#FFB8FF',
                ai: 'ambush',
                speed: 1.4,
                isScared: false,
                targetX: 10,
                targetY: 9
            }
        ];
        
        // Reset game stats
        this.score = 0;
        this.lives = 3;
        this.timeLeft = 60;
        this.pelletsCollected = 0;
        
        // Reset maze
        this.generateMaze();
    }

    startLevel(difficulty) {
        this.resetGame();
        this.isRunning = true;
        this.isPaused = false;
        
        // Adjust difficulty
        this.timeLeft = Math.max(30, 60 - difficulty * 5);
        this.ghosts.forEach(ghost => {
            ghost.speed = 1 + difficulty * 0.3;
        });
        
        // Start timer
        this.startTimer();
        
        // Start game loop
        this.lastTime = performance.now();
        this.gameLoop();
    }

    gameLoop() {
        if (!this.isRunning) return;
        
        const currentTime = performance.now();
        const deltaTime = currentTime - this.lastTime;
        this.lastTime = currentTime;
        
        this.accumulator += deltaTime;
        
        // Update game at fixed intervals
        while (this.accumulator >= this.stepTime) {
            this.update();
            this.accumulator -= this.stepTime;
        }
        
        this.render();
        requestAnimationFrame(() => this.gameLoop());
    }

    update() {
        if (this.isPaused) return;
        
        // Update player
        this.updatePlayer();
        
        // Update ghosts
        this.updateGhosts();
        
        // Check collisions
        this.checkCollisions();
        
        // Update power timer
        if (this.player.isPowered) {
            this.player.powerTimer--;
            if (this.player.powerTimer <= 0) {
                this.player.isPowered = false;
                this.ghosts.forEach(ghost => ghost.isScared = false);
            }
        }
        
        // Update animation
        this.player.animationFrame = (this.player.animationFrame + 1) % 2;
        
        // Check win condition
        if (this.pelletsCollected >= this.totalPellets) {
            this.winLevel();
        }
    }

    updatePlayer() {
        // Try to change direction
        const directions = {
            'up': {x: 0, y: -1},
            'down': {x: 0, y: 1},
            'left': {x: -1, y: 0},
            'right': {x: 1, y: 0}
        };
        
        const nextDir = directions[this.player.nextDirection];
        const nextX = this.player.x + nextDir.x;
        const nextY = this.player.y + nextDir.y;
        
        if (this.isValidMove(nextX, nextY)) {
            this.player.direction = this.player.nextDirection;
        }
        
        // Move in current direction
        const dir = directions[this.player.direction];
        const newX = this.player.x + dir.x;
        const newY = this.player.y + dir.y;
        
        if (this.isValidMove(newX, newY)) {
            this.player.x = newX;
            this.player.y = newY;
            
            // Collect pellets
            this.collectPellet();
        }
        
        // Handle screen wrapping (tunnel)
        if (this.player.x < 0) this.player.x = this.mazeWidth - 1;
        if (this.player.x >= this.mazeWidth) this.player.x = 0;
    }

    updateGhosts() {
        this.ghosts.forEach(ghost => {
            // AI decision making
            if (Math.random() < 0.1) { // 10% chance to change direction each update
                this.updateGhostAI(ghost);
            }
            
            // Move ghost
            const directions = {
                'up': {x: 0, y: -1},
                'down': {x: 0, y: 1},
                'left': {x: -1, y: 0},
                'right': {x: 1, y: 0}
            };
            
            const dir = directions[ghost.direction];
            const newX = ghost.x + dir.x * ghost.speed / this.player.speed;
            const newY = ghost.y + dir.y * ghost.speed / this.player.speed;
            
            if (this.isValidMove(Math.floor(newX), Math.floor(newY))) {
                ghost.x = newX;
                ghost.y = newY;
            } else {
                // Hit wall, choose new direction
                this.updateGhostAI(ghost);
            }
        });
    }

    updateGhostAI(ghost) {
        const directions = ['up', 'down', 'left', 'right'];
        const validDirections = [];
        
        directions.forEach(dir => {
            const vectors = {
                'up': {x: 0, y: -1},
                'down': {x: 0, y: 1},
                'left': {x: -1, y: 0},
                'right': {x: 1, y: 0}
            };
            
            const newX = Math.floor(ghost.x + vectors[dir].x);
            const newY = Math.floor(ghost.y + vectors[dir].y);
            
            if (this.isValidMove(newX, newY)) {
                validDirections.push(dir);
            }
        });
        
        if (validDirections.length > 0) {
            if (ghost.isScared) {
                // Run away from player
                let bestDir = validDirections[0];
                let maxDistance = 0;
                
                validDirections.forEach(dir => {
                    const vectors = {
                        'up': {x: 0, y: -1},
                        'down': {x: 0, y: 1},
                        'left': {x: -1, y: 0},
                        'right': {x: 1, y: 0}
                    };
                    
                    const newX = ghost.x + vectors[dir].x;
                    const newY = ghost.y + vectors[dir].y;
                    const distance = Math.abs(newX - this.player.x) + Math.abs(newY - this.player.y);
                    
                    if (distance > maxDistance) {
                        maxDistance = distance;
                        bestDir = dir;
                    }
                });
                
                ghost.direction = bestDir;
            } else {
                switch(ghost.ai) {
                    case 'chase':
                        // Move towards player
                        let bestDir = validDirections[0];
                        let minDistance = Infinity;
                        
                        validDirections.forEach(dir => {
                            const vectors = {
                                'up': {x: 0, y: -1},
                                'down': {x: 0, y: 1},
                                'left': {x: -1, y: 0},
                                'right': {x: 1, y: 0}
                            };
                            
                            const newX = ghost.x + vectors[dir].x;
                            const newY = ghost.y + vectors[dir].y;
                            const distance = Math.abs(newX - this.player.x) + Math.abs(newY - this.player.y);
                            
                            if (distance < minDistance) {
                                minDistance = distance;
                                bestDir = dir;
                            }
                        });
                        
                        ghost.direction = bestDir;
                        break;
                        
                    case 'ambush':
                        // Try to cut off player
                        const targetX = this.player.x + (this.player.direction === 'right' ? 4 : this.player.direction === 'left' ? -4 : 0);
                        const targetY = this.player.y + (this.player.direction === 'down' ? 4 : this.player.direction === 'up' ? -4 : 0);
                        
                        let ambushDir = validDirections[0];
                        let ambushDistance = Infinity;
                        
                        validDirections.forEach(dir => {
                            const vectors = {
                                'up': {x: 0, y: -1},
                                'down': {x: 0, y: 1},
                                'left': {x: -1, y: 0},
                                'right': {x: 1, y: 0}
                            };
                            
                            const newX = ghost.x + vectors[dir].x;
                            const newY = ghost.y + vectors[dir].y;
                            const distance = Math.abs(newX - targetX) + Math.abs(newY - targetY);
                            
                            if (distance < ambushDistance) {
                                ambushDistance = distance;
                                ambushDir = dir;
                            }
                        });
                        
                        ghost.direction = ambushDir;
                        break;
                        
                    case 'random':
                    default:
                        ghost.direction = validDirections[Math.floor(Math.random() * validDirections.length)];
                        break;
                }
            }
        }
    }

    collectPellet() {
        const x = Math.floor(this.player.x);
        const y = Math.floor(this.player.y);
        
        // Check for regular pellet
        if (this.maze[y][x] === 1) {
            this.maze[y][x] = 3;
            this.score += 10;
            this.pelletsCollected++;
        }
        
        // Check for power pellet
        if (this.maze[y][x] === 2) {
            this.maze[y][x] = 3;
            this.score += 50;
            this.pelletsCollected++;
            
            // Activate power mode
            this.player.isPowered = true;
            this.player.powerTimer = 100;
            this.ghosts.forEach(ghost => ghost.isScared = true);
        }
    }

    checkCollisions() {
        this.ghosts.forEach((ghost, index) => {
            const distance = Math.abs(ghost.x - this.player.x) + Math.abs(ghost.y - this.player.y);
            
            if (distance < 0.5) {
                if (ghost.isScared) {
                    // Eat ghost
                    this.score += 200;
                    ghost.x = 9;
                    ghost.y = 9;
                    ghost.isScared = false;
                    ui.createFloatingText('+200', ghost.x * this.cellSize, ghost.y * this.cellSize, '#FFD700');
                } else {
                    // Player caught
                    this.loseLife();
                }
            }
        });
    }

    loseLife() {
        this.lives--;
        
        if (this.lives <= 0) {
            this.gameOver();
        } else {
            // Reset positions
            this.player.x = 9;
            this.player.y = 15;
            this.player.direction = 'right';
            
            this.ghosts.forEach((ghost, index) => {
                ghost.x = 9;
                ghost.y = 9;
                ghost.direction = ['up', 'left', 'right'][index];
                ghost.isScared = false;
            });
            
            ui.addScreenEffect('shake');
        }
    }

    isValidMove(x, y) {
        if (x < 0 || x >= this.mazeWidth || y < 0 || y >= this.mazeHeight) {
            return false;
        }
        
        return this.maze[y][x] !== 0;
    }

    render() {
        // Clear canvas
        this.ctx.fillStyle = '#000';
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
        
        // Draw maze
        for (let y = 0; y < this.mazeHeight; y++) {
            for (let x = 0; x < this.mazeWidth; x++) {
                const cell = this.maze[y][x];
                
                if (cell === 0) {
                    // Wall
                    this.ctx.fillStyle = '#0066CC';
                    this.ctx.fillRect(x * this.cellSize, y * this.cellSize, this.cellSize, this.cellSize);
                } else if (cell === 1) {
                    // Pellet
                    this.ctx.fillStyle = '#FFF';
                    this.ctx.beginPath();
                    this.ctx.arc(x * this.cellSize + this.cellSize/2, y * this.cellSize + this.cellSize/2, 2, 0, Math.PI * 2);
                    this.ctx.fill();
                } else if (cell === 2) {
                    // Power pellet
                    this.ctx.fillStyle = '#FFF';
                    this.ctx.beginPath();
                    this.ctx.arc(x * this.cellSize + this.cellSize/2, y * this.cellSize + this.cellSize/2, 4, 0, Math.PI * 2);
                    this.ctx.fill();
                }
            }
        }
        
        // Draw ghosts
        this.ghosts.forEach(ghost => {
            this.ctx.fillStyle = ghost.isScared ? '#0000FF' : ghost.color;
            this.ctx.beginPath();
            this.ctx.arc(ghost.x * this.cellSize + this.cellSize/2, ghost.y * this.cellSize + this.cellSize/2, this.cellSize/2 - 2, 0, Math.PI * 2);
            this.ctx.fill();
            
            // Ghost eyes
            this.ctx.fillStyle = '#FFF';
            this.ctx.beginPath();
            this.ctx.arc(ghost.x * this.cellSize + this.cellSize/3, ghost.y * this.cellSize + this.cellSize/3, 2, 0, Math.PI * 2);
            this.ctx.arc(ghost.x * this.cellSize + 2*this.cellSize/3, ghost.y * this.cellSize + this.cellSize/3, 2, 0, Math.PI * 2);
            this.ctx.fill();
        });
        
        // Draw Pac-Man
        this.ctx.fillStyle = '#FFFF00';
        this.ctx.beginPath();
        
        let startAngle = 0;
        let endAngle = Math.PI * 2;
        
        if (this.player.animationFrame === 0) {
            // Mouth closed
            this.ctx.arc(this.player.x * this.cellSize + this.cellSize/2, this.player.y * this.cellSize + this.cellSize/2, this.cellSize/2 - 2, startAngle, endAngle);
        } else {
            // Mouth open
            const mouthAngle = Math.PI / 4;
            const directionAngles = {
                'right': 0,
                'down': Math.PI / 2,
                'left': Math.PI,
                'up': 3 * Math.PI / 2
            };
            
            const baseAngle = directionAngles[this.player.direction] || 0;
            startAngle = baseAngle - mouthAngle;
            endAngle = baseAngle + mouthAngle;
            
            this.ctx.arc(this.player.x * this.cellSize + this.cellSize/2, this.player.y * this.cellSize + this.cellSize/2, this.cellSize/2 - 2, startAngle, endAngle);
            this.ctx.lineTo(this.player.x * this.cellSize + this.cellSize/2, this.player.y * this.cellSize + this.cellSize/2);
        }
        
        this.ctx.closePath();
        this.ctx.fill();
        
        // Update UI
        ui.updatePacmanUI(this.score, this.lives, this.timeLeft);
    }

    startTimer() {
        const timerInterval = setInterval(() => {
            if (!this.isRunning) {
                clearInterval(timerInterval);
                return;
            }
            
            if (!this.isPaused) {
                this.timeLeft--;
                
                if (this.timeLeft <= 0) {
                    clearInterval(timerInterval);
                    this.gameOver();
                }
            }
        }, 1000);
    }

    winLevel() {
        this.isRunning = false;
        ui.showPacmanMessage('Level Complete! You won Saharsh\'s heart!', true);
        
        document.getElementById('pacmanContinue').onclick = () => {
            ui.hidePacmanMessage();
            game.switchScene('restaurant');
            dating.handleMiniGameResult(true, this.score);
        };
    }

    gameOver() {
        this.isRunning = false;
        ui.showPacmanMessage('Game Over! Saharsh is disappointed...', true);
        
        document.getElementById('pacmanContinue').onclick = () => {
            ui.hidePacmanMessage();
            game.switchScene('restaurant');
            dating.handleMiniGameResult(false, this.score);
        };
    }

    setupEventListeners() {
        document.addEventListener('keydown', (e) => {
            if (!this.isRunning || this.isPaused) return;
            
            switch(e.key) {
                case 'ArrowUp':
                    this.player.nextDirection = 'up';
                    break;
                case 'ArrowDown':
                    this.player.nextDirection = 'down';
                    break;
                case 'ArrowLeft':
                    this.player.nextDirection = 'left';
                    break;
                case 'ArrowRight':
                    this.player.nextDirection = 'right';
                    break;
                case ' ':
                    this.isPaused = !this.isPaused;
                    break;
            }
        });
    }
}

// Initialize Pac-Man game
const pacman = new PacMan();
