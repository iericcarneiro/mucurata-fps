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
        this.damage = 12;
        this.accuracy = 0.5;
        this.reactionTime = 200; // ms to react to player (faster!)
        this.fireRate = 350; // ms between shots (faster!)
        
        // State
        this.state = NPCState.PATROL;
        this.isDead = false;
        this.isAggro = false; // Once aggro, NEVER stops hunting!
        this.lastFireTime = 0;
        this.lastSeenPlayerTime = 0;
        this.lastSeenPlayerPos = null;
        
        // Movement
        this.speed = 4;
        this.rotationSpeed = 3;
        this.patrolPoints = [];
        this.currentPatrolIndex = 0;
        this.targetPosition = null;
        
        // Detection - can see far!
        this.viewDistance = 80;
        this.viewAngle = 150; // degrees
        this.hearingDistance = 30;
        
        // Mesh
        this.mesh = null;
        this.bodyParts = {};
        
        // Create NPC
        this.create(position);
    }
    
    create(position) {
        // Root transform for the NPC
        const root = new BABYLON.TransformNode(`npc_root_${this.id}`, this.scene);
        root.position = position.clone();
        
        // Materials based on team
        const skinMat = new BABYLON.StandardMaterial(`skinMat_${this.id}`, this.scene);
        skinMat.diffuseColor = new BABYLON.Color3(0.76, 0.57, 0.42); // Skin tone
        
        const clothesMat = new BABYLON.StandardMaterial(`clothesMat_${this.id}`, this.scene);
        if (this.team === 'police') {
            clothesMat.diffuseColor = new BABYLON.Color3(0.1, 0.15, 0.35); // Dark blue uniform
        } else {
            clothesMat.diffuseColor = new BABYLON.Color3(0.25, 0.2, 0.15); // Brown/tan clothes
        }
        
        const pantsMat = new BABYLON.StandardMaterial(`pantsMat_${this.id}`, this.scene);
        pantsMat.diffuseColor = this.team === 'police' 
            ? new BABYLON.Color3(0.1, 0.1, 0.2) 
            : new BABYLON.Color3(0.15, 0.12, 0.1);
        
        // === BODY PARTS ===
        
        // Torso (main body)
        const torso = BABYLON.MeshBuilder.CreateBox(`torso_${this.id}`, {
            width: 0.45, height: 0.55, depth: 0.25
        }, this.scene);
        torso.position.y = 1.1;
        torso.parent = root;
        torso.material = clothesMat;
        
        // Head
        const head = BABYLON.MeshBuilder.CreateSphere(`head_${this.id}`, {
            diameter: 0.28, segments: 12
        }, this.scene);
        head.position.y = 1.55;
        head.parent = root;
        head.material = skinMat;
        
        // Neck
        const neck = BABYLON.MeshBuilder.CreateCylinder(`neck_${this.id}`, {
            diameter: 0.12, height: 0.12
        }, this.scene);
        neck.position.y = 1.38;
        neck.parent = root;
        neck.material = skinMat;
        
        // === ARMS ===
        
        // Left upper arm
        const leftUpperArm = BABYLON.MeshBuilder.CreateBox(`lUpperArm_${this.id}`, {
            width: 0.12, height: 0.3, depth: 0.12
        }, this.scene);
        leftUpperArm.position = new BABYLON.Vector3(-0.32, 1.2, 0);
        leftUpperArm.parent = root;
        leftUpperArm.material = clothesMat;
        
        // Left lower arm
        const leftLowerArm = BABYLON.MeshBuilder.CreateBox(`lLowerArm_${this.id}`, {
            width: 0.1, height: 0.28, depth: 0.1
        }, this.scene);
        leftLowerArm.position = new BABYLON.Vector3(-0.32, 0.9, 0.1);
        leftLowerArm.rotation.x = -0.5;
        leftLowerArm.parent = root;
        leftLowerArm.material = skinMat;
        
        // Right upper arm
        const rightUpperArm = BABYLON.MeshBuilder.CreateBox(`rUpperArm_${this.id}`, {
            width: 0.12, height: 0.3, depth: 0.12
        }, this.scene);
        rightUpperArm.position = new BABYLON.Vector3(0.32, 1.2, 0);
        rightUpperArm.parent = root;
        rightUpperArm.material = clothesMat;
        
        // Right lower arm (holds weapon)
        const rightLowerArm = BABYLON.MeshBuilder.CreateBox(`rLowerArm_${this.id}`, {
            width: 0.1, height: 0.28, depth: 0.1
        }, this.scene);
        rightLowerArm.position = new BABYLON.Vector3(0.32, 0.9, 0.15);
        rightLowerArm.rotation.x = -0.7;
        rightLowerArm.parent = root;
        rightLowerArm.material = skinMat;
        
        // === LEGS ===
        
        // Left upper leg
        const leftUpperLeg = BABYLON.MeshBuilder.CreateBox(`lUpperLeg_${this.id}`, {
            width: 0.15, height: 0.4, depth: 0.15
        }, this.scene);
        leftUpperLeg.position = new BABYLON.Vector3(-0.12, 0.6, 0);
        leftUpperLeg.parent = root;
        leftUpperLeg.material = pantsMat;
        
        // Left lower leg
        const leftLowerLeg = BABYLON.MeshBuilder.CreateBox(`lLowerLeg_${this.id}`, {
            width: 0.12, height: 0.4, depth: 0.12
        }, this.scene);
        leftLowerLeg.position = new BABYLON.Vector3(-0.12, 0.2, 0);
        leftLowerLeg.parent = root;
        leftLowerLeg.material = pantsMat;
        
        // Right upper leg
        const rightUpperLeg = BABYLON.MeshBuilder.CreateBox(`rUpperLeg_${this.id}`, {
            width: 0.15, height: 0.4, depth: 0.15
        }, this.scene);
        rightUpperLeg.position = new BABYLON.Vector3(0.12, 0.6, 0);
        rightUpperLeg.parent = root;
        rightUpperLeg.material = pantsMat;
        
        // Right lower leg
        const rightLowerLeg = BABYLON.MeshBuilder.CreateBox(`rLowerLeg_${this.id}`, {
            width: 0.12, height: 0.4, depth: 0.12
        }, this.scene);
        rightLowerLeg.position = new BABYLON.Vector3(0.12, 0.2, 0);
        rightLowerLeg.parent = root;
        rightLowerLeg.material = pantsMat;
        
        // === WEAPON ===
        const weapon = this.createNPCWeapon(root);
        
        // === COLLISION BOX (invisible) ===
        const collider = BABYLON.MeshBuilder.CreateBox(`collider_${this.id}`, {
            width: 0.6, height: 1.8, depth: 0.5
        }, this.scene);
        collider.position.y = 0.9;
        collider.parent = root;
        collider.visibility = 0;
        collider.checkCollisions = true;
        collider.isPickable = true;
        
        // Set metadata for hit detection
        collider.metadata = {
            isNPC: true,
            npcInstance: this,
            team: this.team
        };
        
        // Store references
        this.mesh = root;
        this.collider = collider;
        this.bodyParts = {
            head, torso, neck,
            leftUpperArm, leftLowerArm,
            rightUpperArm, rightLowerArm,
            leftUpperLeg, leftLowerLeg,
            rightUpperLeg, rightLowerLeg,
            weapon
        };
        
        // Animation state
        this.walkCycle = 0;
        this.isCrouching = false;
        
        // Generate patrol points around spawn
        this.generatePatrolPoints(position);
    }
    
    createNPCWeapon(parent) {
        const weaponMat = new BABYLON.StandardMaterial(`weaponMat_${this.id}`, this.scene);
        weaponMat.diffuseColor = new BABYLON.Color3(0.12, 0.12, 0.12);
        weaponMat.specularColor = new BABYLON.Color3(0.4, 0.4, 0.4);
        
        const woodMat = new BABYLON.StandardMaterial(`woodMat_${this.id}`, this.scene);
        woodMat.diffuseColor = new BABYLON.Color3(0.35, 0.22, 0.12);
        
        // Weapon container
        const weaponRoot = new BABYLON.TransformNode(`weaponRoot_${this.id}`, this.scene);
        weaponRoot.position = new BABYLON.Vector3(0.28, 0.95, 0.25);
        weaponRoot.rotation = new BABYLON.Vector3(-0.4, 0.1, 0);
        weaponRoot.parent = parent;
        
        if (this.team === 'police') {
            // === RIFLE (M4/AR style) ===
            
            // Barrel
            const barrel = BABYLON.MeshBuilder.CreateCylinder(`barrel_${this.id}`, {
                diameter: 0.025, height: 0.4
            }, this.scene);
            barrel.rotation.x = Math.PI / 2;
            barrel.position.z = 0.35;
            barrel.parent = weaponRoot;
            barrel.material = weaponMat;
            
            // Handguard
            const handguard = BABYLON.MeshBuilder.CreateBox(`handguard_${this.id}`, {
                width: 0.04, height: 0.045, depth: 0.18
            }, this.scene);
            handguard.position.z = 0.2;
            handguard.parent = weaponRoot;
            handguard.material = weaponMat;
            
            // Receiver
            const receiver = BABYLON.MeshBuilder.CreateBox(`receiver_${this.id}`, {
                width: 0.035, height: 0.08, depth: 0.15
            }, this.scene);
            receiver.position = new BABYLON.Vector3(0, 0.02, 0.02);
            receiver.parent = weaponRoot;
            receiver.material = weaponMat;
            
            // Magazine
            const mag = BABYLON.MeshBuilder.CreateBox(`mag_${this.id}`, {
                width: 0.02, height: 0.1, depth: 0.045
            }, this.scene);
            mag.position = new BABYLON.Vector3(0, -0.06, 0.02);
            mag.rotation.x = 0.1;
            mag.parent = weaponRoot;
            mag.material = weaponMat;
            
            // Stock
            const stock = BABYLON.MeshBuilder.CreateBox(`stock_${this.id}`, {
                width: 0.03, height: 0.05, depth: 0.15
            }, this.scene);
            stock.position = new BABYLON.Vector3(0, 0, -0.12);
            stock.parent = weaponRoot;
            stock.material = weaponMat;
            
            // Sight
            const sight = BABYLON.MeshBuilder.CreateBox(`sight_${this.id}`, {
                width: 0.015, height: 0.025, depth: 0.06
            }, this.scene);
            sight.position = new BABYLON.Vector3(0, 0.06, 0.02);
            sight.parent = weaponRoot;
            sight.material = weaponMat;
            
        } else {
            // === SHOTGUN or PISTOL (random) ===
            
            if (Math.random() > 0.5) {
                // Shotgun
                
                // Barrel
                const barrel = BABYLON.MeshBuilder.CreateCylinder(`barrel_${this.id}`, {
                    diameter: 0.035, height: 0.5
                }, this.scene);
                barrel.rotation.x = Math.PI / 2;
                barrel.position.z = 0.3;
                barrel.parent = weaponRoot;
                barrel.material = weaponMat;
                
                // Pump
                const pump = BABYLON.MeshBuilder.CreateCylinder(`pump_${this.id}`, {
                    diameter: 0.045, height: 0.12
                }, this.scene);
                pump.rotation.x = Math.PI / 2;
                pump.position.z = 0.15;
                pump.parent = weaponRoot;
                pump.material = weaponMat;
                
                // Stock
                const stock = BABYLON.MeshBuilder.CreateBox(`stock_${this.id}`, {
                    width: 0.05, height: 0.1, depth: 0.2
                }, this.scene);
                stock.position = new BABYLON.Vector3(0, -0.02, -0.1);
                stock.parent = weaponRoot;
                stock.material = woodMat;
                
            } else {
                // Pistol
                
                // Slide
                const slide = BABYLON.MeshBuilder.CreateBox(`slide_${this.id}`, {
                    width: 0.025, height: 0.03, depth: 0.14
                }, this.scene);
                slide.position.z = 0.07;
                slide.parent = weaponRoot;
                slide.material = weaponMat;
                
                // Grip
                const grip = BABYLON.MeshBuilder.CreateBox(`grip_${this.id}`, {
                    width: 0.022, height: 0.08, depth: 0.06
                }, this.scene);
                grip.position = new BABYLON.Vector3(0, -0.04, -0.02);
                grip.rotation.x = 0.2;
                grip.parent = weaponRoot;
                grip.material = weaponMat;
                
                // Trigger guard
                const guard = BABYLON.MeshBuilder.CreateTorus(`guard_${this.id}`, {
                    diameter: 0.03, thickness: 0.004, tessellation: 12
                }, this.scene);
                guard.position = new BABYLON.Vector3(0, -0.02, 0.03);
                guard.rotation.y = Math.PI / 2;
                guard.parent = weaponRoot;
                guard.material = weaponMat;
            }
        }
        
        return weaponRoot;
    }
    
    // Walking animation
    animateWalk(deltaTime, isMoving) {
        if (!isMoving) {
            // Reset to idle pose
            this.walkCycle = 0;
            this.resetLimbPositions();
            return;
        }
        
        this.walkCycle += deltaTime * 8;
        const swing = Math.sin(this.walkCycle) * 0.4;
        
        // Leg swing
        if (this.bodyParts.leftUpperLeg) {
            this.bodyParts.leftUpperLeg.rotation.x = swing;
            this.bodyParts.rightUpperLeg.rotation.x = -swing;
        }
        
        // Arm swing (opposite to legs)
        if (this.bodyParts.leftUpperArm) {
            this.bodyParts.leftUpperArm.rotation.x = -swing * 0.5;
        }
        
        // Subtle body bob
        if (this.bodyParts.torso) {
            this.bodyParts.torso.position.y = 1.1 + Math.abs(Math.sin(this.walkCycle * 2)) * 0.02;
        }
    }
    
    resetLimbPositions() {
        if (this.bodyParts.leftUpperLeg) {
            this.bodyParts.leftUpperLeg.rotation.x = 0;
            this.bodyParts.rightUpperLeg.rotation.x = 0;
            this.bodyParts.leftUpperArm.rotation.x = 0;
        }
        if (this.bodyParts.torso) {
            this.bodyParts.torso.position.y = this.isCrouching ? 0.7 : 1.1;
        }
    }
    
    // Crouch for cover
    setCrouch(crouching) {
        if (this.isCrouching === crouching) return;
        this.isCrouching = crouching;
        
        const targetY = crouching ? -0.4 : 0;
        
        // Animate crouch
        Object.values(this.bodyParts).forEach(part => {
            if (part && part.position) {
                part.position.y += targetY - (crouching ? 0 : -0.4);
            }
        });
    }
    
    applyGravity(deltaTime) {
        // Raycast down to find ground
        const rayStart = this.mesh.position.clone();
        rayStart.y += 1; // Start from above feet
        
        const ray = new BABYLON.Ray(rayStart, new BABYLON.Vector3(0, -1, 0), 50);
        const hit = this.scene.pickWithRay(ray, (mesh) => {
            return mesh.checkCollisions && 
                   mesh.isPickable &&
                   !mesh.name.includes('npc_') && 
                   !mesh.name.includes('collider_') &&
                   !mesh.name.includes('head_') &&
                   !mesh.name.includes('torso_') &&
                   !mesh.name.includes('weapon') &&
                   !mesh.name.includes('Arm') &&
                   !mesh.name.includes('Leg') &&
                   mesh.name !== 'playerCollider';
        });
        
        if (hit && hit.hit && hit.pickedPoint) {
            const groundY = hit.pickedPoint.y;
            const currentY = this.mesh.position.y;
            
            // If above ground, apply gravity
            if (currentY > groundY + 0.1) {
                this.mesh.position.y -= 15 * deltaTime; // Fall speed
            } else {
                // Snap to ground
                this.mesh.position.y = groundY;
            }
        } else {
            // No ground found, fall towards 0
            if (this.mesh.position.y > 0) {
                this.mesh.position.y -= 15 * deltaTime;
            } else {
                this.mesh.position.y = 0;
            }
        }
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
        
        // Apply gravity - keep NPC on ground
        this.applyGravity(deltaTime);
        
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
        // If aggro, go straight to combat - no stopping!
        if (this.isAggro) {
            this.state = NPCState.COMBAT;
            return;
        }
        
        // Look around, move towards last known position
        if (this.lastSeenPlayerPos) {
            this.moveTowards(this.lastSeenPlayerPos, deltaTime, this.speed * 0.7);
            this.lookAt(this.lastSeenPlayerPos);
            
            // Check if reached last known position
            const dist = BABYLON.Vector3.Distance(this.mesh.position, this.lastSeenPlayerPos);
            if (dist < 2) {
                // Player not here, go back to patrol
                setTimeout(() => {
                    if (this.state === NPCState.ALERT && !this.isAggro) {
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
        // If aggro, go to combat mode - relentless pursuit!
        if (this.isAggro) {
            this.state = NPCState.COMBAT;
            return;
        }
        
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
        // If aggro, ALWAYS know where player is (hunting instinct)
        if (this.isAggro) {
            this.lastSeenPlayerPos = player.collider.position.clone();
            this.lastSeenPlayerTime = performance.now();
        }
        
        // Always look at player's last known position
        const targetPos = this.canSeePlayer(player) 
            ? player.collider.position 
            : this.lastSeenPlayerPos;
            
        if (targetPos) {
            this.lookAt(targetPos);
        }
        
        if (!this.canSeePlayer(player)) {
            // Lost sight - but if aggro, keep hunting!
            if (this.isAggro) {
                // Hunt forever - SPRINT towards player!
                this.moveTowards(player.collider.position, deltaTime, this.speed * 1.5);
                
                // Try to fire in player's direction
                const distance = BABYLON.Vector3.Distance(this.mesh.position, player.collider.position);
                if (distance < 70) {
                    this.tryFireAtPlayer(player);
                }
                return;
            }
            
            const timeSinceSeen = performance.now() - this.lastSeenPlayerTime;
            
            if (timeSinceSeen > 3000) {
                this.state = NPCState.CHASE;
                return;
            }
            
            // Move to last known position
            if (this.lastSeenPlayerPos) {
                this.moveTowards(this.lastSeenPlayerPos, deltaTime, this.speed);
            }
        } else {
            // Can see player - update position and FIGHT!
            this.lastSeenPlayerPos = player.collider.position.clone();
            this.lastSeenPlayerTime = performance.now();
            
            const distance = BABYLON.Vector3.Distance(this.mesh.position, player.collider.position);
            
            // Aggro NPCs are more aggressive - chase harder!
            const chaseSpeed = this.isAggro ? this.speed * 1.3 : this.speed;
            
            // Move and shoot - fight from distance!
            if (distance > 40) {
                // Far away - RUN towards player while shooting
                this.moveTowards(player.collider.position, deltaTime, chaseSpeed);
            } else if (distance < 8) {
                // Too close - back up while shooting
                const awayDir = this.mesh.position.subtract(player.collider.position).normalize();
                const backupPos = this.mesh.position.add(awayDir.scale(5));
                this.moveTowards(backupPos, deltaTime, this.speed * 0.6);
            } else {
                // Good range - strafe and shoot
                if (Math.random() < 0.03) {
                    const strafeDir = Math.random() > 0.5 ? 1 : -1;
                    const strafeVec = new BABYLON.Vector3(
                        Math.sin(this.mesh.rotation.y) * strafeDir,
                        0,
                        Math.cos(this.mesh.rotation.y) * strafeDir
                    );
                    this.targetPosition = this.mesh.position.add(strafeVec.scale(4));
                }
                
                if (this.targetPosition) {
                    this.moveTowards(this.targetPosition, deltaTime, this.speed * 0.4);
                }
            }
            
            // ALWAYS try to fire when in combat and can see player!
            this.tryFireAtPlayer(player);
        }
    }
    
    moveTowards(target, deltaTime, speed) {
        const direction = target.subtract(this.mesh.position);
        direction.y = 0;
        const distance = direction.length();
        
        if (distance > 0.1) {
            direction.normalize();
            
            // Check for collisions before moving
            const movement = direction.scale(speed * deltaTime);
            const nextPos = this.mesh.position.add(movement);
            
            // Wall collision check
            if (!this.checkCollision(nextPos)) {
                this.mesh.position.addInPlace(movement);
            } else {
                // Try sliding along walls
                const slideX = new BABYLON.Vector3(movement.x, 0, 0);
                const slideZ = new BABYLON.Vector3(0, 0, movement.z);
                
                if (!this.checkCollision(this.mesh.position.add(slideX))) {
                    this.mesh.position.addInPlace(slideX);
                } else if (!this.checkCollision(this.mesh.position.add(slideZ))) {
                    this.mesh.position.addInPlace(slideZ);
                }
            }
            
            // Rotate towards target
            const targetRotation = Math.atan2(direction.x, direction.z);
            this.mesh.rotation.y = Utils.lerp(
                this.mesh.rotation.y,
                targetRotation,
                deltaTime * this.rotationSpeed
            );
            
            // Animate walking
            this.animateWalk(deltaTime, true);
        } else {
            this.animateWalk(deltaTime, false);
        }
        
        return distance;
    }
    
    checkCollision(position) {
        // Raycast to check for walls/obstacles
        const rayStart = position.clone();
        rayStart.y = 0.5;
        
        const directions = [
            new BABYLON.Vector3(1, 0, 0),
            new BABYLON.Vector3(-1, 0, 0),
            new BABYLON.Vector3(0, 0, 1),
            new BABYLON.Vector3(0, 0, -1),
        ];
        
        for (const dir of directions) {
            const ray = new BABYLON.Ray(rayStart, dir, 0.4);
            const hit = this.scene.pickWithRay(ray, (mesh) => {
                return mesh.checkCollisions && 
                       !mesh.name.includes('npc_') && 
                       !mesh.name.includes('collider_') &&
                       !mesh.name.includes('player') &&
                       mesh.name !== 'ground';
            });
            
            if (hit && hit.hit) {
                return true;
            }
        }
        
        // Check collision with other NPCs
        const npcs = this.scene.meshes.filter(m => 
            m.name.startsWith('collider_') && 
            m !== this.collider &&
            m.metadata?.isNPC
        );
        
        for (const npc of npcs) {
            const dist = BABYLON.Vector3.Distance(position, npc.parent.position);
            if (dist < 0.8) {
                return true;
            }
        }
        
        return false;
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
        
        const flash = BABYLON.MeshBuilder.CreateSphere(`npcFlash_${this.id}`, { diameter: 0.12 }, this.scene);
        flash.parent = this.bodyParts.weapon;
        flash.position = new BABYLON.Vector3(0, 0, 0.25);
        
        const flashMat = new BABYLON.StandardMaterial(`npcFlashMat_${this.id}`, this.scene);
        flashMat.emissiveColor = new BABYLON.Color3(1, 0.7, 0.2);
        flashMat.disableLighting = true;
        flash.material = flashMat;
        
        // Weapon kick animation
        if (this.bodyParts.rightLowerArm) {
            const origRot = this.bodyParts.rightLowerArm.rotation.x;
            this.bodyParts.rightLowerArm.rotation.x = origRot - 0.15;
            
            setTimeout(() => {
                if (this.bodyParts.rightLowerArm) {
                    this.bodyParts.rightLowerArm.rotation.x = origRot;
                }
            }, 80);
        }
        
        setTimeout(() => {
            flash.dispose();
            flashMat.dispose();
        }, 60);
    }
    
    takeDamage(amount, hitPart = null, isMelee = false) {
        if (isMelee) console.log('🎯 NPC.takeDamage START, amount:', amount);
        if (this.isDead) return false;
        
        // Headshot bonus damage
        if (hitPart && hitPart.name && hitPart.name.includes('head')) {
            amount *= 2.5;
        }
        
        // Store melee flag for fireBackAtPlayer
        this._lastHitWasMelee = isMelee;
        if (isMelee) console.log('🎯 NPC health before:', this.health);
        
        this.health -= amount;
        if (isMelee) console.log('🎯 NPC health after:', this.health);
        
        // Flash red when hit - all body parts (quick, non-blocking)
        try {
            if (isMelee) console.log('🎯 Flashing body parts red...');
            Object.values(this.bodyParts).forEach(part => {
                if (part && part.material && part.material.diffuseColor) {
                    const original = part.material.diffuseColor.clone();
                    part.material.diffuseColor = new BABYLON.Color3(1, 0.2, 0.2);
                    
                    setTimeout(() => {
                        if (part && part.material) {
                            part.material.diffuseColor = original;
                        }
                    }, 80);
                }
            });
            if (isMelee) console.log('🎯 Body flash done');
        } catch (e) {
            console.error('🔴 Body flash error:', e);
        }
        
        // Alert nearby NPCs
        try {
            if (isMelee) console.log('🎯 Alerting nearby NPCs...');
            this.alertNearbyNPCs();
            if (isMelee) console.log('🎯 Alert done');
        } catch (e) {
            console.error('🔴 Alert NPCs error:', e);
        }
        
        if (this.health <= 0) {
            if (isMelee) console.log('🎯 NPC KILLED! Calling die()...');
            this.die();
            if (isMelee) console.log('🎯 die() done');
            return true;
        }
        
        // IMMEDIATELY enter combat and fight back!
        this.state = NPCState.COMBAT;
        this.isAggro = true; // PERMANENTLY AGGRO - will hunt until death!
        
        // Try to find where the shot came from (player position)
        if (window.gameInstance && window.gameInstance.player) {
            const player = window.gameInstance.player;
            this.lastSeenPlayerPos = player.collider.position.clone();
            this.lastSeenPlayerTime = performance.now();
            
            // Look at player immediately
            try {
                if (isMelee) console.log('🎯 Looking at player...');
                this.lookAt(player.collider.position);
                if (isMelee) console.log('🎯 lookAt done');
            } catch (e) {
                console.error('🔴 lookAt error:', e);
            }
            
            // SHOOT BACK IMMEDIATELY - even from far away!
            try {
                if (isMelee) console.log('🎯 Firing back at player...');
                this.fireBackAtPlayer(player);
                if (isMelee) console.log('🎯 fireBack done');
            } catch (e) {
                console.error('🔴 fireBack error:', e);
            }
        }
        
        if (isMelee) console.log('🎯 NPC.takeDamage END');
        return false;
    }
    
    // Special method to fire back when hit - ignores distance/visibility
    fireBackAtPlayer(player) {
        if (this.isDead || !player || player.isDead) return;
        if (!this.mesh || !player.collider) return;
        
        try {
            // Calculate distance for accuracy falloff
            const distance = BABYLON.Vector3.Distance(this.mesh.position, player.collider.position);
        
        // Accuracy decreases with distance but still has a chance
        let accuracy = this.accuracy;
        if (distance > 30) accuracy *= 0.7;
        if (distance > 50) accuracy *= 0.6;
        if (distance > 70) accuracy *= 0.5;
        
        // Always at least 20% chance to hit
        accuracy = Math.max(0.2, accuracy);
        
        const hit = Math.random() < accuracy;
        
        if (hit) {
            let damage = this.damage;
            // Damage falloff at range
            if (distance > 30) damage *= 0.8;
            if (distance > 50) damage *= 0.7;
            
            player.takeDamage(damage);
        }
        
        // Visual/audio feedback (skip flash if player is very close - melee range)
        if (distance > 4) {
            this.createMuzzleFlash();
        }
        Utils.playSound(this.scene, 'shoot');
        
        // Reset fire time so they can keep shooting
        this.lastFireTime = performance.now();
        } catch (e) {
            console.error('fireBackAtPlayer error:', e);
        }
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
        
        // Ragdoll-like fall animation
        const fallDirection = (Math.random() - 0.5) * 2;
        let fallProgress = 0;
        
        const fallAnimation = () => {
            fallProgress += 0.08;
            
            // Rotate the whole body
            this.mesh.rotation.x = Math.min(fallProgress * 1.5, Math.PI / 2);
            this.mesh.rotation.z = fallDirection * fallProgress * 0.3;
            
            // Drop down
            if (this.mesh.position.y > 0.3) {
                this.mesh.position.y -= 0.05;
            }
            
            // Limbs go limp
            if (this.bodyParts.leftUpperArm) {
                this.bodyParts.leftUpperArm.rotation.x = fallProgress;
                this.bodyParts.rightUpperArm.rotation.x = fallProgress * 0.8;
                this.bodyParts.leftUpperLeg.rotation.x = fallProgress * 0.5;
                this.bodyParts.rightUpperLeg.rotation.x = -fallProgress * 0.3;
            }
            
            if (fallProgress < 1.2) {
                requestAnimationFrame(fallAnimation);
            }
        };
        fallAnimation();
        
        // Disable collision
        if (this.collider) {
            this.collider.checkCollisions = false;
            this.collider.isPickable = false;
        }
        
        // Fade out and remove after delay
        setTimeout(() => {
            let alpha = 1;
            const fadeOut = setInterval(() => {
                alpha -= 0.03;
                
                // Fade all body parts
                Object.values(this.bodyParts).forEach(part => {
                    if (part && part.material) {
                        part.material.alpha = alpha;
                    }
                });
                
                if (alpha <= 0) {
                    clearInterval(fadeOut);
                    this.dispose();
                }
            }, 50);
        }, 4000);
        
        // Notify game
        if (window.gameInstance) {
            window.gameInstance.onNPCDeath(this);
        }
    }
    
    dispose() {
        // Dispose all body parts
        Object.values(this.bodyParts).forEach(part => {
            if (part) {
                if (part.material) part.material.dispose();
                part.dispose();
            }
        });
        this.bodyParts = {};
        
        // Dispose collider
        if (this.collider) {
            this.collider.dispose();
            this.collider = null;
        }
        
        // Dispose root mesh
        if (this.mesh) {
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
