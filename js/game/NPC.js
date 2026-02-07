/**
 * NPC AI System for Favela Wars FPS
 */

const NPCState = {
    IDLE: 'idle',
    PATROL: 'patrol',
    ALERT: 'alert',
    CHASE: 'chase',
    COMBAT: 'combat',
    DEAD: 'dead'
};

class NPC {
    constructor(scene, position, team, index) {
        this.scene = scene;
        this.team = team;
        this.index = index;
        this.id = `npc_${team}_${index}`;
        
        // Stats
        this.health = 100;
        this.maxHealth = 100;
        this.damage = 15;
        this.accuracy = 0.6;
        this.reactionTime = 500; // ms to react to player
        this.fireRate = 400; // ms between shots
        
        // State
        this.state = NPCState.PATROL;
        this.isDead = false;
        this.lastFireTime = 0;
        this.lastSeenPlayerTime = 0;
        this.lastSeenPlayerPos = null;
        
        // Movement
        this.speed = 4;
        this.rotationSpeed = 3;
        this.patrolPoints = [];
        this.currentPatrolIndex = 0;
        this.targetPosition = null;
        
        // Detection
        this.viewDistance = 40;
        this.viewAngle = 120; // degrees
        this.hearingDistance = 15;
        
        // Mesh
        this.mesh = null;
        this.bodyParts = {};
        
        // Create NPC
        this.create(position);
    }
    
    create(position) {
        // Create NPC body (using box for better Cannon.js compatibility)
        const body = BABYLON.MeshBuilder.CreateBox(`npc_${this.id}`, {
            width: 0.7,
            height: 1.8,
            depth: 0.7
        }, this.scene);
        body.position = position.clone();
        
        // Create material based on team
        const mat = new BABYLON.StandardMaterial(`npcMat_${this.id}`, this.scene);
        if (this.team === 'police') {
            mat.diffuseColor = new BABYLON.Color3(0.1, 0.1, 0.3); // Dark blue
        } else {
            mat.diffuseColor = new BABYLON.Color3(0.3, 0.15, 0.1); // Dark red/brown
        }
        body.material = mat;
        
        // Add head
        const head = BABYLON.MeshBuilder.CreateSphere(`head_${this.id}`, {
            diameter: 0.35
        }, this.scene);
        head.position = new BABYLON.Vector3(0, 1.1, 0);
        head.parent = body;
        head.material = mat;
        
        // Add weapon visual
        const weapon = BABYLON.MeshBuilder.CreateBox(`weapon_${this.id}`, {
            width: 0.05, height: 0.05, depth: 0.5
        }, this.scene);
        weapon.position = new BABYLON.Vector3(0.3, 0.3, 0.3);
        weapon.rotation.y = -0.2;
        weapon.parent = body;
        
        const weaponMat = new BABYLON.StandardMaterial(`weaponMat_${this.id}`, this.scene);
        weaponMat.diffuseColor = new BABYLON.Color3(0.1, 0.1, 0.1);
        weapon.material = weaponMat;
        
        // Use collision system instead of physics
        body.checkCollisions = true;
        body.ellipsoid = new BABYLON.Vector3(0.35, 0.9, 0.35);
        
        // Store references
        this.mesh = body;
        this.bodyParts.head = head;
        this.bodyParts.weapon = weapon;
        
        // Set metadata for hit detection
        body.metadata = {
            isNPC: true,
            npcInstance: this,
            team: this.team
        };
        body.isPickable = true;
        
        // Generate patrol points around spawn
        this.generatePatrolPoints(position);
    }
    
    generatePatrolPoints(origin) {
        // Create 3-5 patrol points around spawn location
        const numPoints = Utils.randomInt(3, 5);
        
        for (let i = 0; i < numPoints; i++) {
            const angle = (i / numPoints) * Math.PI * 2;
            const distance = Utils.random(5, 15);
            
            const point = new BABYLON.Vector3(
                origin.x + Math.cos(angle) * distance,
                origin.y,
                origin.z + Math.sin(angle) * distance
            );
            
            this.patrolPoints.push(point);
        }
        
        // Set first target
        this.targetPosition = this.patrolPoints[0].clone();
    }
    
    update(deltaTime, player) {
        if (this.isDead) return;
        
        // Update based on state
        switch(this.state) {
            case NPCState.PATROL:
                this.updatePatrol(deltaTime, player);
                break;
            case NPCState.ALERT:
                this.updateAlert(deltaTime, player);
                break;
            case NPCState.CHASE:
                this.updateChase(deltaTime, player);
                break;
            case NPCState.COMBAT:
                this.updateCombat(deltaTime, player);
                break;
        }
        
        // Always check for player visibility
        if (this.state !== NPCState.COMBAT) {
            if (this.canSeePlayer(player)) {
                this.onPlayerSpotted(player);
            }
        }
    }
    
    updatePatrol(deltaTime, player) {
        if (!this.targetPosition) {
            this.nextPatrolPoint();
            return;
        }
        
        // Move towards patrol point
        const distance = this.moveTowards(this.targetPosition, deltaTime, this.speed * 0.5);
        
        if (distance < 1) {
            // Reached patrol point, wait a bit then move to next
            setTimeout(() => {
                this.nextPatrolPoint();
            }, Utils.random(1000, 3000));
            this.targetPosition = null;
        }
    }
    
    nextPatrolPoint() {
        this.currentPatrolIndex = (this.currentPatrolIndex + 1) % this.patrolPoints.length;
        this.targetPosition = this.patrolPoints[this.currentPatrolIndex].clone();
    }
    
    updateAlert(deltaTime, player) {
        // Look around, move towards last known position
        if (this.lastSeenPlayerPos) {
            this.moveTowards(this.lastSeenPlayerPos, deltaTime, this.speed * 0.7);
            this.lookAt(this.lastSeenPlayerPos);
            
            // Check if reached last known position
            const dist = BABYLON.Vector3.Distance(this.mesh.position, this.lastSeenPlayerPos);
            if (dist < 2) {
                // Player not here, go back to patrol
                setTimeout(() => {
                    if (this.state === NPCState.ALERT) {
                        this.state = NPCState.PATROL;
                        this.targetPosition = this.patrolPoints[this.currentPatrolIndex].clone();
                    }
                }, 3000);
            }
        }
        
        // Check if we can see player again
        if (this.canSeePlayer(player)) {
            this.state = NPCState.COMBAT;
            this.lastSeenPlayerPos = player.collider.position.clone();
            this.lastSeenPlayerTime = performance.now();
        }
    }
    
    updateChase(deltaTime, player) {
        if (this.canSeePlayer(player)) {
            this.lastSeenPlayerPos = player.collider.position.clone();
            this.lastSeenPlayerTime = performance.now();
            
            const distance = BABYLON.Vector3.Distance(this.mesh.position, player.collider.position);
            
            if (distance < 20) {
                // Close enough to fight
                this.state = NPCState.COMBAT;
            } else {
                // Keep chasing
                this.moveTowards(player.collider.position, deltaTime, this.speed);
            }
        } else {
            // Lost sight, go to last known position
            if (this.lastSeenPlayerPos) {
                this.moveTowards(this.lastSeenPlayerPos, deltaTime, this.speed);
                
                const dist = BABYLON.Vector3.Distance(this.mesh.position, this.lastSeenPlayerPos);
                if (dist < 2) {
                    this.state = NPCState.ALERT;
                }
            }
        }
    }
    
    updateCombat(deltaTime, player) {
        if (!this.canSeePlayer(player)) {
            // Lost sight
            const timeSinceSeen = performance.now() - this.lastSeenPlayerTime;
            
            if (timeSinceSeen > 2000) {
                this.state = NPCState.CHASE;
                return;
            }
        } else {
            this.lastSeenPlayerPos = player.collider.position.clone();
            this.lastSeenPlayerTime = performance.now();
        }
        
        // Look at player
        this.lookAt(player.collider.position);
        
        const distance = BABYLON.Vector3.Distance(this.mesh.position, player.collider.position);
        
        // Move to optimal combat range
        if (distance > 25) {
            this.moveTowards(player.collider.position, deltaTime, this.speed * 0.8);
        } else if (distance < 8) {
            // Too close, back up a bit
            const awayDir = this.mesh.position.subtract(player.collider.position).normalize();
            const backupPos = this.mesh.position.add(awayDir.scale(5));
            this.moveTowards(backupPos, deltaTime, this.speed * 0.5);
        } else {
            // Strafe randomly
            if (Math.random() < 0.02) {
                const strafeDir = Math.random() > 0.5 ? 1 : -1;
                const strafeVec = new BABYLON.Vector3(
                    Math.sin(this.mesh.rotation.y) * strafeDir,
                    0,
                    Math.cos(this.mesh.rotation.y) * strafeDir
                );
                this.targetPosition = this.mesh.position.add(strafeVec.scale(3));
            }
            
            if (this.targetPosition) {
                this.moveTowards(this.targetPosition, deltaTime, this.speed * 0.5);
            }
        }
        
        // Fire at player
        this.tryFireAtPlayer(player);
    }
    
    moveTowards(target, deltaTime, speed) {
        const direction = target.subtract(this.mesh.position);
        direction.y = 0;
        const distance = direction.length();
        
        if (distance > 0.1) {
            direction.normalize();
            
            // Move directly (no physics)
            const movement = direction.scale(speed * deltaTime);
            this.mesh.position.addInPlace(movement);
            
            // Rotate towards target
            const targetRotation = Math.atan2(direction.x, direction.z);
            this.mesh.rotation.y = Utils.lerp(
                this.mesh.rotation.y,
                targetRotation,
                deltaTime * this.rotationSpeed
            );
        }
        
        return distance;
    }
    
    lookAt(target) {
        const direction = target.subtract(this.mesh.position);
        direction.y = 0;
        
        if (direction.length() > 0) {
            direction.normalize();
            const targetRotation = Math.atan2(direction.x, direction.z);
            this.mesh.rotation.y = targetRotation;
        }
    }
    
    canSeePlayer(player) {
        if (player.isDead) return false;
        
        const playerPos = player.collider.position;
        const npcPos = this.mesh.position;
        
        // Distance check
        const distance = BABYLON.Vector3.Distance(npcPos, playerPos);
        if (distance > this.viewDistance) return false;
        
        // Angle check (field of view)
        const toPlayer = playerPos.subtract(npcPos).normalize();
        const forward = new BABYLON.Vector3(
            Math.sin(this.mesh.rotation.y),
            0,
            Math.cos(this.mesh.rotation.y)
        );
        
        const dot = BABYLON.Vector3.Dot(forward, toPlayer);
        const angle = Math.acos(dot) * 180 / Math.PI;
        
        if (angle > this.viewAngle / 2) return false;
        
        // Line of sight check (raycast)
        const rayStart = npcPos.clone();
        rayStart.y += 1.5; // Eye level
        
        const rayEnd = playerPos.clone();
        rayEnd.y += 1; // Player chest level
        
        const direction = rayEnd.subtract(rayStart).normalize();
        const ray = new BABYLON.Ray(rayStart, direction, distance);
        
        const hit = this.scene.pickWithRay(ray, (mesh) => {
            return mesh !== this.mesh && 
                   mesh !== player.collider && 
                   mesh.isPickable &&
                   !mesh.name.startsWith('npc_') &&
                   !mesh.name.startsWith('head_') &&
                   !mesh.name.startsWith('weapon_');
        });
        
        // Can see player if no obstruction
        return !hit || !hit.hit || hit.distance > distance - 1;
    }
    
    onPlayerSpotted(player) {
        this.lastSeenPlayerPos = player.collider.position.clone();
        this.lastSeenPlayerTime = performance.now();
        
        if (this.state === NPCState.PATROL || this.state === NPCState.IDLE) {
            // React with delay
            setTimeout(() => {
                if (!this.isDead) {
                    this.state = NPCState.COMBAT;
                }
            }, this.reactionTime);
        }
    }
    
    tryFireAtPlayer(player) {
        const now = performance.now();
        
        if (now - this.lastFireTime < this.fireRate) return;
        
        // Check if we can actually see the player
        if (!this.canSeePlayer(player)) return;
        
        this.lastFireTime = now;
        
        // Accuracy check
        const hit = Math.random() < this.accuracy;
        
        if (hit) {
            // Calculate damage based on distance (falloff)
            const distance = BABYLON.Vector3.Distance(this.mesh.position, player.collider.position);
            let damage = this.damage;
            
            if (distance > 20) {
                damage *= 0.7;
            } else if (distance > 30) {
                damage *= 0.5;
            }
            
            player.takeDamage(damage);
        }
        
        // Visual/audio feedback for shot
        this.createMuzzleFlash();
        Utils.playSound(this.scene, 'shoot');
    }
    
    createMuzzleFlash() {
        if (!this.bodyParts.weapon) return;
        
        const flash = BABYLON.MeshBuilder.CreateSphere("npcFlash", { diameter: 0.15 }, this.scene);
        flash.parent = this.bodyParts.weapon;
        flash.position = new BABYLON.Vector3(0, 0, 0.3);
        
        const flashMat = new BABYLON.StandardMaterial("npcFlashMat", this.scene);
        flashMat.emissiveColor = new BABYLON.Color3(1, 0.8, 0.2);
        flashMat.disableLighting = true;
        flash.material = flashMat;
        
        setTimeout(() => {
            flash.dispose();
        }, 50);
    }
    
    takeDamage(amount) {
        if (this.isDead) return false;
        
        this.health -= amount;
        
        // Flash red when hit
        if (this.mesh.material) {
            const originalColor = this.mesh.material.diffuseColor.clone();
            this.mesh.material.diffuseColor = new BABYLON.Color3(1, 0, 0);
            
            setTimeout(() => {
                if (this.mesh.material) {
                    this.mesh.material.diffuseColor = originalColor;
                }
            }, 100);
        }
        
        // Alert nearby NPCs
        this.alertNearbyNPCs();
        
        if (this.health <= 0) {
            this.die();
            return true;
        }
        
        // If not in combat, enter combat state
        if (this.state !== NPCState.COMBAT) {
            this.state = NPCState.ALERT;
        }
        
        return false;
    }
    
    alertNearbyNPCs() {
        // Find and alert nearby allied NPCs
        const alertRadius = 20;
        
        this.scene.meshes.forEach(mesh => {
            if (mesh.metadata && mesh.metadata.isNPC && mesh !== this.mesh) {
                if (mesh.metadata.team === this.team) {
                    const distance = BABYLON.Vector3.Distance(this.mesh.position, mesh.position);
                    
                    if (distance < alertRadius) {
                        const npc = mesh.metadata.npcInstance;
                        if (npc && npc.state === NPCState.PATROL) {
                            npc.state = NPCState.ALERT;
                            npc.lastSeenPlayerPos = this.lastSeenPlayerPos || this.mesh.position.clone();
                        }
                    }
                }
            }
        });
    }
    
    die() {
        this.isDead = true;
        this.state = NPCState.DEAD;
        
        // Fall animation
        const fallAnimation = () => {
            this.mesh.rotation.x += 0.1;
            if (this.mesh.rotation.x < Math.PI / 2) {
                requestAnimationFrame(fallAnimation);
            }
        };
        fallAnimation();
        
        // Fade out and remove after delay
        setTimeout(() => {
            const fadeOut = setInterval(() => {
                if (this.mesh.material) {
                    this.mesh.material.alpha -= 0.05;
                    if (this.mesh.material.alpha <= 0) {
                        clearInterval(fadeOut);
                        this.dispose();
                    }
                }
            }, 50);
        }, 3000);
        
        // Notify game
        if (window.gameInstance) {
            window.gameInstance.onNPCDeath(this);
        }
    }
    
    dispose() {
        if (this.mesh) {
            // Dispose all children first
            this.mesh.getChildMeshes().forEach(child => child.dispose());
            this.mesh.dispose();
            this.mesh = null;
        }
    }
}

class NPCManager {
    constructor(scene) {
        this.scene = scene;
        this.npcs = [];
    }
    
    spawnNPCs(team, count, spawnPoints) {
        const shuffledSpawns = Utils.shuffle(spawnPoints);
        
        for (let i = 0; i < count && i < shuffledSpawns.length; i++) {
            const npc = new NPC(this.scene, shuffledSpawns[i], team, i);
            this.npcs.push(npc);
        }
    }
    
    update(deltaTime, player) {
        for (const npc of this.npcs) {
            npc.update(deltaTime, player);
        }
    }
    
    getAliveCount(team = null) {
        return this.npcs.filter(npc => {
            const alive = !npc.isDead;
            if (team) {
                return alive && npc.team === team;
            }
            return alive;
        }).length;
    }
    
    dispose() {
        this.npcs.forEach(npc => npc.dispose());
        this.npcs = [];
    }
}
