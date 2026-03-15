import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js';
import { OutputPass } from 'three/addons/postprocessing/OutputPass.js';

import { Materials } from './Materials.js';
import { createLep } from './Leprechaun.js';
import { Environment } from './Environment.js';

let scene, camera, renderer, composer, bloomPass, clock, controls;
let activeLeps = [];
let lights = { amb: null, dir: null, fill: null };
let currentBg = 'meadow';
let randomClickCount = 0;
let discoClickCount = 0;
let cloverRainGroup = null;
window.isEasterEggActive = false;

const irishSayings = [
    "\"An Irishman is never drunk as long as he has a blade of grass to hold onto.\"",
    "\"As you slide down the banister of life, may the splinters never point in the wrong direction.\"",
    "\"May you be at the gates of heaven an hour before the devil knows you're dead!\"",
    "\"If you're lucky enough to be Irish, you're lucky enough!\"",
    "\"There are only two kinds of people in the world: The Irish, and those who wish they were.\"",
    "\"May your pockets be heavy and your heart be light.\"",
    "\"A best friend is like a four-leaf clover: hard to find and lucky to have.\"",
    "\"I drink to your health so often, I'm starting to worry about my own!\"",
    "\"May the wind at your back not be the result of the corned beef and cabbage.\"",
    "\"God invented whiskey to keep the Irish from ruling the world.\"",
    "\"A good laugh and a long sleep are the two best cures for anything.\"",
    "\"May your glass be ever full, and your roof never leak.\""
];

function init() {
    Materials.init();

    scene = new THREE.Scene();
    scene.fog = new THREE.FogExp2(0x87CEEB, 0.002);

    camera = new THREE.PerspectiveCamera(40, window.innerWidth / window.innerHeight, 0.1, 400);
    updateCamera();
    camera.position.set(0, 12, 50);

    renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: "high-performance" });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.2;
    document.body.appendChild(renderer.domElement);

    clock = new THREE.Clock();

    controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.maxPolarAngle = Math.PI / 2.05;
    controls.minDistance = 5;
    controls.maxDistance = 120;
    controls.target.set(0, 5, 0);

    // Camera Rotation UX
    controls.autoRotate = true;
    controls.autoRotateSpeed = 1.0;

    let idleTimer;
    const resetIdleTimer = () => {
        controls.autoRotate = false;
        clearTimeout(idleTimer);
        idleTimer = setTimeout(() => {
            controls.autoRotate = true;
        }, 5000);
    };
    controls.addEventListener('start', resetIdleTimer);

    // GLOBAL LIGHTS
    lights.amb = new THREE.AmbientLight(0xffffff, 0.7);
    scene.add(lights.amb);

    lights.dir = new THREE.DirectionalLight(0xfff5e6, 1.8);
    lights.dir.position.set(20, 40, 20);
    lights.dir.castShadow = true;
    lights.dir.shadow.mapSize.width = 2048;
    lights.dir.shadow.mapSize.height = 2048;
    lights.dir.shadow.camera.near = 0.5;
    lights.dir.shadow.camera.far = 100;
    lights.dir.shadow.camera.left = -40;
    lights.dir.shadow.camera.right = 40;
    lights.dir.shadow.camera.top = 40;
    lights.dir.shadow.camera.bottom = -40;
    lights.dir.shadow.bias = -0.001;
    scene.add(lights.dir);

    lights.fill = new THREE.DirectionalLight(0xffffff, 0);
    lights.fill.position.set(0, 15, 40);
    scene.add(lights.fill);

    Environment.init(scene);

    const renderScene = new RenderPass(scene, camera);
    bloomPass = new UnrealBloomPass(new THREE.Vector2(window.innerWidth, window.innerHeight), 0.2, 0.4, 0.85);
    composer = new EffectComposer(renderer);
    composer.addPass(renderScene);
    composer.addPass(bloomPass);
    composer.addPass(new OutputPass());

    // Mappings for UI
    window.updateLepCount = function(val) {
        document.getElementById('count-display').innerText = val;
        const target = parseInt(val);
        while(activeLeps.length < target) {
            const r = activeLeps.length === 0 ? 0 : 5 + Math.random() * 30;
            const a = Math.random() * Math.PI * 2;
            activeLeps.push(createLep(Math.cos(a)*r, Math.sin(a)*r, scene, window.isEasterEggActive));
        }
        while(activeLeps.length > target) {
            const l = activeLeps.pop();
            scene.remove(l.group);
        }
    };

    window.changeScene = function(type, btn) {
        currentBg = type;
        document.querySelectorAll('.btn-sm').forEach(b => b.classList.remove('btn-active'));
        if(btn) btn.classList.add('btn-active');
        Object.keys(Environment.envs).forEach(k => Environment.envs[k].visible = (k === type));

        camera.position.set(0, 12, 50);
        controls.target.set(0, 5, 0);
        controls.update();

        // Reset All Environment Assets
        Environment.discoAssets.mainLight.intensity = 0;
        Environment.discoAssets.pinSpots.forEach(s => s.intensity = 0);
        Environment.campfireAssets.fireLight.intensity = 0;

        if(type === 'disco') {
            if(currentBg === 'disco') {
                discoClickCount++;
                if(discoClickCount >= 3) triggerDiscoInferno();
            } else {
                discoClickCount = 1;
            }
            scene.fog.color.setHex(0x050510);
            scene.fog.density = 0.008;
            lights.amb.color.setHex(0x2a1a4a);
            lights.amb.intensity = 2.16; // Boosted 20%
            lights.dir.intensity = 0;
            lights.fill.color.setHex(0xaa44ff);
            lights.fill.intensity = 1.8; // Boosted 20%
            Environment.discoAssets.mainLight.intensity = 1.8; // Boosted 20%
            Environment.discoAssets.pinSpots.forEach(s => s.intensity = 180);
            bloomPass.strength = 0.5;
        } else if(type === 'campfire') {
            scene.fog.color.setHex(0x050510);
            scene.fog.density = 0.01;
            lights.amb.color.setHex(0x111133);
            lights.amb.intensity = 0.4;
            lights.dir.intensity = 0;
            lights.fill.color.setHex(0xffaa00);
            lights.fill.intensity = 0.2;
            Environment.campfireAssets.fireLight.intensity = 2.5;
            bloomPass.strength = 0.4;
        } else {
            scene.fog.color.setHex(0x87CEEB);
            scene.fog.density = 0.002;
            lights.amb.color.setHex(0xffffff);
            lights.amb.intensity = 0.8;
            lights.dir.intensity = 1.8;
            lights.fill.color.setHex(0xaaddff);
            lights.fill.intensity = 0.5;
            bloomPass.strength = 0.2;
        }
    };

    window.updateSaying = function() {
        const sayingEl = document.getElementById('irish-saying');
        sayingEl.style.opacity = 0;
        setTimeout(() => {
            const randIndex = Math.floor(Math.random() * irishSayings.length);
            sayingEl.innerText = irishSayings[randIndex];
            sayingEl.style.opacity = 1;
        }, 400);
    };

    window.toggleUI = function() {
        const panel = document.getElementById('bottom-panel');
        const backdrop = document.getElementById('panel-backdrop');
        panel.classList.toggle('active');
        const isOpen = panel.classList.contains('active');
        if (isOpen) {
            backdrop.classList.remove('hidden');
        } else {
            backdrop.classList.add('hidden');
        }
        updateUIState();
    };

    window.shareParty = function() {
        const saying = document.getElementById('irish-saying').innerText;
        const url = window.location.href;
        const text = `${saying}\n\nJoin the party: ${url}`;
        document.getElementById('share-content').innerText = text;
        document.getElementById('share-modal').classList.remove('hidden');
    };

    window.randomParty = function() {
        randomClickCount++;
        if (randomClickCount % 7 === 0) triggerEasterEgg();
        const c = Math.floor(Math.random()*66)+1;
        document.getElementById('lep-slider').value = c;
        window.updateLepCount(c);
        if (c === 66) triggerGoldRush();
        window.updateSaying();
        const ts = ['meadow', 'rainbow', 'disco', 'campfire'];
        const t = ts[Math.floor(Math.random()*4)];
        window.changeScene(t, document.querySelector(`.bg-${t}`));
    };

    window.updateLepCount(1);
    window.updateSaying();
    window.changeScene('meadow', document.querySelector('.bg-meadow'));

    // Interaction Hint UX
    const hint = document.getElementById('interaction-hint');
    setTimeout(() => { hint.classList.add('visible'); }, 3000);
    const hideHint = () => {
        hint.classList.remove('visible');
        window.removeEventListener('mousedown', hideHint);
        window.removeEventListener('touchstart', hideHint);
    };
    window.addEventListener('mousedown', hideHint);
    window.addEventListener('touchstart', hideHint);

    setTimeout(() => {
        document.getElementById('loading').style.opacity = '0';
        setTimeout(()=>document.getElementById('loading').remove(), 500);
    }, 800);

    window.addEventListener('resize', onWindowResize);
    onWindowResize();
    animate();
}

function triggerEasterEgg() {
    window.isEasterEggActive = true;
    const ec = document.getElementById('easter-clover');
    ec.style.transform = 'translate(-50%, -50%) scale(0)';
    ec.style.opacity = '1';
    void ec.offsetWidth;
    ec.classList.add('zoom');
    setTimeout(() => {
        ec.classList.remove('zoom');
        ec.style.opacity = '0';
    }, 1000);

    activeLeps.forEach(l => {
        if (l.sunglasses) l.sunglasses.visible = true;
        l.isSpinning = true;
        l.spinRemaining = Math.PI * 2;
    });
    showMegaToast("LUCKY 7!", "PARTY MODE ACTIVATED!", "🍀");
}

function triggerGoldRush() {
    showMegaToast("66 LEPRECHAUNS!", "GOLD RUSH INITIATED!", "💰");
    activeLeps.forEach(l => {
        l.group.traverse(node => {
            if (node.isMesh && node.material !== Materials.mats.skin) {
                node.material = Materials.mats.gold;
            }
        });
    });
}

window.triggerCloverRain = function() {
    showMegaToast("CLOVER RAIN!", "KEEP CLICKING FOR LUCK!", "🍀");
    if(!cloverRainGroup) {
        cloverRainGroup = new THREE.Group();
        scene.add(cloverRainGroup);
    }
    for(let i=0; i<20; i++) {
        const clover = Environment.create3DClover();
        clover.position.set((Math.random()-0.5)*60, 30 + Math.random()*20, (Math.random()-0.5)*60);
        clover.userData = {
            rotSpeed: new THREE.Vector3(Math.random(), Math.random(), Math.random()),
            fallSpeed: 0.1 + Math.random()*0.2
        };
        cloverRainGroup.add(clover);
    }
}

function triggerDiscoInferno() {
    showMegaToast("DISCO INFERNO!", "HEAT IT UP!", "🔥");
    window.isDiscoInferno = true;
    setTimeout(() => { window.isDiscoInferno = false; discoClickCount = 0; }, 10000);
}

function showMegaToast(title, sub, icon) {
    const toast = document.getElementById('mega-toast');
    toast.querySelector('.toast-title').innerText = title;
    toast.querySelector('.toast-sub').innerText = sub;
    toast.querySelector('.toast-icon').innerText = icon;
    toast.classList.add('visible');
    setTimeout(() => {
        toast.classList.remove('visible');
    }, 4000);
}

function showToast(message) {
    const toast = document.getElementById('toast');
    toast.innerText = message;
    toast.classList.add('visible');
    setTimeout(() => {
        toast.classList.remove('visible');
    }, 3000);
}

function updateUIState() {
    const panel = document.getElementById('bottom-panel');
    const btn = document.getElementById('toggle-ui');
    if (!panel || !btn) return;
    const isOpen = panel.classList.contains('active');
    btn.classList.toggle('active', isOpen);
    btn.innerText = isOpen ? '✕ Close' : '⚙️ Controls';
}

function updateCamera() {
    const aspect = window.innerWidth / window.innerHeight;
    camera.aspect = aspect;
    camera.fov = aspect < 1 ? 40 / aspect : 40;
    camera.updateProjectionMatrix();
}

function onWindowResize() {
    updateCamera();
    renderer.setSize(window.innerWidth, window.innerHeight);
    composer.setSize(window.innerWidth, window.innerHeight);
    updateUIState();
}

function animate() {
    requestAnimationFrame(animate);
    const delta = clock.getDelta();
    const time = clock.getElapsedTime();

    // Animate Leprechauns
    activeLeps.forEach(l => {
        const speedMult = window.isEasterEggActive ? 8.4 : 4.2;
        const jumpMult = window.isEasterEggActive ? 1.5 : 1;
        const s = (time * speedMult) + l.phase;

        if (l.isSpinning && l.spinRemaining > 0) {
            const step = delta * 15;
            const move = Math.min(step, l.spinRemaining);
            l.group.rotation.y += move;
            l.spinRemaining -= move;
            if (l.spinRemaining <= 0) l.isSpinning = false;
        }

        l.hips.position.x = Math.sin(s) * 0.3;
        l.hips.position.y = 1.9 + Math.abs(Math.sin(s*2)) * 0.15 * jumpMult;
        l.hips.rotation.y = Math.sin(s*0.5) * 0.25;
        l.torso.rotation.y = -Math.sin(s*0.5) * 0.3;
        const step = Math.sin(s);
        l.lHp.rotation.x = Math.max(0, -step);
        l.lKn.rotation.x = Math.min(0, step)*1.3;
        const rS = Math.sin(s + Math.PI);
        l.rHp.rotation.x = Math.max(0, -rS);
        l.rKn.rotation.x = Math.min(0, rS)*1.3;
        l.lSh.rotation.x = -0.5 + Math.sin(s*2)*0.5;
        l.rSh.rotation.x = -0.5 + Math.sin(s*2+Math.PI)*0.5;
        l.head.rotation.y = Math.sin(s)*0.4;
        l.beardSpheres.forEach(b => {
            b.mesh.position.y = b.basePos.y + Math.sin(s*3 + b.bPhase)*0.025;
        });
    });

    // Animate Environment
    if(currentBg === 'meadow' && Environment.meadowAssets.creek) {
        Environment.meadowAssets.creek.position.z = -40 + Math.sin(time * 0.5) * 2;
    }

    if(currentBg === 'campfire') {
        // Fire animation
        if(Environment.campfireAssets.fireCore) {
            Environment.campfireAssets.fireCore.children.forEach(f => {
                f.scale.setScalar(0.8 + Math.sin(time * 10 + f.userData.phase) * 0.2);
                f.rotation.y += delta * 5;
            });
            Environment.campfireAssets.fireLight.intensity = 2.5 + Math.sin(time * 20) * 0.5;
        }
        // Embers
        Environment.campfireAssets.embers.forEach(e => {
            e.position.y += e.userData.speed;
            e.position.x += e.userData.vx;
            e.position.z += e.userData.vz;
            if(e.position.y > 10) Environment.resetEmber(e);
        });
    }

    if(currentBg === 'disco') {
        const ballSpeed = window.isDiscoInferno ? 2.0 : 0.3;
        Environment.discoAssets.ballGroup.rotation.y += delta * ballSpeed;
        Environment.discoAssets.ballGroup.rotation.z = Math.sin(time * 0.5) * 0.03;

        Environment.discoAssets.floorTiles.forEach(tile => {
            const data = tile.userData;
            const intensity = (Math.sin(time * data.speed + data.phase) + 1) / 2;
            tile.material.emissive.copy(data.baseColor).multiplyScalar(intensity * 0.7);
        });

        // Projected Dots
        const origin = new THREE.Vector3(0, Environment.BALL_Y, 0);
        const euler = new THREE.Euler(
            Environment.discoAssets.ballGroup.rotation.x,
            Environment.discoAssets.ballGroup.rotation.y,
            Environment.discoAssets.ballGroup.rotation.z
        );
        const raycaster = new THREE.Ray();
        raycaster.origin.copy(origin);
        for(let i=0; i<Environment.discoAssets.projectedDots.length; i++) {
            const baseDir = Environment.discoAssets.baseRayDirections[i];
            const dot = Environment.discoAssets.projectedDots[i];
            const currentDir = baseDir.clone().applyEuler(euler);
            raycaster.direction.copy(currentDir);
            const targetPoint = new THREE.Vector3();
            raycaster.intersectBox(Environment.roomBox, targetPoint);
            if (targetPoint) {
                dot.position.copy(targetPoint);
                dot.lookAt(origin);
                dot.material.opacity = 0.15 + Math.sin(time * 5 + i) * 0.3;
            }
        }

        // Speakers
        Environment.discoAssets.speakers.forEach(s => {
            const pulse = 1 + Math.sin(time * 10) * 0.1;
            s.userData.cone1.scale.set(pulse, pulse, pulse);
            s.userData.cone2.scale.set(pulse, pulse, pulse);
        });

        // Lasers
        Environment.discoAssets.lasers.forEach(l => {
            const speed = window.isDiscoInferno ? l.userData.speed * 4 : l.userData.speed;
            l.rotation.x = l.userData.baseRotation.x + Math.sin(time * speed) * 0.5;
            l.rotation.z = l.userData.baseRotation.z + Math.cos(time * speed) * 0.5;
            if(window.isDiscoInferno) {
                l.children[0].material.color.setHex(0xff4400);
            } else {
                // Restore color
                const idx = Environment.discoAssets.lasers.indexOf(l);
                l.children[0].material.color.setHSL(idx / 8, 1, 0.5);
            }
        });
        if(window.isDiscoInferno) {
            bloomPass.strength = 1.2;
            lights.fill.color.setHex(0xff2200);
        } else {
            bloomPass.strength = 0.5;
            lights.fill.color.setHex(0xaa44ff);
        }
    }

    // Animate Clover Rain
    if(cloverRainGroup) {
        for(let i = cloverRainGroup.children.length - 1; i >= 0; i--) {
            const c = cloverRainGroup.children[i];
            c.position.y -= c.userData.fallSpeed;
            c.rotation.x += c.userData.rotSpeed.x * 0.05;
            c.rotation.y += c.userData.rotSpeed.y * 0.05;
            c.rotation.z += c.userData.rotSpeed.z * 0.05;
            if(c.position.y < -5) {
                cloverRainGroup.remove(c);
            }
        }
    }

    controls.update();
    composer.render();
}

init();
