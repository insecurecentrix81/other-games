// ============================================
// VISUAL EFFECTS & POLISH SYSTEM
// Handles particles, screen shake, transitions, and polish effects
// ============================================

import * as THREE from 'https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.module.js';

export class EffectsManager {
    constructor(camera, scene) {
        this.camera = camera;
        this.scene = scene;
        this.particleSystems = new Map();
        this.screenShake = { intensity: 0, duration: 0, decay: 0.9 };
        this.originalCameraPosition = camera.position.clone();
        this.transitionAlpha = 0;
        this.transitionType = 'none';
        this.transitionDuration = 0.5;
        
        this.initParticleSystems();
        this.initScreenTransition();
    }
    
    initParticleSystems() {
        // Blood particles
        const bloodParticles = new THREE.BufferGeometry();
        const bloodCount = 100;
        const bloodPositions = new Float32Array(bloodCount * 3);
        const bloodColors = new Float32Array(bloodCount * 3);
        
        for (let i = 0; i < bloodCount; i++) {
            bloodPositions[i * 3] = 0;
            bloodPositions[i * 3 + 1] = 0;
            bloodPositions[i * 3 + 2] = 0;
            
            // Blood red color with variations
            bloodColors[i * 3] = 0.7 + Math.random() * 0.3; // R
            bloodColors[i * 3 + 1] = Math.random() * 0.1;   // G
            bloodColors[i * 3 + 2] = Math.random() * 0.1;   // B
        }
        
        bloodParticles.setAttribute('position', new THREE.BufferAttribute(bloodPositions, 3));
        bloodParticles.setAttribute('color', new THREE.BufferAttribute(bloodColors, 3));
        
        const bloodMaterial = new THREE.PointsMaterial({
            size: 0.1,
            vertexColors: true,
            transparent: true,
            opacity: 0.8
        });
        
        this.particleSystems.set('blood', {
            geometry: bloodParticles,
            material: bloodMaterial,
            particles: new THREE.Points(bloodParticles, bloodMaterial),
            active: false,
            lifeTime: 2.0,
            age: 0
        });
        
        // Muzzle flash
        const muzzleGeometry = new THREE.SphereGeometry(0.2, 8, 8);
        const muzzleMaterial = new THREE.MeshBasicMaterial({
            color: 0xFFFF00,
            transparent: true,
            opacity: 0.9
        });
        
        this.particleSystems.set('muzzle', {
            geometry: muzzleGeometry,
            material: muzzleMaterial,
            mesh: new THREE.Mesh(muzzleGeometry, muzzleMaterial),
            active: false,
            lifeTime: 0.1,
            age: 0
        });
        
        // Bullet tracer
        const tracerGeometry = new THREE.CylinderGeometry(0.02, 0.02, 1, 4);
        const tracerMaterial = new THREE.MeshBasicMaterial({
            color: 0xFFA500,
            transparent: true,
            opacity: 0.7
        });
        
        this.particleSystems.set('tracer', {
            geometry: tracerGeometry,
            material: tracerMaterial,
            mesh: new THREE.Mesh(tracerGeometry, tracerMaterial),
            active: false,
            lifeTime: 0.3,
            age: 0,
            start: null,
            end: null
        });
        
        // Smoke/dust particles
        const smokeCount = 50;
        const smokeGeometry = new THREE.BufferGeometry();
        const smokePositions = new Float32Array(smokeCount * 3);
        const smokeSizes = new Float32Array(smokeCount);
        
        for (let i = 0; i < smokeCount; i++) {
            smokePositions[i * 3] = (Math.random() - 0.5) * 2;
            smokePositions[i * 3 + 1] = Math.random() * 0.5;
            smokePositions[i * 3 + 2] = (Math.random() - 0.5) * 2;
            smokeSizes[i] = Math.random() * 0.3 + 0.1;
        }
        
        smokeGeometry.setAttribute('position', new THREE.BufferAttribute(smokePositions, 3));
        smokeGeometry.setAttribute('size', new THREE.BufferAttribute(smokeSizes, 1));
        
        const smokeMaterial = new THREE.PointsMaterial({
            size: 0.2,
            color: 0x888888,
            transparent: true,
            opacity: 0.5,
            sizeAttenuation: true
        });
        
        this.particleSystems.set('smoke', {
            geometry: smokeGeometry,
            material: smokeMaterial,
            particles: new THREE.Points(smokeGeometry, smokeMaterial),
            active: false,
            lifeTime: 3.0,
            age: 0
        });
        
        // Add all particle systems to scene
        this.scene.add(this.particleSystems.get('blood').particles);
        this.scene.add(this.particleSystems.get('muzzle').mesh);
        this.scene.add(this.particleSystems.get('tracer').mesh);
        this.scene.add(this.particleSystems.get('smoke').particles);
        
        // Initially hide all particles
        this.particleSystems.forEach(system => {
            if (system.particles) system.particles.visible = false;
            if (system.mesh) system.mesh.visible = false;
        });
    }
    
    initScreenTransition() {
        // Create transition overlay
        this.transitionCanvas = document.createElement('canvas');
        this.transitionCanvas.width = window.innerWidth;
        this.transitionCanvas.height = window.innerHeight;
        this.transitionCanvas.style.position = 'absolute';
        this.transitionCanvas.style.top = '0';
        this.transitionCanvas.style.left = '0';
        this.transitionCanvas.style.pointerEvents = 'none';
        this.transitionCanvas.style.zIndex = '9999';
        document.body.appendChild(this.transitionCanvas);
        
        this.transitionContext = this.transitionCanvas.getContext('2d');
        this.transitionCanvas.style.display = 'none';
    }
    
    update(deltaTime) {
        // Update screen shake
        if (this.screenShake.duration > 0) {
            this.screenShake.duration -= deltaTime;
            this.screenShake.intensity *= this.screenShake.decay;
            
            const shakeX = (Math.random() - 0.5) * this.screenShake.intensity;
            const shakeY = (Math.random() - 0.5) * this.screenShake.intensity;
            const shakeZ = (Math.random() - 0.5) * this.screenShake.intensity;
            
            this.camera.position.x = this.originalCameraPosition.x + shakeX;
            this.camera.position.y = this.originalCameraPosition.y + shakeY;
            this.camera.position.z = this.originalCameraPosition.z + shakeZ;
            
            if (this.screenShake.duration <= 0) {
                this.camera.position.copy(this.originalCameraPosition);
            }
        }
        
        // Update particle systems
        this.particleSystems.forEach((system, key) => {
            if (system.active) {
                system.age += deltaTime;
                
                if (system.age >= system.lifeTime) {
                    system.active = false;
                    system.age = 0;
                    if (system.particles) system.particles.visible = false;
                    if (system.mesh) system.mesh.visible = false;
                } else {
                    // Update particle system based on type
                    switch(key) {
                        case 'blood':
                            this.updateBloodParticles(system, deltaTime);
                            break;
                        case 'muzzle':
                            this.updateMuzzleFlash(system, deltaTime);
                            break;
                        case 'tracer':
                            this.updateBulletTracer(system, deltaTime);
                            break;
                        case 'smoke':
                            this.updateSmokeParticles(system, deltaTime);
                            break;
                    }
                }
            }
        });
        
        // Update screen transitions
        this.updateScreenTransition(deltaTime);
    }
    
    updateBloodParticles(system, deltaTime) {
        const positions = system.geometry.attributes.position.array;
        for (let i = 0; i < positions.length; i += 3) {
            // Simple gravity and spread
            positions[i + 1] -= 5 * deltaTime; // Gravity
            positions[i] += (Math.random() - 0.5) * 2 * deltaTime; // Random spread
            positions[i + 2] += (Math.random() - 0.5) * 2 * deltaTime;
        }
        system.geometry.attributes.position.needsUpdate = true;
        
        // Fade out
        const alpha = 1 - (system.age / system.lifeTime);
        system.material.opacity = alpha * 0.8;
    }
    
    updateMuzzleFlash(system, deltaTime) {
        // Scale down flash
        const scale = 1 - (system.age / system.lifeTime);
        system.mesh.scale.setScalar(scale);
        
        // Fade out
        system.material.opacity = 1 - (system.age / system.lifeTime);
    }
    
    updateBulletTracer(system, deltaTime) {
        if (system.start && system.end) {
            // Move tracer along path
            const progress = system.age / system.lifeTime;
            const currentPos = new THREE.Vector3();
            currentPos.lerpVectors(system.start, system.end, progress);
            system.mesh.position.copy(currentPos);
            
            // Point mesh at end position
            system.mesh.lookAt(system.end);
            
            // Scale length based on progress
            system.mesh.scale.y = 1;
            
            // Fade out
            system.material.opacity = 1 - (system.age / system.lifeTime);
        }
    }
    
    updateSmokeParticles(system, deltaTime) {
        const positions = system.geometry.attributes.position.array;
        const sizes = system.geometry.attributes.size.array;
        
        for (let i = 0; i < positions.length / 3; i++) {
            // Float upward
            positions[i * 3 + 1] += 0.5 * deltaTime;
            
            // Gentle drift
            positions[i * 3] += (Math.random() - 0.5) * 0.2 * deltaTime;
            positions[i * 3 + 2] += (Math.random() - 0.5) * 0.2 * deltaTime;
            
            // Grow slightly
            sizes[i] += 0.1 * deltaTime;
        }
        
        system.geometry.attributes.position.needsUpdate = true;
        system.geometry.attributes.size.needsUpdate = true;
        
        // Fade out
        const alpha = 1 - (system.age / system.lifeTime);
        system.material.opacity = alpha * 0.5;
    }
    
    // Public API for effects
    triggerScreenShake(intensity = 0.5, duration = 0.3) {
        this.screenShake.intensity = intensity;
        this.screenShake.duration = duration;
    }
    
    spawnBloodEffect(position, count = 20) {
        const system = this.particleSystems.get('blood');
        const positions = system.geometry.attributes.position.array;
        
        // Reset positions around impact point
        for (let i = 0; i < count * 3; i += 3) {
            positions[i] = position.x + (Math.random() - 0.5) * 0.5;
            positions[i + 1] = position.y + Math.random() * 0.5;
            positions[i + 2] = position.z + (Math.random() - 0.5) * 0.5;
        }
        
        system.geometry.attributes.position.needsUpdate = true;
        system.active = true;
        system.age = 0;
        system.particles.visible = true;
        system.particles.position.copy(position);
    }
    
    spawnMuzzleFlash(position, direction) {
        const system = this.particleSystems.get('muzzle');
        system.mesh.position.copy(position);
        
        // Point flash in direction of fire
        system.mesh.lookAt(
            position.x + direction.x,
            position.y + direction.y,
            position.z + direction.z
        );
        
        system.active = true;
        system.age = 0;
        system.mesh.visible = true;
        system.mesh.scale.setScalar(1);
        system.material.opacity = 0.9;
    }
    
    spawnBulletTracer(start, end) {
        const system = this.particleSystems.get('tracer');
        system.start = start.clone();
        system.end = end.clone();
        
        // Position at start
        system.mesh.position.copy(start);
        system.mesh.lookAt(end);
        
        // Set length
        const distance = start.distanceTo(end);
        system.mesh.scale.y = distance;
        
        system.active = true;
        system.age = 0;
        system.mesh.visible = true;
        system.material.opacity = 0.7;
    }
    
    spawnSmokeEffect(position) {
        const system = this.particleSystems.get('smoke');
        system.particles.position.copy(position);
        system.active = true;
        system.age = 0;
        system.particles.visible = true;
    }
    
    // Screen transitions
    fadeToBlack(duration = 0.5, callback = null) {
        this.transitionType = 'fadeToBlack';
        this.transitionDuration = duration;
        this.transitionAlpha = 0;
        this.transitionCanvas.style.display = 'block';
        this.transitionCallback = callback;
    }
    
    fadeFromBlack(duration = 0.5, callback = null) {
        this.transitionType = 'fadeFromBlack';
        this.transitionDuration = duration;
        this.transitionAlpha = 1;
        this.transitionCanvas.style.display = 'block';
        this.transitionCallback = callback;
    }
    
    updateScreenTransition(deltaTime) {
        if (this.transitionType === 'none') return;
        
        switch(this.transitionType) {
            case 'fadeToBlack':
                this.transitionAlpha += deltaTime / this.transitionDuration;
                if (this.transitionAlpha >= 1) {
                    this.transitionAlpha = 1;
                    if (this.transitionCallback) {
                        this.transitionCallback();
                        this.transitionCallback = null;
                    }
                    // Auto-fade back in
                    setTimeout(() => {
                        this.fadeFromBlack(this.transitionDuration);
                    }, 500);
                }
                break;
                
            case 'fadeFromBlack':
                this.transitionAlpha -= deltaTime / this.transitionDuration;
                if (this.transitionAlpha <= 0) {
                    this.transitionAlpha = 0;
                    this.transitionCanvas.style.display = 'none';
                    if (this.transitionCallback) {
                        this.transitionCallback();
                        this.transitionCallback = null;
                    }
                    this.transitionType = 'none';
                }
                break;
        }
        
        // Draw transition overlay
        this.transitionCanvas.width = window.innerWidth;
        this.transitionCanvas.height = window.innerHeight;
        
        this.transitionContext.clearRect(0, 0, this.transitionCanvas.width, this.transitionCanvas.height);
        this.transitionContext.fillStyle = `rgba(0, 0, 0, ${this.transitionAlpha})`;
        this.transitionContext.fillRect(0, 0, this.transitionCanvas.width, this.transitionCanvas.height);
    }
    
    // Damage vignette effect
    showDamageVignette(intensity = 0.3, duration = 0.5) {
        const vignette = document.createElement('div');
        vignette.style.position = 'absolute';
        vignette.style.top = '0';
        vignette.style.left = '0';
        vignette.style.width = '100%';
        vignette.style.height = '100%';
        vignette.style.background = 'radial-gradient(circle at center, transparent 30%, rgba(255, 0, 0, 0.5) 100%)';
        vignette.style.pointerEvents = 'none';
        vignette.style.zIndex = '99';
        vignette.style.opacity = intensity;
        vignette.style.transition = `opacity ${duration}s ease-out`;
        document.getElementById('game-container').appendChild(vignette);
        
        // Fade out and remove
        setTimeout(() => {
            vignette.style.opacity = '0';
            setTimeout(() => {
                if (vignette.parentNode) {
                    vignette.parentNode.removeChild(vignette);
                }
            }, duration * 1000);
        }, 100);
    }
    
    // Hit marker effect
    showHitMarker(isHeadshot = false) {
        const hitMarker = document.createElement('div');
        hitMarker.style.position = 'absolute';
        hitMarker.style.top = '50%';
        hitMarker.style.left = '50%';
        hitMarker.style.transform = 'translate(-50%, -50%)';
        hitMarker.style.width = '20px';
        hitMarker.style.height = '20px';
        hitMarker.style.border = '2px solid ' + (isHeadshot ? '#FFD700' : '#FF0000');
        hitMarker.style.borderRadius = '50%';
        hitMarker.style.pointerEvents = 'none';
        hitMarker.style.zIndex = '150';
        hitMarker.style.opacity = '1';
        hitMarker.style.transition = 'opacity 0.3s ease-out, transform 0.3s ease-out';
        document.getElementById('game-container').appendChild(hitMarker);
        
        // Animate
        setTimeout(() => {
            hitMarker.style.opacity = '0';
            hitMarker.style.transform = 'translate(-50%, -50%) scale(1.5)';
            setTimeout(() => {
                if (hitMarker.parentNode) {
                    hitMarker.parentNode.removeChild(hitMarker);
                }
            }, 300);
        }, 50);
    }
    
    // Score popup
    showScorePopup(amount, position, isHeadshot = false) {
        const popup = document.createElement('div');
        popup.textContent = '+' + amount;
        popup.style.position = 'absolute';
        
        // Convert 3D position to screen position
        const vector = new THREE.Vector3();
        vector.copy(position);
        vector.project(this.camera);
        
        const x = (vector.x * 0.5 + 0.5) * window.innerWidth;
        const y = (-(vector.y * 0.5 + 0.5)) * window.innerHeight + 100;
        
        popup.style.left = x + 'px';
        popup.style.top = y + 'px';
        popup.style.color = isHeadshot ? '#FFD700' : '#FFFFFF';
        popup.style.fontSize = '20px';
        popup.style.fontWeight = 'bold';
        popup.style.textShadow = '0 0 5px rgba(0,0,0,0.8)';
        popup.style.pointerEvents = 'none';
        popup.style.zIndex = '100';
        popup.style.opacity = '1';
        popup.style.transition = 'all 1s ease-out';
        popup.style.transform = 'translate(-50%, -50%)';
        
        document.getElementById('game-container').appendChild(popup);
        
        // Animate upward and fade out
        setTimeout(() => {
            popup.style.opacity = '0';
            popup.style.transform = 'translate(-50%, -150%)';
            setTimeout(() => {
                if (popup.parentNode) {
                    popup.parentNode.removeChild(popup);
                }
            }, 1000);
        }, 100);
    }
    
    // Cleanup
    dispose() {
        this.particleSystems.forEach(system => {
            system.geometry.dispose();
            system.material.dispose();
        });
        
        if (this.transitionCanvas.parentNode) {
            this.transitionCanvas.parentNode.removeChild(this.transitionCanvas);
        }
    }
    
    // Handle window resize
    onWindowResize() {
        this.transitionCanvas.width = window.innerWidth;
        this.transitionCanvas.height = window.innerHeight;
    }
}

// Easing functions for smooth animations
export class Easing {
    static easeInOutQuad(t) {
        return t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t;
    }
    
    static easeOutBack(t) {
        const c1 = 1.70158;
        const c3 = c1 + 1;
        return 1 + c3 * Math.pow(t - 1, 3) + c1 * Math.pow(t - 1, 2);
    }
    
    static easeInOutCubic(t) {
        return t < 0.5 ? 4 * t * t * t : (t - 1) * (2 * t - 2) * (2 * t - 2) + 1;
    }
}
