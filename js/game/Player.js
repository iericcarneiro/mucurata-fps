/**
 * Player Controller for Favela Wars FPS
 */

class Player {
    constructor(scene, canvas, team, primaryWeapon) {
        this.scene = scene;
        this.canvas = canvas;
        this.team = team;
        
        // Player stats
        this.health = 100;
        this.maxHealth = 100;
        this.kills = 0;
        this.isDead = false;
        
        // Movement settings
        this.walkSpeed = 8;
        this.runSpeed = 14;
        this.crouchSpeed = 4;
        this.jumpForce = 8;
        this.gravity = -25;
        this.isRunning = false;
        this.isCrouching = false;
        this.isGrounded = true;
        this.velocity = new BABYLON.Vector3(0, 0, 0);
        
        // Look settings
        this.mouseSensitivity = 0.002;
        this.pitchLimit = Math.PI / 2 - 0.1;
        
        // Camera
        this.camera = null;
        this.cameraHeight = 1.7;
        this.crouchHeight = 1.0;
        
        // Physics body
        this.collider = null;
        
        // Weapons
        this.weapons = {};
        this.currentWeaponSlot = 1;
        this.currentWeapon = null;
        this.grenades = 1;
        
        // Input state
        this.input = {
            forward: false,
            backward: false,
            left: false,
            right: false,
            jump: false,
            run: false,
            crouch: false,
            fire: false,
            reload: false
        };
        
        // Initialize
        this.createCamera();
        this.createCollider();
        this.setupWeapons(primaryWeapon);
        this.setupInput();
    }
    
    createCamera() {
        // Create FPS camera
        this.camera = new BABYLON.UniversalCamera("playerCamera", new BABYLON.Vector3(0, this.cameraHeight, 0), this.scene);
        this.camera.minZ = 0.1;
        this.camera.fov = 1.2; // ~70 degrees
        
        // Disable default camera controls (we'll handle input ourselves)
        this.camera.inputs.clear();
        
        // Attach camera to canvas for pointer lock
        this.scene.activeCamera = this.camera;
        
        // Request pointer lock on click
        this.canvas.addEventListener('click', () => {
            if (!document.pointerLockElement) {
                this.canvas.requestPointerLock();
            }
        });
        
        // Handle pointer lock change
        document.addEventListener('pointerlockchange', () => {
            if (document.pointerLockElement === this.canvas) {
                document.addEventListener('mousemove', this.onMouseMove.bind(this));
            } else {
                document.removeEventListener('mousemove', this.onMouseMove.bind(this));
            }
        });
    }
    
    checkWallCollision(movement) {
        if (movement.length() < 0.001) return true;
        
        const direction = movement.normalize();
        const rayStart = this.collider.position.clone();
        rayStart.y = this.collider.position.y + 0.5; // Check at mid-height
        
        // Cast ray in movement direction
        const ray = new BABYLON.Ray(rayStart, direction, 0.6); // 0.6 = player radius + margin
        
        const hit = this.scene.pickWithRay(ray, (mesh) => {
            return mesh !== this.collider && 
                   mesh.checkCollisions && 
                   mesh.isPickable &&
                   !mesh.name.includes('npc_') &&
                   !mesh.name.includes('collider_') &&
                   !mesh.name.includes('head_') &&
                   !mesh.name.includes('weapon') &&
                   mesh.name !== 'ground' &&
                   mesh.name !== 'skybox';
        });
        
        // If hit something close, block movement
        if (hit && hit.hit && hit.distance < 0.5) {
            return false;
        }
        
        return true;
    }
    
    createCollider() {
        // Create collider for player (no physics - use Babylon collision system)
        this.collider = BABYLON.MeshBuilder.CreateBox("playerCollider", {
            width: 0.8,
            height: 1.8,
            depth: 0.8
        }, this.scene);
        this.collider.position = new BABYLON.Vector3(0, 1, 0);
        this.collider.isVisible = false;
        this.collider.isPickable = false;
        
        // Use Babylon's built-in collision system
        this.collider.checkCollisions = true;
        
        // Ellipsoid defines collision shape (half-extents)
        this.collider.ellipsoid = new BABYLON.Vector3(0.4, 0.9, 0.4);
        
        // Offset so ellipsoid center is at player feet level
        this.collider.ellipsoidOffset = new BABYLON.Vector3(0, 0.9, 0);
        
        console.log('Player collider created with wall collision');
    }
    
    setupWeapons(primaryWeapon) {
        // Create weapons
        this.weapons = {
            1: new Weapon(this.scene, this.camera, primaryWeapon),
            2: new Weapon(this.scene, this.camera, WeaponTypes.PISTOL),
            3: new Weapon(this.scene, this.camera, WeaponTypes.KNIFE)
        };
        
        // Equip primary weapon
        this.switchWeapon(1);
    }
    
    setupInput() {
        // Keyboard events
        window.addEventListener('keydown', (e) => this.onKeyDown(e));
        window.addEventListener('keyup', (e) => this.onKeyUp(e));
        
        // Mouse events
        window.addEventListener('mousedown', (e) => this.onMouseDown(e));
        window.addEventListener('mouseup', (e) => this.onMouseUp(e));
        window.addEventListener('wheel', (e) => this.onWheel(e));
    }
    
    onWheel(e) {
        if (this.isDead) return;
        if (!document.pointerLockElement) return;
        
        // Scroll down = next weapon, scroll up = previous weapon
        const maxSlot = Object.keys(this.weapons).length;
        let newSlot = this.currentWeaponSlot;
        
        if (e.deltaY > 0) {
            // Scroll down - next weapon
            newSlot = newSlot >= maxSlot ? 1 : newSlot + 1;
        } else if (e.deltaY < 0) {
            // Scroll up - previous weapon
            newSlot = newSlot <= 1 ? maxSlot : newSlot - 1;
        }
        
        this.switchWeapon(newSlot);
    }
    
    onKeyDown(e) {
        if (this.isDead) return;
        
        switch(e.code) {
            case 'KeyW': this.input.forward = true; break;
            case 'KeyS': this.input.backward = true; break;
            case 'KeyA': this.input.left = true; break;
            case 'KeyD': this.input.right = true; break;
            case 'Space': 
                if (this.isGrounded) {
                    this.input.jump = true;
                }
                break;
            case 'ShiftLeft':
            case 'ShiftRight':
                this.input.run = true;
                this.isRunning = true;
                break;
            case 'ControlLeft':
            case 'ControlRight':
                this.input.crouch = !this.input.crouch;
                this.toggleCrouch();
                break;
            case 'KeyR':
                this.reload();
                break;
            case 'Digit1':
                this.switchWeapon(1);
                break;
            case 'Digit2':
                this.switchWeapon(2);
                break;
            case 'Digit3':
                this.switchWeapon(3);
                break;
            case 'KeyG':
                this.throwGrenade();
                break;
            case 'Escape':
                if (window.gameInstance) {
                    window.gameInstance.togglePause();
                }
                break;
        }
    }
    
    onKeyUp(e) {
        switch(e.code) {
            case 'KeyW': this.input.forward = false; break;
            case 'KeyS': this.input.backward = false; break;
            case 'KeyA': this.input.left = false; break;
            case 'KeyD': this.input.right = false; break;
            case 'ShiftLeft':
            case 'ShiftRight':
                this.input.run = false;
                this.isRunning = false;
                break;
        }
    }
    
    onMouseDown(e) {
        if (this.isDead) return;
        if (!document.pointerLockElement) return;
        
        if (e.button === 0) {
            this.input.fire = true;
            this.fire();
        } else if (e.button === 2) {
            this.aim(true);
        }
    }
    
    onMouseUp(e) {
        if (e.button === 0) {
            this.input.fire = false;
        } else if (e.button === 2) {
            this.aim(false);
        }
    }
    
    onMouseMove(e) {
        if (this.isDead) return;
        
        const deltaX = e.movementX * this.mouseSensitivity;
        const deltaY = e.movementY * this.mouseSensitivity;
        
        // Rotate camera
        this.camera.rotation.y += deltaX;
        this.camera.rotation.x += deltaY;
        
        // Clamp pitch
        this.camera.rotation.x = Utils.clamp(this.camera.rotation.x, -this.pitchLimit, this.pitchLimit);
    }
    
    update(deltaTime) {
        if (this.isDead) return;
        
        this.updateMovement(deltaTime);
        this.updateWeapon(deltaTime);
        this.updateUI();
    }
    
    updateMovement(deltaTime) {
        // Calculate movement direction
        const moveDirection = new BABYLON.Vector3(0, 0, 0);
        
        if (this.input.forward) moveDirection.z = 1;
        if (this.input.backward) moveDirection.z = -1;
        if (this.input.left) moveDirection.x = -1;
        if (this.input.right) moveDirection.x = 1;
        
        // Normalize diagonal movement
        if (moveDirection.length() > 0) {
            moveDirection.normalize();
        }
        
        // Transform to world space based on camera rotation
        const rotationMatrix = BABYLON.Matrix.RotationY(this.camera.rotation.y);
        const worldDirection = BABYLON.Vector3.TransformCoordinates(moveDirection, rotationMatrix);
        
        // Apply speed
        let speed = this.walkSpeed;
        if (this.isRunning && !this.isCrouching) {
            speed = this.runSpeed;
        } else if (this.isCrouching) {
            speed = this.crouchSpeed;
        }
        
        // Apply weapon move speed modifier
        if (this.currentWeapon && this.currentWeapon.data.moveSpeed) {
            speed *= this.currentWeapon.data.moveSpeed;
        }
        
        // Set velocity
        this.velocity.x = worldDirection.x * speed;
        this.velocity.z = worldDirection.z * speed;
        
        // Ground check
        const groundRay = new BABYLON.Ray(
            this.collider.position,
            new BABYLON.Vector3(0, -1, 0),
            1.1
        );
        const groundHit = this.scene.pickWithRay(groundRay, (mesh) => {
            return mesh !== this.collider && mesh.isPickable;
        });
        
        this.isGrounded = groundHit && groundHit.hit;
        
        // Apply gravity
        if (!this.isGrounded) {
            this.velocity.y += this.gravity * deltaTime;
        } else {
            this.velocity.y = -0.1; // Small downward to stay grounded
            
            // Snap to ground
            if (groundHit && groundHit.pickedPoint) {
                this.collider.position.y = groundHit.pickedPoint.y + 0.9;
            }
            
            // Jump
            if (this.input.jump) {
                this.velocity.y = this.jumpForce;
                this.input.jump = false;
                this.isGrounded = false;
            }
        }
        
        // Apply movement WITH COLLISION DETECTION
        const movement = new BABYLON.Vector3(
            this.velocity.x * deltaTime,
            this.velocity.y * deltaTime,
            this.velocity.z * deltaTime
        );
        
        // Check wall collisions with raycasting before moving
        const canMoveX = this.checkWallCollision(new BABYLON.Vector3(movement.x, 0, 0));
        const canMoveZ = this.checkWallCollision(new BABYLON.Vector3(0, 0, movement.z));
        
        // Build final movement vector
        const finalMovement = new BABYLON.Vector3(
            canMoveX ? movement.x : 0,
            movement.y,
            canMoveZ ? movement.z : 0
        );
        
        // Use Babylon's moveWithCollisions for additional safety
        this.collider.moveWithCollisions(finalMovement);
        
        // Clamp to ground level minimum
        if (this.collider.position.y < 1) {
            this.collider.position.y = 1;
            this.velocity.y = 0;
            this.isGrounded = true;
        }
        
        // Update camera position
        const targetHeight = this.isCrouching ? this.crouchHeight : this.cameraHeight;
        this.camera.position = this.collider.position.clone();
        this.camera.position.y = this.collider.position.y + targetHeight - 0.9;
    }
    
    updateWeapon(deltaTime) {
        // Handle automatic fire
        if (this.input.fire && this.currentWeapon) {
            if (this.currentWeapon.data.automatic) {
                this.fire();
            }
        }
    }
    
    fire() {
        if (!this.currentWeapon || this.currentWeapon.isReloading) return;
        
        const hits = this.currentWeapon.fire(this.scene);
        
        if (hits && hits.length > 0) {
            // Process hits
            for (const hit of hits) {
                if (hit.mesh && hit.mesh.metadata && hit.mesh.metadata.isNPC) {
                    // Damage NPC
                    const npc = hit.mesh.metadata.npcInstance;
                    if (npc) {
                        const killed = npc.takeDamage(hit.damage);
                        this.showHitmarker(killed);
                        
                        if (killed) {
                            this.kills++;
                            this.updateKillsUI();
                        }
                    }
                } else if (hit.point) {
                    // Create bullet impact effect
                    this.createBulletImpact(hit.point, hit.mesh);
                }
            }
            
            // Apply recoil
            const recoil = this.currentWeapon.applyRecoil();
            this.camera.rotation.x -= recoil.vertical;
            this.camera.rotation.y += recoil.horizontal;
        }
        
        // Update ammo UI
        this.updateAmmoUI();
        
        // Auto-reload if empty
        if (this.currentWeapon.ammo <= 0 && this.currentWeapon.reserveAmmo > 0) {
            this.reload();
        }
    }
    
    createBulletImpact(point, mesh) {
        // Create a small impact decal/mark
        const impact = BABYLON.MeshBuilder.CreateDisc("impact", { radius: 0.05 }, this.scene);
        impact.position = point;
        impact.lookAt(this.camera.position);
        
        const impactMat = new BABYLON.StandardMaterial("impactMat", this.scene);
        impactMat.diffuseColor = new BABYLON.Color3(0.1, 0.1, 0.1);
        impactMat.emissiveColor = new BABYLON.Color3(0.3, 0.3, 0);
        impact.material = impactMat;
        
        // Fade out and remove
        setTimeout(() => {
            impact.dispose();
        }, 3000);
    }
    
    showHitmarker(isKill = false) {
        const hitmarker = document.getElementById('hitmarker');
        if (hitmarker) {
            hitmarker.classList.remove('show', 'kill');
            void hitmarker.offsetWidth; // Force reflow
            hitmarker.classList.add('show');
            if (isKill) {
                hitmarker.classList.add('kill');
            }
            Utils.playSound(this.scene, 'hit');
        }
    }
    
    reload() {
        if (!this.currentWeapon) return;
        
        const reloading = this.currentWeapon.reload(() => {
            this.updateAmmoUI();
        });
        
        if (reloading) {
            // Show reloading indicator
            this.updateAmmoUI();
        }
    }
    
    switchWeapon(slot) {
        if (slot === this.currentWeaponSlot && this.currentWeapon) return;
        if (!this.weapons[slot]) return;
        
        // Hide current weapon
        if (this.currentWeapon) {
            this.currentWeapon.hide();
            this.currentWeapon.cancelReload();
        }
        
        // Show new weapon
        this.currentWeaponSlot = slot;
        this.currentWeapon = this.weapons[slot];
        this.currentWeapon.show();
        
        // Update UI
        this.updateWeaponUI();
        this.updateAmmoUI();
        this.updateSlotUI();
    }
    
    toggleCrouch() {
        this.isCrouching = !this.isCrouching;
    }
    
    aim(isAiming) {
        // Implement scope/ADS if needed
        if (this.currentWeapon && this.currentWeapon.data.scopeZoom) {
            this.camera.fov = isAiming ? 1.2 / this.currentWeapon.data.scopeZoom : 1.2;
        }
    }
    
    throwGrenade() {
        if (this.grenades <= 0) return;
        
        this.grenades--;
        
        const direction = this.camera.getDirection(BABYLON.Vector3.Forward());
        const startPos = this.camera.position.clone();
        startPos.addInPlace(direction.scale(1));
        
        const grenade = new Grenade(
            this.scene,
            startPos,
            direction,
            WeaponData[WeaponTypes.GRENADE].throwForce
        );
        
        grenade.onExplode = (hits, position) => {
            // Check if player is in blast radius
            const playerDist = BABYLON.Vector3.Distance(position, this.collider.position);
            if (playerDist < WeaponData[WeaponTypes.GRENADE].radius) {
                const falloff = 1 - (playerDist / WeaponData[WeaponTypes.GRENADE].radius);
                this.takeDamage(WeaponData[WeaponTypes.GRENADE].damage * falloff * 0.5); // Reduced self damage
            }
            
            // Damage NPCs
            for (const hit of hits) {
                if (hit.mesh && hit.mesh.metadata && hit.mesh.metadata.npcInstance) {
                    const npc = hit.mesh.metadata.npcInstance;
                    const killed = npc.takeDamage(hit.damage);
                    
                    if (killed) {
                        this.kills++;
                        this.updateKillsUI();
                    }
                }
            }
        };
        
        // Update grenades UI
        this.updateGrenadesUI();
    }
    
    takeDamage(amount) {
        if (this.isDead) return;
        
        this.health -= amount;
        this.health = Math.max(0, this.health);
        
        // Show damage indicator
        const damageIndicator = document.getElementById('damage-indicator');
        if (damageIndicator) {
            damageIndicator.classList.remove('show');
            void damageIndicator.offsetWidth;
            damageIndicator.classList.add('show');
        }
        
        this.updateHealthUI();
        
        if (this.health <= 0) {
            this.die();
        }
    }
    
    heal(amount) {
        this.health = Math.min(this.maxHealth, this.health + amount);
        this.updateHealthUI();
    }
    
    die() {
        this.isDead = true;
        
        // Notify game
        if (window.gameInstance) {
            window.gameInstance.onPlayerDeath();
        }
    }
    
    respawn(position) {
        this.isDead = false;
        this.health = this.maxHealth;
        this.setPosition(position);
        this.updateHealthUI();
    }
    
    setPosition(position) {
        this.collider.position = position.clone();
        this.camera.position = position.clone();
        this.camera.position.y += this.cameraHeight - 0.9;
    }
    
    // UI Update methods
    updateUI() {
        this.updateHealthUI();
        this.updateAmmoUI();
        this.updateWeaponUI();
    }
    
    updateHealthUI() {
        const healthFill = document.getElementById('health-fill');
        const healthText = document.getElementById('health');
        
        if (healthFill && healthText) {
            const percent = (this.health / this.maxHealth) * 100;
            healthFill.style.width = `${percent}%`;
            healthText.textContent = Math.floor(this.health);
            
            if (percent <= 25) {
                healthFill.classList.add('low');
            } else {
                healthFill.classList.remove('low');
            }
        }
    }
    
    updateAmmoUI() {
        const ammoEl = document.getElementById('ammo');
        const reserveEl = document.getElementById('ammo-reserve');
        const ammoCounter = document.querySelector('.ammo-counter');
        
        if (this.currentWeapon && ammoEl && reserveEl) {
            if (this.currentWeapon.type === WeaponTypes.KNIFE) {
                ammoEl.textContent = '∞';
                reserveEl.textContent = '';
            } else {
                const info = this.currentWeapon.getAmmoInfo();
                ammoEl.textContent = info.current;
                reserveEl.textContent = info.reserve;
                
                if (ammoCounter) {
                    ammoCounter.classList.remove('low', 'empty');
                    if (info.current === 0) {
                        ammoCounter.classList.add('empty');
                    } else if (info.current <= info.maxMag * 0.25) {
                        ammoCounter.classList.add('low');
                    }
                }
            }
        }
    }
    
    updateWeaponUI() {
        const weaponEl = document.getElementById('current-weapon');
        if (weaponEl && this.currentWeapon) {
            weaponEl.textContent = this.currentWeapon.data.name;
        }
    }
    
    updateSlotUI() {
        for (let i = 1; i <= 3; i++) {
            const slot = document.getElementById(`slot-${i}`);
            if (slot) {
                slot.classList.toggle('active', i === this.currentWeaponSlot);
            }
        }
    }
    
    updateGrenadesUI() {
        const grenadesEl = document.getElementById('grenades');
        if (grenadesEl) {
            grenadesEl.textContent = this.grenades;
        }
        
        const slotG = document.getElementById('slot-g');
        if (slotG) {
            slotG.classList.toggle('active', this.grenades > 0);
        }
    }
    
    updateKillsUI() {
        const killsEl = document.getElementById('kills');
        if (killsEl) {
            killsEl.textContent = this.kills;
        }
    }
    
    dispose() {
        // Cleanup weapons
        Object.values(this.weapons).forEach(weapon => weapon.dispose());
        
        // Remove collider
        if (this.collider) {
            this.collider.dispose();
        }
    }
}
