/**
 * Menu Controller for Favela Wars FPS
 */

class MenuController {
    constructor() {
        this.selectedTeam = null;
        this.selectedWeapon = null;
        
        this.init();
    }
    
    init() {
        // Team selection
        const teamButtons = document.querySelectorAll('.team-btn');
        teamButtons.forEach(btn => {
            btn.addEventListener('click', () => this.selectTeam(btn.dataset.team, btn));
        });
        
        // Weapon selection
        const weaponButtons = document.querySelectorAll('.weapon-btn');
        weaponButtons.forEach(btn => {
            btn.addEventListener('click', () => this.selectWeapon(btn.dataset.weapon, btn));
        });
        
        // Start game
        const startBtn = document.getElementById('start-game');
        startBtn.addEventListener('click', () => this.startGame());
        
        // Pause menu
        document.getElementById('resume-btn').addEventListener('click', () => {
            if (window.gameInstance) {
                window.gameInstance.resume();
            }
        });
        
        document.getElementById('restart-btn').addEventListener('click', () => {
            if (window.gameInstance) {
                window.gameInstance.restart();
            }
        });
        
        document.getElementById('quit-btn').addEventListener('click', () => {
            if (window.gameInstance) {
                window.gameInstance.returnToMenu();
            }
        });
        
        // Game over menu
        document.getElementById('play-again-btn').addEventListener('click', () => {
            if (window.gameInstance) {
                window.gameInstance.restart();
            }
        });
        
        document.getElementById('menu-btn').addEventListener('click', () => {
            if (window.gameInstance) {
                window.gameInstance.returnToMenu();
            }
        });
        
        // Store reference
        window.menuController = this;
    }
    
    selectTeam(team, button) {
        // Remove selection from all team buttons
        document.querySelectorAll('.team-btn').forEach(btn => {
            btn.classList.remove('selected');
        });
        
        // Select this team
        button.classList.add('selected');
        this.selectedTeam = team;
        
        // Show weapon selection
        document.getElementById('weapon-section').style.display = 'block';
        
        // Check if can start
        this.checkCanStart();
        
        // Play sound effect
        this.playSelectSound();
    }
    
    selectWeapon(weapon, button) {
        // Remove selection from all weapon buttons
        document.querySelectorAll('.weapon-btn').forEach(btn => {
            btn.classList.remove('selected');
        });
        
        // Select this weapon
        button.classList.add('selected');
        this.selectedWeapon = weapon;
        
        // Check if can start
        this.checkCanStart();
        
        // Play sound effect
        this.playSelectSound();
    }
    
    checkCanStart() {
        const startBtn = document.getElementById('start-game');
        
        if (this.selectedTeam && this.selectedWeapon) {
            startBtn.style.display = 'inline-block';
        } else {
            startBtn.style.display = 'none';
        }
    }
    
    async startGame() {
        if (!this.selectedTeam || !this.selectedWeapon) return;
        
        // Map weapon selection to weapon type
        const weaponMap = {
            'shotgun': WeaponTypes.SHOTGUN,
            'sniper': WeaponTypes.SNIPER,
            'ar15': WeaponTypes.AR15
        };
        
        const weaponType = weaponMap[this.selectedWeapon];
        
        // Hide menu
        document.getElementById('main-menu').style.display = 'none';
        
        // Start game
        if (window.gameInstance) {
            await window.gameInstance.start(this.selectedTeam, weaponType);
        }
    }
    
    reset() {
        this.selectedTeam = null;
        this.selectedWeapon = null;
        
        // Reset UI
        document.querySelectorAll('.team-btn, .weapon-btn').forEach(btn => {
            btn.classList.remove('selected');
        });
        
        document.getElementById('weapon-section').style.display = 'none';
        document.getElementById('start-game').style.display = 'none';
    }
    
    playSelectSound() {
        try {
            const audioContext = new (window.AudioContext || window.webkitAudioContext)();
            const oscillator = audioContext.createOscillator();
            const gainNode = audioContext.createGain();
            
            oscillator.connect(gainNode);
            gainNode.connect(audioContext.destination);
            
            oscillator.frequency.value = 600;
            oscillator.type = 'sine';
            
            gainNode.gain.value = 0.1;
            gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.1);
            
            oscillator.start(audioContext.currentTime);
            oscillator.stop(audioContext.currentTime + 0.1);
        } catch (e) {
            // Audio not supported
        }
    }
}
