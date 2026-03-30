class Viewer3D {
    constructor(containerId) {
        this.container = document.getElementById(containerId);
        
        // Scene setup
        this.scene = new THREE.Scene();
        this.scene.background = new THREE.Color(0x13151f);
        
        // Camera setup
        const canvasW = this.container.clientWidth;
        const canvasH = this.container.clientHeight;
        this.camera = new THREE.PerspectiveCamera(45, canvasW / canvasH, 1, 10000);
        
        // Renderer setup
        this.renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
        this.renderer.setSize(canvasW, canvasH);
        this.renderer.setPixelRatio(window.devicePixelRatio);
        this.renderer.shadowMap.enabled = true;
        this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
        
        // Ensure child elements inside container are cleared if any
        while(this.container.firstChild) {
            this.container.removeChild(this.container.firstChild);
        }
        this.container.appendChild(this.renderer.domElement);
        
        // Controls
        this.controls = new THREE.OrbitControls(this.camera, this.renderer.domElement);
        this.controls.enableDamping = true;
        this.controls.dampingFactor = 0.05;

        // Lighting
        this.setupLighting();

        // Object groups
        this.wallGroup = new THREE.Group();
        this.scene.add(this.wallGroup);

        // Window resize
        window.addEventListener('resize', () => this.resize());
        
        // Bind reset
        document.getElementById('resetCameraBtn')?.addEventListener('click', () => this.resetCamera());

        // Start render loop
        this.animate = this.animate.bind(this);
        requestAnimationFrame(this.animate);
    }

    setupLighting() {
        // Ambient Light
        const ambientLight = new THREE.AmbientLight(0x404050, 2.0); // Soft cool light
        this.scene.add(ambientLight);

        // Directional Light
        const dirLight = new THREE.DirectionalLight(0xffffff, 1.5);
        dirLight.position.set(500, 1000, 500);
        dirLight.castShadow = true;
        dirLight.shadow.mapSize.width = 2048;
        dirLight.shadow.mapSize.height = 2048;
        dirLight.shadow.camera.near = 10;
        dirLight.shadow.camera.far = 4000;
        dirLight.shadow.camera.left = -1000;
        dirLight.shadow.camera.right = 1000;
        dirLight.shadow.camera.top = 1000;
        dirLight.shadow.camera.bottom = -1000;
        this.scene.add(dirLight);

        // Point light for dramatic effect
        const pointLight = new THREE.PointLight(0x8b5cf6, 2, 800);
        pointLight.position.set(0, 200, 0);
        this.scene.add(pointLight);
    }

    resize() {
        if (!this.container) return;
        const w = this.container.clientWidth;
        const h = this.container.clientHeight;
        this.camera.aspect = w / h;
        this.camera.updateProjectionMatrix();
        this.renderer.setSize(w, h);
    }

    setData(data) {
        // Clear old walls
        while(this.wallGroup.children.length > 0) { 
            this.wallGroup.remove(this.wallGroup.children[0]); 
        }

        const walls = data.walls || [];
        const issues = data.issues || [];
        const dims = data.dimensions || {width: 1000, height: 1000};

        const wallHeight = 150; // Arbitrary 3D extrusion height
        const wallThickness = 12;

        // Materials
        const bearingMaterial = new THREE.MeshStandardMaterial({ 
            color: 0x6366f1, // struct-primary
            roughness: 0.7,
            metalness: 0.1
        });

        const partitionMaterial = new THREE.MeshStandardMaterial({ 
            color: 0x8b5cf6, // struct-accent
            roughness: 0.9,
            metalness: 0.0,
            transparent: true,
            opacity: 0.8
        });

        const dangerMaterial = new THREE.MeshStandardMaterial({ 
            color: 0xef4444, // struct-danger
            roughness: 0.5,
            emissive: 0x5a0000
        });

        // Compute Bounding Box of structure to generate Floor Slab (Hackathon requirement)
        let minX = Infinity, maxX = -Infinity, minZ = Infinity, maxZ = -Infinity;
        walls.forEach(w => {
            minX = Math.min(minX, w.x1, w.x2);
            maxX = Math.max(maxX, w.x1, w.x2);
            minZ = Math.min(minZ, w.y1, w.y2);
            maxZ = Math.max(maxZ, w.y1, w.y2);
        });

        // Fallback or Image Dims
        const cx = dims.width / 2;
        const cz = dims.height / 2;

        if(walls.length > 0) {
            const slabWidth = (maxX - minX) + 60; // 60px margin
            const slabDepth = (maxZ - minZ) + 60;
            const slabThickness = 15;
            
            const slabGeo = new THREE.BoxGeometry(slabWidth, slabThickness, slabDepth);
            const slabMat = new THREE.MeshStandardMaterial({ 
                color: 0x2a2b33, 
                roughness: 0.8, 
                metalness: 0.1 
            });
            const slab = new THREE.Mesh(slabGeo, slabMat);
            
            // Set slab perfectly underneath the model
            slab.position.y = (-wallHeight / 2) - (slabThickness / 2);
            slab.position.x = ((minX + maxX) / 2) - cx;
            slab.position.z = ((minZ + maxZ) / 2) - cz;
            
            slab.receiveShadow = true;
            this.wallGroup.add(slab);
            
            // Edge highlight for slab
            const wireGeo = new THREE.EdgesGeometry(slabGeo);
            const wireMat = new THREE.LineBasicMaterial({ color: 0x8b5cf6, opacity: 0.5, transparent: true });
            const wire = new THREE.LineSegments(wireGeo, wireMat);
            slab.add(wire);
        }

        walls.forEach(wall => {
            const isIssue = issues.find(i => i.wallId === wall.id);
            const dx = wall.x2 - wall.x1;
            const dy = wall.y2 - wall.y1;
            const length = Math.hypot(dx, dy);
            
            if (length < 1) return; // Skip zero length

            // Calculate rotation
            const angle = Math.atan2(dy, dx);
            
            // Midpoint
            const midX = (wall.x1 + wall.x2) / 2 - cx;
            const midZ = (wall.y1 + wall.y2) / 2 - cz; // y in 2D is z in 3D

            const geometry = new THREE.BoxGeometry(length, wallHeight, wallThickness);
            
            let mat = partitionMaterial;
            if (isIssue) mat = dangerMaterial;
            else if (wall.type === 'load-bearing') mat = bearingMaterial;

            const mesh = new THREE.Mesh(geometry, mat);
            
            mesh.position.set(midX, 0, midZ);
            
            // Rotate around Y axis. Math.atan2 gives angle from positive X axis towards positive Y axis.
            // In ThreeJS WebGL coords, -Math.atan2 is needed for correct alignment due to Z handedness
            mesh.rotation.y = -angle;

            mesh.castShadow = true;
            mesh.receiveShadow = true;
            
            this.wallGroup.add(mesh);
        });

        // Add a grid helper
        const gridHelper = new THREE.GridHelper(Math.max(dims.width, dims.height) * 1.5, 30, 0x333344, 0x1a1c29);
        gridHelper.position.y = -wallHeight / 2 + 1; // slightly above floor
        this.wallGroup.add(gridHelper);

        this.focusCameraInfo = {
            target: new THREE.Vector3(0, 0, 0),
            position: new THREE.Vector3(0, Math.max(dims.width, dims.height), Math.max(dims.width, dims.height) * 0.8)
        };
        
        this.resetCamera();
    }

    resetCamera() {
        if (!this.focusCameraInfo) return;
        this.camera.position.copy(this.focusCameraInfo.position);
        this.controls.target.copy(this.focusCameraInfo.target);
        this.controls.update();
    }

    animate() {
        requestAnimationFrame(this.animate);
        this.controls.update();
        // Slow auto-rotation for premium feel if nothing is interacted yet
        if (this.wallGroup && this.wallGroup.children.length > 0) {
            this.wallGroup.rotation.y += 0.001;
        }
        this.renderer.render(this.scene, this.camera);
    }
}
