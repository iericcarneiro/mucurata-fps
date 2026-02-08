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
        
        // Exposed brick walls - FAVELA STYLE! (no plaster/reboco)
        this.materials.painted = [];
        
        // Different brick colors (exposed, weathered)
        const brickColors = [
            new BABYLON.Color3(0.6, 0.35, 0.25),   // Red brick
            new BABYLON.Color3(0.55, 0.38, 0.28),  // Orange brick
            new BABYLON.Color3(0.5, 0.32, 0.22),   // Dark red brick
            new BABYLON.Color3(0.58, 0.4, 0.3),    // Light brick
            new BABYLON.Color3(0.52, 0.35, 0.25),  // Weathered brick
            new BABYLON.Color3(0.48, 0.3, 0.2),    // Old brick
        ];
        
        for (let i = 0; i < brickColors.length; i++) {
            const mat = new BABYLON.PBRMaterial(`brickWall${i}`, this.scene);
            mat.albedoColor = brickColors[i];
            mat.roughness = 0.95;
            mat.metallic = 0;
            mat.albedoTexture = this.createBrickTexture(`brickTex${i}`, brickColors[i]);
            mat.bumpTexture = this.createBrickBumpTexture(`brickBump${i}`);
            this.materials.painted.push(mat);
        }
    }
    
    createBrickTexture(name, baseColor) {
        // Create procedural brick texture
        const texture = new BABYLON.DynamicTexture(name, 256, this.scene);
        const ctx = texture.getContext();
        
        const brickWidth = 32;
        const brickHeight = 16;
        const mortarSize = 2;
        
        // Mortar color (gray cement)
        ctx.fillStyle = '#555550';
        ctx.fillRect(0, 0, 256, 256);
        
        // Draw bricks
        for (let row = 0; row < 16; row++) {
            const offset = (row % 2) * (brickWidth / 2); // Stagger rows
            
            for (let col = -1; col < 9; col++) {
                const x = col * brickWidth + offset;
                const y = row * brickHeight;
                
                // Slight color variation per brick
                const variation = 0.9 + Math.random() * 0.2;
                const r = Math.floor(baseColor.r * 255 * variation);
                const g = Math.floor(baseColor.g * 255 * variation);
                const b = Math.floor(baseColor.b * 255 * variation);
                
                ctx.fillStyle = `rgb(${r},${g},${b})`;
                ctx.fillRect(
                    x + mortarSize, 
                    y + mortarSize, 
                    brickWidth - mortarSize * 2, 
                    brickHeight - mortarSize * 2
                );
                
                // Add some dirt/weathering spots
                if (Math.random() > 0.7) {
                    ctx.fillStyle = `rgba(0,0,0,${Math.random() * 0.2})`;
                    ctx.fillRect(
                        x + mortarSize + Math.random() * 20,
                        y + mortarSize + Math.random() * 8,
                        Math.random() * 10 + 2,
                        Math.random() * 5 + 2
                    );
                }
            }
        }
        
        texture.update();
        return texture;
    }
    
    createBrickBumpTexture(name) {
        // Create bump map for brick depth
        const texture = new BABYLON.DynamicTexture(name, 256, this.scene);
        const ctx = texture.getContext();
        
        const brickWidth = 32;
        const brickHeight = 16;
        const mortarSize = 2;
        
        // Base (mortar is lower)
        ctx.fillStyle = '#404040';
        ctx.fillRect(0, 0, 256, 256);
        
        // Bricks are raised
        for (let row = 0; row < 16; row++) {
            const offset = (row % 2) * (brickWidth / 2);
            
            for (let col = -1; col < 9; col++) {
                const x = col * brickWidth + offset;
                const y = row * brickHeight;
                
                // Brick surface with slight variation
                const height = 180 + Math.random() * 40;
                ctx.fillStyle = `rgb(${height},${height},${height})`;
                ctx.fillRect(
                    x + mortarSize, 
                    y + mortarSize, 
                    brickWidth - mortarSize * 2, 
                    brickHeight - mortarSize * 2
                );
            }
        }
        
        texture.update();
        texture.level = 0.3;
        return texture;
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
        // Flat terrain - no extra blocks needed
        // Buildings and props provide all the cover
    }
    
    createRamp(x, y, z, width, length, slopeAngle) {
        // Create STAIRS instead of ramp (works better with collision)
        const stairGroup = new BABYLON.TransformNode(`stairs_${x}_${z}`, this.scene);
        
        const numSteps = 8;
        const stepHeight = 0.35;
        const stepDepth = length / numSteps;
        
        for (let i = 0; i < numSteps; i++) {
            const step = BABYLON.MeshBuilder.CreateBox(`step_${x}_${z}_${i}`, {
                width: width,
                height: stepHeight,
                depth: stepDepth + 0.1 // Slight overlap
            }, this.scene);
            
            step.position = new BABYLON.Vector3(
                x,
                y - 1 + (i * stepHeight),
                z - (length/2) + (i * stepDepth) + stepDepth/2
            );
            
            step.material = this.materials.concrete;
            step.checkCollisions = true;
            step.isPickable = true;
            step.parent = stairGroup;
            
            this.meshes.push(step);
        }
        
        // Return a dummy mesh for the array (stairs are already added to meshes)
        const dummy = BABYLON.MeshBuilder.CreateBox(`stairDummy_${x}_${z}`, {
            width: 0.1, height: 0.1, depth: 0.1
        }, this.scene);
        dummy.visibility = 0;
        dummy.isPickable = false;
        
        return dummy;
    }
    
    createBuildings() {
        // Generate buildings (barracos) across the map
        const buildingConfigs = [];
        
        // Define building zones - FEWER buildings, more spread out
        const zones = [
            { x: -30, z: -30, count: 3 },
            { x: 0, z: -25, count: 3 },
            { x: 30, z: -30, count: 3 },
            { x: -30, z: 10, count: 2 },
            { x: 30, z: 10, count: 2 },
            { x: 0, z: 30, count: 2 },
        ];
        
        for (const zone of zones) {
            for (let i = 0; i < zone.count; i++) {
                const x = zone.x + Utils.random(-10, 10);
                const z = zone.z + Utils.random(-8, 8);
                const floors = 1; // 1 floor - simpler!
                const width = Utils.random(5, 8);
                const depth = Utils.random(5, 7);
                
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
            
            // Side walls - WITH BIG OPEN DOORS on ground floor (no wall above door!)
            if (floor === 0) {
                const sideDoorWidth = 2.5;
                // Left wall - only 2 pieces (no top piece!)
                this.createWall(x - width/2, baseY, z - depth/4 - 0.3, 0.2, floorHeight, depth/2 - sideDoorWidth/2 - 0.3, wallMat, 0);
                this.createWall(x - width/2, baseY, z + depth/4 + 0.3, 0.2, floorHeight, depth/2 - sideDoorWidth/2 - 0.3, wallMat, 0);
                
                // Right wall - only 2 pieces (no top piece!)
                this.createWall(x + width/2, baseY, z - depth/4 - 0.3, 0.2, floorHeight, depth/2 - sideDoorWidth/2 - 0.3, wallMat, 0);
                this.createWall(x + width/2, baseY, z + depth/4 + 0.3, 0.2, floorHeight, depth/2 - sideDoorWidth/2 - 0.3, wallMat, 0);
            } else {
                // Upper floors - solid walls
                this.createWall(x - width/2, baseY, z, 0.2, floorHeight, depth, wallMat, 0);
                this.createWall(x + width/2, baseY, z, 0.2, floorHeight, depth, wallMat, 0);
            }
            
            // Front wall with BIG door opening - NO WALL ABOVE DOOR!
            if (floor === 0) {
                const doorWidth = 3.0; // BIGGER DOOR!
                // Only side pieces - no top piece!
                this.createWall(x - width/2 + (width - doorWidth)/4, baseY, z - depth/2, (width - doorWidth)/2, floorHeight, 0.2, wallMat, 0);
                this.createWall(x + width/2 - (width - doorWidth)/4, baseY, z - depth/2, (width - doorWidth)/2, floorHeight, 0.2, wallMat, 0);
            } else {
                this.createWall(x, baseY, z - depth/2, width, floorHeight, 0.2, wallMat, 0);
            }
            
            // Back wall with door - NO WALL ABOVE DOOR!
            if (floor === 0) {
                const doorWidth = 2.5;
                // Only side pieces - no top piece!
                this.createWall(x - width/2 + (width - doorWidth)/4, baseY, z + depth/2, (width - doorWidth)/2, floorHeight, 0.2, wallMat, 0);
                this.createWall(x + width/2 - (width - doorWidth)/4, baseY, z + depth/2, (width - doorWidth)/2, floorHeight, 0.2, wallMat, 0);
            } else {
                this.createWall(x, baseY, z + depth/2, width, floorHeight, 0.2, wallMat, 0);
            }
            
            // Floor (with stair hole on upper floors)
            if (floor === 0 || floors === 1) {
                // Ground floor - solid
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
            } else {
                // Upper floor - with hole for stairs (2 pieces)
                const holeWidth = 1.5;
                const holeDepth = 4.5;
                
                // Main floor piece (most of the floor)
                const mainFloor = BABYLON.MeshBuilder.CreateBox(`floor_${x}_${z}_${floor}_main`, {
                    width: width - holeWidth - 0.5,
                    height: 0.2,
                    depth: depth
                }, this.scene);
                mainFloor.position = new BABYLON.Vector3(x - holeWidth/2, baseY, z);
                mainFloor.material = this.materials.concrete;
                mainFloor.checkCollisions = true;
                mainFloor.isPickable = true;
                this.meshes.push(mainFloor);
                
                // Side piece next to hole
                const sideFloor = BABYLON.MeshBuilder.CreateBox(`floor_${x}_${z}_${floor}_side`, {
                    width: holeWidth + 0.3,
                    height: 0.2,
                    depth: depth - holeDepth
                }, this.scene);
                sideFloor.position = new BABYLON.Vector3(x + width/2 - holeWidth/2 - 0.2, baseY, z - depth/2 + (depth - holeDepth)/2);
                sideFloor.material = this.materials.concrete;
                sideFloor.checkCollisions = true;
                sideFloor.isPickable = true;
                this.meshes.push(sideFloor);
            }
        }
        
        // INTERNAL STAIRS (inside the house)
        if (floors > 1) {
            this.createInternalStairs(x, z, groundY, floors, width, depth);
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
    }
    
    createInternalStairs(x, z, groundY, floors, buildingWidth, buildingDepth) {
        const floorHeight = 3;
        const stairWidth = 1.2;
        const numSteps = 10;
        const stepHeight = floorHeight / numSteps;
        const stepDepth = 0.4;
        
        // Place stairs in corner of building
        const stairX = x + buildingWidth/2 - stairWidth/2 - 0.3;
        const stairZ = z + buildingDepth/2 - 2;
        
        for (let floor = 0; floor < floors - 1; floor++) {
            const baseY = groundY + floor * floorHeight;
            
            // Create steps
            for (let step = 0; step < numSteps; step++) {
                const stepMesh = BABYLON.MeshBuilder.CreateBox(`intStep_${x}_${z}_${floor}_${step}`, {
                    width: stairWidth,
                    height: stepHeight,
                    depth: stepDepth
                }, this.scene);
                
                stepMesh.position = new BABYLON.Vector3(
                    stairX,
                    baseY + step * stepHeight + stepHeight/2,
                    stairZ - step * stepDepth
                );
                
                stepMesh.material = this.materials.concrete;
                stepMesh.checkCollisions = true;
                stepMesh.isPickable = true;
                
                this.meshes.push(stepMesh);
            }
            
            // Hole in floor above for stairs (remove part of ceiling)
            // We'll make the floor have a gap by not creating floor there
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
        // Barrels scattered around
        for (let i = 0; i < 10; i++) {
            const x = Utils.random(-45, 45);
            const z = Utils.random(-45, 45);
            
            const barrel = BABYLON.MeshBuilder.CreateCylinder(`propBarrel_${i}`, {
                diameter: 0.6,
                height: 1
            }, this.scene);
            
            barrel.position = new BABYLON.Vector3(x, 0.5, z);
            barrel.material = Math.random() > 0.5 ? this.materials.rust : this.materials.metal;
            barrel.checkCollisions = true;
            barrel.isPickable = true;
            this.meshes.push(barrel);
        }
        
        // Sandbag walls - OUTSIDE buildings only (edges of map)
        const sandbagPositions = [
            // Far edges - guaranteed outside buildings
            { x: -55, z: 0 }, { x: 55, z: 0 },
            { x: 0, z: -55 }, { x: 0, z: 55 },
            { x: -50, z: -50 }, { x: 50, z: -50 },
            { x: -50, z: 50 }, { x: 50, z: 50 },
            // Mid positions at edges
            { x: -55, z: -25 }, { x: -55, z: 25 },
            { x: 55, z: -25 }, { x: 55, z: 25 },
        ];
        
        for (let i = 0; i < sandbagPositions.length; i++) {
            const pos = sandbagPositions[i];
            
            const sandbags = BABYLON.MeshBuilder.CreateBox(`sandbags_${i}`, {
                width: Utils.random(2, 3),
                height: 0.8,
                depth: 0.6
            }, this.scene);
            
            sandbags.position = new BABYLON.Vector3(pos.x, 0.4, pos.z);
            sandbags.rotation.y = Utils.random(0, Math.PI);
            sandbags.material = this.materials.ground;
            sandbags.checkCollisions = true;
            sandbags.isPickable = true;
            this.meshes.push(sandbags);
        }
    }
    
    createSpawnPoints() {
        // Police spawns - FAR from buildings, in open area
        for (let i = 0; i < 10; i++) {
            this.spawnPoints.police.push(new BABYLON.Vector3(
                Utils.random(-20, 20),
                2,
                Utils.random(50, 60) // Far back, open area
            ));
        }
        
        // Criminal spawns - OPEN AREAS, far from buildings!
        // These coordinates are in areas WITHOUT buildings
        const safeSpawnPoints = [
            { x: -45, z: -45 },  // Far corner
            { x: 45, z: -45 },   // Far corner
            { x: -45, z: 45 },   // Corner
            { x: 45, z: 45 },    // Corner
            { x: 0, z: -50 },    // Far back
            { x: 0, z: 50 },     // Far front
            { x: -50, z: 0 },    // Far left
            { x: 50, z: 0 },     // Far right
            { x: -35, z: -35 },  // Diagonal
            { x: 35, z: 35 },    // Diagonal
        ];
        
        for (let i = 0; i < 10; i++) {
            const spawn = safeSpawnPoints[i % safeSpawnPoints.length];
            this.spawnPoints.criminal.push(new BABYLON.Vector3(spawn.x, 2, spawn.z));
        }
    }
    
    getGroundLevel(x, z) {
        // Flat terrain - everything at ground level
        return 0;
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
