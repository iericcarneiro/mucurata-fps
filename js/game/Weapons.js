/**
 * Weapons System for Favela Wars FPS
 */

const WeaponTypes = {
    SHOTGUN: 'shotgun',
    SNIPER: 'sniper',
    AR15: 'ar15',
    PISTOL: 'pistol',
    KNIFE: 'knife',
    GRENADE: 'grenade'
};

const WeaponData = {
    [WeaponTypes.SHOTGUN]: {
        name: 'Shotgun',
        damage: 25, // Per pellet, 8 pellets
        pellets: 8,
        spread: 0.15,
        range: 15,
        fireRate: 900, // ms between shots (pump action)
        reloadTime: 2500,
        magSize: 6,
        reserveAmmo: 24,
        automatic: false,
        recoil: 0.15,
        moveSpeed: 0.9
    },
    [WeaponTypes.SNIPER]: {
        name: 'Sniper',
        damage: 150,
        pellets: 1,
        spread: 0.001,
        range: 200,
        fireRate: 1500, // Bolt action
        reloadTime: 3000,
        magSize: 5,
        reserveAmmo: 20,
        automatic: false,
        recoil: 0.3,
        moveSpeed: 0.8,
        scopeZoom: 4
    },
    [WeaponTypes.AR15]: {
        name: 'AR-15',
        damage: 28,
        pellets: 1,
        spread: 0.03,
        range: 80,
        fireRate: 100, // Full auto
        reloadTime: 2000,
        magSize: 30,
        reserveAmmo: 120,
        automatic: true,
        recoil: 0.04,
        moveSpeed: 0.95,
        adsZoom: 1.5, // Iron sights zoom
        hasIronSights: true
    },
    [WeaponTypes.PISTOL]: {
        name: 'Pistola',
        damage: 38, // Buffed! Mais potente
        pellets: 1,
        spread: 0.015, // Mais precisa
        range: 50, // Maior alcance
        fireRate: 180, // Semi-auto, um pouco mais rápido
        reloadTime: 1400,
        magSize: 15, // Mais balas
        reserveAmmo: 60,
        automatic: false,
        recoil: 0.06,
        moveSpeed: 1.0
    },
    [WeaponTypes.KNIFE]: {
        name: 'Faca',
        damage: 55, // 100 from behind (instant kill)
        backstabMultiplier: 2,
        range: 2.5,
        fireRate: 500,
        moveSpeed: 1.1,
        recoil: 0 // IMPORTANT: must be 0, not undefined, or camera breaks!
    },
    [WeaponTypes.GRENADE]: {
        name: 'Granada',
        damage: 150,
        radius: 8,
        fuseTime: 2500,
        throwForce: 25
    }
};

class Weapon {
    constructor(scene, camera, type) {
        this.scene = scene;
        this.camera = camera;
        this.type = type;
        this.data = WeaponData[type];
        
        this.ammo = this.data.magSize || 0;
        this.reserveAmmo = this.data.reserveAmmo || 0;
        this.isReloading = false;
        this.lastFireTime = 0;
        this.isAiming = false;
        
        this.mesh = null;
        this.muzzleFlash = null;
        
        this.createWeaponMesh();
    }
    
    createWeaponMesh() {
        // Create weapon model based on type
        const parent = new BABYLON.TransformNode("weaponParent", this.scene);
        parent.parent = this.camera;
        
        switch(this.type) {
            case WeaponTypes.SHOTGUN:
                this.createShotgunMesh(parent);
                break;
            case WeaponTypes.SNIPER:
                this.createSniperMesh(parent);
                break;
            case WeaponTypes.AR15:
                this.createAR15Mesh(parent);
                break;
            case WeaponTypes.PISTOL:
                this.createPistolMesh(parent);
                break;
            case WeaponTypes.KNIFE:
                this.createKnifeMesh(parent);
                break;
        }
        
        this.mesh = parent;
        this.mesh.setEnabled(false);
        
        // Create muzzle flash
        if (this.type !== WeaponTypes.KNIFE && this.type !== WeaponTypes.GRENADE) {
            this.createMuzzleFlash();
        }
    }
    
    createShotgunMesh(parent) {
        const gunMat = new BABYLON.StandardMaterial("shotgunMat", this.scene);
        gunMat.diffuseColor = new BABYLON.Color3(0.2, 0.2, 0.2);
        gunMat.specularColor = new BABYLON.Color3(0.3, 0.3, 0.3);
        
        const woodMat = new BABYLON.StandardMaterial("woodMat", this.scene);
        woodMat.diffuseColor = new BABYLON.Color3(0.4, 0.25, 0.1);
        
        // Barrel
        const barrel = BABYLON.MeshBuilder.CreateCylinder("barrel", {
            diameter: 0.04, height: 0.8
        }, this.scene);
        barrel.rotation.x = Math.PI / 2;
        barrel.position = new BABYLON.Vector3(0.3, -0.15, 0.5);
        barrel.material = gunMat;
        barrel.parent = parent;
        
        // Pump
        const pump = BABYLON.MeshBuilder.CreateCylinder("pump", {
            diameter: 0.05, height: 0.15
        }, this.scene);
        pump.rotation.x = Math.PI / 2;
        pump.position = new BABYLON.Vector3(0.3, -0.15, 0.25);
        pump.material = gunMat;
        pump.parent = parent;
        
        // Stock
        const stock = BABYLON.MeshBuilder.CreateBox("stock", {
            width: 0.06, height: 0.15, depth: 0.3
        }, this.scene);
        stock.position = new BABYLON.Vector3(0.3, -0.18, -0.1);
        stock.material = woodMat;
        stock.parent = parent;
    }
    
    createSniperMesh(parent) {
        const gunMat = new BABYLON.StandardMaterial("sniperMat", this.scene);
        gunMat.diffuseColor = new BABYLON.Color3(0.15, 0.18, 0.15);
        gunMat.specularColor = new BABYLON.Color3(0.2, 0.2, 0.2);
        
        // Long barrel
        const barrel = BABYLON.MeshBuilder.CreateCylinder("barrel", {
            diameter: 0.03, height: 1.0
        }, this.scene);
        barrel.rotation.x = Math.PI / 2;
        barrel.position = new BABYLON.Vector3(0.3, -0.15, 0.6);
        barrel.material = gunMat;
        barrel.parent = parent;
        
        // Body
        const body = BABYLON.MeshBuilder.CreateBox("body", {
            width: 0.05, height: 0.12, depth: 0.4
        }, this.scene);
        body.position = new BABYLON.Vector3(0.3, -0.15, 0.1);
        body.material = gunMat;
        body.parent = parent;
        
        // Scope
        const scope = BABYLON.MeshBuilder.CreateCylinder("scope", {
            diameter: 0.04, height: 0.2
        }, this.scene);
        scope.rotation.x = Math.PI / 2;
        scope.position = new BABYLON.Vector3(0.3, -0.06, 0.2);
        scope.material = gunMat;
        scope.parent = parent;
        
        // Stock
        const stock = BABYLON.MeshBuilder.CreateBox("stock", {
            width: 0.05, height: 0.1, depth: 0.35
        }, this.scene);
        stock.position = new BABYLON.Vector3(0.3, -0.18, -0.2);
        stock.material = gunMat;
        stock.parent = parent;
    }
    
    createAR15Mesh(parent) {
        const gunMat = new BABYLON.StandardMaterial("ar15Mat", this.scene);
        gunMat.diffuseColor = new BABYLON.Color3(0.1, 0.1, 0.1);
        gunMat.specularColor = new BABYLON.Color3(0.4, 0.4, 0.4);
        
        // Barrel
        const barrel = BABYLON.MeshBuilder.CreateCylinder("barrel", {
            diameter: 0.025, height: 0.5
        }, this.scene);
        barrel.rotation.x = Math.PI / 2;
        barrel.position = new BABYLON.Vector3(0.3, -0.15, 0.45);
        barrel.material = gunMat;
        barrel.parent = parent;
        
        // Handguard
        const handguard = BABYLON.MeshBuilder.CreateBox("handguard", {
            width: 0.045, height: 0.05, depth: 0.25
        }, this.scene);
        handguard.position = new BABYLON.Vector3(0.3, -0.15, 0.3);
        handguard.material = gunMat;
        handguard.parent = parent;
        
        // Receiver
        const receiver = BABYLON.MeshBuilder.CreateBox("receiver", {
            width: 0.04, height: 0.1, depth: 0.2
        }, this.scene);
        receiver.position = new BABYLON.Vector3(0.3, -0.12, 0.05);
        receiver.material = gunMat;
        receiver.parent = parent;
        
        // Magazine
        const mag = BABYLON.MeshBuilder.CreateBox("mag", {
            width: 0.025, height: 0.15, depth: 0.06
        }, this.scene);
        mag.position = new BABYLON.Vector3(0.3, -0.24, 0.05);
        mag.rotation.x = 0.1;
        mag.material = gunMat;
        mag.parent = parent;
        
        // Stock
        const stock = BABYLON.MeshBuilder.CreateBox("stock", {
            width: 0.035, height: 0.06, depth: 0.2
        }, this.scene);
        stock.position = new BABYLON.Vector3(0.3, -0.13, -0.15);
        stock.material = gunMat;
        stock.parent = parent;
        
        // Carry handle / sight
        const sight = BABYLON.MeshBuilder.CreateBox("sight", {
            width: 0.02, height: 0.03, depth: 0.1
        }, this.scene);
        sight.position = new BABYLON.Vector3(0.3, -0.05, 0.05);
        sight.material = gunMat;
        sight.parent = parent;
    }
    
    createPistolMesh(parent) {
        const gunMat = new BABYLON.StandardMaterial("pistolMat", this.scene);
        gunMat.diffuseColor = new BABYLON.Color3(0.15, 0.15, 0.15);
        gunMat.specularColor = new BABYLON.Color3(0.5, 0.5, 0.5);
        
        // Slide
        const slide = BABYLON.MeshBuilder.CreateBox("slide", {
            width: 0.03, height: 0.035, depth: 0.18
        }, this.scene);
        slide.position = new BABYLON.Vector3(0.35, -0.2, 0.15);
        slide.material = gunMat;
        slide.parent = parent;
        
        // Frame/Grip
        const grip = BABYLON.MeshBuilder.CreateBox("grip", {
            width: 0.028, height: 0.1, depth: 0.08
        }, this.scene);
        grip.position = new BABYLON.Vector3(0.35, -0.26, 0.05);
        grip.rotation.x = 0.2;
        grip.material = gunMat;
        grip.parent = parent;
        
        // Trigger guard
        const triggerGuard = BABYLON.MeshBuilder.CreateTorus("triggerGuard", {
            diameter: 0.04, thickness: 0.005, tessellation: 16
        }, this.scene);
        triggerGuard.position = new BABYLON.Vector3(0.35, -0.24, 0.1);
        triggerGuard.rotation.y = Math.PI / 2;
        triggerGuard.material = gunMat;
        triggerGuard.parent = parent;
    }
    
    createKnifeMesh(parent) {
        const bladeMat = new BABYLON.StandardMaterial("bladeMat", this.scene);
        bladeMat.diffuseColor = new BABYLON.Color3(0.75, 0.75, 0.8);
        bladeMat.specularColor = new BABYLON.Color3(0.9, 0.9, 0.9);
        bladeMat.specularPower = 64;
        
        const handleMat = new BABYLON.StandardMaterial("handleMat", this.scene);
        handleMat.diffuseColor = new BABYLON.Color3(0.15, 0.1, 0.05);
        
        // Blade - tactical knife style (larger, visible)
        const blade = BABYLON.MeshBuilder.CreateBox("blade", {
            width: 0.008, height: 0.04, depth: 0.18
        }, this.scene);
        blade.position = new BABYLON.Vector3(0.32, -0.22, 0.24);
        blade.rotation.x = -0.1; // Slight angle like holding a knife
        blade.material = bladeMat;
        blade.parent = parent;
        blade.isPickable = false;
        
        // Blade edge (darker line on the edge)
        const edge = BABYLON.MeshBuilder.CreateBox("edge", {
            width: 0.002, height: 0.035, depth: 0.16
        }, this.scene);
        edge.position = new BABYLON.Vector3(0.32, -0.225, 0.25);
        edge.rotation.x = -0.1;
        const edgeMat = new BABYLON.StandardMaterial("edgeMat", this.scene);
        edgeMat.diffuseColor = new BABYLON.Color3(0.4, 0.4, 0.45);
        edge.material = edgeMat;
        edge.parent = parent;
        edge.isPickable = false;
        
        // Handle
        const handle = BABYLON.MeshBuilder.CreateCylinder("handle", {
            diameter: 0.028, height: 0.11
        }, this.scene);
        handle.rotation.x = Math.PI / 2;
        handle.position = new BABYLON.Vector3(0.32, -0.22, 0.08);
        handle.material = handleMat;
        handle.parent = parent;
        handle.isPickable = false;
        
        // Guard (between blade and handle)
        const guard = BABYLON.MeshBuilder.CreateBox("guard", {
            width: 0.04, height: 0.015, depth: 0.015
        }, this.scene);
        guard.position = new BABYLON.Vector3(0.32, -0.22, 0.14);
        guard.material = handleMat;
        guard.parent = parent;
        guard.isPickable = false;
    }
    
    createMuzzleFlash() {
        // Muzzle flash sprite
        const flash = BABYLON.MeshBuilder.CreatePlane("muzzleFlash", { size: 0.3 }, this.scene);
        flash.billboardMode = BABYLON.Mesh.BILLBOARDMODE_ALL;
        
        const flashMat = new BABYLON.StandardMaterial("flashMat", this.scene);
        flashMat.emissiveColor = new BABYLON.Color3(1, 0.8, 0.2);
        flashMat.disableLighting = true;
        flashMat.alpha = 0;
        flash.material = flashMat;
        
        flash.parent = this.mesh;
        flash.position = new BABYLON.Vector3(0, 0, 1);
        
        this.muzzleFlash = flash;
    }
    
    show() {
        if (this.mesh) {
            this.mesh.setEnabled(true);
        }
    }
    
    hide() {
        if (this.mesh) {
            this.mesh.setEnabled(false);
        }
    }
    
    canFire() {
        if (this.isReloading) return false;
        if (this.type === WeaponTypes.KNIFE) return true;
        if (this.ammo <= 0) return false;
        
        const now = performance.now();
        return (now - this.lastFireTime) >= this.data.fireRate;
    }
    
    fire(scene) {
        if (!this.canFire()) return null;
        
        this.lastFireTime = performance.now();
        
        if (this.type === WeaponTypes.KNIFE) {
            return this.meleeAttack();
        }
        
        this.ammo--;
        
        // Show muzzle flash
        this.showMuzzleFlash();
        
        // Apply recoil
        this.applyRecoil();
        
        // Play sound
        Utils.playSound(scene, 'shoot');
        
        // Return hit info
        return this.performRaycast();
    }
    
    performRaycast() {
        const hits = [];
        const origin = this.camera.position.clone();
        
        for (let i = 0; i < this.data.pellets; i++) {
            // Calculate spread
            const spreadX = (Math.random() - 0.5) * this.data.spread;
            const spreadY = (Math.random() - 0.5) * this.data.spread;
            
            const direction = this.camera.getDirection(BABYLON.Vector3.Forward());
            direction.x += spreadX;
            direction.y += spreadY;
            direction.normalize();
            
            const ray = new BABYLON.Ray(origin, direction, this.data.range);
            const hit = this.scene.pickWithRay(ray, (mesh) => {
                return mesh.isPickable && mesh.name !== "weaponParent" && !mesh.name.startsWith("muzzle");
            });
            
            if (hit && hit.hit) {
                hits.push({
                    mesh: hit.pickedMesh,
                    point: hit.pickedPoint,
                    distance: hit.distance,
                    damage: this.data.damage
                });
            }
        }
        
        return hits;
    }
    
    meleeAttack() {
        try {
            const origin = this.camera.position.clone();
            const direction = this.camera.getDirection(BABYLON.Vector3.Forward());
            const ray = new BABYLON.Ray(origin, direction, this.data.range);
            
            const hit = this.scene.pickWithRay(ray, (mesh) => {
                return mesh.isPickable && mesh.metadata && mesh.metadata.isNPC;
            });
            
            if (hit && hit.hit) {
                const hitMesh = hit.pickedMesh;
                const npcInstance = hitMesh.metadata ? hitMesh.metadata.npcInstance : null;
                
                // Check if backstab - use the NPC's main mesh for direction
                let isBackstab = false;
                if (npcInstance && npcInstance.mesh) {
                    try {
                        const npcMesh = npcInstance.mesh;
                        const toPlayer = this.camera.position.subtract(npcMesh.position).normalize();
                        // NPC forward is based on its Y rotation
                        const npcAngle = npcMesh.rotation ? npcMesh.rotation.y : 0;
                        const npcForward = new BABYLON.Vector3(Math.sin(npcAngle), 0, Math.cos(npcAngle));
                        const dot = BABYLON.Vector3.Dot(toPlayer, npcForward);
                        isBackstab = dot > 0.5; // Behind the enemy
                    } catch (e) {
                        console.warn('Backstab check error:', e);
                    }
                }
                
                const damage = isBackstab ? 200 : this.data.damage; // Insta-kill from behind
                
                // Play knife hit sound
                Utils.playSound(this.scene, 'hit');
                
                return [{
                    mesh: hitMesh,
                    point: hit.pickedPoint,
                    distance: hit.distance,
                    damage: damage,
                    isBackstab: isBackstab
                }];
            }
        } catch (e) {
            console.error('Melee attack error:', e);
        }
        
        return [];
    }
    
    showMuzzleFlash() {
        if (!this.muzzleFlash) return;
        
        this.muzzleFlash.material.alpha = 1;
        this.muzzleFlash.rotation.z = Math.random() * Math.PI * 2;
        
        setTimeout(() => {
            if (this.muzzleFlash) {
                this.muzzleFlash.material.alpha = 0;
            }
        }, 50);
    }
    
    applyRecoil() {
        // Recoil will be applied by the player controller
        return {
            vertical: this.data.recoil,
            horizontal: (Math.random() - 0.5) * this.data.recoil * 0.3
        };
    }
    
    reload(onComplete) {
        if (this.isReloading) return false;
        if (this.type === WeaponTypes.KNIFE) return false;
        if (this.ammo >= this.data.magSize) return false;
        if (this.reserveAmmo <= 0) return false;
        
        this.isReloading = true;
        Utils.playSound(this.scene, 'reload');
        
        setTimeout(() => {
            const needed = this.data.magSize - this.ammo;
            const toLoad = Math.min(needed, this.reserveAmmo);
            
            this.ammo += toLoad;
            this.reserveAmmo -= toLoad;
            this.isReloading = false;
            
            if (onComplete) onComplete();
        }, this.data.reloadTime);
        
        return true;
    }
    
    cancelReload() {
        this.isReloading = false;
    }
    
    getAmmoInfo() {
        return {
            current: this.ammo,
            reserve: this.reserveAmmo,
            maxMag: this.data.magSize
        };
    }
    
    dispose() {
        if (this.mesh) {
            this.mesh.dispose();
        }
    }
}

class Grenade {
    constructor(scene, position, direction, force) {
        this.scene = scene;
        this.mesh = null;
        this.exploded = false;
        this.data = WeaponData[WeaponTypes.GRENADE];
        
        this.create(position, direction, force);
    }
    
    create(position, direction, force) {
        // Create grenade mesh
        this.mesh = BABYLON.MeshBuilder.CreateSphere("grenade", { diameter: 0.1 }, this.scene);
        this.mesh.position = position.clone();
        
        const mat = new BABYLON.StandardMaterial("grenadeMat", this.scene);
        mat.diffuseColor = new BABYLON.Color3(0.2, 0.3, 0.2);
        this.mesh.material = mat;
        
        // Simple projectile motion (no physics engine)
        const velocity = direction.scale(force);
        velocity.y += 5; // Arc upward
        this.velocity = velocity;
        this.gravity = -20;
        
        // Animate grenade
        const animateGrenade = () => {
            if (this.exploded || !this.mesh) return;
            
            const deltaTime = 0.016; // ~60fps
            this.velocity.y += this.gravity * deltaTime;
            this.mesh.position.addInPlace(this.velocity.scale(deltaTime));
            
            // Ground collision
            if (this.mesh.position.y < 0.1) {
                this.mesh.position.y = 0.1;
                this.velocity.y *= -0.3; // Bounce
                this.velocity.x *= 0.7; // Friction
                this.velocity.z *= 0.7;
            }
            
            requestAnimationFrame(animateGrenade);
        };
        animateGrenade();
        
        // Set fuse timer
        setTimeout(() => {
            this.explode();
        }, this.data.fuseTime);
    }
    
    explode() {
        if (this.exploded) return;
        this.exploded = true;
        
        const explosionPos = this.mesh.position.clone();
        
        // Create explosion effect
        this.createExplosionEffect(explosionPos);
        
        // Play explosion sound
        Utils.playSound(this.scene, 'explosion');
        
        // Deal damage to nearby entities
        const hits = this.getDamageTargets(explosionPos);
        
        // Remove grenade mesh
        this.mesh.dispose();
        
        // Trigger callback with hits
        if (this.onExplode) {
            this.onExplode(hits, explosionPos);
        }
    }
    
    createExplosionEffect(position) {
        // Flash sphere
        const flash = BABYLON.MeshBuilder.CreateSphere("explosion", { diameter: this.data.radius }, this.scene);
        flash.position = position;
        
        const flashMat = new BABYLON.StandardMaterial("explosionMat", this.scene);
        flashMat.emissiveColor = new BABYLON.Color3(1, 0.5, 0);
        flashMat.alpha = 0.8;
        flash.material = flashMat;
        
        // Animate explosion
        let scale = 0.1;
        const expandRate = 0.3;
        
        const animation = this.scene.onBeforeRenderObservable.add(() => {
            scale += expandRate;
            flash.scaling = new BABYLON.Vector3(scale, scale, scale);
            flashMat.alpha -= 0.05;
            
            if (flashMat.alpha <= 0) {
                this.scene.onBeforeRenderObservable.remove(animation);
                flash.dispose();
            }
        });
        
        // Particle system for smoke/debris
        const particleSystem = new BABYLON.ParticleSystem("explosionParticles", 100, this.scene);
        particleSystem.emitter = position;
        
        particleSystem.color1 = new BABYLON.Color4(1, 0.5, 0, 1);
        particleSystem.color2 = new BABYLON.Color4(0.5, 0.5, 0.5, 1);
        particleSystem.colorDead = new BABYLON.Color4(0.2, 0.2, 0.2, 0);
        
        particleSystem.minSize = 0.3;
        particleSystem.maxSize = 1;
        
        particleSystem.minLifeTime = 0.3;
        particleSystem.maxLifeTime = 1;
        
        particleSystem.emitRate = 500;
        particleSystem.direction1 = new BABYLON.Vector3(-5, 5, -5);
        particleSystem.direction2 = new BABYLON.Vector3(5, 10, 5);
        
        particleSystem.minEmitPower = 5;
        particleSystem.maxEmitPower = 15;
        
        particleSystem.gravity = new BABYLON.Vector3(0, -10, 0);
        
        particleSystem.start();
        
        setTimeout(() => {
            particleSystem.stop();
            setTimeout(() => particleSystem.dispose(), 2000);
        }, 100);
    }
    
    getDamageTargets(position) {
        const hits = [];
        
        // Check all NPCs
        const npcs = this.scene.meshes.filter(m => m.metadata && m.metadata.isNPC);
        
        for (const npc of npcs) {
            const distance = BABYLON.Vector3.Distance(position, npc.position);
            
            if (distance <= this.data.radius) {
                // Damage falls off with distance
                const falloff = 1 - (distance / this.data.radius);
                const damage = this.data.damage * falloff;
                
                hits.push({
                    mesh: npc,
                    damage: damage,
                    distance: distance
                });
            }
        }
        
        return hits;
    }
}
