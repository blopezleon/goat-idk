/**
 * FluentForm - 3D Mouth Model Visualization
 * This module creates and controls a 3D model showing proper tongue and mouth positions
 * for different phonemes using Three.js
 */

class MouthModel {
    constructor(containerId) {
        this.container = document.getElementById(containerId);
        if (!this.container) {
            console.error(`Container with ID ${containerId} not found`);
            return;
        }

        this.loadDependencies()
            .then(() => this.initialize())
            .catch(error => console.error('Failed to load 3D model dependencies:', error));
    }

    async loadDependencies() {
        // Load Three.js if not already loaded
        if (typeof THREE === 'undefined') {
            await this.loadScript('https://cdn.jsdelivr.net/npm/three@0.132.2/build/three.min.js');
        }
        
        // Load OrbitControls
        await this.loadScript('https://cdn.jsdelivr.net/npm/three@0.132.2/examples/js/controls/OrbitControls.js');
        
        // Load GLTF Loader
        await this.loadScript('https://cdn.jsdelivr.net/npm/three@0.132.2/examples/js/loaders/GLTFLoader.js');
    }

    loadScript(src) {
        return new Promise((resolve, reject) => {
            const script = document.createElement('script');
            script.src = src;
            script.onload = resolve;
            script.onerror = reject;
            document.head.appendChild(script);
        });
    }

    initialize() {
        // Container dimensions
        const width = this.container.clientWidth;
        const height = this.container.clientHeight || 300;

        // Create scene
        this.scene = new THREE.Scene();
        this.scene.background = new THREE.Color(0xf5f5f5);

        // Create camera
        this.camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 1000);
        this.camera.position.set(0, 0, 10);

        // Create renderer
        this.renderer = new THREE.WebGLRenderer({ antialias: true });
        this.renderer.setSize(width, height);
        this.renderer.setPixelRatio(window.devicePixelRatio);
        this.renderer.outputEncoding = THREE.sRGBEncoding;
        this.container.appendChild(this.renderer.domElement);

        // Add lighting
        const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
        this.scene.add(ambientLight);

        const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
        directionalLight.position.set(0, 10, 10);
        this.scene.add(directionalLight);

        // Add controls
        this.controls = new THREE.OrbitControls(this.camera, this.renderer.domElement);
        this.controls.enableDamping = true;
        this.controls.dampingFactor = 0.05;

        // Create mouth geometries
        this.createMouthModel();

        // Handle window resize
        window.addEventListener('resize', () => this.onWindowResize());

        // Start animation loop
        this.animate();
    }

    createMouthModel() {
        // Create mouth group to hold all parts
        this.mouthGroup = new THREE.Group();
        this.scene.add(this.mouthGroup);

        // Create lips (outer mouth shape)
        const lipsGeometry = new THREE.TorusGeometry(2, 0.5, 16, 32, Math.PI);
        const lipsMaterial = new THREE.MeshPhongMaterial({ 
            color: 0xe74c3c, 
            shininess: 30 
        });
        this.lips = new THREE.Mesh(lipsGeometry, lipsMaterial);
        this.lips.rotation.x = Math.PI;
        this.lips.position.y = 0;
        this.mouthGroup.add(this.lips);

        // Create teeth
        const teethGeometry = new THREE.BoxGeometry(3, 0.3, 0.5);
        const teethMaterial = new THREE.MeshPhongMaterial({ 
            color: 0xffffff,
            shininess: 100
        });
        
        // Upper teeth
        this.upperTeeth = new THREE.Mesh(teethGeometry, teethMaterial);
        this.upperTeeth.position.set(0, 0.5, 0);
        this.mouthGroup.add(this.upperTeeth);
        
        // Lower teeth
        this.lowerTeeth = new THREE.Mesh(teethGeometry, teethMaterial);
        this.lowerTeeth.position.set(0, -0.5, 0);
        this.mouthGroup.add(this.lowerTeeth);

        // Create tongue
        const tongueGeometry = new THREE.SphereGeometry(1, 32, 32);
        const tongueMaterial = new THREE.MeshPhongMaterial({ 
            color: 0xff9999,
            shininess: 30
        });
        this.tongue = new THREE.Mesh(tongueGeometry, tongueMaterial);
        // Default position is resting
        this.tongue.position.set(0, -0.9, 0.5);
        this.tongue.scale.set(1.5, 0.5, 1);
        this.mouthGroup.add(this.tongue);

        // Create palate (roof of mouth)
        const palateGeometry = new THREE.SphereGeometry(2, 32, 16, 0, Math.PI * 2, 0, Math.PI / 2);
        const palateMaterial = new THREE.MeshPhongMaterial({ 
            color: 0xff9f7f,
            side: THREE.DoubleSide,
            shininess: 30
        });
        this.palate = new THREE.Mesh(palateGeometry, palateMaterial);
        this.palate.rotation.x = Math.PI;
        this.palate.position.y = 1;
        this.palate.scale.set(1, 0.5, 1);
        this.mouthGroup.add(this.palate);
        
        // Add annotations/markers
        this.addAnnotations();
    }

    addAnnotations() {
        // Create a separate scene for annotations that doesn't rotate with the model
        this.annotationGroup = new THREE.Group();
        this.scene.add(this.annotationGroup);
        
        // We'll add these dynamically when showing specific phoneme positions
    }

    // Update the mouth model to show the position for a specific phoneme
    showPhonemePosition(phoneme) {
        // Reset to default position first
        this.resetPosition();
        
        // Define mouth positions for different phonemes
        switch(phoneme.toLowerCase()) {
            case 'r':
                // Curled tongue position for 'r'
                this.animateTongue({
                    position: { x: 0, y: -0.4, z: 1.2 },
                    rotation: { x: -Math.PI / 6, y: 0, z: 0 },
                    scale: { x: 1.2, y: 0.6, z: 1.5 }
                });
                this.setLipsAperture(0.7);
                break;
                
            case 'th':
                // Tongue between teeth for 'th'
                this.animateTongue({
                    position: { x: 0, y: 0, z: 1.8 },
                    rotation: { x: 0, y: 0, z: 0 },
                    scale: { x: 1.5, y: 0.3, z: 1.2 }
                });
                this.setLipsAperture(0.5);
                this.setTeethPosition(0.3);
                break;
                
            case 's':
                // Tongue behind teeth, narrow channel for 's'
                this.animateTongue({
                    position: { x: 0, y: 0.1, z: 1 },
                    rotation: { x: 0, y: 0, z: 0 },
                    scale: { x: 1.5, y: 0.2, z: 2 }
                });
                this.setLipsAperture(0.4);
                this.setTeethPosition(0.2);
                break;
                
            case 'sh':
                // Rounded lips, tongue raised for 'sh'
                this.animateTongue({
                    position: { x: 0, y: 0.3, z: 0.5 },
                    rotation: { x: Math.PI / 12, y: 0, z: 0 },
                    scale: { x: 1.5, y: 0.4, z: 1.5 }
                });
                this.setLipsAperture(0.3);
                this.lips.scale.set(0.9, 1, 1); // Round the lips
                break;
                
            case 'l':
                // Tongue tip raised to palate for 'l'
                this.animateTongue({
                    position: { x: 0, y: 0.5, z: 1.5 },
                    rotation: { x: Math.PI / 8, y: 0, z: 0 },
                    scale: { x: 1.5, y: 0.3, z: 1.8 }
                });
                this.setLipsAperture(0.6);
                break;
                
            case 'k':
            case 'g':
                // Back of tongue raised for 'k' and 'g'
                this.animateTongue({
                    position: { x: 0, y: 0.2, z: -0.5 },
                    rotation: { x: -Math.PI / 8, y: 0, z: 0 },
                    scale: { x: 1.5, y: 0.6, z: 1.2 }
                });
                this.setLipsAperture(0.6);
                break;
                
            default:
                // Neutral position for vowels and other consonants
                this.resetPosition();
                break;
        }
        
        // Add annotation specific to this phoneme
        this.updateAnnotation(phoneme);
    }
    
    // Reset to neutral position
    resetPosition() {
        // Reset tongue
        this.animateTongue({
            position: { x: 0, y: -0.9, z: 0.5 },
            rotation: { x: 0, y: 0, z: 0 },
            scale: { x: 1.5, y: 0.5, z: 1 }
        });
        
        // Reset lips
        this.setLipsAperture(1.0);
        this.lips.scale.set(1, 1, 1);
        
        // Reset teeth
        this.setTeethPosition(0.5);
        
        // Clear annotations
        while(this.annotationGroup.children.length > 0) {
            this.annotationGroup.remove(this.annotationGroup.children[0]);
        }
    }
    
    // Animate the tongue to a new position
    animateTongue(params) {
        // For now, just set positions directly - could be animated with GSAP in a real implementation
        if (params.position) {
            this.tongue.position.set(
                params.position.x, 
                params.position.y, 
                params.position.z
            );
        }
        
        if (params.rotation) {
            this.tongue.rotation.set(
                params.rotation.x,
                params.rotation.y,
                params.rotation.z
            );
        }
        
        if (params.scale) {
            this.tongue.scale.set(
                params.scale.x,
                params.scale.y,
                params.scale.z
            );
        }
    }
    
    // Set how open the mouth is
    setLipsAperture(value) {
        // value 0 = closed, 1 = fully open
        this.upperTeeth.position.y = 0.5 * value;
        this.lowerTeeth.position.y = -0.5 * value;
        this.lips.scale.y = value;
    }
    
    // Set teeth position
    setTeethPosition(value) {
        // value is the distance between upper and lower teeth
        this.upperTeeth.position.y = value / 2;
        this.lowerTeeth.position.y = -value / 2;
    }
    
    // Update annotations for specific phoneme
    updateAnnotation(phoneme) {
        // Clear existing annotations
        while(this.annotationGroup.children.length > 0) {
            this.annotationGroup.remove(this.annotationGroup.children[0]);
        }
        
        // Create a canvas for the annotation
        const canvas = document.createElement('canvas');
        canvas.width = 256;
        canvas.height = 128;
        const context = canvas.getContext('2d');
        
        // Set up the canvas with phoneme information
        context.fillStyle = 'rgba(45, 52, 54, 0.8)';
        context.fillRect(0, 0, canvas.width, canvas.height);
        
        context.font = 'bold 40px Arial';
        context.textAlign = 'center';
        context.fillStyle = 'white';
        context.fillText(phoneme.toUpperCase(), canvas.width / 2, 50);
        
        context.font = '20px Arial';
        context.fillText('Position shown for this sound', canvas.width / 2, 80);
        
        // Create texture from canvas
        const texture = new THREE.CanvasTexture(canvas);
        
        // Create a sprite with the texture
        const spriteMaterial = new THREE.SpriteMaterial({ map: texture });
        const sprite = new THREE.Sprite(spriteMaterial);
        sprite.position.set(0, 3, 0);
        sprite.scale.set(5, 2.5, 1);
        
        // Add to annotation group
        this.annotationGroup.add(sprite);
    }

    onWindowResize() {
        const width = this.container.clientWidth;
        const height = this.container.clientHeight || 300;
        
        this.camera.aspect = width / height;
        this.camera.updateProjectionMatrix();
        this.renderer.setSize(width, height);
    }

    animate() {
        requestAnimationFrame(() => this.animate());
        
        // Update controls
        if (this.controls) {
            this.controls.update();
        }
        
        // Render the scene
        this.renderer.render(this.scene, this.camera);
    }
}

// Create a global interface for using the mouth model
window.FluentForm = window.FluentForm || {};
window.FluentForm.MouthModel = MouthModel; 