/**
 * Main Entry Point for Mucuratá FPS
 * 
 * A realistic browser-based FPS game using Babylon.js
 * Theme: Police vs Criminals in favela
 */

// Wait for DOM to load
document.addEventListener('DOMContentLoaded', async () => {
    console.log('🎮 Mucuratá FPS - Initializing...');
    
    // Get canvas
    const canvas = document.getElementById('renderCanvas');
    
    if (!canvas) {
        console.error('Canvas element not found!');
        return;
    }
    
    // Check WebGL support
    if (!checkWebGLSupport()) {
        showError('Seu navegador não suporta WebGL. Por favor, use um navegador moderno.');
        return;
    }
    
    // Initialize game
    const game = new Game(canvas);
    
    try {
        await game.init();
        console.log('✅ Game engine ready');
        
        // Initialize menu
        const menu = new MenuController();
        console.log('✅ Menu controller ready');
        
        // Prevent context menu on right click
        canvas.addEventListener('contextmenu', (e) => e.preventDefault());
        
        // Handle visibility change (pause when tab hidden)
        document.addEventListener('visibilitychange', () => {
            if (document.hidden && game.isRunning && !game.isPaused) {
                game.togglePause();
            }
        });
        
        console.log('🎮 Mucuratá FPS - Ready to play!');
        
    } catch (error) {
        console.error('Failed to initialize game:', error);
        showError('Erro ao inicializar o jogo. Verifique o console para mais detalhes.');
    }
});

/**
 * Check if WebGL is supported
 */
function checkWebGLSupport() {
    try {
        const canvas = document.createElement('canvas');
        return !!(window.WebGLRenderingContext && 
            (canvas.getContext('webgl') || canvas.getContext('experimental-webgl')));
    } catch (e) {
        return false;
    }
}

/**
 * Show error message to user
 */
function showError(message) {
    const menu = document.getElementById('main-menu');
    if (menu) {
        menu.innerHTML = `
            <div class="menu-content">
                <h1 class="game-title" style="color: #ff4444;">ERRO</h1>
                <p style="color: #fff; font-size: 1.2rem; margin-top: 20px;">${message}</p>
            </div>
        `;
    }
}

/**
 * Debug utilities (can be called from console)
 */
window.DEBUG = {
    // Toggle god mode
    godMode: () => {
        if (window.gameInstance && window.gameInstance.player) {
            window.gameInstance.player.maxHealth = 999999;
            window.gameInstance.player.health = 999999;
            console.log('God mode enabled');
        }
    },
    
    // Give ammo
    giveAmmo: () => {
        if (window.gameInstance && window.gameInstance.player) {
            const weapons = window.gameInstance.player.weapons;
            Object.values(weapons).forEach(w => {
                if (w.data.magSize) {
                    w.ammo = w.data.magSize;
                    w.reserveAmmo = w.data.reserveAmmo * 10;
                }
            });
            window.gameInstance.player.grenades = 10;
            console.log('Ammo refilled');
        }
    },
    
    // Kill all enemies
    killAll: () => {
        if (window.gameInstance && window.gameInstance.npcManager) {
            window.gameInstance.npcManager.npcs.forEach(npc => {
                if (!npc.isDead) {
                    npc.takeDamage(1000);
                }
            });
            console.log('All enemies eliminated');
        }
    },
    
    // Teleport to position
    teleport: (x, y, z) => {
        if (window.gameInstance && window.gameInstance.player) {
            window.gameInstance.player.setPosition(new BABYLON.Vector3(x, y, z));
            console.log(`Teleported to ${x}, ${y}, ${z}`);
        }
    },
    
    // Show FPS
    showFPS: () => {
        if (window.gameInstance && window.gameInstance.engine) {
            setInterval(() => {
                console.log(`FPS: ${window.gameInstance.engine.getFps().toFixed(0)}`);
            }, 1000);
        }
    },
    
    // List all NPCs
    listNPCs: () => {
        if (window.gameInstance && window.gameInstance.npcManager) {
            window.gameInstance.npcManager.npcs.forEach(npc => {
                console.log(`${npc.id}: HP=${npc.health}, State=${npc.state}, Dead=${npc.isDead}`);
            });
        }
    }
};

console.log('💡 Debug commands available: DEBUG.godMode(), DEBUG.giveAmmo(), DEBUG.killAll(), DEBUG.teleport(x,y,z), DEBUG.showFPS(), DEBUG.listNPCs()');
