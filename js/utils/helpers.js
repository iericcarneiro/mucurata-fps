/**
 * Utility Functions for Favela Wars FPS
 */

const Utils = {
    /**
     * Clamp a value between min and max
     */
    clamp(value, min, max) {
        return Math.min(Math.max(value, min), max);
    },

    /**
     * Linear interpolation
     */
    lerp(a, b, t) {
        return a + (b - a) * t;
    },

    /**
     * Random number between min and max
     */
    random(min, max) {
        return Math.random() * (max - min) + min;
    },

    /**
     * Random integer between min and max (inclusive)
     */
    randomInt(min, max) {
        return Math.floor(Math.random() * (max - min + 1)) + min;
    },

    /**
     * Random element from array
     */
    randomElement(array) {
        return array[Math.floor(Math.random() * array.length)];
    },

    /**
     * Shuffle array (Fisher-Yates)
     */
    shuffle(array) {
        const result = [...array];
        for (let i = result.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [result[i], result[j]] = [result[j], result[i]];
        }
        return result;
    },

    /**
     * Distance between two Vector3
     */
    distance(v1, v2) {
        return BABYLON.Vector3.Distance(v1, v2);
    },

    /**
     * Check if point is in field of view
     */
    isInFOV(origin, direction, target, fovAngle) {
        const toTarget = target.subtract(origin).normalize();
        const dot = BABYLON.Vector3.Dot(direction, toTarget);
        return dot > Math.cos(fovAngle * Math.PI / 180 / 2);
    },

    /**
     * Convert degrees to radians
     */
    degToRad(degrees) {
        return degrees * Math.PI / 180;
    },

    /**
     * Convert radians to degrees
     */
    radToDeg(radians) {
        return radians * 180 / Math.PI;
    },

    /**
     * Ease out cubic
     */
    easeOutCubic(t) {
        return 1 - Math.pow(1 - t, 3);
    },

    /**
     * Ease in out cubic
     */
    easeInOutCubic(t) {
        return t < 0.5
            ? 4 * t * t * t
            : 1 - Math.pow(-2 * t + 2, 3) / 2;
    },

    /**
     * Create procedural texture color
     */
    createColor(r, g, b) {
        return new BABYLON.Color3(r / 255, g / 255, b / 255);
    },

    /**
     * Create simple material with color
     */
    createMaterial(scene, name, color, roughness = 0.8) {
        const mat = new BABYLON.PBRMaterial(name, scene);
        mat.albedoColor = color;
        mat.roughness = roughness;
        mat.metallic = 0;
        return mat;
    },

    /**
     * Create brick/wall texture procedurally
     */
    createBrickTexture(scene, width = 512, height = 512) {
        const texture = new BABYLON.DynamicTexture("brickTexture", { width, height }, scene);
        const ctx = texture.getContext();
        
        // Base color
        ctx.fillStyle = '#8B7355';
        ctx.fillRect(0, 0, width, height);
        
        // Draw bricks
        const brickWidth = 60;
        const brickHeight = 25;
        const mortarSize = 4;
        
        for (let y = 0; y < height; y += brickHeight + mortarSize) {
            const offset = (Math.floor(y / (brickHeight + mortarSize)) % 2) * (brickWidth / 2);
            for (let x = -brickWidth; x < width + brickWidth; x += brickWidth + mortarSize) {
                const bx = x + offset;
                const colorVar = Math.random() * 30 - 15;
                const r = Math.min(255, Math.max(0, 139 + colorVar));
                const g = Math.min(255, Math.max(0, 115 + colorVar));
                const b = Math.min(255, Math.max(0, 85 + colorVar));
                ctx.fillStyle = `rgb(${r}, ${g}, ${b})`;
                ctx.fillRect(bx, y, brickWidth, brickHeight);
            }
        }
        
        texture.update();
        return texture;
    },

    /**
     * Create concrete texture procedurally
     */
    createConcreteTexture(scene, width = 512, height = 512) {
        const texture = new BABYLON.DynamicTexture("concreteTexture", { width, height }, scene);
        const ctx = texture.getContext();
        
        // Base color
        ctx.fillStyle = '#808080';
        ctx.fillRect(0, 0, width, height);
        
        // Add noise
        const imageData = ctx.getImageData(0, 0, width, height);
        const data = imageData.data;
        
        for (let i = 0; i < data.length; i += 4) {
            const noise = (Math.random() - 0.5) * 40;
            data[i] = Math.min(255, Math.max(0, data[i] + noise));
            data[i + 1] = Math.min(255, Math.max(0, data[i + 1] + noise));
            data[i + 2] = Math.min(255, Math.max(0, data[i + 2] + noise));
        }
        
        ctx.putImageData(imageData, 0, 0);
        
        // Add some cracks
        ctx.strokeStyle = '#606060';
        ctx.lineWidth = 1;
        for (let i = 0; i < 5; i++) {
            ctx.beginPath();
            let x = Math.random() * width;
            let y = Math.random() * height;
            ctx.moveTo(x, y);
            for (let j = 0; j < 5; j++) {
                x += (Math.random() - 0.5) * 100;
                y += Math.random() * 50;
                ctx.lineTo(x, y);
            }
            ctx.stroke();
        }
        
        texture.update();
        return texture;
    },

    /**
     * Create corrugated metal texture
     */
    createMetalTexture(scene, width = 256, height = 256) {
        const texture = new BABYLON.DynamicTexture("metalTexture", { width, height }, scene);
        const ctx = texture.getContext();
        
        // Gradient base
        const gradient = ctx.createLinearGradient(0, 0, 0, height);
        gradient.addColorStop(0, '#4a4a4a');
        gradient.addColorStop(0.5, '#666666');
        gradient.addColorStop(1, '#4a4a4a');
        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, width, height);
        
        // Add corrugation lines
        for (let y = 0; y < height; y += 8) {
            ctx.fillStyle = y % 16 === 0 ? '#555' : '#777';
            ctx.fillRect(0, y, width, 4);
        }
        
        // Rust spots
        ctx.fillStyle = 'rgba(139, 69, 19, 0.3)';
        for (let i = 0; i < 10; i++) {
            const x = Math.random() * width;
            const y = Math.random() * height;
            const r = Math.random() * 20 + 5;
            ctx.beginPath();
            ctx.arc(x, y, r, 0, Math.PI * 2);
            ctx.fill();
        }
        
        texture.update();
        return texture;
    },

    /**
     * Format time as MM:SS
     */
    formatTime(seconds) {
        const mins = Math.floor(seconds / 60);
        const secs = Math.floor(seconds % 60);
        return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    },

    /**
     * Play sound with optional 3D positioning
     */
    playSound(scene, name, position = null, volume = 1) {
        // Sound would be loaded from assets in production
        // For now, we use Web Audio API for simple sounds
        try {
            const audioContext = BABYLON.Engine.audioEngine?.audioContext;
            if (!audioContext) return;
            
            const oscillator = audioContext.createOscillator();
            const gainNode = audioContext.createGain();
            
            oscillator.connect(gainNode);
            gainNode.connect(audioContext.destination);
            
            gainNode.gain.value = volume * 0.1;
            
            // Different sounds for different actions
            switch(name) {
                case 'shoot':
                    oscillator.frequency.value = 150;
                    oscillator.type = 'square';
                    gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.1);
                    break;
                case 'reload':
                    oscillator.frequency.value = 400;
                    oscillator.type = 'sine';
                    gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.3);
                    break;
                case 'hit':
                    oscillator.frequency.value = 800;
                    oscillator.type = 'sine';
                    gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.05);
                    break;
                case 'explosion':
                    oscillator.frequency.value = 60;
                    oscillator.type = 'sawtooth';
                    gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.5);
                    break;
            }
            
            oscillator.start(audioContext.currentTime);
            oscillator.stop(audioContext.currentTime + 0.5);
        } catch (e) {
            // Audio not supported or blocked
        }
    }
};

// Freeze to prevent modification
Object.freeze(Utils);
