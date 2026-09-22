// Ultra-Realistic 3D WebGL Stadium Engine powered by Three.js
// Complete Anatomical 3D Model Overhaul & Multi-Phase Celebration Sequence:
// Sprint -> Knee Slide on Turf -> Corner Flag Smash -> Leap & 180° Spin -> Ground Slam "SIUUUU!"

class StadiumRenderer {
    constructor(container) {
        this.container = container || document.getElementById('stadium-viewport');
        this.width = this.container ? this.container.clientWidth : window.innerWidth;
        this.height = this.container ? this.container.clientHeight : window.innerHeight;

        // Three.js Core
        this.scene = null;
        this.camera = null;
        this.renderer = null;
        this.clock = new THREE.Clock();

        // 3D Objects & Groups
        this.ball = null;
        this.ballShadow = null;
        this.ronaldoGroup = null;
        this.gkGroup = null;
        this.goalGroup = null;
        this.netMesh = null;
        this.netGeometry = null;
        this.cornerFlags = [];
        this.targetCornerFlag = null;

        // Visual Effects: Confetti, Grass Blades, Shockwaves, Slide Marks
        this.confettiParticles = null;
        this.turfParticles = null;
        this.shockwaveMesh = null;
        this.slideMarkMesh = null;

        // Game & Animation State
        this.state = 'idle'; // 'idle', 'runup', 'shooting', 'celebrating', 'saved'
        this.ballState = 'ready'; // 'ready', 'flying', 'in_net', 'saved'
        this.ballFlightProgress = 0;
        this.ballStartPos = new THREE.Vector3(0, 0.22, 11.0); // Penalty spot
        this.ballTargetPos = new THREE.Vector3(0, 1.5, 0);
        this.isGoalOutcome = true;
        this.onShotComplete = null;

        // Goalkeeper 3D Animation State
        this.gkState = 'idle';
        this.gkTargetZone = 0;
        this.gkAnimProgress = 0;
        this.gkSaveVariant = 0;
        this.gkConcedeVariant = 0;

        // Articulated Cristiano Ronaldo Celebration State
        this.isCelebratingSiu = false;
        this.celebPhase = 0; 
        // 0: Goal sprint to corner (0.0s - 1.4s)
        // 1: Knee slide across turf (1.4s - 2.8s)
        // 2: Corner flag smash & kick (2.8s - 3.7s)
        // 3: Run-up & high leap (3.7s - 4.5s)
        // 4: 180° mid-air pirouette & arm tuck (4.5s - 5.1s)
        // 5: Explosive ground landing & SIUUU pose (5.1s - 7.0s)
        this.celebTimer = 0;
        this.hasPlayedSlideSound = false;
        this.hasPlayedSmashSound = false;
        this.hasPlayedSiuSound = false;

        // Camera Modes
        this.cameraMode = 'penalty'; // 'penalty', 'track_shot', 'celeb_dynamic', 'siu_hero'
        this.cameraDefaultPos = new THREE.Vector3(0, 2.6, 14.8);
        this.cameraDefaultLook = new THREE.Vector3(0, 1.6, 0);
        this.camCurrentPos = new THREE.Vector3().copy(this.cameraDefaultPos);
        this.camCurrentLook = new THREE.Vector3().copy(this.cameraDefaultLook);

        this.initThree();
        this.buildStadium();
        this.buildGoal();
        this.buildCornerFlags();
        this.buildRonaldo();
        this.buildFranceGoalkeeper();
        this.buildBall();
        this.buildParticles();

        window.addEventListener('resize', () => this.resize());
    }

    initThree() {
        // Scene & Fog
        this.scene = new THREE.Scene();
        this.scene.background = new THREE.Color(0x060c18);
        this.scene.fog = new THREE.FogExp2(0x0a1426, 0.010);

        // Perspective Camera
        this.camera = new THREE.PerspectiveCamera(46, this.width / this.height, 0.1, 250);
        this.camera.position.copy(this.cameraDefaultPos);
        this.camera.lookAt(this.cameraDefaultLook);

        // WebGL Renderer with High Precision & PCF Soft Shadows
        this.renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false, powerPreference: 'high-performance' });
        this.renderer.setSize(this.width, this.height);
        this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
        this.renderer.shadowMap.enabled = true;
        this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;

        // Replace 2D canvas with WebGL canvas
        const canvas = document.getElementById('game-canvas');
        if (canvas && canvas.parentElement) {
            canvas.style.display = 'none';
            this.renderer.domElement.id = 'webgl-game-canvas';
            this.renderer.domElement.style.width = '100%';
            this.renderer.domElement.style.height = '100%';
            this.renderer.domElement.style.display = 'block';
            this.renderer.domElement.style.position = 'absolute';
            this.renderer.domElement.style.top = '0';
            this.renderer.domElement.style.left = '0';
            this.renderer.domElement.style.zIndex = '1';
            canvas.parentElement.insertBefore(this.renderer.domElement, canvas);
        }

        // Lighting Architecture: Ambient, Key Lights, 4 Stadium Floodlight Towers
        const ambientLight = new THREE.AmbientLight(0xddeeff, 0.7);
        this.scene.add(ambientLight);

        const addFloodlight = (x, y, z, tx, ty, tz, intensity = 1.6) => {
            const light = new THREE.SpotLight(0xffffff, intensity, 140, Math.PI / 3.8, 0.45, 1.2);
            light.position.set(x, y, z);
            light.target.position.set(tx, ty, tz);
            light.castShadow = true;
            light.shadow.mapSize.width = 1024;
            light.shadow.mapSize.height = 1024;
            light.shadow.camera.near = 5;
            light.shadow.camera.far = 120;
            this.scene.add(light);
            this.scene.add(light.target);

            // Glowing lens flare light housing
            const housingGeo = new THREE.SphereGeometry(0.75, 16, 16);
            const housingMat = new THREE.MeshBasicMaterial({ color: 0xffffff });
            const housing = new THREE.Mesh(housingGeo, housingMat);
            housing.position.set(x, y, z);
            this.scene.add(housing);
        };

        addFloodlight(-26, 24, 26, 0, 0, 6, 1.6);
        addFloodlight(26, 24, 26, 0, 0, 6, 1.6);
        addFloodlight(-26, 24, -16, 0, 1, 0, 1.3);
        addFloodlight(26, 24, -16, 0, 1, 0, 1.3);

        const dirLight = new THREE.DirectionalLight(0xfffaed, 0.8);
        dirLight.position.set(5, 35, 12);
        dirLight.castShadow = true;
        this.scene.add(dirLight);
    }

    resize() {
        if (!this.renderer || !this.camera) return;
        const parent = this.renderer.domElement.parentElement;
        if (!parent) return;
        this.width = parent.clientWidth;
        this.height = parent.clientHeight;
        this.camera.aspect = this.width / this.height;
        this.camera.updateProjectionMatrix();
        this.renderer.setSize(this.width, this.height);
    }

    // Build 3D Realistic Pitch, Stands, LED Boards and Banners
    buildStadium() {
        const canvas = document.createElement('canvas');
        canvas.width = 1024;
        canvas.height = 1024;
        const ctx = canvas.getContext('2d');

        // Natural grass gradient
        ctx.fillStyle = '#1e7b2a';
        ctx.fillRect(0, 0, 1024, 1024);

        // Crisp mowing stripes
        const stripeCount = 16;
        const stripeHeight = 1024 / stripeCount;
        for (let i = 0; i < stripeCount; i++) {
            ctx.fillStyle = i % 2 === 0 ? '#269435' : '#1c6f25';
            ctx.fillRect(0, i * stripeHeight, 1024, stripeHeight);
        }

        // Noise blades texture
        ctx.fillStyle = 'rgba(255, 255, 255, 0.05)';
        for (let i = 0; i < 45000; i++) {
            const rx = Math.random() * 1024;
            const ry = Math.random() * 1024;
            ctx.fillRect(rx, ry, 2, 2);
        }

        const grassTexture = new THREE.CanvasTexture(canvas);
        grassTexture.wrapS = THREE.RepeatWrapping;
        grassTexture.wrapT = THREE.RepeatWrapping;
        grassTexture.repeat.set(4, 4);

        const pitchGeo = new THREE.PlaneGeometry(90, 110);
        const pitchMat = new THREE.MeshStandardMaterial({
            map: grassTexture,
            roughness: 0.7,
            metalness: 0.05
        });
        const pitch = new THREE.Mesh(pitchGeo, pitchMat);
        pitch.rotation.x = -Math.PI / 2;
        pitch.receiveShadow = true;
        this.scene.add(pitch);

        this.buildPitchMarkings();
        this.buildGrandstands();
    }

    buildPitchMarkings() {
        const lineMat = new THREE.MeshBasicMaterial({ color: 0xffffff, depthWrite: false });

        const addChalkLine = (w, h, x, z) => {
            const geo = new THREE.PlaneGeometry(w, h);
            const mesh = new THREE.Mesh(geo, lineMat);
            mesh.rotation.x = -Math.PI / 2;
            mesh.position.set(x, 0.015, z);
            this.scene.add(mesh);
        };

        // Goal Line
        addChalkLine(46, 0.15, 0, 0);
        // 6-yard box
        addChalkLine(18.32, 0.15, 0, 5.5);
        addChalkLine(0.15, 5.5, -9.16, 2.75);
        addChalkLine(0.15, 5.5, 9.16, 2.75);
        // Penalty Box (18-yard box)
        addChalkLine(40.32, 0.15, 0, 16.5);
        addChalkLine(0.15, 16.5, -20.16, 8.25);
        addChalkLine(0.15, 16.5, 20.16, 8.25);

        // Penalty Spot Marker
        const spotGeo = new THREE.CircleGeometry(0.24, 24);
        const spot = new THREE.Mesh(spotGeo, lineMat);
        spot.rotation.x = -Math.PI / 2;
        spot.position.set(0, 0.02, 11.0);
        this.scene.add(spot);

        // Penalty Arc
        const arcGeo = new THREE.RingGeometry(9.1, 9.25, 32, 1, Math.PI * 0.15, Math.PI * 0.7);
        const arc = new THREE.Mesh(arcGeo, lineMat);
        arc.rotation.x = -Math.PI / 2;
        arc.position.set(0, 0.02, 11.0);
        this.scene.add(arc);
    }

    buildGrandstands() {
        // LED Advertising Board behind goal
        const boardGeo = new THREE.BoxGeometry(48, 1.4, 0.4);
        const boardMat = new THREE.MeshStandardMaterial({ color: 0x111111, roughness: 0.4, emissive: 0x1a2233 });
        const board = new THREE.Mesh(boardGeo, boardMat);
        board.position.set(0, 0.7, -6.5);
        this.scene.add(board);

        // Stadium Stands Tier
        const standGeo = new THREE.BoxGeometry(76, 20, 22);
        const standMat = new THREE.MeshStandardMaterial({ color: 0x141f33, roughness: 0.8 });
        const stand = new THREE.Mesh(standGeo, standMat);
        stand.position.set(0, 10, -18);
        this.scene.add(stand);

        // Crowd Silhouette Fans Texture
        const crowdCanvas = document.createElement('canvas');
        crowdCanvas.width = 1024;
        crowdCanvas.height = 256;
        const cctx = crowdCanvas.getContext('2d');
        cctx.fillStyle = '#0f172a';
        cctx.fillRect(0, 0, 1024, 256);

        // Fans cheering colors (Portugal crimson/gold and France royal blue/white)
        for (let i = 0; i < 900; i++) {
            const cx = Math.random() * 1024;
            const cy = Math.random() * 256;
            const isPort = cx < 512 ? (Math.random() > 0.3) : (Math.random() > 0.7);
            cctx.fillStyle = isPort ? (Math.random() > 0.5 ? '#cc0000' : '#ffd700') : (Math.random() > 0.5 ? '#0055ff' : '#ffffff');
            cctx.beginPath();
            cctx.arc(cx, cy, 3 + Math.random() * 3.5, 0, Math.PI * 2);
            cctx.fill();
        }

        const crowdTex = new THREE.CanvasTexture(crowdCanvas);
        const crowdPlaneGeo = new THREE.PlaneGeometry(74, 15);
        const crowdPlaneMat = new THREE.MeshBasicMaterial({ map: crowdTex });
        const crowdPlane = new THREE.Mesh(crowdPlaneGeo, crowdPlaneMat);
        crowdPlane.position.set(0, 8.5, -6.9);
        this.scene.add(crowdPlane);
    }

    // Build 3D Solid Metallic Goal Posts & Reactive 3D Net
    buildGoal() {
        this.goalGroup = new THREE.Group();

        const postRadius = 0.08;
        const postMat = new THREE.MeshStandardMaterial({
            color: 0xffffff,
            roughness: 0.15,
            metalness: 0.4
        });

        // Left Post
        const postGeo = new THREE.CylinderGeometry(postRadius, postRadius, 2.44, 24);
        const leftPost = new THREE.Mesh(postGeo, postMat);
        leftPost.position.set(-3.66, 1.22, 0);
        leftPost.castShadow = true;
        this.goalGroup.add(leftPost);

        // Right Post
        const rightPost = new THREE.Mesh(postGeo, postMat);
        rightPost.position.set(3.66, 1.22, 0);
        rightPost.castShadow = true;
        this.goalGroup.add(rightPost);

        // Crossbar
        const crossbarGeo = new THREE.CylinderGeometry(postRadius, postRadius, 7.32 + postRadius * 2, 24);
        const crossbar = new THREE.Mesh(crossbarGeo, postMat);
        crossbar.rotation.z = Math.PI / 2;
        crossbar.position.set(0, 2.44, 0);
        crossbar.castShadow = true;
        this.goalGroup.add(crossbar);

        // Back Net Struts
        const strutMat = new THREE.MeshStandardMaterial({ color: 0xcccccc, roughness: 0.3, metalness: 0.2 });
        const strutGeo = new THREE.CylinderGeometry(0.04, 0.04, 3.2, 16);

        const leftStrut = new THREE.Mesh(strutGeo, strutMat);
        leftStrut.position.set(-3.66, 1.22, -1.0);
        leftStrut.rotation.x = -0.55;
        this.goalGroup.add(leftStrut);

        const rightStrut = new THREE.Mesh(strutGeo, strutMat);
        rightStrut.position.set(3.66, 1.22, -1.0);
        rightStrut.rotation.x = -0.55;
        this.goalGroup.add(rightStrut);

        // 3D Goal Net Box Mesh
        const netMat = new THREE.MeshBasicMaterial({
            color: 0xffffff,
            wireframe: true,
            transparent: true,
            opacity: 0.45
        });

        this.netGeometry = new THREE.PlaneGeometry(7.32, 2.44, 28, 16);
        this.netMesh = new THREE.Mesh(this.netGeometry, netMat);
        this.netMesh.position.set(0, 1.22, -2.0);
        this.goalGroup.add(this.netMesh);

        const topNetGeo = new THREE.PlaneGeometry(7.32, 2.0, 28, 12);
        const topNet = new THREE.Mesh(topNetGeo, netMat);
        topNet.rotation.x = Math.PI / 2;
        topNet.position.set(0, 2.44, -1.0);
        this.goalGroup.add(topNet);

        const sideNetGeo = new THREE.PlaneGeometry(2.0, 2.44, 12, 16);
        const leftSideNet = new THREE.Mesh(sideNetGeo, netMat);
        leftSideNet.rotation.y = Math.PI / 2;
        leftSideNet.position.set(-3.66, 1.22, -1.0);
        this.goalGroup.add(leftSideNet);

        const rightSideNet = new THREE.Mesh(sideNetGeo, netMat);
        rightSideNet.rotation.y = -Math.PI / 2;
        rightSideNet.position.set(3.66, 1.22, -1.0);
        this.goalGroup.add(rightSideNet);

        this.scene.add(this.goalGroup);
    }

    // Build 3D Realistic Corner Flags with Spring Physics
    buildCornerFlags() {
        this.cornerFlags = [];

        const positions = [
            { x: -21.0, z: 0.0, name: 'left_corner' },
            { x: 21.0, z: 0.0, name: 'right_corner' },
            { x: -21.0, z: 24.0, name: 'left_far' },
            { x: 21.0, z: 24.0, name: 'right_far' }
        ];

        positions.forEach(p => {
            const flagGroup = new THREE.Group();
            flagGroup.position.set(p.x, 0, p.z);

            // Ground socket / spring base
            const baseGeo = new THREE.CylinderGeometry(0.12, 0.16, 0.12, 16);
            const baseMat = new THREE.MeshStandardMaterial({ color: 0x222222, roughness: 0.6 });
            const base = new THREE.Mesh(baseGeo, baseMat);
            base.position.y = 0.06;
            flagGroup.add(base);

            // Flexible pole with spring anchor
            const polePivot = new THREE.Group();
            polePivot.position.set(0, 0.06, 0);

            const poleGeo = new THREE.CylinderGeometry(0.025, 0.025, 1.55, 16);
            const poleMat = new THREE.MeshStandardMaterial({
                color: 0xffea00, // Vibrant neon yellow striped pole
                roughness: 0.3,
                metalness: 0.1
            });
            const pole = new THREE.Mesh(poleGeo, poleMat);
            pole.position.y = 1.55 / 2;
            pole.castShadow = true;
            polePivot.add(pole);

            // Satin Flag Cloth (Portugal Gold & Crimson)
            const flagClothGeo = new THREE.PlaneGeometry(0.48, 0.32, 10, 8);
            const flagClothMat = new THREE.MeshStandardMaterial({
                color: 0xcc0000,
                roughness: 0.4,
                side: THREE.DoubleSide
            });
            const flagCloth = new THREE.Mesh(flagClothGeo, flagClothMat);
            flagCloth.position.set(0.24, 1.35, 0);
            flagCloth.castShadow = true;
            polePivot.add(flagCloth);

            flagGroup.add(polePivot);
            this.scene.add(flagGroup);

            const flagData = {
                group: flagGroup,
                pivot: polePivot,
                cloth: flagCloth,
                clothGeo: flagClothGeo,
                pos: new THREE.Vector3(p.x, 0, p.z),
                name: p.name,
                tiltX: 0,
                tiltZ: 0,
                velX: 0,
                velZ: 0,
                isHit: false
            };

            this.cornerFlags.push(flagData);
            if (p.name === 'right_corner') {
                this.targetCornerFlag = flagData; // Right corner flag is the target celebration location!
            }
        });
    }

    // Build Articulated, Smooth Anatomical Cristiano Ronaldo 3D Model (Portugal #7)
    buildRonaldo() {
        this.ronaldoGroup = new THREE.Group();

        // High Quality Material Shaders
        const skinMat = new THREE.MeshStandardMaterial({ color: 0xdf9e6d, roughness: 0.55, metalness: 0.05 });
        const jerseyMat = new THREE.MeshStandardMaterial({ color: 0xc80000, roughness: 0.45, metalness: 0.05 }); // Portugal Crimson
        const shortsMat = new THREE.MeshStandardMaterial({ color: 0xf5f5f5, roughness: 0.5 }); // Pure White
        const socksMat = new THREE.MeshStandardMaterial({ color: 0x056608, roughness: 0.5 }); // Green Socks
        const bootsMat = new THREE.MeshStandardMaterial({ color: 0xffd700, roughness: 0.25, metalness: 0.6 }); // Gold Mercurial Cleats
        const hairMat = new THREE.MeshStandardMaterial({ color: 0x181008, roughness: 0.9 });
        const armbandMat = new THREE.MeshStandardMaterial({ color: 0xffe600, roughness: 0.4 }); // Captain armband
        const trimMat = new THREE.MeshStandardMaterial({ color: 0x006622, roughness: 0.5 });

        // 1. Pelvis / Hips (Root of body hierarchy)
        const pelvisGeo = new THREE.CylinderGeometry(0.24, 0.21, 0.26, 20);
        this.ronaldoPelvis = new THREE.Mesh(pelvisGeo, shortsMat);
        this.ronaldoPelvis.position.y = 0.98;
        this.ronaldoGroup.add(this.ronaldoPelvis);

        // 2. Torso & Muscular Chest
        const torsoGeo = new THREE.CylinderGeometry(0.27, 0.23, 0.56, 20);
        this.ronaldoTorso = new THREE.Mesh(torsoGeo, jerseyMat);
        this.ronaldoTorso.position.y = 0.38;
        this.ronaldoTorso.castShadow = true;
        this.ronaldoPelvis.add(this.ronaldoTorso);

        // Authentic Green Collar & Shoulder Trim
        const collarGeo = new THREE.TorusGeometry(0.14, 0.035, 12, 24);
        const collar = new THREE.Mesh(collarGeo, trimMat);
        collar.rotation.x = Math.PI / 2;
        collar.position.set(0, 0.28, 0);
        this.ronaldoTorso.add(collar);

        // Gold Number 7 on Back
        const numCanvas = document.createElement('canvas');
        numCanvas.width = 128;
        numCanvas.height = 128;
        const nctx = numCanvas.getContext('2d');
        nctx.fillStyle = '#ffd700';
        nctx.font = 'bold 95px sans-serif';
        nctx.textAlign = 'center';
        nctx.textBaseline = 'middle';
        nctx.fillText('7', 64, 64);
        const numTex = new THREE.CanvasTexture(numCanvas);
        const numMat = new THREE.MeshBasicMaterial({ map: numTex, transparent: true });
        const numMesh = new THREE.Mesh(new THREE.PlaneGeometry(0.24, 0.3), numMat);
        numMesh.position.set(0, 0.05, -0.24);
        numMesh.rotation.y = Math.PI;
        this.ronaldoTorso.add(numMesh);

        // Portugal Crest on Front Chest
        const crestCanvas = document.createElement('canvas');
        crestCanvas.width = 64;
        crestCanvas.height = 64;
        const crctx = crestCanvas.getContext('2d');
        crctx.fillStyle = '#ffd700';
        crctx.beginPath();
        crctx.arc(32, 32, 26, 0, Math.PI * 2);
        crctx.fill();
        crctx.fillStyle = '#cc0000';
        crctx.fillRect(18, 18, 28, 28);
        const crestTex = new THREE.CanvasTexture(crestCanvas);
        const crestMat = new THREE.MeshBasicMaterial({ map: crestTex, transparent: true });
        const crestMesh = new THREE.Mesh(new THREE.PlaneGeometry(0.1, 0.1), crestMat);
        crestMesh.position.set(-0.12, 0.12, 0.24);
        this.ronaldoTorso.add(crestMesh);

        // 3. Neck & Stylized CR7 Head
        const neckGeo = new THREE.CylinderGeometry(0.08, 0.09, 0.12, 16);
        const neck = new THREE.Mesh(neckGeo, skinMat);
        neck.position.y = 0.32;
        this.ronaldoTorso.add(neck);

        const headGeo = new THREE.SphereGeometry(0.165, 24, 24);
        this.ronaldoHead = new THREE.Mesh(headGeo, skinMat);
        this.ronaldoHead.position.y = 0.14;
        this.ronaldoHead.castShadow = true;
        neck.add(this.ronaldoHead);

        // Signature CR7 Styled Quiff Hair & Side Fade
        const hairTopGeo = new THREE.SphereGeometry(0.172, 20, 20, 0, Math.PI * 2, 0, Math.PI * 0.52);
        const hairTop = new THREE.Mesh(hairTopGeo, hairMat);
        hairTop.position.set(0, 0.02, 0);
        this.ronaldoHead.add(hairTop);

        const quiffGeo = new THREE.ConeGeometry(0.09, 0.14, 16);
        const quiff = new THREE.Mesh(quiffGeo, hairMat);
        quiff.rotation.x = -0.45;
        quiff.position.set(0, 0.12, 0.08);
        this.ronaldoHead.add(quiff);

        // Facial Features (Brow, Eyes, Jawline)
        const eyeMat = new THREE.MeshBasicMaterial({ color: 0x111111 });
        const eyeGeo = new THREE.SphereGeometry(0.022, 12, 12);
        const leftEye = new THREE.Mesh(eyeGeo, eyeMat);
        leftEye.position.set(-0.055, 0.02, 0.145);
        this.ronaldoHead.add(leftEye);

        const rightEye = new THREE.Mesh(eyeGeo, eyeMat);
        rightEye.position.set(0.055, 0.02, 0.145);
        this.ronaldoHead.add(rightEye);

        // 4. Articulated Left Arm Hierarchy
        this.ronaldoLeftShoulder = new THREE.Group();
        this.ronaldoLeftShoulder.position.set(-0.32, 0.22, 0);
        this.ronaldoTorso.add(this.ronaldoLeftShoulder);

        const upperArmGeo = new THREE.CylinderGeometry(0.07, 0.065, 0.28, 16);
        const leftUpperArm = new THREE.Mesh(upperArmGeo, jerseyMat);
        leftUpperArm.position.y = -0.14;
        leftUpperArm.castShadow = true;
        this.ronaldoLeftShoulder.add(leftUpperArm);

        // Captain Armband on Left Bicep
        const armbandGeo = new THREE.CylinderGeometry(0.072, 0.072, 0.08, 16);
        const armband = new THREE.Mesh(armbandGeo, armbandMat);
        armband.position.y = -0.08;
        this.ronaldoLeftShoulder.add(armband);

        this.ronaldoLeftElbow = new THREE.Group();
        this.ronaldoLeftElbow.position.set(0, -0.28, 0);
        this.ronaldoLeftShoulder.add(this.ronaldoLeftElbow);

        const forearmGeo = new THREE.CylinderGeometry(0.06, 0.05, 0.26, 16);
        const leftForearm = new THREE.Mesh(forearmGeo, skinMat);
        leftForearm.position.y = -0.13;
        leftForearm.castShadow = true;
        this.ronaldoLeftElbow.add(leftForearm);

        const handGeo = new THREE.SphereGeometry(0.05, 14, 14);
        const leftHand = new THREE.Mesh(handGeo, skinMat);
        leftHand.position.y = -0.26;
        this.ronaldoLeftElbow.add(leftHand);

        // 5. Articulated Right Arm Hierarchy
        this.ronaldoRightShoulder = new THREE.Group();
        this.ronaldoRightShoulder.position.set(0.32, 0.22, 0);
        this.ronaldoTorso.add(this.ronaldoRightShoulder);

        const rightUpperArm = new THREE.Mesh(upperArmGeo, jerseyMat);
        rightUpperArm.position.y = -0.14;
        rightUpperArm.castShadow = true;
        this.ronaldoRightShoulder.add(rightUpperArm);

        this.ronaldoRightElbow = new THREE.Group();
        this.ronaldoRightElbow.position.set(0, -0.28, 0);
        this.ronaldoRightShoulder.add(this.ronaldoRightElbow);

        const rightForearm = new THREE.Mesh(forearmGeo, skinMat);
        rightForearm.position.y = -0.13;
        rightForearm.castShadow = true;
        this.ronaldoRightElbow.add(rightForearm);

        const rightHand = new THREE.Mesh(handGeo, skinMat);
        rightHand.position.y = -0.26;
        this.ronaldoRightElbow.add(rightHand);

        // 6. Articulated Left Leg Hierarchy (Hip -> Knee -> Ankle/Cleats)
        this.ronaldoLeftHip = new THREE.Group();
        this.ronaldoLeftHip.position.set(-0.14, -0.12, 0);
        this.ronaldoPelvis.add(this.ronaldoLeftHip);

        const thighGeo = new THREE.CylinderGeometry(0.095, 0.08, 0.38, 16);
        const leftThigh = new THREE.Mesh(thighGeo, shortsMat);
        leftThigh.position.y = -0.19;
        leftThigh.castShadow = true;
        this.ronaldoLeftHip.add(leftThigh);

        this.ronaldoLeftKnee = new THREE.Group();
        this.ronaldoLeftKnee.position.set(0, -0.38, 0);
        this.ronaldoLeftHip.add(this.ronaldoLeftKnee);

        const calfGeo = new THREE.CylinderGeometry(0.08, 0.065, 0.42, 16);
        const leftCalf = new THREE.Mesh(calfGeo, socksMat);
        leftCalf.position.y = -0.21;
        leftCalf.castShadow = true;
        this.ronaldoLeftKnee.add(leftCalf);

        // Gold CR7 Mercurial Cleat
        const bootGeo = new THREE.BoxGeometry(0.12, 0.1, 0.26);
        const leftBoot = new THREE.Mesh(bootGeo, bootsMat);
        leftBoot.position.set(0, -0.42, 0.06);
        leftBoot.castShadow = true;
        this.ronaldoLeftKnee.add(leftBoot);

        // 7. Articulated Right Leg Hierarchy
        this.ronaldoRightHip = new THREE.Group();
        this.ronaldoRightHip.position.set(0.14, -0.12, 0);
        this.ronaldoPelvis.add(this.ronaldoRightHip);

        const rightThigh = new THREE.Mesh(thighGeo, shortsMat);
        rightThigh.position.y = -0.19;
        rightThigh.castShadow = true;
        this.ronaldoRightHip.add(rightThigh);

        this.ronaldoRightKnee = new THREE.Group();
        this.ronaldoRightKnee.position.set(0, -0.38, 0);
        this.ronaldoRightHip.add(this.ronaldoRightKnee);

        const rightCalf = new THREE.Mesh(calfGeo, socksMat);
        rightCalf.position.y = -0.21;
        rightCalf.castShadow = true;
        this.ronaldoRightKnee.add(rightCalf);

        const rightBoot = new THREE.Mesh(bootGeo, bootsMat);
        rightBoot.position.set(0, -0.42, 0.06);
        rightBoot.castShadow = true;
        this.ronaldoRightKnee.add(rightBoot);

        // Penalty spot initial positioning
        this.ronaldoGroup.position.set(0, 0, 12.6);
        this.scene.add(this.ronaldoGroup);
    }

    // Build Articulated, Athletic France Goalkeeper 3D Model (Mike Maignan style)
    buildFranceGoalkeeper() {
        this.gkGroup = new THREE.Group();

        const skinMat = new THREE.MeshStandardMaterial({ color: 0x82522c, roughness: 0.6 });
        const jerseyMat = new THREE.MeshStandardMaterial({ color: 0x00e5ff, roughness: 0.4, emissive: 0x003344 }); // Neon Cyan Keeper Kit
        const shortsMat = new THREE.MeshStandardMaterial({ color: 0x0a1c3d, roughness: 0.6 }); // Deep Navy FFF shorts
        const gloveMat = new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.3 }); // Pro Latex Palms
        const bootMat = new THREE.MeshStandardMaterial({ color: 0xff0044, roughness: 0.4 });

        // Pelvis
        const pelvisGeo = new THREE.CylinderGeometry(0.25, 0.22, 0.26, 20);
        this.gkPelvis = new THREE.Mesh(pelvisGeo, shortsMat);
        this.gkPelvis.position.y = 1.02;
        this.gkGroup.add(this.gkPelvis);

        // Torso
        const torsoGeo = new THREE.CylinderGeometry(0.28, 0.24, 0.58, 20);
        this.gkTorso = new THREE.Mesh(torsoGeo, jerseyMat);
        this.gkTorso.position.y = 0.40;
        this.gkTorso.castShadow = true;
        this.gkPelvis.add(this.gkTorso);

        // Head
        const neckGeo = new THREE.CylinderGeometry(0.085, 0.095, 0.12, 16);
        const neck = new THREE.Mesh(neckGeo, skinMat);
        neck.position.y = 0.34;
        this.gkTorso.add(neck);

        const headGeo = new THREE.SphereGeometry(0.17, 24, 24);
        this.gkHead = new THREE.Mesh(headGeo, skinMat);
        this.gkHead.position.y = 0.14;
        this.gkHead.castShadow = true;
        neck.add(this.gkHead);

        // Arms & Gloves
        const upperArmGeo = new THREE.CylinderGeometry(0.075, 0.07, 0.30, 16);
        const forearmGeo = new THREE.CylinderGeometry(0.065, 0.055, 0.28, 16);

        // Left Arm
        this.gkLeftShoulder = new THREE.Group();
        this.gkLeftShoulder.position.set(-0.35, 0.24, 0);
        this.gkTorso.add(this.gkLeftShoulder);

        const leftUpper = new THREE.Mesh(upperArmGeo, jerseyMat);
        leftUpper.position.y = -0.15;
        this.gkLeftShoulder.add(leftUpper);

        this.gkLeftElbow = new THREE.Group();
        this.gkLeftElbow.position.set(0, -0.30, 0);
        this.gkLeftShoulder.add(this.gkLeftElbow);

        const leftForearm = new THREE.Mesh(forearmGeo, skinMat);
        leftForearm.position.y = -0.14;
        this.gkLeftElbow.add(leftForearm);

        const gloveGeo = new THREE.BoxGeometry(0.14, 0.14, 0.08);
        const leftGlove = new THREE.Mesh(gloveGeo, gloveMat);
        leftGlove.position.y = -0.28;
        this.gkLeftElbow.add(leftGlove);

        // Right Arm
        this.gkRightShoulder = new THREE.Group();
        this.gkRightShoulder.position.set(0.35, 0.24, 0);
        this.gkTorso.add(this.gkRightShoulder);

        const rightUpper = new THREE.Mesh(upperArmGeo, jerseyMat);
        rightUpper.position.y = -0.15;
        this.gkRightShoulder.add(rightUpper);

        this.gkRightElbow = new THREE.Group();
        this.gkRightElbow.position.set(0, -0.30, 0);
        this.gkRightShoulder.add(this.gkRightElbow);

        const rightForearm = new THREE.Mesh(forearmGeo, skinMat);
        rightForearm.position.y = -0.14;
        this.gkRightElbow.add(rightForearm);

        const rightGlove = new THREE.Mesh(gloveGeo, gloveMat);
        rightGlove.position.y = -0.28;
        this.gkRightElbow.add(rightGlove);

        // Legs
        const thighGeo = new THREE.CylinderGeometry(0.10, 0.085, 0.40, 16);
        const calfGeo = new THREE.CylinderGeometry(0.085, 0.07, 0.44, 16);
        const bootGeo = new THREE.BoxGeometry(0.13, 0.1, 0.28);

        this.gkLeftHip = new THREE.Group();
        this.gkLeftHip.position.set(-0.15, -0.12, 0);
        this.gkPelvis.add(this.gkLeftHip);
        const leftThigh = new THREE.Mesh(thighGeo, shortsMat);
        leftThigh.position.y = -0.20;
        this.gkLeftHip.add(leftThigh);

        this.gkLeftKnee = new THREE.Group();
        this.gkLeftKnee.position.set(0, -0.40, 0);
        this.gkLeftHip.add(this.gkLeftKnee);
        const leftCalf = new THREE.Mesh(calfGeo, jerseyMat);
        leftCalf.position.y = -0.22;
        this.gkLeftKnee.add(leftCalf);
        const leftBoot = new THREE.Mesh(bootGeo, bootMat);
        leftBoot.position.set(0, -0.44, 0.06);
        this.gkLeftKnee.add(leftBoot);

        this.gkRightHip = new THREE.Group();
        this.gkRightHip.position.set(0.15, -0.12, 0);
        this.gkPelvis.add(this.gkRightHip);
        const rightThigh = new THREE.Mesh(thighGeo, shortsMat);
        rightThigh.position.y = -0.20;
        this.gkRightHip.add(rightThigh);

        this.gkRightKnee = new THREE.Group();
        this.gkRightKnee.position.set(0, -0.40, 0);
        this.gkRightHip.add(this.gkRightKnee);
        const rightCalf = new THREE.Mesh(calfGeo, jerseyMat);
        rightCalf.position.y = -0.22;
        this.gkRightKnee.add(rightCalf);
        const rightBoot = new THREE.Mesh(bootGeo, bootMat);
        rightBoot.position.set(0, -0.44, 0.06);
        this.gkRightKnee.add(rightBoot);

        // Initial readiness stance
        this.gkLeftShoulder.rotation.z = -0.45;
        this.gkRightShoulder.rotation.z = 0.45;
        this.gkGroup.position.set(0, 0, 0.2);
        this.scene.add(this.gkGroup);
    }

    // Build 3D Soccer Ball
    buildBall() {
        const canvas = document.createElement('canvas');
        canvas.width = 512;
        canvas.height = 256;
        const ctx = canvas.getContext('2d');
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(0, 0, 512, 256);

        // Black Pentagon patterns
        ctx.fillStyle = '#111827';
        for (let i = 0; i < 18; i++) {
            const x = (i % 6) * 90 + 30;
            const y = Math.floor(i / 6) * 90 + 40;
            ctx.beginPath();
            for (let p = 0; p < 5; p++) {
                const a = (p * Math.PI * 2) / 5 - Math.PI / 2;
                const px = x + Math.cos(a) * 22;
                const py = y + Math.sin(a) * 22;
                if (p === 0) ctx.moveTo(px, py);
                else ctx.lineTo(px, py);
            }
            ctx.closePath();
            ctx.fill();
        }

        const ballTex = new THREE.CanvasTexture(canvas);
        const ballGeo = new THREE.SphereGeometry(0.22, 32, 32);
        const ballMat = new THREE.MeshStandardMaterial({
            map: ballTex,
            roughness: 0.35,
            metalness: 0.1
        });
        this.ball = new THREE.Mesh(ballGeo, ballMat);
        this.ball.position.copy(this.ballStartPos);
        this.ball.castShadow = true;
        this.scene.add(this.ball);

        // Soft Dynamic Ground Shadow
        const shadowGeo = new THREE.PlaneGeometry(0.6, 0.6);
        const shadowMat = new THREE.MeshBasicMaterial({
            color: 0x000000,
            transparent: true,
            opacity: 0.5,
            depthWrite: false
        });
        this.ballShadow = new THREE.Mesh(shadowGeo, shadowMat);
        this.ballShadow.rotation.x = -Math.PI / 2;
        this.ballShadow.position.set(this.ballStartPos.x, 0.02, this.ballStartPos.z);
        this.scene.add(this.ballShadow);
    }

    // Build Particles & Dynamic Visual FX
    buildParticles() {
        // 1. Portuguese Confetti Burst
        const confettiCount = 350;
        const cGeo = new THREE.BufferGeometry();
        const cPos = new Float32Array(confettiCount * 3);
        const cColors = new Float32Array(confettiCount * 3);

        const palette = [
            new THREE.Color(0xcc0000), // Crimson
            new THREE.Color(0x008800), // Green
            new THREE.Color(0xffd700), // Gold
            new THREE.Color(0xffffff)  // White
        ];

        for (let i = 0; i < confettiCount; i++) {
            cPos[i * 3] = (Math.random() - 0.5) * 14;
            cPos[i * 3 + 1] = -10;
            cPos[i * 3 + 2] = (Math.random() - 0.5) * 14;

            const c = palette[Math.floor(Math.random() * palette.length)];
            cColors[i * 3] = c.r;
            cColors[i * 3 + 1] = c.g;
            cColors[i * 3 + 2] = c.b;
        }

        cGeo.setAttribute('position', new THREE.BufferAttribute(cPos, 3));
        cGeo.setAttribute('color', new THREE.BufferAttribute(cColors, 3));

        const cMat = new THREE.PointsMaterial({
            size: 0.28,
            vertexColors: true,
            transparent: true,
            opacity: 0.95
        });
        this.confettiParticles = new THREE.Points(cGeo, cMat);
        this.scene.add(this.confettiParticles);

        // 2. Flying Grass / Turf Particles during Knee Slide
        const turfCount = 180;
        const tGeo = new THREE.BufferGeometry();
        const tPos = new Float32Array(turfCount * 3);
        const tVels = new Float32Array(turfCount * 3);

        for (let i = 0; i < turfCount; i++) {
            tPos[i * 3] = 0;
            tPos[i * 3 + 1] = -10;
            tPos[i * 3 + 2] = 0;

            tVels[i * 3] = (Math.random() - 0.5) * 6;
            tVels[i * 3 + 1] = 1 + Math.random() * 4;
            tVels[i * 3 + 2] = (Math.random() - 0.5) * 6;
        }

        tGeo.setAttribute('position', new THREE.BufferAttribute(tPos, 3));
        const tMat = new THREE.PointsMaterial({
            color: 0x48c734,
            size: 0.16,
            transparent: true,
            opacity: 0.9
        });
        this.turfParticles = new THREE.Points(tGeo, tMat);
        this.turfVelocities = tVels;
        this.scene.add(this.turfParticles);

        // 3. Ground Shockwave Ring on "SIUUUU!" Landing
        const shockGeo = new THREE.RingGeometry(0.2, 0.45, 32);
        const shockMat = new THREE.MeshBasicMaterial({
            color: 0xffd700,
            transparent: true,
            opacity: 0,
            side: THREE.DoubleSide,
            depthWrite: false
        });
        this.shockwaveMesh = new THREE.Mesh(shockGeo, shockMat);
        this.shockwaveMesh.rotation.x = -Math.PI / 2;
        this.shockwaveMesh.position.set(0, 0.025, 0);
        this.scene.add(this.shockwaveMesh);
    }

    // Map 6 tactical zones to exact 3D world target coordinates inside the goal
    get3DZoneCoordinates(zoneIndex) {
        const cols = [-2.4, 0.0, 2.4];
        const rows = [1.85, 0.55];

        const col = zoneIndex % 3;
        const row = Math.floor(zoneIndex / 3);

        return new THREE.Vector3(cols[col], rows[row], 0.0);
    }

    startBallFlight(targetZoneIndex, isGoal, onComplete) {
        this.ballTargetPos = this.get3DZoneCoordinates(targetZoneIndex);
        this.ballState = 'flying';
        this.ballFlightProgress = 0;
        this.isGoalOutcome = isGoal;
        this.onShotComplete = onComplete;
        this.state = 'shooting';

        this.gkSaveVariant = Math.floor(Math.random() * 4);
        this.gkConcedeVariant = Math.floor(Math.random() * 4);
        this.gkTargetZone = targetZoneIndex;
        this.gkAnimProgress = 0;
        this.gkState = 'dive';

        this.cameraMode = 'track_shot';
    }

    resetBall() {
        this.ballState = 'ready';
        this.ballFlightProgress = 0;
        this.ball.position.copy(this.ballStartPos);
        this.ball.rotation.set(0, 0, 0);
        this.ballShadow.position.set(this.ballStartPos.x, 0.02, this.ballStartPos.z);
        this.ballShadow.scale.set(1, 1, 1);

        // Reset Ronaldo to initial penalty stance
        this.ronaldoGroup.position.set(0, 0, 12.6);
        this.ronaldoGroup.rotation.set(0, 0, 0);
        this.ronaldoPelvis.position.set(0, 0.98, 0);
        this.ronaldoTorso.rotation.set(0, 0, 0);
        this.ronaldoHead.rotation.set(0, 0, 0);
        this.ronaldoLeftShoulder.rotation.set(0, 0, 0);
        this.ronaldoLeftElbow.rotation.set(0, 0, 0);
        this.ronaldoRightShoulder.rotation.set(0, 0, 0);
        this.ronaldoRightElbow.rotation.set(0, 0, 0);
        this.ronaldoLeftHip.rotation.set(0, 0, 0);
        this.ronaldoLeftKnee.rotation.set(0, 0, 0);
        this.ronaldoRightHip.rotation.set(0, 0, 0);
        this.ronaldoRightKnee.rotation.set(0, 0, 0);

        // Reset Goalkeeper
        this.gkGroup.position.set(0, 0, 0.2);
        this.gkGroup.rotation.set(0, 0, 0);
        this.gkPelvis.position.set(0, 1.02, 0);
        this.gkTorso.rotation.set(0, 0, 0);
        this.gkHead.rotation.set(0, 0, 0);
        this.gkLeftShoulder.rotation.set(0, 0, -0.45);
        this.gkLeftElbow.rotation.set(0, 0, 0);
        this.gkRightShoulder.rotation.set(0, 0, 0.45);
        this.gkRightElbow.rotation.set(0, 0, 0);
        this.gkLeftHip.rotation.set(0, 0, 0);
        this.gkLeftKnee.rotation.set(0, 0, 0);
        this.gkRightHip.rotation.set(0, 0, 0);
        this.gkRightKnee.rotation.set(0, 0, 0);
        this.gkState = 'idle';

        // Reset Celebration Flags & Timers
        this.isCelebratingSiu = false;
        this.celebPhase = 0;
        this.celebTimer = 0;
        this.hasPlayedSlideSound = false;
        this.hasPlayedSmashSound = false;
        this.hasPlayedSiuSound = false;
        this.cameraMode = 'penalty';

        // Reset Corner Flags physics
        this.cornerFlags.forEach(f => {
            f.tiltX = 0;
            f.tiltZ = 0;
            f.velX = 0;
            f.velZ = 0;
            f.pivot.rotation.set(0, 0, 0);
        });

        // Reset Net deformation
        if (this.netGeometry) {
            const pos = this.netGeometry.attributes.position;
            for (let i = 0; i < pos.count; i++) {
                pos.setZ(i, 0);
            }
            pos.needsUpdate = true;
        }

        // Hide confetti and turf particles
        if (this.confettiParticles) {
            const pos = this.confettiParticles.geometry.attributes.position;
            for (let i = 0; i < pos.count; i++) {
                pos.setY(i, -10);
            }
            pos.needsUpdate = true;
        }
        if (this.turfParticles) {
            const pos = this.turfParticles.geometry.attributes.position;
            for (let i = 0; i < pos.count; i++) {
                pos.setY(i, -10);
            }
            pos.needsUpdate = true;
        }
        if (this.shockwaveMesh) {
            this.shockwaveMesh.material.opacity = 0;
        }
    }

    triggerSiuCelebration() {
        this.isCelebratingSiu = true;
        this.celebPhase = 0;
        this.celebTimer = 0;
        this.hasPlayedSlideSound = false;
        this.hasPlayedSmashSound = false;
        this.hasPlayedSiuSound = false;
        this.cameraMode = 'celeb_dynamic';
    }

    setTeams(playerTeam, gkTeam) {
        // Ready
    }

    setGoalkeeperState(state, targetZone = 0) {
        this.gkState = state;
        this.gkTargetZone = targetZone;
        this.gkAnimProgress = 0;
    }

    // Main 3D Animation & Biomechanical Physics Loop
    update(dt) {
        // 1. Ronaldo Penalty Run-up & Power Strike Motion
        if (this.state === 'shooting' && this.ballFlightProgress < 0.28) {
            const t = this.ballFlightProgress / 0.28;
            // Fluid hip load & leg swing
            this.ronaldoRightHip.rotation.x = -Math.sin(t * Math.PI) * 0.95;
            this.ronaldoRightKnee.rotation.x = Math.sin(t * Math.PI) * 0.65;
            this.ronaldoLeftShoulder.rotation.x = Math.sin(t * Math.PI) * 0.75;
            this.ronaldoTorso.rotation.x = Math.sin(t * Math.PI) * 0.2;
        }

        // 2. 3D Ball Flight Trajectory
        if (this.ballState === 'flying') {
            this.ballFlightProgress += dt * 1.75;
            if (this.ballFlightProgress >= 1.0) {
                this.ballFlightProgress = 1.0;
                if (this.isGoalOutcome) {
                    this.ballState = 'in_net';
                    window.soundEngine.playNetSwish();
                    this.triggerSiuCelebration();

                    // Bulge 3D net backward realistically
                    if (this.netGeometry) {
                        const pos = this.netGeometry.attributes.position;
                        for (let i = 0; i < pos.count; i++) {
                            const vx = pos.getX(i);
                            const vy = pos.getY(i) + 1.22;
                            const dist = Math.hypot(vx - this.ballTargetPos.x, vy - this.ballTargetPos.y);
                            if (dist < 1.8) {
                                pos.setZ(i, -Math.max(0, (1.8 - dist) * 0.65));
                            }
                        }
                        pos.needsUpdate = true;
                    }
                } else {
                    this.ballState = 'saved';
                    const isPost = this.gkSaveVariant === 2;
                    window.soundEngine.playSaveSound(isPost);
                }

                if (this.onShotComplete) {
                    this.onShotComplete(this.isGoalOutcome);
                }
            }

            const t = this.ballFlightProgress;
            const currentZ = this.ballStartPos.z + (this.ballTargetPos.z - this.ballStartPos.z) * t;
            const currentX = this.ballStartPos.x + (this.ballTargetPos.x - this.ballStartPos.x) * t;
            const arc = Math.sin(t * Math.PI) * 0.45;
            const currentY = this.ballStartPos.y + (this.ballTargetPos.y - this.ballStartPos.y) * t + arc;

            this.ball.position.set(currentX, currentY, currentZ);
            this.ball.rotation.x += dt * 25;
            this.ball.rotation.y += dt * 18;

            this.ballShadow.position.set(currentX, 0.02, currentZ);
            const shadowScale = Math.max(0.2, 1 - currentY / 3.0);
            this.ballShadow.scale.set(shadowScale, shadowScale, shadowScale);
        }

        // 3. Articulated France Goalkeeper Realistic Save & Dive Moves
        if (this.gkState === 'dive') {
            this.gkAnimProgress = Math.min(1.0, this.gkAnimProgress + dt * 2.6);
            const p = this.gkAnimProgress;
            const easeP = 1 - Math.pow(1 - p, 3);
            const targetPos = this.get3DZoneCoordinates(this.gkTargetZone);

            if (this.isGoalOutcome) {
                if (this.gkConcedeVariant === 0) {
                    // Dives wrong direction
                    this.gkGroup.position.x = -targetPos.x * easeP * 0.8;
                    this.gkGroup.position.y = targetPos.y * easeP * 0.7;
                    this.gkGroup.rotation.z = (targetPos.x < 0 ? -1 : 1) * easeP * 0.6;
                    this.gkLeftShoulder.rotation.z = -1.2 * easeP;
                    this.gkRightShoulder.rotation.z = 1.2 * easeP;
                } else if (this.gkConcedeVariant === 1) {
                    // Dives right way but beaten by knuckleball speed
                    this.gkGroup.position.x = targetPos.x * easeP * 0.65;
                    this.gkGroup.position.y = targetPos.y * easeP * 0.65;
                    this.gkGroup.rotation.z = (targetPos.x < 0 ? 1 : -1) * easeP * 0.7;
                } else {
                    // Frozen on line
                    this.gkGroup.position.y = 0;
                    this.gkHead.rotation.y = targetPos.x < 0 ? -0.6 : 0.6;
                }
            } else {
                // Dynamic Cat-like Save
                this.gkGroup.position.x = targetPos.x * easeP * 0.95;
                this.gkGroup.position.y = targetPos.y * easeP * 0.88;
                this.gkGroup.rotation.z = (targetPos.x < 0 ? 1 : -1) * easeP * 0.8;
                this.gkLeftShoulder.rotation.z = 1.4 * easeP;
                this.gkRightShoulder.rotation.z = -1.4 * easeP;
                this.gkLeftElbow.rotation.x = -0.3 * easeP;
                this.gkRightElbow.rotation.x = -0.3 * easeP;
            }
        } else if (this.gkState === 'idle') {
            const time = this.clock.getElapsedTime();
            this.gkGroup.position.y = Math.sin(time * 6) * 0.06;
            this.gkLeftShoulder.rotation.z = -0.45 + Math.sin(time * 4) * 0.08;
            this.gkRightShoulder.rotation.z = 0.45 - Math.sin(time * 4) * 0.08;
        }

        // 4. EPIC MULTI-PHASE CRISTIANO RONALDO CELEBRATION
        // Phase 0: Sprint to Corner (0.0s - 1.4s)
        // Phase 1: Knee Slide across Turf (1.4s - 2.8s)
        // Phase 2: Corner Flag Smash & Kick (2.8s - 3.7s)
        // Phase 3: Run-up & High Altitude Leap (3.7s - 4.5s)
        // Phase 4: 180° Mid-Air Pirouette (4.5s - 5.1s)
        // Phase 5: Ground Slam & Iconic "SIUUUU!" Pose (5.1s - 7.0s)
        if (this.isCelebratingSiu) {
            this.celebTimer += dt;
            const ron = this.ronaldoGroup;
            const timer = this.celebTimer;

            // Target Corner Coordinates (Right Corner Flag at x = 21.0, z = 0.0)
            // Celebration path approaches flag at around (17.5, 0, 1.8)
            const cornerTarget = new THREE.Vector3(17.5, 0, 1.8);

            if (timer < 1.4) {
                // ==========================================
                // PHASE 0: SPRINT TO CORNER (0.0s - 1.4s)
                // ==========================================
                this.celebPhase = 0;
                const p = timer / 1.4;
                const easeP = p * p;

                // Move from penalty spot towards corner
                ron.position.x = 0 + cornerTarget.x * 0.55 * easeP;
                ron.position.z = 12.6 + (cornerTarget.z - 12.6) * 0.55 * easeP;
                ron.position.y = Math.abs(Math.sin(timer * 18)) * 0.18;

                // Rotate body towards sprint trajectory
                ron.rotation.y = -Math.PI * 0.35;

                // Natural, fluid running cycle
                const runCadence = timer * 16;
                this.ronaldoRightHip.rotation.x = Math.sin(runCadence) * 0.9;
                this.ronaldoRightKnee.rotation.x = Math.max(0, -Math.sin(runCadence) * 0.85);
                this.ronaldoLeftHip.rotation.x = -Math.sin(runCadence) * 0.9;
                this.ronaldoLeftKnee.rotation.x = Math.max(0, Math.sin(runCadence) * 0.85);

                this.ronaldoLeftShoulder.rotation.x = Math.sin(runCadence) * 0.8;
                this.ronaldoRightShoulder.rotation.x = -Math.sin(runCadence) * 0.8;
                this.ronaldoTorso.rotation.x = 0.22; // Forward lean
                this.ronaldoPelvis.position.y = 0.98;

            } else if (timer < 2.8) {
                // ==========================================
                // PHASE 1: KNEE SLIDE ACROSS TURF (1.4s - 2.8s)
                // ==========================================
                this.celebPhase = 1;
                const p = (timer - 1.4) / 1.4;
                const slideEase = 1 - Math.pow(1 - p, 2);

                if (!this.hasPlayedSlideSound) {
                    this.hasPlayedSlideSound = true;
                    window.soundEngine.playSlideSound();
                }

                // Slide friction trajectory across turf towards corner flag
                const startSlide = new THREE.Vector3(cornerTarget.x * 0.55, 0, 12.6 + (cornerTarget.z - 12.6) * 0.55);
                ron.position.x = startSlide.x + (cornerTarget.x - startSlide.x) * slideEase * 0.92;
                ron.position.z = startSlide.z + (cornerTarget.z - startSlide.z) * slideEase * 0.92;
                ron.position.y = 0;

                // Knee slide posture: Drop down, hips tucked, chest arched back in triumph
                this.ronaldoPelvis.position.y = 0.55;
                this.ronaldoTorso.rotation.x = -0.45; // Lean back with chest proud
                this.ronaldoHead.rotation.x = -0.3;  // Looking up to fans
                
                // Knees bent completely backward sliding on turf
                this.ronaldoLeftHip.rotation.x = 0.6;
                this.ronaldoLeftKnee.rotation.x = 1.65;
                this.ronaldoRightHip.rotation.x = 0.6;
                this.ronaldoRightKnee.rotation.x = 1.65;

                // Arms spread wide in pure euphoria!
                this.ronaldoLeftShoulder.rotation.z = -1.2;
                this.ronaldoLeftShoulder.rotation.x = -0.3;
                this.ronaldoRightShoulder.rotation.z = 1.2;
                this.ronaldoRightShoulder.rotation.x = -0.3;

                // Emit flying grass / turf spray particles from beneath knees
                if (this.turfParticles) {
                    const pos = this.turfParticles.geometry.attributes.position;
                    for (let i = 0; i < pos.count; i++) {
                        if (pos.getY(i) <= 0 || pos.getY(i) === -10) {
                            pos.setX(i, ron.position.x + (Math.random() - 0.5) * 0.6);
                            pos.setY(i, 0.1 + Math.random() * 0.2);
                            pos.setZ(i, ron.position.z + (Math.random() - 0.5) * 0.6);
                        } else {
                            pos.setX(i, pos.getX(i) + this.turfVelocities[i * 3] * dt);
                            pos.setY(i, pos.getY(i) + this.turfVelocities[i * 3 + 1] * dt);
                            pos.setZ(i, pos.getZ(i) + this.turfVelocities[i * 3 + 2] * dt);
                            this.turfVelocities[i * 3 + 1] -= 9.8 * dt; // gravity
                        }
                    }
                    this.turfParticles.geometry.attributes.position.needsUpdate = true;
                }

            } else if (timer < 3.7) {
                // ==========================================
                // PHASE 2: CORNER FLAG SMASH & KICK (2.8s - 3.7s)
                // ==========================================
                this.celebPhase = 2;
                const p = (timer - 2.8) / 0.9;

                // Stand up quickly beside corner flag
                this.ronaldoPelvis.position.y = 0.98;
                this.ronaldoTorso.rotation.x = 0;
                this.ronaldoHead.rotation.x = 0;

                // Face corner flag pole
                ron.rotation.y = -Math.PI * 0.55;
                ron.position.x = 19.8;
                ron.position.z = 0.8;

                if (p < 0.45) {
                    // Wind up kick / punch towards flag
                    const strikeP = p / 0.45;
                    this.ronaldoRightHip.rotation.x = -Math.sin(strikeP * Math.PI * 0.5) * 1.2;
                    this.ronaldoRightKnee.rotation.x = 0.8 * strikeP;
                    this.ronaldoRightShoulder.rotation.x = 0.8 * strikeP;
                } else {
                    // Impact smash on the corner flag!
                    if (!this.hasPlayedSmashSound) {
                        this.hasPlayedSmashSound = true;
                        window.soundEngine.playFlagSmashSound();

                        // Apply spring impulse force to corner flag
                        if (this.targetCornerFlag) {
                            this.targetCornerFlag.velX = 14.0;
                            this.targetCornerFlag.velZ = -8.0;
                            this.targetCornerFlag.isHit = true;
                        }
                    }

                    // Follow-through of kick
                    this.ronaldoRightHip.rotation.x = 0.5;
                    this.ronaldoRightKnee.rotation.x = 0;
                    this.ronaldoRightShoulder.rotation.x = -0.5;
                }

            } else if (timer < 4.5) {
                // ==========================================
                // PHASE 3: RUN-UP & HIGH ALTITUDE LEAP (3.7s - 4.5s)
                // ==========================================
                this.celebPhase = 3;
                const p = (timer - 3.7) / 0.8;

                // Step forward into open space facing the crowd
                ron.position.x = 19.8 - p * 3.5;
                ron.position.z = 0.8 + p * 3.5; // (around x = 16.3, z = 4.3)
                
                // Explode high into the air! (Vertical jump up to 2.5m)
                const jumpProgress = Math.sin(p * Math.PI * 0.5);
                ron.position.y = jumpProgress * 2.5;

                // Mid-air signature finger twirl gesture & torso extension
                this.ronaldoTorso.rotation.x = 0.1;
                this.ronaldoLeftShoulder.rotation.z = -0.8;
                this.ronaldoRightShoulder.rotation.z = 0.8;
                this.ronaldoRightShoulder.rotation.x = -1.2; // Hand raised high in sky

                this.ronaldoLeftHip.rotation.x = -0.3;
                this.ronaldoRightHip.rotation.x = -0.3;
                this.ronaldoLeftKnee.rotation.x = 0.5;
                this.ronaldoRightKnee.rotation.x = 0.5;

            } else if (timer < 5.1) {
                // ==========================================
                // PHASE 4: 180° MID-AIR PIROUETTE (4.5s - 5.1s)
                // ==========================================
                this.celebPhase = 4;
                const p = (timer - 4.5) / 0.6;

                // Stay airborne at apex, spin 180 degrees to face stadium audience
                ron.position.y = 2.5 * Math.sin((0.8 + p * 0.2) * Math.PI * 0.5);
                ron.rotation.y = -Math.PI * 0.55 + p * Math.PI; // Spin 180° to face front

                // Tuck both arms tightly to chest for explosive mid-air rotation
                this.ronaldoLeftShoulder.rotation.z = -0.3 * (1 - p);
                this.ronaldoRightShoulder.rotation.z = 0.3 * (1 - p);
                this.ronaldoLeftShoulder.rotation.x = 0.6;
                this.ronaldoRightShoulder.rotation.x = 0.6;
                this.ronaldoLeftElbow.rotation.x = -1.4;
                this.ronaldoRightElbow.rotation.x = -1.4;

            } else {
                // ==========================================
                // PHASE 5: GROUND SLAM & ICONIC "SIUUUU!" POSE (5.1s - 7.0s)
                // ==========================================
                this.celebPhase = 5;
                const p = timer - 5.1;

                ron.position.y = 0;
                ron.rotation.y = Math.PI * 0.45; // Facing stadium front camera

                if (!this.hasPlayedSiuSound) {
                    this.hasPlayedSiuSound = true;
                    // Trigger massive vocal "SIUUUU!" & Stadium Roar
                    window.soundEngine.playSiuuuu();

                    // Trigger Ground Shockwave Ring
                    if (this.shockwaveMesh) {
                        this.shockwaveMesh.position.set(ron.position.x, 0.025, ron.position.z);
                        this.shockwaveMesh.material.opacity = 0.9;
                        this.shockwaveMesh.scale.set(1, 1, 1);
                    }

                    // Explode Confetti around Ronaldo
                    if (this.confettiParticles) {
                        const pos = this.confettiParticles.geometry.attributes.position;
                        for (let i = 0; i < pos.count; i++) {
                            pos.setX(i, ron.position.x + (Math.random() - 0.5) * 8);
                            pos.setY(i, 2 + Math.random() * 6);
                            pos.setZ(i, ron.position.z + (Math.random() - 0.5) * 8);
                        }
                        this.confettiParticles.geometry.attributes.position.needsUpdate = true;
                    }
                }

                // Legendary "SIUUU" Posture:
                // Wide grounded power stance, chest expanded forward, both arms thrown down & back
                this.ronaldoPelvis.position.y = 0.88; // Deep grounded stance
                this.ronaldoTorso.rotation.x = 0.15;
                this.ronaldoTorso.rotation.y = 0;
                this.ronaldoHead.rotation.x = -0.2; // Chin tilted up

                // Spread legs wide
                this.ronaldoLeftHip.rotation.z = -0.42;
                this.ronaldoRightHip.rotation.z = 0.42;
                this.ronaldoLeftKnee.rotation.x = 0.25;
                this.ronaldoRightKnee.rotation.x = 0.25;

                // Power throw arms down and backward
                this.ronaldoLeftShoulder.rotation.x = -1.15;
                this.ronaldoLeftShoulder.rotation.z = -0.55;
                this.ronaldoRightShoulder.rotation.x = -1.15;
                this.ronaldoRightShoulder.rotation.z = 0.55;
                this.ronaldoLeftElbow.rotation.x = -0.15;
                this.ronaldoRightElbow.rotation.x = -0.15;

                // Animate Ground Shockwave expanding outward
                if (this.shockwaveMesh && this.shockwaveMesh.material.opacity > 0) {
                    const currentScale = this.shockwaveMesh.scale.x + dt * 12.0;
                    this.shockwaveMesh.scale.set(currentScale, currentScale, currentScale);
                    this.shockwaveMesh.material.opacity = Math.max(0, this.shockwaveMesh.material.opacity - dt * 1.8);
                }

                // Confetti drifting gracefully
                if (this.confettiParticles) {
                    const pos = this.confettiParticles.geometry.attributes.position;
                    for (let i = 0; i < pos.count; i++) {
                        let py = pos.getY(i);
                        if (py > 0) {
                            pos.setY(i, py - dt * 2.2);
                            pos.setX(i, pos.getX(i) + Math.sin(timer + i) * dt * 0.4);
                        }
                    }
                    this.confettiParticles.geometry.attributes.position.needsUpdate = true;
                }
            }
        }

        // 5. Corner Flag Spring & Damping Physics Engine
        this.cornerFlags.forEach(f => {
            if (f.isHit || Math.abs(f.tiltX) > 0.001 || Math.abs(f.tiltZ) > 0.001) {
                // Spring force: F = -k * x - c * v
                const k = 55.0;  // Spring tension stiffness
                const damping = 4.2; // Air and internal material damping

                const accX = -k * f.tiltX - damping * f.velX;
                const accZ = -k * f.tiltZ - damping * f.velZ;

                f.velX += accX * dt;
                f.velZ += accZ * dt;
                f.tiltX += f.velX * dt;
                f.tiltZ += f.velZ * dt;

                f.pivot.rotation.x = f.tiltX;
                f.pivot.rotation.z = f.tiltZ;

                if (Math.abs(f.tiltX) < 0.01 && Math.abs(f.velX) < 0.05 && Math.abs(f.tiltZ) < 0.01 && Math.abs(f.velZ) < 0.05) {
                    f.tiltX = 0;
                    f.tiltZ = 0;
                    f.velX = 0;
                    f.velZ = 0;
                    f.isHit = false;
                    f.pivot.rotation.set(0, 0, 0);
                }
            }

            // Flag cloth ripple wind
            const time = this.clock.getElapsedTime();
            if (f.clothGeo) {
                const pos = f.clothGeo.attributes.position;
                for (let i = 0; i < pos.count; i++) {
                    const vx = pos.getX(i);
                    pos.setZ(i, Math.sin(time * 8 + vx * 6) * 0.04);
                }
                pos.needsUpdate = true;
            }
        });

        // 6. Dynamic Multi-Angle Cinematic Camera Director
        if (this.cameraMode === 'track_shot') {
            // Track the ball bullet trajectory
            const targetCam = new THREE.Vector3(
                this.ball.position.x * 0.35,
                2.1 + this.ball.position.y * 0.2,
                13.2
            );
            this.camera.position.lerp(targetCam, dt * 5.0);
            this.camera.lookAt(this.ball.position.x * 0.7, this.ball.position.y + 0.5, this.ball.position.z);

        } else if (this.cameraMode === 'celeb_dynamic') {
            const ronPos = this.ronaldoGroup.position;

            if (this.celebPhase === 0) {
                // Tracking sprint camera: Sweeping side-angle
                const camPos = new THREE.Vector3(ronPos.x - 4.5, 1.8, ronPos.z + 5.5);
                this.camera.position.lerp(camPos, dt * 4.0);
                this.camera.lookAt(ronPos.x, ronPos.y + 1.2, ronPos.z);

            } else if (this.celebPhase === 1) {
                // Knee Slide low-angle pitch-level hero shot
                const camPos = new THREE.Vector3(ronPos.x + 3.8, 0.75, ronPos.z + 4.2);
                this.camera.position.lerp(camPos, dt * 5.0);
                this.camera.lookAt(ronPos.x, ronPos.y + 0.8, ronPos.z);

            } else if (this.celebPhase === 2) {
                // Corner Flag Smash intense close-up
                const camPos = new THREE.Vector3(ronPos.x + 2.8, 1.4, ronPos.z + 3.2);
                this.camera.position.lerp(camPos, dt * 6.0);
                this.camera.lookAt(ronPos.x, ronPos.y + 1.2, ronPos.z);

            } else if (this.celebPhase === 3 || this.celebPhase === 4) {
                // High Leap & Mid-Air Spin Low-to-High Dramatic Angle
                const camPos = new THREE.Vector3(ronPos.x + 4.2, 1.2, ronPos.z + 4.8);
                this.camera.position.lerp(camPos, dt * 4.0);
                this.camera.lookAt(ronPos.x, ronPos.y + 1.4, ronPos.z);

            } else {
                // Phase 5: Iconic "SIUUUU!" 360° Hero Orbit with Floodlight Flares
                const orbitAngle = (this.celebTimer - 5.1) * 0.9;
                const camPos = new THREE.Vector3(
                    ronPos.x + Math.sin(orbitAngle) * 4.2,
                    1.35 + Math.sin(orbitAngle * 0.5) * 0.3,
                    ronPos.z + Math.cos(orbitAngle) * 4.2
                );
                this.camera.position.lerp(camPos, dt * 4.5);
                this.camera.lookAt(ronPos.x, ronPos.y + 1.1, ronPos.z);
            }

        } else {
            // Default penalty viewpoint
            this.camera.position.lerp(this.cameraDefaultPos, dt * 4.0);
            this.camera.lookAt(this.cameraDefaultLook);
        }
    }

    render() {
        const dt = Math.min(0.08, this.clock.getDelta());
        this.update(dt);
        if (this.renderer && this.scene && this.camera) {
            this.renderer.render(this.scene, this.camera);
        }
    }
}

// Global export
window.StadiumRenderer = StadiumRenderer;
