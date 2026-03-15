import * as THREE from 'three';

export const Materials = {
    mats: {},
    textures: {},

    init() {
        this.textures.fabric = this.createBumpMap('fabric');
        this.textures.leather = this.createBumpMap('leather');
        this.textures.clover = this.createCloverMap();

        this.mats.gold = new THREE.MeshStandardMaterial({
            color: 0xFFD700,
            metalness: 0.8,
            roughness: 0.15,
            emissive: 0x332200,
            emissiveIntensity: 0.5
        });

        this.mats.suit = new THREE.MeshStandardMaterial({
            color: 0x008A27,
            roughness: 0.9,
            bumpMap: this.textures.fabric,
            bumpScale: 0.01
        });

        this.mats.darkSuit = new THREE.MeshStandardMaterial({
            color: 0x004d16,
            roughness: 0.9,
            bumpMap: this.textures.fabric,
            bumpScale: 0.01
        });

        this.mats.skin = new THREE.MeshStandardMaterial({
            color: 0xFFD3B6,
            roughness: 0.45
        });

        this.mats.beard = new THREE.MeshStandardMaterial({
            color: 0xD95A00,
            roughness: 0.8
        });

        this.mats.leather = new THREE.MeshStandardMaterial({
            color: 0x111111,
            roughness: 0.7,
            bumpMap: this.textures.leather,
            bumpScale: 0.02
        });
    },

    createBumpMap(type) {
        const canvas = document.createElement('canvas');
        canvas.width = 512;
        canvas.height = 512;
        const ctx = canvas.getContext('2d');
        if (type === 'fabric') {
            ctx.fillStyle = '#888';
            ctx.fillRect(0, 0, 512, 512);
            ctx.strokeStyle = '#fff';
            ctx.lineWidth = 1;
            for (let i = 0; i < 512; i += 4) {
                ctx.beginPath();
                ctx.moveTo(i, 0);
                ctx.lineTo(i, 512);
                ctx.stroke();
                ctx.beginPath();
                ctx.moveTo(0, i);
                ctx.lineTo(512, i);
                ctx.stroke();
            }
        } else {
            for (let i = 0; i < 512; i++) {
                for (let j = 0; j < 512; j++) {
                    const n = Math.random() * 255;
                    ctx.fillStyle = `rgb(${n},${n},${n})`;
                    ctx.fillRect(i, j, 1, 1);
                }
            }
        }
        const t = new THREE.CanvasTexture(canvas);
        t.wrapS = t.wrapT = THREE.RepeatWrapping;
        return t;
    },

    createCloverMap() {
        const canvas = document.createElement('canvas');
        canvas.width = 1024;
        canvas.height = 1024;
        const ctx = canvas.getContext('2d');

        // Base dark green grass
        ctx.fillStyle = '#1e661e';
        ctx.fillRect(0, 0, 1024, 1024);

        // Draw scattered clovers
        for (let i = 0; i < 450; i++) {
            const x = Math.random() * 1024;
            const y = Math.random() * 1024;
            const size = 15 + Math.random() * 20;
            const angle = Math.random() * Math.PI;

            ctx.save();
            ctx.translate(x, y);
            ctx.rotate(angle);

            // Mix of emerald and classic green
            ctx.fillStyle = (Math.random() > 0.85) ? '#32cd32' : '#228b22';
            ctx.shadowColor = 'rgba(0,0,0,0.3)';
            ctx.shadowBlur = 4;

            // Most are 3-leaf, some are lucky 4-leaf clovers
            const leaves = (Math.random() > 0.95) ? 4 : 3;
            for (let l = 0; l < leaves; l++) {
                ctx.rotate((Math.PI * 2) / leaves);
                ctx.beginPath();
                ctx.arc(size / 2, 0, size / 2, 0, Math.PI * 2);
                ctx.fill();
            }

            // Little stem
            ctx.beginPath();
            ctx.moveTo(0, 0);
            ctx.quadraticCurveTo(-size / 2, size, -size, size * 1.5);
            ctx.strokeStyle = ctx.fillStyle;
            ctx.lineWidth = 3;
            ctx.stroke();
            ctx.restore();
        }

        const t = new THREE.CanvasTexture(canvas);
        t.wrapS = t.wrapT = THREE.RepeatWrapping;
        t.repeat.set(12, 12);
        return t;
    }
};
