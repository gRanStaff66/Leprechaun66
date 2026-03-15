import * as THREE from 'three';
import { Materials } from './Materials.js';

export const Environment = {
    ROOM_W: 100,
    ROOM_H: 30,
    ROOM_D: 100,
    BALL_Y: 18,
    roomBox: null,

    envs: {
        meadow: new THREE.Group(),
        rainbow: new THREE.Group(),
        disco: new THREE.Group(),
        campfire: new THREE.Group()
    },

    discoAssets: {
        ballGroup: null,
        pinSpots: [],
        mainLight: null,
        floorTiles: [],
        projectedDots: [],
        baseRayDirections: [],
        speakers: [],
        lasers: []
    },

    meadowAssets: {
        creek: null
    },

    campfireAssets: {
        fireCore: null,
        embers: [],
        fireLight: null
    },

    init(scene) {
        this.roomBox = new THREE.Box3(
            new THREE.Vector3(-this.ROOM_W/2, 0, -this.ROOM_D/2),
            new THREE.Vector3(this.ROOM_W/2, this.ROOM_H, this.ROOM_D/2)
        );

        this.buildOutdoors();
        this.buildDiscoRoom();
        this.buildCampfire();

        Object.values(this.envs).forEach(e => {
            e.visible = false;
            scene.add(e);
        });
    },

    buildOutdoors() {
        // Floor
        const floorGeo = new THREE.PlaneGeometry(this.ROOM_W*3, this.ROOM_D*3);
        const floorMat = new THREE.MeshStandardMaterial({
            map: Materials.textures.clover,
            roughness: 0.9
        });
        const floorMeadow = new THREE.Mesh(floorGeo, floorMat);
        floorMeadow.rotation.x = -Math.PI/2;
        floorMeadow.receiveShadow = true;
        this.envs.meadow.add(floorMeadow);

        const floorRainbow = floorMeadow.clone();
        this.envs.rainbow.add(floorRainbow);

        // Sky
        const skyGeo = new THREE.SphereGeometry(180, 32, 32);
        const skyMat = new THREE.MeshBasicMaterial({ color: 0x87CEEB, side: THREE.BackSide });
        const skyMeadow = new THREE.Mesh(skyGeo, skyMat);
        this.envs.meadow.add(skyMeadow);

        const skyRainbow = skyMeadow.clone();
        this.envs.rainbow.add(skyRainbow);

        // Rainbow specific
        const rainbowX = 25;
        const rainbowZ = -25;
        // The rainbow bundle ends between x=25-40=-15 and x=25-(40-5*1.2)=-9
        // We center the pot at the average: -12
        const potX = -12;
        const potZ = -25;

        const cols = [0xFF0000, 0xFF7F00, 0xFFFF00, 0x00FF00, 0x0000FF, 0x9400D3];
        cols.forEach((c, i) => {
            const arc = new THREE.Mesh(
                new THREE.TorusGeometry(40 - i*1.2, 0.8, 12, 100, Math.PI),
                new THREE.MeshBasicMaterial({ color: c, transparent: true, opacity: 0.5 })
            );
            arc.position.set(rainbowX, -2, rainbowZ);
            this.envs.rainbow.add(arc);
        });

        // Add a glow at the base of the rainbow
        const glowGeo = new THREE.CylinderGeometry(8, 8, 1, 32);
        const glowMat = new THREE.MeshBasicMaterial({
            color: 0xFFFF00,
            transparent: true,
            opacity: 0.2,
            blending: THREE.AdditiveBlending
        });
        const glow = new THREE.Mesh(glowGeo, glowMat);
        glow.position.set(potX, 0.1, potZ);
        this.envs.rainbow.add(glow);

        const potGroup = new THREE.Group();
        potGroup.position.set(potX, 0, potZ);
        this.envs.rainbow.add(potGroup);

        const potScale = 1.3;
        const pot = new THREE.Mesh(
            new THREE.SphereGeometry(5 * potScale, 32, 20, 0, Math.PI*2, 0, Math.PI/1.5),
            Materials.mats.leather
        );
        pot.rotation.x = Math.PI;
        pot.position.y = 4.5 * potScale;
        pot.castShadow = true;
        potGroup.add(pot);

        const coins = new THREE.Mesh(
            new THREE.SphereGeometry(4.8 * potScale, 20, 10, 0, Math.PI*2, 0, Math.PI/2),
            Materials.mats.gold
        );
        coins.position.y = 4.2 * potScale;
        potGroup.add(coins);

        // MEADOW ENHANCEMENTS
        // 3D Trees
        for(let i=0; i<15; i++) {
            const tree = this.createTree();
            const angle = Math.random() * Math.PI * 2;
            const dist = 40 + Math.random() * 60;
            tree.position.set(Math.cos(angle)*dist, 0, Math.sin(angle)*dist);
            tree.rotation.y = Math.random() * Math.PI;
            tree.scale.setScalar(1.5 + Math.random()*2);
            this.envs.meadow.add(tree);
        }

        // 3D Clovers
        for(let i=0; i<100; i++) {
            const clover = this.create3DClover();
            const angle = Math.random() * Math.PI * 2;
            const dist = 5 + Math.random() * 40;
            clover.position.set(Math.cos(angle)*dist, 0.05, Math.sin(angle)*dist);
            clover.rotation.y = Math.random() * Math.PI;
            this.envs.meadow.add(clover);
        }

        // Creek
        this.meadowAssets.creek = this.createCreek();
        this.meadowAssets.creek.position.set(0, 0.1, -40);
        this.envs.meadow.add(this.meadowAssets.creek);

        // Campfire basic landscape
        const floorCamp = floorMeadow.clone();
        floorCamp.material = floorMeadow.material.clone();
        floorCamp.material.color.setHex(0x1a331a);
        this.envs.campfire.add(floorCamp);

        const skyCamp = skyMeadow.clone();
        skyCamp.material = new THREE.MeshBasicMaterial({ color: 0x050510, side: THREE.BackSide });
        this.envs.campfire.add(skyCamp);

        // Add some trees to campfire too
        for(let i=0; i<12; i++) {
            const tree = this.createTree();
            const angle = Math.random() * Math.PI * 2;
            const dist = 35 + Math.random() * 50;
            tree.position.set(Math.cos(angle)*dist, 0, Math.sin(angle)*dist);
            tree.rotation.y = Math.random() * Math.PI;
            tree.scale.setScalar(2 + Math.random()*2);
            this.envs.campfire.add(tree);
        }
    },

    createTree() {
        const group = new THREE.Group();
        const trunkGeo = new THREE.CylinderGeometry(0.5, 0.8, 4, 8);
        const trunkMat = new THREE.MeshStandardMaterial({ color: 0x5D4037 });
        const trunk = new THREE.Mesh(trunkGeo, trunkMat);
        trunk.position.y = 2;
        trunk.castShadow = true;
        group.add(trunk);

        const foliageMat = new THREE.MeshStandardMaterial({ color: 0x2E7D32 });
        for(let i=0; i<3; i++) {
            const foliage = new THREE.Mesh(new THREE.IcosahedronGeometry(2 - i*0.4, 0), foliageMat);
            foliage.position.y = 4 + i*1.5;
            foliage.castShadow = true;
            group.add(foliage);
        }
        return group;
    },

    create3DClover() {
        const group = new THREE.Group();
        const leaves = Math.random() > 0.95 ? 4 : 3;
        const leafGeo = new THREE.CircleGeometry(0.2, 8);
        const leafMat = new THREE.MeshStandardMaterial({
            color: Math.random() > 0.5 ? 0x32cd32 : 0x228b22,
            side: THREE.DoubleSide
        });

        for(let i=0; i<leaves; i++) {
            const leaf = new THREE.Mesh(leafGeo, leafMat);
            leaf.rotation.x = -Math.PI/2;
            const angle = (i / leaves) * Math.PI * 2;
            leaf.position.set(Math.cos(angle)*0.15, 0, Math.sin(angle)*0.15);
            leaf.rotation.z = angle;
            group.add(leaf);
        }

        const stemGeo = new THREE.CylinderGeometry(0.01, 0.01, 0.3, 8);
        const stem = new THREE.Mesh(stemGeo, leafMat);
        stem.position.y = -0.15;
        group.add(stem);

        group.scale.setScalar(0.5 + Math.random()*1);
        return group;
    },

    createCreek() {
        const geo = new THREE.PlaneGeometry(200, 15);
        // Using a basic blue with some transparency and emissive for "sparkle"
        const mat = new THREE.MeshStandardMaterial({
            color: 0x0077be,
            transparent: true,
            opacity: 0.6,
            emissive: 0x001133
        });
        const creek = new THREE.Mesh(geo, mat);
        creek.rotation.x = -Math.PI/2;

        // We will animate the position/offset in the loop
        return creek;
    },

    buildDiscoRoom() {
        const wallMat = new THREE.MeshStandardMaterial({ color: 0x050505, roughness: 0.8 });
        const ceilingMat = new THREE.MeshStandardMaterial({ color: 0x020202, roughness: 0.9 });

        this.discoAssets.mainLight = new THREE.PointLight(0xeeeeff, 0, 80);
        this.discoAssets.mainLight.position.set(0, this.BALL_Y - 3, 0);
        this.envs.disco.add(this.discoAssets.mainLight);

        const ceiling = new THREE.Mesh(new THREE.PlaneGeometry(this.ROOM_W*2, this.ROOM_D*2), ceilingMat);
        ceiling.rotation.x = Math.PI / 2;
        ceiling.position.y = this.ROOM_H;
        this.envs.disco.add(ceiling);

        // LED Floor
        const gridSize = 20;
        const spacing = 4.0;
        const startXY = -((gridSize - 1) * spacing) / 2;
        const tileGeo = new THREE.BoxGeometry(3.8, 0.1, 3.8);

        for(let i=0; i<gridSize; i++) {
            for(let j=0; j<gridSize; j++) {
                const tileMat = new THREE.MeshStandardMaterial({
                    color: 0x000000,
                    emissive: new THREE.Color(),
                    roughness: 0.1,
                    metalness: 0.3
                });
                const tile = new THREE.Mesh(tileGeo, tileMat);
                tile.position.set(startXY + i * spacing, 0.05, startXY + j * spacing);
                const colors = [0xFF0000, 0xFF7F00, 0xFFFF00, 0x00FF00, 0x0000FF, 0x4B0082, 0x9400D3];
                tile.userData = {
                    baseColor: new THREE.Color(colors[Math.floor(Math.random() * colors.length)]),
                    phase: Math.random() * Math.PI * 2,
                    speed: 0.5 + Math.random() * 1.5
                };
                this.discoAssets.floorTiles.push(tile);
                this.envs.disco.add(tile);
            }
        }

        // Disco Ball
        this.discoAssets.ballGroup = new THREE.Group();
        this.discoAssets.ballGroup.position.y = this.BALL_Y;
        this.envs.disco.add(this.discoAssets.ballGroup);

        const ballRadius = 4.5;
        const mirrorTileSize = 0.4;
        const segmentsLat = 24;
        const silverMirrorMat = new THREE.MeshStandardMaterial({
            color: 0xdddddd, metalness: 1.0, roughness: 0.1, flatShading: true
        });
        const mTileGeom = new THREE.BoxGeometry(mirrorTileSize, mirrorTileSize, 0.1);

        for (let i = 0; i < segmentsLat; i++) {
            const lat = (i / segmentsLat) * Math.PI;
            const ringRadius = Math.sin(lat) * ballRadius;
            const y = Math.cos(lat) * ballRadius;
            const tilesInRing = Math.max(4, Math.floor((Math.PI * 2 * ringRadius) / (mirrorTileSize * 1.05)));

            for (let j = 0; j < tilesInRing; j++) {
                const lon = (j / tilesInRing) * Math.PI * 2;
                const x = Math.sin(lon) * ringRadius;
                const z = Math.cos(lon) * ringRadius;
                const tile = new THREE.Mesh(mTileGeom, silverMirrorMat);
                tile.position.set(x, y, z);
                tile.lookAt(0, 0, 0);
                tile.rotation.x += (Math.random() - 0.5) * 0.1;
                tile.rotation.y += (Math.random() - 0.5) * 0.1;
                this.discoAssets.ballGroup.add(tile);
            }
        }

        const grout = new THREE.Mesh(
            new THREE.SphereGeometry(ballRadius * 0.95, 32, 32),
            new THREE.MeshStandardMaterial({ color: 0x050505 })
        );
        this.discoAssets.ballGroup.add(grout);

        // Pin Spots
        const cornerDist = 20;
        const spotPositions = [
            [cornerDist, this.ROOM_H - 2, cornerDist],
            [-cornerDist, this.ROOM_H - 2, cornerDist],
            [cornerDist, this.ROOM_H - 2, -cornerDist],
            [-cornerDist, this.ROOM_H - 2, -cornerDist]
        ];
        spotPositions.forEach(pos => {
            const spot = new THREE.SpotLight(0xffffff, 0);
            spot.position.set(pos[0], pos[1], pos[2]);
            spot.angle = 0.2;
            spot.penumbra = 0.1;
            spot.decay = 1.0;
            spot.distance = 60;
            const targetObj = new THREE.Object3D();
            targetObj.position.set(0, this.BALL_Y, 0);
            this.envs.disco.add(targetObj);
            spot.target = targetObj;
            this.discoAssets.pinSpots.push(spot);
            this.envs.disco.add(spot);
        });

        // Projected Dots
        const dotCount = 500;
        const dotGeo = new THREE.PlaneGeometry(1.2, 1.2);
        const dotMat = new THREE.MeshBasicMaterial({
            color: 0xffffff,
            transparent: true,
            opacity: 0.5,
            blending: THREE.AdditiveBlending,
            depthWrite: false
        });

        for(let i=0; i<dotCount; i++) {
            const vector = new THREE.Vector3(
                (Math.random()-0.5)*2,
                (Math.random()-0.5)*2,
                (Math.random()-0.5)*2
            ).normalize();
            this.discoAssets.baseRayDirections.push(vector);
            const dot = new THREE.Mesh(dotGeo, dotMat);
            dot.scale.setScalar(0.5 + Math.random() * 1.5);
            this.discoAssets.projectedDots.push(dot);
            this.envs.disco.add(dot);
        }

        // Disco Enhancements: Speakers
        const speakerPositions = [
            [25, 0, -25], [-25, 0, -25], [25, 0, 25], [-25, 0, 25]
        ];
        speakerPositions.forEach(pos => {
            const speaker = this.createSpeaker();
            speaker.position.set(pos[0], pos[1], pos[2]);
            speaker.lookAt(0, 0, 0);
            this.discoAssets.speakers.push(speaker);
            this.envs.disco.add(speaker);
        });

        // Disco Enhancements: Lasers
        for(let i=0; i<8; i++) {
            const laser = this.createLaser(i);
            this.discoAssets.lasers.push(laser);
            this.envs.disco.add(laser);
        }
    },

    createSpeaker() {
        const group = new THREE.Group();
        const box = new THREE.Mesh(
            new THREE.BoxGeometry(4, 8, 4),
            new THREE.MeshStandardMaterial({ color: 0x111111 })
        );
        box.position.y = 4;
        group.add(box);

        const coneGeo = new THREE.CylinderGeometry(1.5, 1.5, 0.5, 32);
        const coneMat = new THREE.MeshStandardMaterial({ color: 0x222222 });

        const cone1 = new THREE.Mesh(coneGeo, coneMat);
        cone1.rotation.x = Math.PI/2;
        cone1.position.set(0, 6, 2);
        group.add(cone1);

        const cone2 = new THREE.Mesh(coneGeo, coneMat);
        cone2.rotation.x = Math.PI/2;
        cone2.position.set(0, 3, 2);
        group.add(cone2);

        group.userData = { cone1, cone2 };
        return group;
    },

    createLaser(index) {
        const group = new THREE.Group();
        const color = new THREE.Color().setHSL(index / 8, 1, 0.5);
        const geo = new THREE.CylinderGeometry(0.05, 0.05, 100, 8);
        const mat = new THREE.MeshBasicMaterial({
            color: color,
            transparent: true,
            opacity: 0.8
        });
        const beam = new THREE.Mesh(geo, mat);
        beam.position.y = 50;
        group.add(beam);

        group.position.set(
            (Math.random() - 0.5) * 40,
            this.ROOM_H - 1,
            (Math.random() - 0.5) * 40
        );
        group.userData = {
            baseRotation: new THREE.Euler(Math.random()*Math.PI, Math.random()*Math.PI, 0),
            speed: 0.5 + Math.random()
        };
        return group;
    },

    buildCampfire() {
        // Logs (3x scale)
        const logScale = 3.0;
        const logGeo = new THREE.CylinderGeometry(0.3 * logScale, 0.3 * logScale, 4 * logScale, 8);
        for(let i=0; i<6; i++) {
            const log = new THREE.Mesh(logGeo, Materials.mats.wood);
            log.rotation.z = Math.PI / 2;
            log.rotation.y = (i / 6) * Math.PI * 2;
            log.position.y = 0.3 * logScale;
            // Spread them slightly
            const dist = 1.0 * logScale;
            log.position.x = Math.cos(log.rotation.y) * dist;
            log.position.z = Math.sin(log.rotation.y) * dist;
            this.envs.campfire.add(log);
        }

        // Fire Core (3x scale)
        this.campfireAssets.fireCore = new THREE.Group();
        this.campfireAssets.fireCore.position.y = 1 * logScale;
        this.envs.campfire.add(this.campfireAssets.fireCore);

        for(let i=0; i<12; i++) {
            const flame = new THREE.Mesh(
                new THREE.ConeGeometry(0.5 * logScale, 2 * logScale, 8),
                Materials.mats.fire
            );
            flame.position.y = 0.5 * logScale;
            flame.rotation.x = (Math.random() - 0.5) * 0.5;
            flame.rotation.z = (Math.random() - 0.5) * 0.5;
            flame.userData = { phase: Math.random() * Math.PI * 2 };
            this.campfireAssets.fireCore.add(flame);
        }

        // Light (Boosted distance)
        this.campfireAssets.fireLight = new THREE.PointLight(0xffaa00, 3, 60);
        this.campfireAssets.fireLight.position.set(0, 2 * logScale, 0);
        this.campfireAssets.fireLight.castShadow = true;
        this.envs.campfire.add(this.campfireAssets.fireLight);

        // Embers
        const emberGeo = new THREE.SphereGeometry(0.05, 4, 4);
        const emberMat = new THREE.MeshBasicMaterial({ color: 0xffaa00 });
        for(let i=0; i<30; i++) {
            const ember = new THREE.Mesh(emberGeo, emberMat);
            this.resetEmber(ember);
            this.campfireAssets.embers.push(ember);
            this.envs.campfire.add(ember);
        }
    },

    resetEmber(ember) {
        ember.position.set(
            (Math.random() - 0.5) * 2,
            0.5 + Math.random() * 2,
            (Math.random() - 0.5) * 2
        );
        ember.userData = {
            speed: 0.1 + Math.random() * 0.2,
            vx: (Math.random() - 0.5) * 0.05,
            vz: (Math.random() - 0.5) * 0.05
        };
    }
};
