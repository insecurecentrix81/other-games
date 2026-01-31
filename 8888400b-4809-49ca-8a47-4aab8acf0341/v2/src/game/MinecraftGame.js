import * as THREE from "three";
import SimplexNoise from "../noise/SimplexNoise.js";
import ChunkWorkerPool from "../workers/ChunkWorkerPool.js";
import {
  CHUNK_SIZE,
  WORLD_HEIGHT,
  GRAVITY,
  JUMP_FORCE,
  PLAYER_HEIGHT,
  PLAYER_WIDTH,
  WALK_SPEED,
  SPRINT_SPEED,
  FLY_SPEED,
  WATER_LEVEL,
  PLACE_COOLDOWN,
  MAX_HEALTH,
  MAX_STACK_SIZE,
  BLOCK,
  ITEM,
  BLOCK_DATA,
  ITEM_DATA,
  TOOL_TIERS,
  RECIPES,
  FACE_DATA,
} from "../constants.js";

export default class MinecraftGame {
  constructor() {
    // put constructor body here (paste from original)
    // IMPORTANT changes inside constructor:
    // 1) keep renderer/camera/scene setup on main thread
    // 2) keep noise on main thread (for spawn height etc)
    // 3) add worker pool + chunk height metadata + remesh queue

    this.settings = {
      renderDistance: 2,
      shadowsEnabled: false,
      shadowDistance: 200,
      fov: 80,
      sensitivity: 1.0,
      fullscreen: false,
    };

    this.scene = new THREE.Scene();
    this.camera = new THREE.PerspectiveCamera(this.settings.fov, window.innerWidth / window.innerHeight, 0.01, 500);
    this.renderer = new THREE.WebGLRenderer({ antialias: false, powerPreference: "high-performance" });
    this.renderer.setSize(window.innerWidth, window.innerHeight);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.setClearColor(0x87ceeb);
    document.getElementById("game-container").prepend(this.renderer.domElement);

    // Noise stays here for things like findSpawnPoint() / getTerrainHeight()
    this.noise = new SimplexNoise(42);
    this.noiseDetail = new SimplexNoise(123);

    this.worldSeed = 42;

    // CHANGED: worker pool does chunk gen + meshing
    this.chunkPool = new ChunkWorkerPool();
    this.chunks = new Map();        // key -> Uint8Array
    this.chunkYMax = new Map();     // key -> yMax (for faster remesh)
    this.chunkMeshes = new Map();   // key -> THREE.Group
    this.pendingChunks = new Set(); // key currently requested

    // CHANGED: keep modifications indexed per chunk so we can send them to worker efficiently
    this.modifiedBlocks = new Map();      // "x,y,z" -> type (your existing logic)
    this.modifiedByChunk = new Map();     // "cx,cz" -> Array<[lx,y,lz,type]>

    this.dirtyChunks = new Set(); // "cx,cz" to remesh
    this.remeshInFlight = new Set();

    this.player = {
      position: new THREE.Vector3(8, 50, 8),
      velocity: new THREE.Vector3(),
      onGround: false,
      yaw: 0,
      pitch: 0,
      inWater: false,
      health: MAX_HEALTH,
      fallStartY: null,
      isDead: false
    };

    this.keys = {};
    this.selectedSlot = 0;
    this.hotbarSlots = new Array(9).fill(null);
    this.inventorySlots = new Array(27).fill(null);
    this.inventoryOpen = false;

    this.isPlaying = false;
    this.isPaused = false;
    this.lastTime = 0;
    this.frameCount = 0;
    this.fpsTime = 0;
    this.fps = 0;

    this.targetBlock = null;
    this.placementBlock = null;
    this.breakProgress = 0;
    this.breaking = false;
    this.currentBreakingBlock = null;
    
    this.placing = false;
    this.placeCooldown = 0;

    this.particleSystem = [];
    
    this.gameMode = 'survival';
    this.isFlying = false;
    this.lastSpacePress = 0;

    this.autosaveTimer = null;
    this.lastAutosave = 0;

    this.init();
  }

  init() {
    // put init() here (paste from original)
    // NOTE: do NOT call old generateInitialChunks() that does synchronous generation
    // You'll replace it with async worker-based generation (see below).
    this.setupLighting();
    this.setupHighlight();
    this.setupHotbar();
    this.setupHealthBar();
    this.setupEventListeners();
    this.setupSettingsUI();
    this.setupInventoryUI()
  }

  // ==================== WORLD GEN (main thread helpers) ====================
  getTerrainHeight(x, z) {
    const scale = 0.008;
    const detailScale = 0.03;

    let base = this.noise.octave(x * scale, z * scale, 4, 0.5);
    let detail = this.noiseDetail.octave(x * detailScale, z * detailScale, 2, 0.5);

    let height = 20 + base * 25 + detail * 5;

    let mountain = this.noise.octave(x * 0.004, z * 0.004, 3, 0.4);
    if (mountain > 0.3) {
      height += (mountain - 0.3) * 60;
    }

    return Math.floor(height);
  }

  getBiome(x, z) {
    const temp = this.noise.noise2D(x * 0.002, z * 0.002);
    const moisture = this.noiseDetail.noise2D(x * 0.003, z * 0.003);

    if (temp > 0.4) return 'desert';
    if (temp < -0.4) return 'snow';
    if (moisture > 0.3) return 'forest';
    return 'plains';
  }

  // ==================== WORKER-BASED CHUNK PIPELINE ====================

  #getChunkKey(cx, cz) {
    return `${cx},${cz}`;
  }

  #getModsForChunk(cx, cz) {
    const k = this.#getChunkKey(cx, cz);
    return this.modifiedByChunk.get(k) || [];
  }

  async requestChunk(cx, cz) {
    const key = this.#getChunkKey(cx, cz);
    if (this.chunks.has(key) || this.pendingChunks.has(key)) return;
    this.pendingChunks.add(key);

    try {
      const mods = this.#getModsForChunk(cx, cz);
      const res = await this.chunkPool.generateChunk({ cx, cz, worldSeed: this.worldSeed, mods });

      // receive transferred buffers
      const chunk = new Uint8Array(res.chunkBuffer);
      this.chunks.set(key, chunk);
      this.chunkYMax.set(key, res.yMax);

      this.applyChunkMeshFromWorker(cx, cz, res.mesh);

      // When a chunk arrives, borders with neighbors may have “extra faces”.
      // Optionally remesh neighbors now that both exist:
      this.requestRemesh(cx - 1, cz);
      this.requestRemesh(cx + 1, cz);
      this.requestRemesh(cx, cz - 1);
      this.requestRemesh(cx, cz + 1);
    } finally {
      this.pendingChunks.delete(key);
    }
  }

  applyChunkMeshFromWorker(cx, cz, meshBuffers) {
    const key = this.#getChunkKey(cx, cz);

    // Dispose old mesh
    if (this.chunkMeshes.has(key)) {
      const oldGroup = this.chunkMeshes.get(key);
      this.scene.remove(oldGroup);
      oldGroup.children.forEach((m) => {
        m.geometry?.dispose?.();
        m.material?.dispose?.();
      });
      this.chunkMeshes.delete(key);
    }

    const group = new THREE.Group();

    const makeMesh = (posBuffer, colBuffer, isTrans) => {
      if (!posBuffer || posBuffer.byteLength === 0) return;

      const pos = new Float32Array(posBuffer);
      if (pos.length === 0) return;

      const col = new Float32Array(colBuffer);

      const geo = new THREE.BufferGeometry();
      geo.setAttribute("position", new THREE.BufferAttribute(pos, 3));
      geo.setAttribute("color", new THREE.BufferAttribute(col, 3));
      geo.computeVertexNormals();

      const mat = new THREE.MeshStandardMaterial({
        vertexColors: true,
        transparent: isTrans,
        opacity: isTrans ? 0.6 : 1.0,
        depthWrite: !isTrans,
        roughness: 0.8,
        side: THREE.FrontSide,
      });

      const mesh = new THREE.Mesh(geo, mat);
      if (this.settings.shadowsEnabled) {
        mesh.castShadow = !isTrans;
        mesh.receiveShadow = !isTrans;
      }
      group.add(mesh);
    };

    makeMesh(meshBuffers.opaquePos, meshBuffers.opaqueCol, false);
    makeMesh(meshBuffers.transPos, meshBuffers.transCol, true);

    this.scene.add(group);
    this.chunkMeshes.set(key, group);
  }

  requestRemesh(cx, cz) {
    const key = this.#getChunkKey(cx, cz);
    if (!this.chunks.has(key)) return;
    if (this.remeshInFlight.has(key)) return;
    this.dirtyChunks.add(key);
  }

  async flushRemeshQueue(maxPerFrame = 1) {
    let done = 0;

    for (const key of this.dirtyChunks) {
      if (done >= maxPerFrame) break;

      if (!this.chunks.has(key)) {
        this.dirtyChunks.delete(key);
        continue;
      }

      this.dirtyChunks.delete(key);
      this.remeshInFlight.add(key);

      const [cx, cz] = key.split(",").map(Number);
      const chunk = this.chunks.get(key);

      // We must NOT transfer the live chunk buffer (main thread needs it for collisions).
      // So we send a COPY and transfer the copy.
      const chunkCopy = new Uint8Array(chunk);
      const yMax = this.chunkYMax.get(key) || 64;

      this.chunkPool
        .meshChunk({ cx, cz, chunkCopyBuffer: chunkCopy.buffer, yMax })
        .then((res) => this.applyChunkMeshFromWorker(cx, cz, res.mesh))
        .finally(() => this.remeshInFlight.delete(key));

      done++;
    }
  }

  // ==================== REPLACE THESE METHODS ====================

  async generateInitialChunks() {
    // Replace your original synchronous generateInitialChunks()
    const pcx = Math.floor(this.player.position.x / CHUNK_SIZE);
    const pcz = Math.floor(this.player.position.z / CHUNK_SIZE);

    const tasks = [];
    for (let dx = -this.settings.renderDistance; dx <= this.settings.renderDistance; dx++) {
      for (let dz = -this.settings.renderDistance; dz <= this.settings.renderDistance; dz++) {
        if (dx * dx + dz * dz <= this.settings.renderDistance * this.settings.renderDistance) {
          tasks.push(this.requestChunk(pcx + dx, pcz + dz));
        }
      }
    }

    // Wait only for the center chunk so the player doesn't fall through air.
    await this.requestChunk(pcx, pcz);
    // Let the others stream in.
    await Promise.allSettled(tasks);
  }

  updateChunks() {
    // Replace your original updateChunks()
    const pcx = Math.floor(this.player.position.x / CHUNK_SIZE);
    const pcz = Math.floor(this.player.position.z / CHUNK_SIZE);

    for (let dx = -this.settings.renderDistance; dx <= this.settings.renderDistance; dx++) {
      for (let dz = -this.settings.renderDistance; dz <= this.settings.renderDistance; dz++) {
        const distSq = dx * dx + dz * dz;
        if (distSq <= this.settings.renderDistance * this.settings.renderDistance) {
          const cx = pcx + dx;
          const cz = pcz + dz;
          const key = this.#getChunkKey(cx, cz);
          if (!this.chunks.has(key) && !this.pendingChunks.has(key)) {
            // fire-and-forget; worker does heavy work
            this.requestChunk(cx, cz);
          }
        }
      }
    }

    // Unload far chunks (same as before)
    const maxDist = this.settings.renderDistance + 2;
    for (const [key, group] of this.chunkMeshes) {
      const [cx, cz] = key.split(",").map(Number);
      if (Math.abs(cx - pcx) > maxDist || Math.abs(cz - pcz) > maxDist) {
        this.scene.remove(group);
        group.children.forEach((child) => {
          child.geometry?.dispose?.();
          child.material?.dispose?.();
        });
        this.chunkMeshes.delete(key);
        this.chunks.delete(key);
        this.chunkYMax.delete(key);
      }
    }

    document.getElementById("chunk-info").textContent = `Chunks: ${this.chunkMeshes.size}`;
  }

  setBlock(x, y, z, type) {
    // Replace your setBlock() so it schedules worker remesh instead of building mesh synchronously
    if (y < 0 || y >= WORLD_HEIGHT) return;

    this.modifiedBlocks.set(`${x},${y},${z}`, type);

    const cx = Math.floor(x / CHUNK_SIZE);
    const cz = Math.floor(z / CHUNK_SIZE);
    const chunkKey = `${cx},${cz}`;

    // Track per-chunk local modifications for persistence (sent to worker when chunk loads)
    const lx = ((x % CHUNK_SIZE) + CHUNK_SIZE) % CHUNK_SIZE;
    const lz = ((z % CHUNK_SIZE) + CHUNK_SIZE) % CHUNK_SIZE;
    if (!this.modifiedByChunk.has(chunkKey)) this.modifiedByChunk.set(chunkKey, []);
    this.modifiedByChunk.get(chunkKey).push([lx, y, lz, type]);

    const chunk = this.chunks.get(chunkKey);
    if (chunk) {
      chunk[lx + y * CHUNK_SIZE + lz * CHUNK_SIZE * WORLD_HEIGHT] = type;
      this.chunkYMax.set(chunkKey, Math.max(this.chunkYMax.get(chunkKey) || 1, y + 2));

      // schedule remesh for this chunk and edge neighbors
      this.requestRemesh(cx, cz);
      if (lx === 0) this.requestRemesh(cx - 1, cz);
      if (lx === CHUNK_SIZE - 1) this.requestRemesh(cx + 1, cz);
      if (lz === 0) this.requestRemesh(cx, cz - 1);
      if (lz === CHUNK_SIZE - 1) this.requestRemesh(cx, cz + 1);
    }
  }

  async startGame() {
    // Put your startGame() here (paste from original) and change only the chunk bits:
    // - call await this.generateInitialChunks() (worker-based)
    // - do NOT call old this.generateChunk()/this.buildChunkMesh()

    const menu = document.getElementById("menu");
    const menuTitle = menu.querySelector("h1");
    const menuButton = menu.querySelector("button");

    menu.classList.add("hidden");
    document.getElementById("settings-panel").classList.remove("visible");

    if (!this.isPlaying) {
      document.getElementById("loading").classList.add("show");
      await new Promise((r) => setTimeout(r, 50));

      // Find spawn on main thread (noise is here)
      this.findSpawnPoint();

      // Stream chunks in from workers
      await this.generateInitialChunks();

      this.isPlaying = true;
      this.updateShadows();
      document.getElementById("loading").classList.remove("show");
      this.lastTime = performance.now();
      this.gameLoop();
    }

    this.isPaused = false;
    menuTitle.textContent = "⛏ MINECRAFT";
    menuButton.textContent = "Play World";
    this.updateGameModeIndicator();

    await new Promise((r) => setTimeout(r, 50));
    try {
      await this.renderer.domElement.requestPointerLock();
    } catch {}
  }
  gameLoop() {
    if (!this.isPlaying) return;

    const now = performance.now();
    const dt = Math.min((now - this.lastTime) / 1000, 0.1);
    this.lastTime = now;

    this.frameCount++;
    if (now - this.fpsTime >= 1000) {
      this.fps = this.frameCount;
      this.frameCount = 0;
      this.fpsTime = now;
      document.getElementById('fps').textContent = `FPS: ${this.fps}`;
    }

    if (document.pointerLockElement && !this.isPaused && !this.inventoryOpen && !this.player.isDead) {
      this.updatePlayer(dt);
      this.updateBlockSelection();

      if (this.breaking && this.targetBlock) {
        const blockKey = `${this.targetBlock.x},${this.targetBlock.y},${this.targetBlock.z}`;
        
        if (this.currentBreakingBlock !== blockKey) {
          this.breakProgress = 0;
          this.currentBreakingBlock = blockKey;
        }
        
        const block = this.getBlock(this.targetBlock.x, this.targetBlock.y, this.targetBlock.z);
        const blockData = BLOCK_DATA[block];
        
        if (blockData && blockData.hardness > 0) {
          if (this.gameMode === 'creative') {
            this.breakBlock();
          } else {
            const tool = this.getHeldTool();
            const miningSpeed = this.getMiningSpeed(blockData, tool);
            const breakSpeed = miningSpeed / blockData.hardness;
            
            this.breakProgress += dt * breakSpeed;
            this.updateBreakIndicator(this.breakProgress);
            
            if (this.breakProgress >= 1) {
              this.breakBlock();
            }
          }
        } else if (blockData && blockData.hardness === -1) {
          this.breakProgress = 0;
          this.updateBreakIndicator(0);
        }
      } else {
        if (this.breakProgress > 0) {
          this.breakProgress = 0;
          this.currentBreakingBlock = null;
          this.updateBreakIndicator(0);
        }
      }

      if (this.placing) {
        this.placeCooldown -= dt;
        if (this.placeCooldown <= 0) {
          this.placeBlock();
        }
      }
      
      this.flushRemeshQueue(1)
      this.updateChunks();
    }
  }

  setupLighting() {
    const ambient = new THREE.AmbientLight(0xffffff, 0.7);
    this.scene.add(ambient);
  
    this.sun = new THREE.DirectionalLight(0xfff5e0, 1.2);
    this.sun.position.set(100, 200, 50);
    
    this.sunTarget = new THREE.Object3D();
    this.scene.add(this.sunTarget);
    this.sun.target = this.sunTarget;
    this.scene.add(this.sun);
  
    this.updateFog();
  }

  updateShadows() {
    if (this.settings.shadowsEnabled) {
      this.renderer.shadowMap.enabled = true;
      this.renderer.shadowMap.type = THREE.VSMShadowMap;
      this.sun.castShadow = true;
      
      const res = this.settings.shadowDistance;
      this.sun.shadow.mapSize.set(res * 8, res * 8);
      
      const d = this.settings.shadowDistance / 2;
      this.sun.shadow.camera.left = -d;
      this.sun.shadow.camera.right = d;
      this.sun.shadow.camera.top = d;
      this.sun.shadow.camera.bottom = -d;
      this.sun.shadow.camera.near = 1;
      this.sun.shadow.camera.far = 350;
      this.sun.shadow.blurSamples = 4;
      this.sun.shadow.bias = -0.0002;
      this.sun.shadow.normalBias = 0;
      this.sun.shadow.camera.updateProjectionMatrix();
      
      this.chunkMeshes.forEach((group) => {
        group.children.forEach(mesh => {
          mesh.castShadow = true;
          mesh.receiveShadow = true;
        });
      });
    } else {
      this.renderer.shadowMap.enabled = false;
      this.sun.castShadow = false;
      
      this.chunkMeshes.forEach((group) => {
        group.children.forEach(mesh => {
          mesh.castShadow = false;
          mesh.receiveShadow = false;
        });
      });
    }
  }

  updateFog() {
    const viewDistance = CHUNK_SIZE * this.settings.renderDistance;
    this.scene.fog = new THREE.Fog(0x87ceeb, viewDistance * 0.5, viewDistance * 0.9);
  }

  setupHighlight() {
    const geo = new THREE.BoxGeometry(1.005, 1.005, 1.005);
    const edges = new THREE.EdgesGeometry(geo);
    this.highlight = new THREE.LineSegments(edges, new THREE.LineBasicMaterial({ color: 0x000000, linewidth: 2 }));
    this.highlight.visible = false;
    this.scene.add(this.highlight);
  }

  setupHealthBar() {
    const container = document.getElementById('health-bar');
    container.innerHTML = '';
    
    for (let i = 0; i < 10; i++) {
      const heart = document.createElement('div');
      heart.className = 'heart';
      const fill = document.createElement('div');
      fill.className = 'heart-fill';
      fill.id = `heart-${i}`;
      heart.appendChild(fill);
      container.appendChild(heart);
    }
    
    this.updateHealthBar();
  }

  updateHealthBar() {
    const health = this.player.health;
    for (let i = 0; i < 10; i++) {
      const fill = document.getElementById(`heart-${i}`);
      const heartValue = (i + 1) * 2;
      
      if (health >= heartValue) {
        fill.className = 'heart-fill';
      } else if (health >= heartValue - 1) {
        fill.className = 'heart-fill half';
      } else {
        fill.className = 'heart-fill empty';
      }
    }
    
    document.getElementById('health-bar').style.display = 
      this.gameMode === 'creative' ? 'none' : 'flex';
  }

  setupSettingsUI() {
    const panel = document.getElementById('settings-panel');
    
    const rdSlider = document.getElementById('setting-render-distance');
    rdSlider.value = this.settings.renderDistance;
    document.getElementById('render-distance-value').textContent = this.settings.renderDistance;
    rdSlider.oninput = () => {
      this.settings.renderDistance = parseInt(rdSlider.value);
      document.getElementById('render-distance-value').textContent = this.settings.renderDistance;
      this.saveSettings();
    };
    
    const shadowCheck = document.getElementById('setting-shadows');
    shadowCheck.checked = this.settings.shadowsEnabled;
    document.getElementById('shadow-distance-row').style.display = 
      this.settings.shadowsEnabled ? 'flex' : 'none';
    shadowCheck.onchange = () => {
      this.settings.shadowsEnabled = shadowCheck.checked;
      document.getElementById('shadow-distance-row').style.display = 
        shadowCheck.checked ? 'flex' : 'none';
      if (this.isPlaying) this.updateShadows();
      this.saveSettings();
    };
    
    const sdSlider = document.getElementById('setting-shadow-distance');
    sdSlider.value = this.settings.shadowDistance;
    document.getElementById('shadow-distance-value').textContent = this.settings.shadowDistance;
    sdSlider.oninput = () => {
      this.settings.shadowDistance = parseInt(sdSlider.value);
      document.getElementById('shadow-distance-value').textContent = this.settings.shadowDistance;
      if (this.isPlaying && this.settings.shadowsEnabled) this.updateShadows();
      this.saveSettings();
    };
    
    const fovSlider = document.getElementById('setting-fov');
    fovSlider.value = this.settings.fov;
    document.getElementById('fov-value').textContent = this.settings.fov;
    fovSlider.oninput = () => {
      this.settings.fov = parseInt(fovSlider.value);
      document.getElementById('fov-value').textContent = this.settings.fov;
      this.camera.fov = this.settings.fov;
      this.camera.updateProjectionMatrix();
      this.saveSettings();
    };
    
    const sensSlider = document.getElementById('setting-sensitivity');
    sensSlider.value = this.settings.sensitivity;
    document.getElementById('sensitivity-value').textContent = this.settings.sensitivity.toFixed(1);
    sensSlider.oninput = () => {
      this.settings.sensitivity = parseFloat(sensSlider.value);
      document.getElementById('sensitivity-value').textContent = this.settings.sensitivity.toFixed(1);
      this.saveSettings();
    };
    
    const autosaveCheck = document.getElementById('setting-autosave');
    autosaveCheck.checked = this.settings.autosave;
    autosaveCheck.onchange = () => {
      this.settings.autosave = autosaveCheck.checked;
      if (this.isPlaying) {
        if (this.settings.autosave) {
          this.startAutosave();
        } else {
          this.stopAutosave();
        }
      }
      this.saveSettings();
    };
    
    const fsCheck = document.getElementById('setting-fullscreen');
    fsCheck.checked = this.settings.fullscreen;
    fsCheck.onchange = () => {
      this.settings.fullscreen = fsCheck.checked;
      if (fsCheck.checked) {
        document.documentElement.requestFullscreen?.();
      } else {
        document.exitFullscreen?.();
      }
      this.saveSettings();
    };
    
    document.getElementById('settings-btn').onclick = () => {
      panel.classList.add('visible');
    };
    
    document.getElementById('settings-close-btn').onclick = () => {
      panel.classList.remove('visible');
      this.updateFog();
    };
  }

  setupInventoryUI() {
    this.updateInventoryUI();
  }

  updateInventoryUI() {
    const mainInv = document.getElementById('main-inventory');
    const hotbarInv = document.getElementById('hotbar-inventory');
    const recipeList = document.getElementById('recipe-list');
    
    mainInv.innerHTML = '';
    hotbarInv.innerHTML = '';
    recipeList.innerHTML = '';
    
    for (let i = 0; i < 27; i++) {
      const slot = this.createInventorySlot(this.inventorySlots[i], 'inventory', i);
      mainInv.appendChild(slot);
    }
    
    for (let i = 0; i < 9; i++) {
      const slot = this.createInventorySlot(this.hotbarSlots[i], 'hotbar', i);
      hotbarInv.appendChild(slot);
    }
    
    const recipes = this.gameMode === 'creative' ? this.getCreativeItems() : RECIPES;
    
    if (this.gameMode === 'creative') {
      recipes.forEach(item => {
        const recipeEl = document.createElement('div');
        recipeEl.className = 'recipe-item can-craft';
        recipeEl.innerHTML = `<span class="recipe-result">${item.name}</span>`;
        recipeEl.onclick = () => this.giveItem(item.id, 64);
        recipeList.appendChild(recipeEl);
      });
    } else {
      RECIPES.forEach(recipe => {
        const canCraft = this.canCraftRecipe(recipe);
        const recipeEl = document.createElement('div');
        recipeEl.className = 'recipe-item' + (canCraft ? ' can-craft' : '');
        
        const ingredientStr = recipe.ingredients.map(ing => {
          const name = this.getItemName(ing.item);
          const has = this.countItem(ing.item);
          return `${has}/${ing.count} ${name}`;
        }).join(' + ');
        
        recipeEl.innerHTML = `
          <span class="recipe-ingredients">${ingredientStr}</span>
          <span class="recipe-arrow">→</span>
          <span class="recipe-result">${recipe.resultCount}x ${recipe.name}</span>
        `;
        
        if (canCraft) {
          recipeEl.onclick = () => this.craftRecipe(recipe);
        }
        
        recipeList.appendChild(recipeEl);
      });
    }
  }

  getCreativeItems() {
    const items = [];
    for (const [id, data] of Object.entries(BLOCK_DATA)) {
      items.push({ id: parseInt(id), name: data.name });
    }
    for (const [id, data] of Object.entries(ITEM_DATA)) {
      items.push({ id: parseInt(id), name: data.name });
    }
    return items;
  }

  createInventorySlot(slotData, type, index) {
    const slot = document.createElement('div');
    slot.className = 'inv-slot';
    
    if (slotData) {
      const canvas = document.createElement('canvas');
      canvas.width = 32;
      canvas.height = 32;
      this.drawItemIcon(canvas, slotData.id);
      slot.appendChild(canvas);
      
      if (slotData.count > 1) {
        const count = document.createElement('span');
        count.className = 'slot-count';
        count.textContent = slotData.count;
        slot.appendChild(count);
      }
      
      const itemData = ITEM_DATA[slotData.id];
      if (itemData?.durability && slotData.durability !== undefined) {
        const durBar = document.createElement('div');
        durBar.className = 'durability-bar';
        const durFill = document.createElement('div');
        durFill.className = 'durability-fill';
        durFill.style.width = (slotData.durability / itemData.durability * 100) + '%';
        durFill.style.background = this.getDurabilityColor(slotData.durability / itemData.durability);
        durBar.appendChild(durFill);
        slot.appendChild(durBar);
      }
    }
    
    slot.onclick = () => this.handleInventoryClick(type, index);
    
    return slot;
  }

  getDurabilityColor(ratio) {
    if (ratio > 0.6) return '#4ade80';
    if (ratio > 0.3) return '#fbbf24';
    return '#ef4444';
  }

  handleInventoryClick(type, index) {
    if (this.gameMode === 'creative') return;
    console.log('Clicked', type, index);
  }

  setupHotbar() {
    this.updateHotbar();
  }

  drawItemIcon(canvas, itemId) {
    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, 32, 32);
    
    if (BLOCK_DATA[itemId]) {
      this.drawBlockIcon(canvas, itemId);
    } else if (ITEM_DATA[itemId]) {
      this.drawToolIcon(canvas, itemId);
    }
  }

  drawBlockIcon(canvas, type) {
    const ctx = canvas.getContext('2d');
    const data = BLOCK_DATA[type];
    if (!data) return;

    const toRGB = hex => `rgb(${(hex>>16)&255},${(hex>>8)&255},${hex&255})`;
    const darken = (hex, f) => {
      let r = ((hex>>16)&255)*f, g = ((hex>>8)&255)*f, b = (hex&255)*f;
      return `rgb(${Math.floor(r)},${Math.floor(g)},${Math.floor(b)})`;
    };

    ctx.fillStyle = toRGB(data.top);
    ctx.beginPath();
    ctx.moveTo(16, 4); ctx.lineTo(28, 10); ctx.lineTo(16, 16); ctx.lineTo(4, 10);
    ctx.closePath(); ctx.fill();

    ctx.fillStyle = darken(data.side, 0.6);
    ctx.beginPath();
    ctx.moveTo(4, 10); ctx.lineTo(16, 16); ctx.lineTo(16, 28); ctx.lineTo(4, 22);
    ctx.closePath(); ctx.fill();

    ctx.fillStyle = darken(data.side, 0.8);
    ctx.beginPath();
    ctx.moveTo(28, 10); ctx.lineTo(16, 16); ctx.lineTo(16, 28); ctx.lineTo(28, 22);
    ctx.closePath(); ctx.fill();
  }

  drawToolIcon(canvas, itemId) {
    const ctx = canvas.getContext('2d');
    const data = ITEM_DATA[itemId];
    if (!data) return;
    
    const toRGB = hex => `rgb(${(hex>>16)&255},${(hex>>8)&255},${hex&255})`;
    ctx.fillStyle = toRGB(data.color);
    
    if (data.toolType === 'pickaxe') {
      ctx.fillRect(14, 2, 4, 4);
      ctx.fillRect(10, 6, 12, 4);
      ctx.fillRect(14, 10, 4, 18);
    } else if (data.toolType === 'axe') {
      ctx.fillRect(18, 2, 8, 8);
      ctx.fillRect(14, 6, 4, 4);
      ctx.fillRect(14, 10, 4, 18);
    } else if (data.toolType === 'shovel') {
      ctx.fillRect(12, 2, 8, 10);
      ctx.fillRect(14, 12, 4, 16);
    } else if (data.name?.includes('Sword')) {
      ctx.fillRect(14, 2, 4, 20);
      ctx.fillRect(10, 22, 12, 4);
      ctx.fillRect(14, 26, 4, 4);
    } else {
      ctx.beginPath();
      ctx.arc(16, 16, 10, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  updateHotbar() {
    const container = document.getElementById('hotbar');
    container.innerHTML = '';

    for (let i = 0; i < 9; i++) {
      const slotData = this.hotbarSlots[i];
      const slot = document.createElement('div');
      slot.className = 'hotbar-slot' + (i === this.selectedSlot ? ' selected' : '');

      if (slotData) {
        const canvas = document.createElement('canvas');
        canvas.width = 32;
        canvas.height = 32;
        this.drawItemIcon(canvas, slotData.id);
        slot.appendChild(canvas);
        
        if (slotData.count > 1) {
          const count = document.createElement('span');
          count.className = 'slot-count';
          count.textContent = slotData.count;
          slot.appendChild(count);
        }

        const name = document.createElement('span');
        name.className = 'slot-name';
        name.textContent = this.getItemName(slotData.id);
        slot.appendChild(name);
        
        const itemData = ITEM_DATA[slotData.id];
        if (itemData?.durability && slotData.durability !== undefined) {
          const durBar = document.createElement('div');
          durBar.className = 'durability-bar';
          const durFill = document.createElement('div');
          durFill.className = 'durability-fill';
          durFill.style.width = (slotData.durability / itemData.durability * 100) + '%';
          durFill.style.background = this.getDurabilityColor(slotData.durability / itemData.durability);
          durBar.appendChild(durFill);
          slot.appendChild(durBar);
        }
      }

      const num = document.createElement('span');
      num.className = 'slot-number';
      num.textContent = i + 1;
      slot.appendChild(num);

      slot.onclick = () => { this.selectedSlot = i; this.updateHotbar(); };
      container.appendChild(slot);
    }
  }

  getItemName(itemId) {
    if (BLOCK_DATA[itemId]) return BLOCK_DATA[itemId].name;
    if (ITEM_DATA[itemId]) return ITEM_DATA[itemId].name;
    return 'Unknown';
  }

  getHeldItem() {
    return this.hotbarSlots[this.selectedSlot];
  }

  getHeldTool() {
    const held = this.getHeldItem();
    if (!held) return null;
    const data = ITEM_DATA[held.id];
    if (data?.isTool) return { ...data, durability: held.durability, slotIndex: this.selectedSlot };
    return null;
  }

  addToInventory(itemId, count = 1, durability = undefined) {
    const itemData = ITEM_DATA[itemId];
    const isStackable = itemData?.stackable !== false && !itemData?.isTool;
    
    let remaining = count;
    
    if (isStackable) {
      for (let i = 0; i < this.hotbarSlots.length && remaining > 0; i++) {
        const slot = this.hotbarSlots[i];
        if (slot && slot.id === itemId && slot.count < MAX_STACK_SIZE) {
          const add = Math.min(remaining, MAX_STACK_SIZE - slot.count);
          slot.count += add;
          remaining -= add;
        }
      }
      
      for (let i = 0; i < this.inventorySlots.length && remaining > 0; i++) {
        const slot = this.inventorySlots[i];
        if (slot && slot.id === itemId && slot.count < MAX_STACK_SIZE) {
          const add = Math.min(remaining, MAX_STACK_SIZE - slot.count);
          slot.count += add;
          remaining -= add;
        }
      }
    }
    
    while (remaining > 0) {
      const addCount = isStackable ? Math.min(remaining, MAX_STACK_SIZE) : 1;
      let added = false;
      
      for (let i = 0; i < this.hotbarSlots.length; i++) {
        if (!this.hotbarSlots[i]) {
          this.hotbarSlots[i] = { 
            id: itemId, 
            count: addCount,
            durability: durability !== undefined ? durability : (ITEM_DATA[itemId]?.durability)
          };
          remaining -= addCount;
          added = true;
          break;
        }
      }
      
      if (!added) {
        for (let i = 0; i < this.inventorySlots.length; i++) {
          if (!this.inventorySlots[i]) {
            this.inventorySlots[i] = { 
              id: itemId, 
              count: addCount,
              durability: durability !== undefined ? durability : (ITEM_DATA[itemId]?.durability)
            };
            remaining -= addCount;
            added = true;
            break;
          }
        }
      }
      
      if (!added) break;
    }
    
    this.updateHotbar();
    if (this.inventoryOpen) this.updateInventoryUI();
    
    return remaining === 0;
  }

  removeFromInventory(itemId, count = 1) {
    let remaining = count;
    
    for (let i = 0; i < this.hotbarSlots.length && remaining > 0; i++) {
      const slot = this.hotbarSlots[i];
      if (slot && slot.id === itemId) {
        const remove = Math.min(remaining, slot.count);
        slot.count -= remove;
        remaining -= remove;
        if (slot.count <= 0) this.hotbarSlots[i] = null;
      }
    }
    
    for (let i = 0; i < this.inventorySlots.length && remaining > 0; i++) {
      const slot = this.inventorySlots[i];
      if (slot && slot.id === itemId) {
        const remove = Math.min(remaining, slot.count);
        slot.count -= remove;
        remaining -= remove;
        if (slot.count <= 0) this.inventorySlots[i] = null;
      }
    }
    
    this.updateHotbar();
    if (this.inventoryOpen) this.updateInventoryUI();
    
    return remaining === 0;
  }

  countItem(itemId) {
    let count = 0;
    for (const slot of this.hotbarSlots) {
      if (slot && slot.id === itemId) count += slot.count;
    }
    for (const slot of this.inventorySlots) {
      if (slot && slot.id === itemId) count += slot.count;
    }
    return count;
  }

  giveItem(itemId, count = 1) {
    const itemData = ITEM_DATA[itemId];
    this.addToInventory(itemId, count, itemData?.durability);
  }

  canCraftRecipe(recipe) {
    for (const ing of recipe.ingredients) {
      if (this.countItem(ing.item) < ing.count) return false;
    }
    return true;
  }

  craftRecipe(recipe) {
    if (!this.canCraftRecipe(recipe)) return false;
    
    for (const ing of recipe.ingredients) {
      this.removeFromInventory(ing.item, ing.count);
    }
    
    const resultData = ITEM_DATA[recipe.result];
    this.addToInventory(recipe.result, recipe.resultCount, resultData?.durability);
    
    this.updateInventoryUI();
    return true;
  }

  damageTool(slotIndex) {
    const slot = this.hotbarSlots[slotIndex];
    if (!slot) return;
    
    const itemData = ITEM_DATA[slot.id];
    if (!itemData?.isTool) return;
    
    slot.durability--;
    
    if (slot.durability <= 0) {
      this.hotbarSlots[slotIndex] = null;
    }
    
    this.updateHotbar();
  }

  updateGameModeIndicator() {
    const indicator = document.getElementById('gamemode-indicator');
    if (this.gameMode === 'creative') {
      indicator.textContent = 'Creative' + (this.isFlying ? ' (Flying)' : '');
      indicator.className = 'creative';
    } else {
      indicator.textContent = 'Survival';
      indicator.className = 'survival';
    }
    this.updateHealthBar();
    if (this.inventoryOpen) this.updateInventoryUI();
  }

  toggleGameMode() {
    this.gameMode = this.gameMode === 'survival' ? 'creative' : 'survival';
    if (this.gameMode === 'survival') {
      this.isFlying = false;
    }
    if (this.gameMode === 'creative') {
      this.player.health = MAX_HEALTH;
    }
    this.updateGameModeIndicator();
  }

  toggleInventory() {
    this.inventoryOpen = !this.inventoryOpen;
    const invScreen = document.getElementById('inventory-screen');
    
    if (this.inventoryOpen) {
      invScreen.classList.add('visible');
      document.exitPointerLock();
      this.updateInventoryUI();
    } else {
      invScreen.classList.remove('visible');
      if (this.isPlaying && !this.isPaused) {
        this.renderer.domElement.requestPointerLock();
      }
    }
  }

  setupEventListeners() {
    document.getElementById('start-btn').onclick = (e) => {
      e.preventDefault();
      e.stopPropagation();
      if (this.currentSlot) {
        const saves = this.saveManager.getAllSaves();
        if (saves[this.currentSlot]) {
          this.startGame(false);
        }
      }
    };

    document.getElementById('respawn-btn').onclick = () => {
      this.respawn();
    };

    document.addEventListener('keydown', e => {
      if (this.keys[e.code]) return;
      this.keys[e.code] = true;
      
      // Quick save with F5
      if (e.code === 'F5' && this.isPlaying && !this.isPaused) {
        e.preventDefault();
        this.saveGame(true);
        return;
      }
      
      if (e.code === 'KeyE' && this.isPlaying && !this.isPaused && !this.player.isDead) {
        this.toggleInventory();
        e.preventDefault();
        return;
      }
      
      if (this.inventoryOpen) return;
      
      if (e.code.startsWith('Digit') && e.code.length === 6) {
        const n = parseInt(e.code[5]) - 1;
        if (n >= 0 && n < 9) {
          this.selectedSlot = n;
          this.updateHotbar();
        }
      }
      
      if (e.code === 'KeyC' && this.isPlaying && !this.isPaused) {
        this.toggleGameMode();
      }
      
      if (e.code === 'Space' && this.gameMode === 'creative') {
        const now = performance.now();
        if (now - this.lastSpacePress < 300) {
          this.isFlying = !this.isFlying;
          this.player.velocity.y = 0;
          this.updateGameModeIndicator();
        }
        this.lastSpacePress = now;
      }
      
      if (e.code === 'Escape' && this.isPlaying && !this.inventoryOpen) {
        // Save before showing menu
        this.saveGame(false);
        document.getElementById('settings-panel').classList.add('visible');
        document.exitPointerLock();
      }
      
      if (['Space', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.code)) {
        e.preventDefault();
      }
    });

    document.addEventListener('keyup', e => this.keys[e.code] = false);

    document.addEventListener('mousemove', e => {
      if (document.pointerLockElement && this.isPlaying && !this.isPaused && !this.inventoryOpen) {
        const sens = this.settings.sensitivity * 0.002;
        this.player.yaw -= e.movementX * sens;
        this.player.pitch = Math.max(-Math.PI/2 + 0.01, 
                                     Math.min(Math.PI/2 - 0.01, this.player.pitch - e.movementY * sens));
      }
    });

    document.addEventListener('mousedown', e => {
      if (!this.isPlaying || this.isPaused || this.inventoryOpen || this.player.isDead) return;
      if (!document.pointerLockElement) {
        this.renderer.domElement.requestPointerLock();
        return;
      }
      if (e.button === 0) this.breaking = true;
      else if (e.button === 2) {
        this.placing = true;
        this.placeBlock();
      }
    });

    document.addEventListener('mouseup', e => {
      if (e.button === 0) {
        this.breaking = false;
        this.breakProgress = 0;
        this.currentBreakingBlock = null;
        this.updateBreakIndicator(0);
      }
      if (e.button === 2) {
        this.placing = false;
      }
    });

    document.addEventListener('wheel', e => {
      if (!this.isPlaying || this.isPaused || this.inventoryOpen) return;
      this.selectedSlot = (this.selectedSlot + (e.deltaY > 0 ? 1 : -1) + 9) % 9;
      this.updateHotbar();
    });

    document.addEventListener('contextmenu', e => e.preventDefault());

    document.addEventListener('pointerlockchange', () => {
      if (!document.pointerLockElement && this.isPlaying && !this.isPaused && !this.inventoryOpen) {
        if (!document.getElementById('settings-panel').classList.contains('visible')) {
          this.isPaused = true;
          this.saveGame(false); // Save when pausing
          document.getElementById('menu').classList.remove('hidden');
          document.getElementById('menu').querySelector('h1').textContent = '⏸ PAUSED';
          document.getElementById('start-btn').textContent = 'Resume';
          document.getElementById('start-btn').disabled = false;
          this.updateWorldSlots();
        }
      }
    });

    window.addEventListener('resize', () => {
      this.camera.aspect = window.innerWidth / window.innerHeight;
      this.camera.updateProjectionMatrix();
      this.renderer.setSize(window.innerWidth, window.innerHeight);
    });
    
    // Save before closing
    window.addEventListener('beforeunload', () => {
      if (this.isPlaying) {
        this.saveGame(false);
      }
    });
  }

  updateBreakIndicator(progress) {
    const indicator = document.getElementById('break-indicator');
    const progressBar = document.getElementById('break-progress-bar');
    const progressFill = document.getElementById('break-progress-fill');
    
    if (progress > 0 && progress < 1) {
      indicator.classList.add('active');
      progressBar.classList.add('active');
      progressFill.style.width = (progress * 100) + '%';
      
      const inner = document.getElementById('break-indicator-inner');
      const crackSize = Math.floor(progress * 5) + 1;
      inner.style.background = `repeating-linear-gradient(
        ${45 + progress * 90}deg,
        transparent,
        transparent ${8 - crackSize}px,
        rgba(0,0,0,${0.3 + progress * 0.4}) ${8 - crackSize}px,
        rgba(0,0,0,${0.3 + progress * 0.4}) ${12 - crackSize}px
      )`;
    } else {
      indicator.classList.remove('active');
      progressBar.classList.remove('active');
    }
  }

  resetWorld() {
    // Clear existing world data
    this.chunks.clear();
    this.chunkMeshes.forEach((group) => {
      this.scene.remove(group);
      group.children.forEach(child => {
        if (child.geometry) child.geometry.dispose();
        if (child.material) child.material.dispose();
      });
    });
    this.chunkMeshes.clear();
    this.modifiedBlocks.clear();
    
    // Clear particles
    this.particleSystem.forEach(p => {
      this.scene.remove(p);
      p.geometry.dispose();
      p.material.dispose();
    });
    this.particleSystem = [];
    
    // Reset player
    this.player.position.set(8, 50, 8);
    this.player.velocity.set(0, 0, 0);
    this.player.yaw = 0;
    this.player.pitch = 0;
    this.player.health = MAX_HEALTH;
    this.player.onGround = false;
    this.player.inWater = false;
    this.player.fallStartY = null;
    this.player.isDead = false;
    
    // Reset inventory
    this.hotbarSlots = new Array(9).fill(null);
    this.inventorySlots = new Array(27).fill(null);
    this.selectedSlot = 0;
    
    // Reset game state
    this.gameMode = 'survival';
    this.isFlying = false;
  }
}
