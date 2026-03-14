import * as THREE from 'three';
import { Materials } from './Materials.js';

export function createLep(x, z, scene, isEasterEggActive) {
    const lep = {
        beardSpheres: [],
        phase: Math.random() * Math.PI * 2,
        group: new THREE.Group(),
        isSpinning: false,
        spinRemaining: 0
    };
    lep.group.position.set(x, 0, z);
    lep.group.rotation.y = (Math.random() - 0.5) * 2;
    scene.add(lep.group);

    const hips = new THREE.Group();
    hips.position.y = 1.9;
    lep.group.add(hips);

    const torso = new THREE.Group();
    hips.add(torso);
    lep.hips = hips;
    lep.torso = torso;

    // Body/Coat
    const coat = new THREE.Mesh(new THREE.CylinderGeometry(0.45, 0.55, 1.3, 32), Materials.mats.suit);
    coat.position.y = 0.65;
    coat.castShadow = true;
    coat.receiveShadow = true;
    torso.add(coat);

    // Belt
    const belt = new THREE.Mesh(new THREE.CylinderGeometry(0.48, 0.5, 0.18, 32), Materials.mats.leather);
    belt.position.y = 0.25;
    torso.add(belt);
    const buckle = new THREE.Mesh(new THREE.BoxGeometry(0.25, 0.25, 0.1), Materials.mats.gold);
    buckle.position.set(0, 0.25, 0.48);
    torso.add(buckle);

    // Head
    const headPivot = new THREE.Group();
    headPivot.position.y = 1.4;
    torso.add(headPivot);
    lep.head = headPivot;

    const head = new THREE.Mesh(new THREE.SphereGeometry(0.4, 32, 32), Materials.mats.skin);
    head.castShadow = true;
    headPivot.add(head);

    // Face details
    // Eyes
    const eyeGeo = new THREE.SphereGeometry(0.04, 8, 8);
    const eyeMat = new THREE.MeshBasicMaterial({ color: 0x333333 });
    const leftEye = new THREE.Mesh(eyeGeo, eyeMat);
    leftEye.position.set(-0.15, 0.1, 0.35);
    headPivot.add(leftEye);

    const rightEye = new THREE.Mesh(eyeGeo, eyeMat);
    rightEye.position.set(0.15, 0.1, 0.35);
    headPivot.add(rightEye);

    // Nose
    const nose = new THREE.Mesh(new THREE.SphereGeometry(0.05, 8, 8), Materials.mats.skin);
    nose.position.set(0, 0.02, 0.4);
    headPivot.add(nose);

    // Beard
    const beardGroup = new THREE.Group();
    for(let i=0; i<15; i++) {
        const bSphere = new THREE.Mesh(new THREE.SphereGeometry(0.14, 16, 16), Materials.mats.beard);
        const angle = (i / 14) * Math.PI - Math.PI/2;
        bSphere.position.set(
            Math.sin(angle)*0.35,
            -0.25 + Math.abs(Math.sin(angle))*0.15,
            Math.cos(angle)*0.3
        );
        beardGroup.add(bSphere);
        lep.beardSpheres.push({ mesh: bSphere, basePos: bSphere.position.clone(), bPhase: i*0.5 });
    }
    headPivot.add(beardGroup);

    // Hat
    const hat = new THREE.Group();
    hat.position.y = 0.35;
    headPivot.add(hat);

    hat.add(new THREE.Mesh(new THREE.CylinderGeometry(0.7, 0.7, 0.05, 32), Materials.mats.suit));
    const hatTop = new THREE.Mesh(new THREE.CylinderGeometry(0.4, 0.45, 0.7, 32), Materials.mats.suit);
    hatTop.position.y = 0.35;
    hat.add(hatTop);
    const hBuckle = new THREE.Mesh(new THREE.BoxGeometry(0.18, 0.18, 0.05), Materials.mats.gold);
    hBuckle.position.set(0, 0.1, 0.42);
    hat.add(hBuckle);

    // Sunglasses for Easter Egg
    const sunglasses = new THREE.Group();
    sunglasses.position.set(0, 0.08, 0.38);
    sunglasses.visible = isEasterEggActive;
    headPivot.add(sunglasses);
    lep.sunglasses = sunglasses;

    const lensGeo = new THREE.BoxGeometry(0.25, 0.15, 0.05);
    const lensMat = new THREE.MeshBasicMaterial({ color: 0x000000 });
    const leftLens = new THREE.Mesh(lensGeo, lensMat);
    leftLens.position.x = -0.15;
    const rightLens = new THREE.Mesh(lensGeo, lensMat);
    rightLens.position.x = 0.15;
    sunglasses.add(leftLens, rightLens);
    const frame = new THREE.Mesh(new THREE.BoxGeometry(0.6, 0.05, 0.05), lensMat);
    frame.position.y = 0.05;
    sunglasses.add(frame);

    // Arms
    function arm(isL) {
        const s = isL ? -1 : 1;
        const sh = new THREE.Group();
        sh.position.set(s*0.6, 1.1, 0);
        torso.add(sh);

        const u = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.12, 0.5, 16), Materials.mats.suit);
        u.translateY(-0.25);
        sh.add(u);

        const el = new THREE.Group();
        el.position.y = -0.5;
        sh.add(el);

        const l = new THREE.Mesh(new THREE.CylinderGeometry(0.1, 0.1, 0.4, 16), Materials.mats.suit);
        l.translateY(-0.2);
        el.add(l);

        // Detailed Hand
        const hand = new THREE.Group();
        hand.position.y = -0.5;
        el.add(hand);

        const palm = new THREE.Mesh(new THREE.SphereGeometry(0.12, 16, 16), Materials.mats.skin);
        hand.add(palm);

        // Fingers
        for(let i=0; i<4; i++) {
            const finger = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.03, 0.1, 8), Materials.mats.skin);
            finger.position.set((i-1.5)*0.05, -0.1, 0);
            hand.add(finger);
        }

        return { sh, el };
    }
    const lA = arm(true); lep.lSh = lA.sh; lep.lEl = lA.el;
    const rA = arm(false); lep.rSh = rA.sh; lep.rEl = rA.el;

    // Legs
    function leg(isL) {
        const s = isL ? -1 : 1;
        const hp = new THREE.Group();
        hp.position.set(s*0.28, 0, 0);
        hips.add(hp);

        const t = new THREE.Mesh(new THREE.CylinderGeometry(0.18, 0.15, 0.6, 16), Materials.mats.darkSuit);
        t.translateY(-0.3);
        hp.add(t);

        const kn = new THREE.Group();
        kn.position.y = -0.6;
        hp.add(kn);

        const c = new THREE.Mesh(new THREE.CylinderGeometry(0.13, 0.1, 0.5, 16), Materials.mats.suit);
        c.translateY(-0.25);
        kn.add(c);

        const shoe = new THREE.Mesh(new THREE.BoxGeometry(0.28, 0.2, 0.45), Materials.mats.leather);
        shoe.position.set(0,-0.6, 0.1);
        kn.add(shoe);

        const sBuckle = new THREE.Mesh(new THREE.BoxGeometry(0.15, 0.15, 0.05), Materials.mats.gold);
        sBuckle.position.set(0, -0.5, 0.32);
        kn.add(sBuckle);

        return { hp, kn };
    }
    const lL = leg(true); lep.lHp = lL.hp; lep.lKn = lL.kn;
    const rL = leg(false); lep.rHp = rL.hp; lep.rKn = rL.kn;

    return lep;
}
