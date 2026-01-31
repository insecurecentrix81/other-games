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
    // 1. Settings
    this.settings = {
      renderDistance: 3,
      shadowsEnabled: false,
      shadowDistance: 200,
      fov: 80,
      sensitivity: 1.0,
      fullscreen: false,
    };

    // 2. Three.js Core
    this.scene = new THREE.Scene();
    this.camera = new THREE.PerspectiveCamera(this.settings.fov, window.innerWidth / window.innerHeight, 0.01, 1000);
    this.renderer = new THREE.WebGLRenderer({ antialias: false, powerPreference: "high-performance" });
    this.renderer.setSize(window.innerWidth, window.innerHeight);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.setClearColor(0x87ceeb);
    document.getElementById("game-container").prepend(this.renderer.domElement);

    // 3. World State & Worker Pool
    this.noise = new SimplexNoise(42);
    this.noiseDetail = new SimplexNoise(123);
    this.worldSeed = 42;

    this.chunkPool = new ChunkWorkerPool();
    this.chunks = new Map();        // key -> Uint8Array (Voxels)
    this.chunkYMax = new Map();     // key -> highest Y (Optimization)
    this.chunkMeshes = new Map();   // key -> THREE.Group
    this.pendingChunks = new Set(); // key -> boolean
    this.dirtyChunks = new Set();   // key -> needs remesh
    this.remeshInFlight = new Set();

    this.modifiedByChunk = new Map(); // key -> Array of [lx, y, lz, type]

    // 4. Player State
    this.player = {
      position: new THREE.Vector3(8, 60, 8),
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

    this.init();
  }

  init() {
    this.setupLighting();
    this.setupHighlight();
    this.setupHotbar();
    this.setupHealthBar();
    this.setupEventListeners();
    this.setupSettingsUI();
    this.setupInventoryUI();
    
    // Default items for survival testing
    this.giveItem(BLOCK.WOOD, 4);
  }

  // ==================== WORKER PIPELINE ====================

  #getChunkKey(cx, cz) { return `${cx},${cz}`; }

  async requestChunk(cx, cz) {
    const key = this.#getChunkKey(cx, cz);
    if (this.chunks.has(key) || this.pendingChunks.has(key)) return;
    this.pendingChunks.add(key);

    const mods = this.modifiedByChunk.get(key) || [];
    try {
      const res = await this.chunkPool.generateChunk({ 
        cx, cz, worldSeed: this.worldSeed, mods 
      });

      this.chunks.set(key, new Uint8Array(res.chunkBuffer));
      this.chunkYMax.set(key, res.yMax);
      this.applyChunkMeshFromWorker(cx, cz, res.mesh);

      // Border remesh
      this.requestRemesh(cx - 1, cz);
      this.requestRemesh(cx + 1, cz);
      this.requestRemesh(cx, cz - 1);
      this.requestRemesh(cx, cz + 1);
    } finally {
      this.pendingChunks.delete(key);
    }
  }

  requestRemesh(cx, cz) {
    const key = this.#getChunkKey(cx, cz);
    if (!this.chunks.has(key) || this.remeshInFlight.has(key)) return;
    this.dirtyChunks.add(key);
  }

  async flushRemeshQueue(maxPerFrame = 1) {
    let done = 0;
    for (const key of this.dirtyChunks) {
      if (done >= maxPerFrame) break;
      this.dirtyChunks.delete(key);
      this.remeshInFlight.add(key);

      const [cx, cz] = key.split(",").map(Number);
      const chunk = this.chunks.get(key);
      const chunkCopy = new Uint8Array(chunk);
      const yMax = this.chunkYMax.get(key) || 128;

      this.chunkPool.meshChunk({ cx, cz, chunkCopyBuffer: chunkCopy.buffer, yMax })
        .then(res => this.applyChunkMeshFromWorker(cx, cz, res.mesh))
        .finally(() => this.remeshInFlight.delete(key));
      done++;
    }
  }

  applyChunkMeshFromWorker(cx, cz, meshBuffers) {
    const key = this.#getChunkKey(cx, cz);
    if (this.chunkMeshes.has(key)) {
      const old = this.chunkMeshes.get(key);
      this.scene.remove(old);
      old.children.forEach(c => { c.geometry.dispose(); c.material.dispose(); });
    }

    const group = new THREE.Group();
    const create = (posBuf, colBuf, isTrans) => {
      if (!posBuf || posBuf.byteLength === 0) return;
      const geo = new THREE.BufferGeometry();
      geo.setAttribute("position", new THREE.BufferAttribute(new Float32Array(posBuf), 3));
      geo.setAttribute("color", new THREE.BufferAttribute(new Float32Array(colBuf), 3));
      geo.computeVertexNormals();
      const mat = new THREE.MeshStandardMaterial({
        vertexColors: true, transparent: isTrans, opacity: isTrans ? 0.6 : 1,
        depthWrite: !isTrans, roughness: 0.8
      });
      const mesh = new THREE.Mesh(geo, mat);
      mesh.castShadow = !isTrans && this.settings.shadowsEnabled;
      mesh.receiveShadow = !isTrans && this.settings.shadowsEnabled;
      group.add(mesh);
    };

    create(meshBuffers.opaquePos, meshBuffers.opaqueCol, false);
    create(meshBuffers.transPos, meshBuffers.transCol, true);
    this.scene.add(group);
    this.chunkMeshes.set(key, group);
  }

  // ==================== GAMEPLAY LOGIC ====================

  getBlock(x, y, z) {
    if (y < 0 || y >= WORLD_HEIGHT) return BLOCK.AIR;
    const cx = Math.floor(x / CHUNK_SIZE);
    const cz = Math.floor(z / CHUNK_SIZE);
    const chunk = this.chunks.get(this.#getChunkKey(cx, cz));
    if (!chunk) return BLOCK.AIR;
    const lx = ((x % CHUNK_SIZE) + CHUNK_SIZE) % CHUNK_SIZE;
    const lz = ((z % CHUNK_SIZE) + CHUNK_SIZE) % CHUNK_SIZE;
    return chunk[lx + y * CHUNK_SIZE + lz * CHUNK_SIZE * WORLD_HEIGHT];
  }

  setBlock(x, y, z, type) {
    if (y < 0 || y >= WORLD_HEIGHT) return;
    const cx = Math.floor(x / CHUNK_SIZE);
    const cz = Math.floor(z / CHUNK_SIZE);
    const key = this.#getChunkKey(cx, cz);
    const chunk = this.chunks.get(key);
    if (!chunk) return;

    const lx = ((x % CHUNK_SIZE) + CHUNK_SIZE) % CHUNK_SIZE;
    const lz = ((z % CHUNK_SIZE) + CHUNK_SIZE) % CHUNK_SIZE;
    chunk[lx + y * CHUNK_SIZE + lz * CHUNK_SIZE * WORLD_HEIGHT] = type;
    
    // Update modifications for persistence
    if (!this.modifiedByChunk.has(key)) this.modifiedByChunk.set(key, []);
    this.modifiedByChunk.get(key).push([lx, y, lz, type]);

    this.chunkYMax.set(key, Math.max(this.chunkYMax.get(key) || 0, y + 2));
    this.requestRemesh(cx, cz);
    // Neighborhood updates
    if (lx === 0) this.requestRemesh(cx - 1, cz);
    if (lx === CHUNK_SIZE - 1) this.requestRemesh(cx + 1, cz);
    if (lz === 0) this.requestRemesh(cx, cz - 1);
    if (lz === CHUNK_SIZE - 1) this.requestRemesh(cx, cz + 1);
  }

  updatePlayer(dt) {
    if (this.player.isDead) return;

    const moveDir = new THREE.Vector3();
    if (this.keys['KeyW']) moveDir.z -= 1;
    if (this.keys['KeyS']) moveDir.z += 1;
    if (this.keys['KeyA']) moveDir.x -= 1;
    if (this.keys['KeyD']) moveDir.x += 1;
    moveDir.normalize();

    const cos = Math.cos(this.player.yaw);
    const sin = Math.sin(this.player.yaw);
    const moveX = moveDir.x * cos + moveDir.z * sin;
    const moveZ = -moveDir.x * sin + moveDir.z * cos;

    if (this.isFlying) {
      const fSpeed = this.keys['ShiftLeft'] ? FLY_SPEED * 2 : FLY_SPEED;
      this.player.velocity.x = moveX * fSpeed;
      this.player.velocity.z = moveZ * fSpeed;
      this.player.velocity.y = (this.keys['Space'] ? fSpeed : (this.keys['ShiftLeft'] ? -fSpeed : 0));
    } else {
      const speed = this.keys['ShiftLeft'] ? SPRINT_SPEED : WALK_SPEED;
      this.player.velocity.x = moveX * speed;
      this.player.velocity.z = moveZ * speed;
      if (this.keys['Space'] && this.player.onGround) this.player.velocity.y = JUMP_FORCE;
      this.player.velocity.y -= GRAVITY * dt;
    }

    // Fall damage tracking
    if (!this.player.onGround && !this.isFlying && this.player.velocity.y < 0 && this.player.fallStartY === null) {
        this.player.fallStartY = this.player.position.y;
    }

    this.moveWithCollision(dt);

    if (this.player.onGround && this.player.fallStartY !== null) {
        const dist = this.player.fallStartY - this.player.position.y;
        if (dist > 3) this.applyDamage(Math.floor(dist - 3));
        this.player.fallStartY = null;
    }

    this.camera.position.copy(this.player.position);
    this.camera.rotation.set(this.player.pitch, this.player.yaw, 0, 'YXZ');
    
    document.getElementById('position').textContent = `XYZ: ${this.player.position.x.toFixed(1)} / ${this.player.position.y.toFixed(1)} / ${this.player.position.z.toFixed(1)}`;
  }

  moveWithCollision(dt) {
    const pos = this.player.position;
    const vel = this.player.velocity;

    pos.x += vel.x * dt;
    if (this.checkCollision(pos)) { pos.x -= vel.x * dt; vel.x = 0; }
    pos.z += vel.z * dt;
    if (this.checkCollision(pos)) { pos.z -= vel.z * dt; vel.z = 0; }
    pos.y += vel.y * dt;
    if (this.checkCollision(pos)) {
      if (vel.y < 0) this.player.onGround = true;
      pos.y -= vel.y * dt; vel.y = 0;
    } else {
      this.player.onGround = false;
    }
  }

  checkCollision(pos) {
    const hw = PLAYER_WIDTH / 2;
    const points = [
        [pos.x-hw, pos.y-PLAYER_HEIGHT, pos.z-hw], [pos.x+hw, pos.y-PLAYER_HEIGHT, pos.z-hw],
        [pos.x-hw, pos.y-PLAYER_HEIGHT, pos.z+hw], [pos.x+hw, pos.y-PLAYER_HEIGHT, pos.z+hw],
        [pos.x-hw, pos.y-0.1, pos.z-hw], [pos.x+hw, pos.y-0.1, pos.z-hw],
        [pos.x-hw, pos.y-0.1, pos.z+hw], [pos.x+hw, pos.y-0.1, pos.z+hw]
    ];
    for (const p of points) {
      const b = this.getBlock(Math.floor(p[0]), Math.floor(p[1]), Math.floor(p[2]));
      if (b !== BLOCK.AIR && BLOCK_DATA[b]?.solid) return true;
    }
    return false;
  }

  updateBlockSelection() {
    const dir = new THREE.Vector3(0, 0, -1).applyQuaternion(this.camera.quaternion);
    this.targetBlock = null; this.placementBlock = null;
    let prev = null;
    for (let t = 0; t < 5; t += 0.1) {
      const x = Math.floor(this.camera.position.x + dir.x * t);
      const y = Math.floor(this.camera.position.y + dir.y * t);
      const z = Math.floor(this.camera.position.z + dir.z * t);
      const b = this.getBlock(x, y, z);
      if (b !== BLOCK.AIR && b !== BLOCK.WATER) {
        this.targetBlock = { x, y, z };
        this.placementBlock = prev;
        break;
      }
      prev = { x, y, z };
    }
    if (this.targetBlock) {
      this.highlight.position.set(this.targetBlock.x + 0.5, this.targetBlock.y + 0.5, this.targetBlock.z + 0.5);
      this.highlight.visible = true;
    } else { this.highlight.visible = false; }
  }

  // ==================== ACTIONS ====================

  breakBlock() {
    if (!this.targetBlock) return;
    const { x, y, z } = this.targetBlock;
    const b = this.getBlock(x, y, z);
    if (b === BLOCK.BEDROCK) return;
    
    this.spawnParticles(x + 0.5, y + 0.5, z + 0.5, BLOCK_DATA[b].side);
    if (this.gameMode === 'survival') this.addToInventory(b, 1);
    this.setBlock(x, y, z, BLOCK.AIR);
  }

  placeBlock() {
    if (!this.placementBlock) return;
    const held = this.getHeldItem();
    if (!held || !BLOCK_DATA[held.id]) return;
    
    const { x, y, z } = this.placementBlock;
    // Check if player is inside
    if (this.checkCollision({ x: this.player.position.x, y: this.player.position.y, z: this.player.position.z })) return;

    this.setBlock(x, y, z, held.id);
    if (this.gameMode === 'survival') this.removeFromInventory(held.id, 1);
    this.placeCooldown = PLACE_COOLDOWN;
  }

  // ==================== UI & VFX ====================

  setupLighting() {
    this.scene.add(new THREE.AmbientLight(0xffffff, 0.7));
    this.sun = new THREE.DirectionalLight(0xfff5e0, 1.2);
    this.sun.position.set(100, 200, 50);
    this.scene.add(this.sun);
    this.updateFog();
  }

  updateFog() {
    const dist = CHUNK_SIZE * this.settings.renderDistance;
    this.scene.fog = new THREE.Fog(0x87ceeb, dist * 0.5, dist * 0.9);
  }

  setupHighlight() {
    const geo = new THREE.BoxGeometry(1.01, 1.01, 1.01);
    this.highlight = new THREE.LineSegments(new THREE.EdgesGeometry(geo), new THREE.LineBasicMaterial({ color: 0x000000 }));
    this.scene.add(this.highlight);
  }

  spawnParticles(x, y, z, color) {
    for (let i = 0; i < 10; i++) {
        const p = new THREE.Mesh(new THREE.BoxGeometry(0.15, 0.15, 0.15), new THREE.MeshBasicMaterial({ color }));
        p.position.set(x, y, z);
        p.velocity = new THREE.Vector3((Math.random()-0.5)*4, Math.random()*4, (Math.random()-0.5)*4);
        p.life = 1.0;
        this.scene.add(p);
        this.particleSystem.push(p);
    }
  }

  updateParticles(dt) {
    for (let i = this.particleSystem.length - 1; i >= 0; i--) {
        const p = this.particleSystem[i];
        p.position.addScaledVector(p.velocity, dt);
        p.velocity.y -= 9.8 * dt;
        p.life -= dt;
        if (p.life <= 0) {
            this.scene.remove(p);
            p.geometry.dispose(); p.material.dispose();
            this.particleSystem.splice(i, 1);
        }
    }
  }

  // ==================== SYSTEM ====================

  async startGame() {
    document.getElementById('menu').classList.add('hidden');
    document.getElementById('loading').classList.add('show');
    
    // Initial spawn area
    const pcx = Math.floor(this.player.position.x / CHUNK_SIZE);
    const pcz = Math.floor(this.player.position.z / CHUNK_SIZE);
    
    const tasks = [];
    for(let x = -1; x <= 1; x++) {
        for(let z = -1; z <= 1; z++) {
            tasks.push(this.requestChunk(pcx + x, pcz + z));
        }
    }
    await Promise.all(tasks);

    this.isPlaying = true;
    document.getElementById('loading').classList.remove('show');
    this.lastTime = performance.now();
    this.gameLoop();
    this.renderer.domElement.requestPointerLock();
  }

  gameLoop() {
    if (!this.isPlaying) return;
    const now = performance.now();
    const dt = Math.min((now - this.lastTime) / 1000, 0.1);
    this.lastTime = now;

    if (document.pointerLockElement && !this.isPaused && !this.inventoryOpen) {
      this.updatePlayer(dt);
      this.updateBlockSelection();
      
      if (this.breaking && this.targetBlock) {
        this.breakProgress += dt * (this.gameMode === 'creative' ? 10 : 1.5);
        this.updateBreakIndicator(this.breakProgress);
        if (this.breakProgress >= 1) { this.breakBlock(); this.breakProgress = 0; }
      }

      if (this.placing && this.placeCooldown <= 0) this.placeBlock();
      this.placeCooldown -= dt;

      this.updateChunks();
      this.flushRemeshQueue(1);
    }

    this.updateParticles(dt);
    this.renderer.render(this.scene, this.camera);
    requestAnimationFrame(() => this.gameLoop());
  }

  updateChunks() {
    const pcx = Math.floor(this.player.position.x / CHUNK_SIZE);
    const pcz = Math.floor(this.player.position.z / CHUNK_SIZE);
    for (let dx = -this.settings.renderDistance; dx <= this.settings.renderDistance; dx++) {
      for (let dz = -this.settings.renderDistance; dz <= this.settings.renderDistance; dz++) {
        if (dx*dx + dz*dz <= this.settings.renderDistance**2) {
          this.requestChunk(pcx + dx, pcz + dz);
        }
      }
    }
    // Cleanup far chunks
    const limit = this.settings.renderDistance + 2;
    for (const [key, mesh] of this.chunkMeshes) {
        const [cx, cz] = key.split(',').map(Number);
        if (Math.abs(cx - pcx) > limit || Math.abs(cz - pcz) > limit) {
            this.scene.remove(mesh);
            mesh.children.forEach(c => { c.geometry.dispose(); c.material.dispose(); });
            this.chunkMeshes.delete(key);
            this.chunks.delete(key);
        }
    }
  }

  // ==================== UI HELPERS ====================
  applyDamage(amt) {
    if (this.gameMode === 'creative') return;
    this.player.health -= amt;
    this.updateHealthBar();
    if (this.player.health <= 0) this.playerDie();
  }

  playerDie() {
    this.player.isDead = true;
    document.getElementById('death-screen').classList.add('visible');
    document.exitPointerLock();
  }

  respawn() {
    this.player.isDead = false;
    this.player.health = MAX_HEALTH;
    this.player.position.set(8, 60, 8);
    this.updateHealthBar();
    document.getElementById('death-screen').classList.remove('visible');
    this.renderer.domElement.requestPointerLock();
  }

  // Paste boilerplate UI methods here (setupHotbar, setupEventListeners, etc.)
  // These are standard UI management functions from your original code.
  
  setupHotbar() { this.updateHotbar(); }
  setupHealthBar() { 
    const container = document.getElementById('health-bar');
    container.innerHTML = '';
    for(let i=0; i<10; i++) {
        const h = document.createElement('div'); h.className = 'heart';
        const f = document.createElement('div'); f.className = 'heart-fill'; f.id = `heart-${i}`;
        h.appendChild(f); container.appendChild(h);
    }
    this.updateHealthBar();
  }

  updateHealthBar() {
    const h = this.player.health;
    for(let i=0; i<10; i++) {
        const el = document.getElementById(`heart-${i}`);
        if (!el) continue;
        const val = (i+1)*2;
        el.className = h >= val ? 'heart-fill' : (h >= val-1 ? 'heart-fill half' : 'heart-fill empty');
    }
  }

  updateHotbar() {
    const hb = document.getElementById('hotbar');
    hb.innerHTML = '';
    for(let i=0; i<9; i++) {
        const slot = document.createElement('div');
        slot.className = 'hotbar-slot' + (i === this.selectedSlot ? ' selected' : '');
        const item = this.hotbarSlots[i];
        if (item) {
            const canvas = document.createElement('canvas'); canvas.width = 32; canvas.height = 32;
            this.drawItemIcon(canvas, item.id); slot.appendChild(canvas);
            if (item.count > 1) {
                const c = document.createElement('span'); c.className = 'slot-count'; c.textContent = item.count;
                slot.appendChild(c);
            }
        }
        slot.onclick = () => { this.selectedSlot = i; this.updateHotbar(); };
        hb.appendChild(slot);
    }
  }

  drawItemIcon(canvas, id) {
    const ctx = canvas.getContext('2d');
    const data = BLOCK_DATA[id] || ITEM_DATA[id];
    if (!data) return;
    ctx.fillStyle = `rgb(${(data.top || data.color) >> 16 & 255}, ${(data.top || data.color) >> 8 & 255}, ${(data.top || data.color) & 255})`;
    ctx.fillRect(4, 4, 24, 24);
  }

  getItemName(id) { return (BLOCK_DATA[id]?.name || ITEM_DATA[id]?.name || "Unknown"); }
  getHeldItem() { return this.hotbarSlots[this.selectedSlot]; }
  addToInventory(id, count) {
    for(let i=0; i<9; i++) {
        if (this.hotbarSlots[i]?.id === id) { this.hotbarSlots[i].count += count; this.updateHotbar(); return; }
    }
    for(let i=0; i<9; i++) {
        if (!this.hotbarSlots[i]) { this.hotbarSlots[i] = { id, count }; this.updateHotbar(); return; }
    }
  }
  removeFromInventory(id, count) {
    const item = this.hotbarSlots[this.selectedSlot];
    if (item && item.id === id) {
        item.count -= count;
        if (item.count <= 0) this.hotbarSlots[this.selectedSlot] = null;
        this.updateHotbar();
    }
  }

  setupEventListeners() {
    document.getElementById('start-btn').onclick = () => this.startGame();
    document.getElementById('respawn-btn').onclick = () => this.respawn();
    window.addEventListener('keydown', e => this.keys[e.code] = true);
    window.addEventListener('keyup', e => this.keys[e.code] = false);
    window.addEventListener('mousemove', e => {
        if (document.pointerLockElement) {
            this.player.yaw -= e.movementX * 0.002 * this.settings.sensitivity;
            this.player.pitch = Math.max(-1.5, Math.min(1.5, this.player.pitch - e.movementY * 0.002 * this.settings.sensitivity));
        }
    });
    window.addEventListener('mousedown', e => {
        if (e.button === 0) this.breaking = true;
        if (e.button === 2) this.placing = true;
    });
    window.addEventListener('mouseup', e => {
        if (e.button === 0) { this.breaking = false; this.breakProgress = 0; this.updateBreakIndicator(0); }
        if (e.button === 2) this.placing = false;
    });
  }

  updateBreakIndicator(v) {
    const bar = document.getElementById('break-progress-bar');
    const fill = document.getElementById('break-progress-fill');
    if (v > 0) { bar.classList.add('active'); fill.style.width = (v*100)+'%'; }
    else { bar.classList.remove('active'); }
  }

  setupSettingsUI() {}
  setupInventoryUI() {}
  giveItem(id, count) { this.addToInventory(id, count); }
}
