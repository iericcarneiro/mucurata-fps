/**
 * Main Game Controller for Favela Wars FPS
 */

class Game {
    constructor(canvas) {
        this.canvas = canvas;
        this.engine = null;
        this.scene = null;
        
        // Game state
        this.isRunning = false;
        this.isPaused = false;
        this.isGameOver = false;
        
        // Game settings
        this.team = null;
        this.primaryWeapon = null;
        this.difficulty = 'normal';
        this.enemyCount = 8;
        
        // Game objects
        this.player = null;
        this.map = null;
        this.npcManager = null;
        
        // Timing
        this.lastUpdateTime = 0;
        this.gameTime = 0;
        
        // Make globally accessible
        window.gameInstance = this;
    }
    
    async init() {
        // Create Babylon engine
        this.engine = new BABYLON.Engine(this.canvas, true, {
            preserveDrawingBuffer: true,
            stencil: true
        });
        
        // Handle window resize
        window.addEventListener('resize', () => {
            this.engine.resize();
        });
        
        // Enable audio
        BABYLON.Engine.audioEngine = new BABYLON.AudioEngine();
        
        console.log('Game engine initialized');
    }
    
    async start(team, primaryWeapon) {
        this.team = team;
        this.primaryWeapon = primaryWeapon;
        
        console.log(`Starting game as ${team} with ${primaryWeapon}`);
        
        // Create scene
        await this.createScene();
        
        // Show HUD
        document.getElementById('hud').style.display = 'block';
        
        // Update total enemies display
        document.getElementById('total-enemies').textContent = this.enemyCount;
        
        // Start game loop
        this.isRunning = true;
        this.lastUpdateTime = performance.now();
        
        this.engine.runRenderLoop(() => {
            if (this.isRunning && !this.isPaused) {
                this.update();
            }
            this.scene.render();
        });
        
        // Request pointer lock
        this.canvas.requestPointerLock();
    }
    
    async createScene() {
        try {
            // Create scene
            this.scene = new BABYLON.Scene(this.engine);
            this.scene.clearColor = new BABYLON.Color4(0.1, 0.1, 0.15, 1);
            
            // Use Babylon's built-in collision system (no physics engine needed)
            console.log('Scene created, using collision system');
        
        // Generate map
        this.map = new FavelaMap(this.scene);
        this.map.generate();
        
        // Create player
        const playerSpawn = this.map.getPlayerSpawn(this.team);
        this.player = new Player(this.scene, this.canvas, this.team, this.primaryWeapon);
        this.player.setPosition(playerSpawn);
        
        // Create NPCs
        this.npcManager = new NPCManager(this.scene);
        const enemyTeam = this.team === 'police' ? 'criminal' : 'police';
        const enemySpawns = this.map.getEnemySpawns(this.team);
        this.npcManager.spawnNPCs(enemyTeam, this.enemyCount, enemySpawns);
        
        // Enable collisions
        this.scene.collisionsEnabled = true;
        
        // Set up fog for atmosphere - CS-style distance haze
        this.scene.fogMode = BABYLON.Scene.FOGMODE_EXP2;
        this.scene.fogDensity = 0.008;
        this.scene.fogColor = new BABYLON.Color3(0.55, 0.53, 0.5);
        this.scene.fogStart = 30;
        this.scene.fogEnd = 120;
        
        // Post-processing
        this.setupPostProcessing();
        
        console.log('Scene created successfully');
        } catch (error) {
            console.error('Error creating scene:', error);
            throw error;
        }
    }
    
    setupPostProcessing() {
        // Create default pipeline for post-processing
        const pipeline = new BABYLON.DefaultRenderingPipeline(
            "defaultPipeline",
            true,
            this.scene,
            [this.player.camera]
        );
        
        // Enable bloom for muzzle flashes and lights (CS-style subtle)
        pipeline.bloomEnabled = true;
        pipeline.bloomThreshold = 0.7;
        pipeline.bloomWeight = 0.4;
        pipeline.bloomKernel = 64;
        pipeline.bloomScale = 0.6;
        
        // Enable FXAA for smooth edges
        pipeline.fxaaEnabled = true;
        
        // Sharpen for crispy visuals like CS
        pipeline.sharpenEnabled = true;
        pipeline.sharpen.edgeAmount = 0.3;
        pipeline.sharpen.colorAmount = 1.0;
        
        // Enable tone mapping - more cinematic
        pipeline.imageProcessingEnabled = true;
        pipeline.imageProcessing.toneMappingEnabled = true;
        pipeline.imageProcessing.toneMappingType = BABYLON.ImageProcessingConfiguration.TONEMAPPING_ACES;
        pipeline.imageProcessing.exposure = 1.1;
        pipeline.imageProcessing.contrast = 1.25;
        
        // Color grading for CS-style look (slightly desaturated, gritty)
        pipeline.imageProcessing.colorCurvesEnabled = true;
        const curves = new BABYLON.ColorCurves();
        curves.globalSaturation = -15; // Slightly desaturated
        curves.highlightsSaturation = -10;
        curves.shadowsSaturation = 5;
        curves.globalExposure = 5;
        pipeline.imageProcessing.colorCurves = curves;
        
        // Vignette for focus
        pipeline.imageProcessing.vignetteEnabled = true;
        pipeline.imageProcessing.vignetteWeight = 2.0;
        pipeline.imageProcessing.vignetteCameraFov = 0.4;
        pipeline.imageProcessing.vignetteColor = new BABYLON.Color4(0, 0, 0, 1);
        
        // Chromatic aberration (subtle, for realism)
        pipeline.chromaticAberrationEnabled = true;
        pipeline.chromaticAberration.aberrationAmount = 15;
        pipeline.chromaticAberration.radialIntensity = 0.8;
        
        // Grain for cinematic feel
        pipeline.grainEnabled = true;
        pipeline.grain.intensity = 8;
        pipeline.grain.animated = true;
        
        // Store pipeline reference
        this.renderPipeline = pipeline;
        
        // SSAO for depth and realism
        this.setupSSAO();
    }
    
    setupSSAO() {
        // Screen Space Ambient Occlusion
        const ssaoRatio = {
            ssaoRatio: 0.5,
            blurRatio: 0.5
        };
        
        const ssao = new BABYLON.SSAO2RenderingPipeline("ssao", this.scene, ssaoRatio, [this.player.camera]);
        ssao.radius = 1.5;
        ssao.totalStrength = 1.2;
        ssao.expensiveBlur = true;
        ssao.samples = 16;
        ssao.maxZ = 100;
        ssao.minZAspect = 0.5;
        
        this.ssaoPipeline = ssao;
    }
    
    update() {
        const now = performance.now();
        const deltaTime = (now - this.lastUpdateTime) / 1000; // Convert to seconds
        this.lastUpdateTime = now;
        
        this.gameTime += deltaTime;
        
        // Update player
        if (this.player && !this.player.isDead) {
            this.player.update(deltaTime);
        }
        
        // Update NPCs
        if (this.npcManager) {
            this.npcManager.update(deltaTime, this.player);
        }
        
        // Check win condition
        this.checkWinCondition();
    }
    
    checkWinCondition() {
        if (this.isGameOver) return;
        
        const enemyTeam = this.team === 'police' ? 'criminal' : 'police';
        const aliveEnemies = this.npcManager.getAliveCount(enemyTeam);
        
        if (aliveEnemies === 0) {
            this.victory();
        }
    }
    
    onPlayerDeath() {
        this.gameOver(false);
    }
    
    onNPCDeath(npc) {
        // Update UI is handled by player kills counter
        console.log(`NPC ${npc.id} eliminated`);
    }
    
    victory() {
        this.isGameOver = true;
        this.showGameOver(true);
    }
    
    gameOver(isVictory) {
        this.isGameOver = true;
        this.isRunning = false;
        
        // Exit pointer lock
        document.exitPointerLock();
        
        this.showGameOver(isVictory);
    }
    
    showGameOver(isVictory) {
        const gameOverScreen = document.getElementById('game-over');
        const title = document.getElementById('game-over-title');
        const stats = document.getElementById('game-over-stats');
        
        if (isVictory) {
            title.textContent = 'MISSÃO COMPLETA';
            title.style.color = '#00ff00';
        } else {
            title.textContent = 'VOCÊ MORREU';
            title.style.color = '#ff0000';
        }
        
        stats.innerHTML = `
            Eliminações: ${this.player.kills}<br>
            Tempo: ${Utils.formatTime(this.gameTime)}
        `;
        
        gameOverScreen.style.display = 'flex';
        document.getElementById('hud').style.display = 'none';
    }
    
    togglePause() {
        if (this.isGameOver) return;
        
        this.isPaused = !this.isPaused;
        
        const pauseMenu = document.getElementById('pause-menu');
        
        if (this.isPaused) {
            pauseMenu.style.display = 'flex';
            document.exitPointerLock();
        } else {
            pauseMenu.style.display = 'none';
            this.canvas.requestPointerLock();
        }
    }
    
    resume() {
        if (this.isPaused) {
            this.togglePause();
        }
    }
    
    restart() {
        this.cleanup();
        this.start(this.team, this.primaryWeapon);
        
        document.getElementById('pause-menu').style.display = 'none';
        document.getElementById('game-over').style.display = 'none';
    }
    
    returnToMenu() {
        this.cleanup();
        
        document.getElementById('pause-menu').style.display = 'none';
        document.getElementById('game-over').style.display = 'none';
        document.getElementById('hud').style.display = 'none';
        document.getElementById('main-menu').style.display = 'flex';
        
        // Reset menu state
        if (window.menuController) {
            window.menuController.reset();
        }
    }
    
    cleanup() {
        this.isRunning = false;
        this.isPaused = false;
        this.isGameOver = false;
        this.gameTime = 0;
        
        // Dispose game objects
        if (this.player) {
            this.player.dispose();
            this.player = null;
        }
        
        if (this.npcManager) {
            this.npcManager.dispose();
            this.npcManager = null;
        }
        
        if (this.map) {
            this.map.dispose();
            this.map = null;
        }
        
        // Dispose scene
        if (this.scene) {
            this.scene.dispose();
            this.scene = null;
        }
        
        // Stop render loop
        this.engine.stopRenderLoop();
    }
    
    dispose() {
        this.cleanup();
        
        if (this.engine) {
            this.engine.dispose();
            this.engine = null;
        }
    }
}
