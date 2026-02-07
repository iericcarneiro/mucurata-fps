/**
 * Favela Map Generator for Favela Wars FPS
 */

class FavelaMap {
    constructor(scene) {
        this.scene = scene;
        this.meshes = [];
        this.spawnPoints = {
            police: [],
            criminal: []
        };
        
        // Map dimensions
        this.width = 100;
        this.depth = 100;
        this.maxHeight = 25;
        
        // Materials
        this.materials = {};
        
        this.createMaterials();
    }
    
    createMaterials() {
        // Brick wall material - more detailed
        const brickMat = new BABYLON.PBRMaterial("brickMat", this.scene);
        brickMat.albedoColor = new BABYLON.Color3(0.55, 0.35, 0.28);
        brickMat.roughness = 0.92;
        brickMat.metallic = 0;
        brickMat.bumpTexture = this.createNoiseTexture("brickBump", 0.3);
        this.materials.brick = brickMat;
        
        // Concrete material - gritty
        const concreteMat = new BABYLON.PBRMaterial("concreteMat", this.scene);
        concreteMat.albedoColor = new BABYLON.Color3(0.45, 0.44, 0.42);
        concreteMat.roughness = 0.88;
        concreteMat.metallic = 0;
        concreteMat.bumpTexture = this.createNoiseTexture("concreteBump", 0.2);
        this.materials.concrete = concreteMat;
        
        // Metal sheet material - shinier
        const metalMat = new BABYLON.PBRMaterial("metalMat", this.scene);
        metalMat.albedoColor = new BABYLON.Color3(0.4, 0.42, 0.45);
        metalMat.roughness = 0.4;
        metalMat.metallic = 0.85;
        metalMat.bumpTexture = this.createNoiseTexture("metalBump", 0.1);
        this.materials.metal = metalMat;
        
        // Rusted metal - more variation
        const rustMat = new BABYLON.PBRMaterial("rustMat", this.scene);
        rustMat.albedoColor = new BABYLON.Color3(0.45, 0.28, 0.18);
        rustMat.roughness = 0.95;
        rustMat.metallic = 0.2;
        rustMat.bumpTexture = this.createNoiseTexture("rustBump", 0.4);
        this.materials.rust = rustMat;
        
        // Wood material - richer
        const woodMat = new BABYLON.PBRMaterial("woodMat", this.scene);
        woodMat.albedoColor = new BABYLON.Color3(0.35, 0.24, 0.15);
        woodMat.roughness = 0.75;
        woodMat.metallic = 0;
        woodMat.bumpTexture = this.createNoiseTexture("woodBump", 0.25);
        this.materials.wood = woodMat;
        
        // Ground material - dirt/asphalt mix
        const groundMat = new BABYLON.PBRMaterial("groundMat", this.scene);
        groundMat.albedoColor = new BABYLON.Color3(0.3, 0.28, 0.24);
        groundMat.roughness = 0.98;
        groundMat.metallic = 0;
        groundMat.bumpTexture = this.createNoiseTexture("groundBump", 0.15);
        this.materials.ground = groundMat;
        
        // Painted walls (various colors) - more muted CS-style
        const colors = [
            new BABYLON.Color3(0.65, 0.55, 0.42), // Tan
            new BABYLON.Color3(0.72, 0.68, 0.58), // Cream
            new BABYLON.Color3(0.52, 0.58, 0.65), // Muted blue
            new BABYLON.Color3(0.68, 0.55, 0.55), // Dusty pink
            new BABYLON.Color3(0.58, 0.65, 0.52), // Sage green
            new BABYLON.Color3(0.75, 0.72, 0.65), // Beige
            new BABYLON.Color3(0.6, 0.58, 0.55),  // Warm gray
            new BABYLON.Color3(0.7, 0.62, 0.52),  // Sandstone
        ];
        
        this.materials.painted = colors.map((color, i) => {
            const mat = new BABYLON.PBRMaterial(`paintedMat${i}`, this.scene);
            mat.albedoColor = color;
            mat.roughness = 0.82;
            mat.metallic = 0;
            mat.bumpTexture = this.createNoiseTexture(`paintBump${i}`, 0.08);
            return mat;
        });
    }
    
    createNoiseTexture(name, intensity) {
        // Create procedural bump texture for surface detail
        const texture = new BABYLON.DynamicTexture(name, 128, this.scene);
        const ctx = texture.getContext();
        
        // Fill with noise
        const imageData = ctx.createImageData(128, 128);
        for (let i = 0; i < imageData.data.length; i += 4) {
            const noise = Math.random() * 255;
            const value = 128 + (noise - 128) * intensity;
            imageData.data[i] = value;
            imageData.data[i + 1] = value;
            imageData.data[i + 2] = value;
            imageData.data[i + 3] = 255;
        }
        ctx.putImageData(imageData, 0, 0);
        texture.update();
        
        texture.level = intensity;
        return texture;
    }
    
    generate() {
        // Create ground
        this.createGround();
        
        // Create hillside terrain
        this.createTerrain();
        
        // Create buildings
        this.createBuildings();
        
        // Create alleys and stairs
        this.createAlleys();
        
        // Create props
        this.createProps();
        
        // Create spawn points
        this.createSpawnPoints();
        
        // Add lighting
        this.createLighting();
        
        // Create skybox
        this.createSkybox();
    }
    
    createGround() {
        const ground = BABYLON.MeshBuilder.CreateGround("ground", {
            width: this.width * 2,
            height: this.depth * 2,
            subdivisions: 32
        }, this.scene);
        
        ground.material = this.materials.ground;
        ground.receiveShadows = true;
        ground.checkCollisions = true;
        ground.isPickable = true;
        
        this.meshes.push(ground);
    }
    
    createTerrain() {
        // Create sloped terrain to simulate hillside
        const terrainPieces = [];
        
        // Multiple levels going up the hill
        for (let level = 0; level < 5; level++) {
            const yOffset = level * 4;
            const zOffset = -20 + level * 15;
            
            // Create flat platform for this level
            const platform = BABYLON.MeshBuilder.CreateBox(`platform_${level}`, {
                width: this.width * 0.8,
                height: 1,
                depth: 20
            }, this.scene);
            
            platform.position = new BABYLON.Vector3(0, yOffset, zOffset);
            platform.material = this.materials.concrete;
            platform.checkCollisions = true;
            platform.isPickable = true;
            
            terrainPieces.push(platform);
            
            // Create ramp/stairs connecting levels
            if (level > 0) {
                const ramp = BABYLON.MeshBuilder.CreateBox(`ramp_${level}`, {
                    width: 4,
                    height: 0.5,
                    depth: 15
                }, this.scene);
                
                ramp.position = new BABYLON.Vector3(
                    Utils.random(-20, 20),
                    yOffset - 2,
                    zOffset - 10
                );
                ramp.rotation.x = -0.3;
                ramp.material = this.materials.concrete;
                ramp.checkCollisions = true;
                ramp.isPickable = true;
                
                terrainPieces.push(ramp);
            }
        }
        
        this.meshes.push(...terrainPieces);
    }
    
    createBuildings() {
        // Generate buildings (barracos) across the map
        const buildingConfigs = [];
        
        // Define building zones
        const zones = [
            { x: -30, z: -30, count: 8 },
            { x: 0, z: -20, count: 10 },
            { x: 30, z: -30, count: 8 },
            { x: -25, z: 0, count: 6 },
            { x: 25, z: 0, count: 6 },
            { x: -20, z: 15, count: 5 },
            { x: 20, z: 15, count: 5 },
            { x: 0, z: 25, count: 4 },
        ];
        
        for (const zone of zones) {
            for (let i = 0; i < zone.count; i++) {
                const x = zone.x + Utils.random(-10, 10);
                const z = zone.z + Utils.random(-8, 8);
                const floors = Utils.randomInt(1, 3);
                const width = Utils.random(4, 8);
                const depth = Utils.random(4, 6);
                
                this.createBuilding(x, z, width, depth, floors);
            }
        }
    }
    
    createBuilding(x, z, width, depth, floors) {
        const floorHeight = 3;
        const wallMat = Utils.randomElement(this.materials.painted);
        const roofMat = Math.random() > 0.5 ? this.materials.metal : this.materials.rust;
        
        // Calculate ground level based on position (for hillside)
        const groundY = this.getGroundLevel(x, z);
        
        for (let floor = 0; floor < floors; floor++) {
            const baseY = groundY + floor * floorHeight;
            
            // Walls
            this.createWall(x - width/2, baseY, z, 0.2, floorHeight, depth, wallMat, 0);
            this.createWall(x + width/2, baseY, z, 0.2, floorHeight, depth, wallMat, 0);
            
            // Front wall with door opening on ground floor
            if (floor === 0) {
                // Wall segments around door
                this.createWall(x - width/4, baseY, z - depth/2, width/2 - 0.5, floorHeight, 0.2, wallMat, 0);
                this.createWall(x + width/4, baseY, z - depth/2, width/2 - 0.5, floorHeight, 0.2, wallMat, 0);
                // Top of door
                this.createWall(x, baseY + 2.2, z - depth/2, 1, floorHeight - 2.2, 0.2, wallMat, 0);
            } else {
                this.createWall(x, baseY, z - depth/2, width, floorHeight, 0.2, wallMat, 0);
            }
            
            // Back wall
            this.createWall(x, baseY, z + depth/2, width, floorHeight, 0.2, wallMat, 0);
            
            // Floor
            const floorMesh = BABYLON.MeshBuilder.CreateBox(`floor_${x}_${z}_${floor}`, {
                width: width,
                height: 0.2,
                depth: depth
            }, this.scene);
            floorMesh.position = new BABYLON.Vector3(x, baseY, z);
            floorMesh.material = this.materials.concrete;
            floorMesh.checkCollisions = true;
            floorMesh.isPickable = true;
            
            this.meshes.push(floorMesh);
        }
        
        // Roof (laje)
        const roofY = groundY + floors * floorHeight;
        const roof = BABYLON.MeshBuilder.CreateBox(`roof_${x}_${z}`, {
            width: width + 0.5,
            height: 0.15,
            depth: depth + 0.5
        }, this.scene);
        roof.position = new BABYLON.Vector3(x, roofY, z);
        roof.material = this.materials.concrete;
        roof.checkCollisions = true;
        roof.isPickable = true;
        
        this.meshes.push(roof);
        
        // Sometimes add a metal roof extension
        if (Math.random() > 0.5) {
            const metalRoof = BABYLON.MeshBuilder.CreateBox(`metalRoof_${x}_${z}`, {
                width: width + 1,
                height: 0.05,
                depth: 2
            }, this.scene);
            metalRoof.position = new BABYLON.Vector3(x, roofY + 0.3, z - depth/2 - 1);
            metalRoof.rotation.x = 0.15;
            metalRoof.material = roofMat;
            this.meshes.push(metalRoof);
        }
        
        // Add external stairs for multi-floor buildings
        if (floors > 1 && Math.random() > 0.3) {
            this.createExternalStairs(x, z, groundY, floors, width, depth);
        }
    }
    
    createWall(x, y, z, width, height, depth, material, rotation) {
        const wall = BABYLON.MeshBuilder.CreateBox(`wall_${x}_${y}_${z}`, {
            width: width,
            height: height,
            depth: depth
        }, this.scene);
        
        wall.position = new BABYLON.Vector3(x, y + height/2, z);
        wall.rotation.y = rotation;
        wall.material = material;
        wall.receiveShadows = true;
        wall.checkCollisions = true;
        wall.isPickable = true;
        
        this.meshes.push(wall);
        return wall;
    }
    
    createExternalStairs(x, z, groundY, floors, buildingWidth, buildingDepth) {
        const stairWidth = 1.2;
        const stairDepth = 3;
        const stepHeight = 0.25;
        const stepDepth = 0.3;
        
        // Place stairs on one side of building
        const stairX = x + buildingWidth/2 + stairWidth/2 + 0.5;
        
        for (let floor = 0; floor < floors; floor++) {
            const baseY = groundY + floor * 3;
            const stepsPerFloor = Math.floor(3 / stepHeight);
            
            for (let step = 0; step < stepsPerFloor; step++) {
                const stepMesh = BABYLON.MeshBuilder.CreateBox(`step_${x}_${floor}_${step}`, {
                    width: stairWidth,
                    height: stepHeight,
                    depth: stepDepth
                }, this.scene);
                
                stepMesh.position = new BABYLON.Vector3(
                    stairX,
                    baseY + step * stepHeight + stepHeight/2,
                    z - buildingDepth/2 + step * stepDepth
                );
                stepMesh.material = this.materials.concrete;
                stepMesh.checkCollisions = true;
                stepMesh.isPickable = true;
                
                this.meshes.push(stepMesh);
            }
            
            // Landing platform
            if (floor < floors - 1) {
                const landing = BABYLON.MeshBuilder.CreateBox(`landing_${x}_${floor}`, {
                    width: stairWidth + 0.5,
                    height: 0.2,
                    depth: 2
                }, this.scene);
                landing.position = new BABYLON.Vector3(
                    stairX,
                    baseY + 3,
                    z - buildingDepth/2 + stepsPerFloor * stepDepth + 1
                );
                landing.material = this.materials.concrete;
                landing.checkCollisions = true;
                landing.isPickable = true;
                
                this.meshes.push(landing);
            }
        }
    }
    
    createAlleys() {
        // Create narrow alleyways between building clusters
        const alleyConfigs = [
            { x1: -40, z1: 0, x2: 40, z2: 0, width: 3 },
            { x1: 0, z1: -40, x2: 0, z2: 40, width: 4 },
            { x1: -35, z1: -35, x2: 35, z2: 35, width: 2.5 },
        ];
        
        for (const config of alleyConfigs) {
            // Add cover objects along alleys
            const length = Math.sqrt(
                Math.pow(config.x2 - config.x1, 2) + 
                Math.pow(config.z2 - config.z1, 2)
            );
            
            const numCovers = Math.floor(length / 15);
            
            for (let i = 0; i < numCovers; i++) {
                const t = (i + 0.5) / numCovers;
                const x = config.x1 + (config.x2 - config.x1) * t;
                const z = config.z1 + (config.z2 - config.z1) * t;
                
                // Random cover type
                if (Math.random() > 0.5) {
                    this.createBarrel(x + Utils.random(-2, 2), z + Utils.random(-2, 2));
                } else {
                    this.createCrate(x + Utils.random(-2, 2), z + Utils.random(-2, 2));
                }
            }
        }
    }
    
    createBarrel(x, z) {
        const groundY = this.getGroundLevel(x, z);
        
        const barrel = BABYLON.MeshBuilder.CreateCylinder(`barrel_${x}_${z}`, {
            diameter: 0.6,
            height: 1
        }, this.scene);
        
        barrel.position = new BABYLON.Vector3(x, groundY + 0.5, z);
        barrel.material = Math.random() > 0.5 ? this.materials.rust : this.materials.metal;
        barrel.checkCollisions = true;
        barrel.isPickable = true;
        
        this.meshes.push(barrel);
    }
    
    createCrate(x, z) {
        const groundY = this.getGroundLevel(x, z);
        const size = Utils.random(0.8, 1.5);
        
        const crate = BABYLON.MeshBuilder.CreateBox(`crate_${x}_${z}`, {
            width: size,
            height: size,
            depth: size
        }, this.scene);
        
        crate.position = new BABYLON.Vector3(x, groundY + size/2, z);
        crate.rotation.y = Utils.random(0, Math.PI);
        crate.material = this.materials.wood;
        crate.checkCollisions = true;
        crate.isPickable = true;
        
        this.meshes.push(crate);
    }
    
    createProps() {
        // Add environmental props for atmosphere
        
        // Water tanks on roofs
        for (let i = 0; i < 10; i++) {
            const x = Utils.random(-40, 40);
            const z = Utils.random(-40, 40);
            const groundY = this.getGroundLevel(x, z);
            
            const tank = BABYLON.MeshBuilder.CreateCylinder(`tank_${i}`, {
                diameter: 1.5,
                height: 2
            }, this.scene);
            
            tank.position = new BABYLON.Vector3(x, groundY + 10 + Utils.random(0, 5), z);
            tank.material = this.materials.metal;
            this.meshes.push(tank);
        }
        
        // Power lines (simplified as thin boxes)
        for (let i = 0; i < 5; i++) {
            const x = Utils.random(-30, 30);
            const z1 = Utils.random(-30, 30);
            const z2 = z1 + Utils.random(10, 30);
            
            const wire = BABYLON.MeshBuilder.CreateBox(`wire_${i}`, {
                width: 0.02,
                height: 0.02,
                depth: Math.abs(z2 - z1)
            }, this.scene);
            
            wire.position = new BABYLON.Vector3(x, 8, (z1 + z2) / 2);
            
            const wireMat = new BABYLON.StandardMaterial(`wireMat_${i}`, this.scene);
            wireMat.diffuseColor = new BABYLON.Color3(0.1, 0.1, 0.1);
            wire.material = wireMat;
            
            this.meshes.push(wire);
        }
        
        // Satellite dishes
        for (let i = 0; i < 8; i++) {
            const x = Utils.random(-40, 40);
            const z = Utils.random(-40, 40);
            const groundY = this.getGroundLevel(x, z);
            
            const dish = BABYLON.MeshBuilder.CreateDisc(`dish_${i}`, {
                radius: 0.4,
                tessellation: 16
            }, this.scene);
            
            dish.position = new BABYLON.Vector3(x, groundY + Utils.random(6, 15), z);
            dish.rotation.x = -Math.PI / 3;
            dish.rotation.y = Utils.random(0, Math.PI * 2);
            dish.material = this.materials.metal;
            
            this.meshes.push(dish);
        }
    }
    
    createSpawnPoints() {
        // Police spawns at bottom of map
        for (let i = 0; i < 10; i++) {
            this.spawnPoints.police.push(new BABYLON.Vector3(
                Utils.random(-30, 30),
                2,
                Utils.random(35, 45)
            ));
        }
        
        // Criminal spawns at top of map (in the favela)
        for (let i = 0; i < 10; i++) {
            const x = Utils.random(-30, 30);
            const z = Utils.random(-35, -20);
            const y = this.getGroundLevel(x, z) + 2;
            
            this.spawnPoints.criminal.push(new BABYLON.Vector3(x, y, z));
        }
    }
    
    getGroundLevel(x, z) {
        // Simple heightmap based on z position (going up the hill)
        const normalizedZ = (z + this.depth/2) / this.depth; // 0 to 1
        return Math.max(0, normalizedZ * 15); // 0 to 15 units high
    }
    
    createLighting() {
        // Ambient light - lower for more contrast (CS-style)
        const ambient = new BABYLON.HemisphericLight("ambient", new BABYLON.Vector3(0, 1, 0), this.scene);
        ambient.intensity = 0.25;
        ambient.groundColor = new BABYLON.Color3(0.15, 0.12, 0.1);
        ambient.specular = new BABYLON.Color3(0.1, 0.1, 0.1);
        
        // Main directional light (sun) - more dramatic angle
        const sun = new BABYLON.DirectionalLight("sun", new BABYLON.Vector3(-0.4, -0.8, -0.4), this.scene);
        sun.intensity = 1.8;
        sun.diffuse = new BABYLON.Color3(1, 0.92, 0.8);
        sun.specular = new BABYLON.Color3(1, 0.95, 0.85);
        
        // High quality shadow generator
        const shadowGenerator = new BABYLON.ShadowGenerator(4096, sun);
        shadowGenerator.usePercentageCloserFiltering = true; // PCF for softer shadows
        shadowGenerator.filteringQuality = BABYLON.ShadowGenerator.QUALITY_HIGH;
        shadowGenerator.bias = 0.001;
        shadowGenerator.normalBias = 0.02;
        shadowGenerator.darkness = 0.3; // Not too dark
        
        // Cascaded shadows for better quality at distance
        sun.shadowMinZ = 1;
        sun.shadowMaxZ = 150;
        
        // Add main meshes to shadow caster
        this.meshes.slice(0, 80).forEach(mesh => {
            shadowGenerator.addShadowCaster(mesh);
            mesh.receiveShadows = true;
        });
        
        this.shadowGenerator = shadowGenerator;
        
        // Fill light from opposite side (softer)
        const fillLight = new BABYLON.DirectionalLight("fill", new BABYLON.Vector3(0.3, -0.5, 0.5), this.scene);
        fillLight.intensity = 0.4;
        fillLight.diffuse = new BABYLON.Color3(0.7, 0.8, 1); // Slight blue tint
        fillLight.specular = new BABYLON.Color3(0, 0, 0);
        
        // Point lights in alleyways for atmosphere - warmer, more varied
        const lightConfigs = [
            { color: new BABYLON.Color3(1, 0.7, 0.4), intensity: 0.8 },   // Warm bulb
            { color: new BABYLON.Color3(1, 0.9, 0.7), intensity: 0.6 },   // Soft white
            { color: new BABYLON.Color3(0.9, 0.95, 1), intensity: 0.5 },  // Cool white
            { color: new BABYLON.Color3(1, 0.5, 0.2), intensity: 0.4 },   // Orange
        ];
        
        for (let i = 0; i < 12; i++) {
            const config = Utils.randomElement(lightConfigs);
            const light = new BABYLON.PointLight(
                `alleyLight_${i}`,
                new BABYLON.Vector3(
                    Utils.random(-35, 35),
                    Utils.random(2.5, 5),
                    Utils.random(-35, 35)
                ),
                this.scene
            );
            light.intensity = config.intensity;
            light.diffuse = config.color;
            light.range = 12;
            light.shadowEnabled = false; // Performance
            
            // Add visible light bulb mesh
            const bulb = BABYLON.MeshBuilder.CreateSphere(`bulb_${i}`, { diameter: 0.15 }, this.scene);
            bulb.position = light.position.clone();
            const bulbMat = new BABYLON.StandardMaterial(`bulbMat_${i}`, this.scene);
            bulbMat.emissiveColor = config.color;
            bulbMat.disableLighting = true;
            bulb.material = bulbMat;
            this.meshes.push(bulb);
        }
    }
    
    createSkybox() {
        // Create gradient sky - CS:GO style overcast/hazy
        const skybox = BABYLON.MeshBuilder.CreateSphere("skybox", { 
            diameter: 500,
            sideOrientation: BABYLON.Mesh.BACKSIDE
        }, this.scene);
        
        const skyMat = new BABYLON.StandardMaterial("skyMat", this.scene);
        skyMat.backFaceCulling = false;
        skyMat.disableLighting = true;
        
        // Create gradient texture for sky - more muted CS-style
        const skyTexture = new BABYLON.DynamicTexture("skyTexture", { width: 512, height: 512 }, this.scene);
        const ctx = skyTexture.getContext();
        
        const gradient = ctx.createLinearGradient(0, 0, 0, 512);
        gradient.addColorStop(0, '#2a3a4a');    // Muted blue-gray at top
        gradient.addColorStop(0.2, '#3d4d5d');  // Slate
        gradient.addColorStop(0.4, '#5a6a7a');  // Gray-blue
        gradient.addColorStop(0.55, '#7a8a9a'); // Lighter gray
        gradient.addColorStop(0.7, '#9aa0a6');  // Overcast
        gradient.addColorStop(0.85, '#b5a89a'); // Warm haze
        gradient.addColorStop(0.95, '#c5b5a0'); // Horizon haze
        gradient.addColorStop(1, '#d5c5a5');    // Ground haze
        
        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, 512, 512);
        
        // Add some subtle cloud-like noise
        ctx.globalAlpha = 0.08;
        for (let i = 0; i < 100; i++) {
            const x = Math.random() * 512;
            const y = Math.random() * 300;
            const size = Math.random() * 60 + 20;
            ctx.fillStyle = '#ffffff';
            ctx.beginPath();
            ctx.ellipse(x, y, size, size * 0.4, 0, 0, Math.PI * 2);
            ctx.fill();
        }
        ctx.globalAlpha = 1;
        
        skyTexture.update();
        
        skyMat.emissiveTexture = skyTexture;
        skybox.material = skyMat;
        skybox.isPickable = false;
        
        this.meshes.push(skybox);
    }
    
    getPlayerSpawn(team) {
        const spawns = this.spawnPoints[team];
        return Utils.randomElement(spawns).clone();
    }
    
    getEnemySpawns(team) {
        const enemyTeam = team === 'police' ? 'criminal' : 'police';
        return [...this.spawnPoints[enemyTeam]];
    }
    
    dispose() {
        this.meshes.forEach(mesh => mesh.dispose());
        this.meshes = [];
    }
}
