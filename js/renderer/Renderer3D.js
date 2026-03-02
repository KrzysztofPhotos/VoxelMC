import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';
import { EXRLoader } from 'three/addons/loaders/EXRLoader.js';
import { RGBELoader } from 'three/addons/loaders/RGBELoader.js';
import * as BufferGeometryUtils from 'three/addons/utils/BufferGeometryUtils.js';
import { BlockRegistry } from '../materials/BlockRegistry.js';

export class Renderer3D {
    constructor(canvasId) {
        this.canvas = document.getElementById(canvasId);
        
        this.scene = new THREE.Scene();
        this.scene.background = new THREE.Color(0x1a1a1a);
        
        this.camera = new THREE.PerspectiveCamera(45, 1, 0.1, 1000);
        this.camera.position.set(40, 40, 40);
        
        this.renderer = new THREE.WebGLRenderer({ canvas: this.canvas, antialias: true });
        this.renderer.shadowMap.enabled = true;
        this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
        this.renderer.outputColorSpace = THREE.SRGBColorSpace;
        this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
        this.renderer.toneMappingExposure = 1.0;
        // In r160 usePhysicallyCorrectLights is deprecated in favor of useLegacyLights = false which is the default, but we can set it anyway or set physicallyCorrectLights for older versions
        this.renderer.physicallyCorrectLights = true;
        
        this.controls = new OrbitControls(this.camera, this.renderer.domElement);
        this.controls.enableDamping = true;
        
        // Natural Lighting Setup (Sun & Sky)
        const hemiLight = new THREE.HemisphereLight(0xffffff, 0x444444, 0.4);
        hemiLight.position.set(0, 100, 0);
        this.scene.add(hemiLight);
        
        this.sunLight = new THREE.DirectionalLight(0xfff5e6, 1.5);
        this.sunLight.position.set(50, 100, 50);
        this.sunLight.castShadow = true;
        this.sunLight.shadow.mapSize.width = 2048;
        this.sunLight.shadow.mapSize.height = 2048;
        this.sunLight.shadow.camera.near = 0.5;
        this.sunLight.shadow.camera.far = 500;
        this.sunLight.shadow.camera.left = -50;
        this.sunLight.shadow.camera.right = 50;
        this.sunLight.shadow.camera.top = 50;
        this.sunLight.shadow.camera.bottom = -50;
        this.sunLight.shadow.bias = -0.001;
        this.sunLight.shadow.normalBias = 0.05;
        this.scene.add(this.sunLight);

        // Soft fill light from the opposite side
        const fillLight = new THREE.DirectionalLight(0x88bbff, 0.3);
        fillLight.position.set(-50, 20, -50);
        this.scene.add(fillLight);

        // Helper grid
        this.gridHelper = new THREE.GridHelper(100, 100, 0x444444, 0x2a2a2a);
        this.gridHelper.position.y = -0.5;
        this.scene.add(this.gridHelper);

        this.instancedMesh = null;
        this.edgesMesh = null; // To hold outlines
        
        // Setup Environment map for reflections using realistic studio/room environment
        const pmremGenerator = new THREE.PMREMGenerator(this.renderer);
        pmremGenerator.compileEquirectangularShader();
        
        // Setup Room Environment (similar to Blender's default lookdev studio)
        this.roomEnvScene = new RoomEnvironment();
        this.roomEnvTexture = pmremGenerator.fromScene(this.roomEnvScene).texture;
        
        // Caching for downloaded textures
        this.texturesCache = {
            'studio': this.roomEnvTexture
        };
        
        // Cache for Minecraft block textures
        this.blockTexturesCache = {};
        this.textureLoader = new THREE.TextureLoader();
        
        this.currentBgType = 'studio';
        this.scene.environment = this.roomEnvTexture;
        
        this.resize();
        window.addEventListener('resize', () => this.resize());
        
        this.animate();
    }

    setBackground(type) {
        if (this.currentBgType === type) return;
        this.currentBgType = type;

        const applyEnv = (texture) => {
            texture.mapping = THREE.EquirectangularReflectionMapping;
            this.scene.environment = texture;
            if (type === 'studio') {
                this.scene.background = new THREE.Color(0x1a1a1a);
            } else {
                this.scene.background = texture;
            }
            
            // Force materials that depend on environment map to update
            if (this.instancedMesh && this.instancedMesh.material) {
                this.instancedMesh.material.needsUpdate = true;
            }
        };

        if (this.texturesCache[type]) {
            applyEnv(this.texturesCache[type]);
            return;
        }

        const updateCacheAndApply = (texture) => {
            this.texturesCache[type] = texture;
            if (this.currentBgType === type) {
                applyEnv(texture);
            }
        };

        if (type === 'minecraft') {
            const loader = new RGBELoader();
            loader.load('themes/HDRI Minecraft Daytime.hdr', updateCacheAndApply);
        } else if (type === 'ludwikowice') {
            const loader = new EXRLoader();
            loader.load('themes/ludwikowice_farmland_4k.exr', updateCacheAndApply);
        } else if (type === 'bridge_exr') {
            const loader = new EXRLoader();
            loader.load('themes/cedar_bridge_2_4k.exr', updateCacheAndApply);
        }
    }

    resize() {
        const parent = this.canvas.parentElement;
        if (!parent || parent.clientWidth === 0) return; // Hidden
        
        const width = parent.clientWidth;
        const height = parent.clientHeight;
        
        this.renderer.setSize(width, height, false);
        this.camera.aspect = width / height;
        this.camera.updateProjectionMatrix();
    }

    getBlockTexture(textureName) {
        if (this.blockTexturesCache[textureName]) {
            return this.blockTexturesCache[textureName];
        }

        const texture = this.textureLoader.load(`assets/textures/${textureName}`, () => {
            if (this.mainMesh && this.mainMesh.material && this.mainMesh.material.map === texture) {
                this.mainMesh.material.needsUpdate = true;
            }
        });
        
        texture.magFilter = THREE.NearestFilter;
        texture.minFilter = THREE.NearestFilter;
        texture.generateMipmaps = false;
        // Textures act as colors so they need correct color space encoding (sRGB)
        texture.colorSpace = THREE.SRGBColorSpace;
        
        this.blockTexturesCache[textureName] = texture;
        return texture;
    }

    getMaterialForBlock(textureType) {
        const blockDef = BlockRegistry[textureType] || BlockRegistry['stone'];
        
        // Setup transparent properties if required by registry
        const isTransparent = blockDef.transparent || false;

        // If it's a single texture, return a standard material
        if (blockDef.textures.all) {
            return new THREE.MeshStandardMaterial({
                map: this.getBlockTexture(blockDef.textures.all),
                roughness: 0.8,
                metalness: 0.0,
                flatShading: false,
                transparent: isTransparent,
                alphaTest: isTransparent ? 0.1 : 0
            });
        }
        
        // If it's multi-texture, return an array of 6 materials
        // Order: px, nx, py, ny, pz, nz (Right, Left, Top, Bottom, Front, Back)
        const sideTex = this.getBlockTexture(blockDef.textures.side || blockDef.textures.all);
        const topTex = this.getBlockTexture(blockDef.textures.top || blockDef.textures.all);
        const bottomTex = this.getBlockTexture(blockDef.textures.bottom || blockDef.textures.all);

        const matSide = new THREE.MeshStandardMaterial({ map: sideTex, roughness: 0.8, metalness: 0.0, flatShading: false, transparent: isTransparent, alphaTest: isTransparent ? 0.1 : 0 });
        const matTop = new THREE.MeshStandardMaterial({ map: topTex, roughness: 0.8, metalness: 0.0, flatShading: false, transparent: isTransparent, alphaTest: isTransparent ? 0.1 : 0 });
        const matBottom = new THREE.MeshStandardMaterial({ map: bottomTex, roughness: 0.8, metalness: 0.0, flatShading: false, transparent: isTransparent, alphaTest: isTransparent ? 0.1 : 0 });

        return [
            matSide,   // Right
            matSide,   // Left
            matTop,    // Top
            matBottom, // Bottom
            matSide,   // Front
            matSide    // Back
        ];
    }

    setData(blocks, materialType = 'solid', textureType = 'stone') {
        if (this.mainMesh) {
            this.scene.remove(this.mainMesh);
            // Recursively dispose geometries and materials
            this.mainMesh.traverse(child => {
                if (child.geometry) child.geometry.dispose();
                if (child.material) {
                    if (Array.isArray(child.material)) {
                        child.material.forEach(m => m.dispose());
                    } else {
                        child.material.dispose();
                    }
                }
            });
            this.mainMesh = null;
        }
        if (this.edgesMesh) {
            this.scene.remove(this.edgesMesh);
            this.edgesMesh.geometry.dispose();
            this.edgesMesh.material.dispose();
            this.edgesMesh = null;
        }
        
        if (blocks.length === 0) return;

        // Group blocks by type if using textures, otherwise treat as one monolithic shape
        const blockGroups = {};
        if (materialType === 'texture') {
            blocks.forEach(b => {
                const type = b.type || textureType;
                if (!blockGroups[type]) blockGroups[type] = [];
                blockGroups[type].push(b);
            });
        } else {
            blockGroups['default'] = blocks;
        }

        const baseGeometry = new THREE.BoxGeometry(1, 1, 1);
        const groupMeshes = [];
        
        for (const [type, groupBlocks] of Object.entries(blockGroups)) {
            const geometries = [];
            const matrix = new THREE.Matrix4();
            
            for (let i = 0; i < groupBlocks.length; i++) {
                const b = groupBlocks[i];
                matrix.makeTranslation(b.x, b.y, b.z);
                const blockGeo = baseGeometry.clone();
                blockGeo.applyMatrix4(matrix);
                geometries.push(blockGeo);
            }

            let mergedGeometry = BufferGeometryUtils.mergeGeometries(geometries, true);
            mergedGeometry.computeVertexNormals();

            let material;
            const baseColor = 0x007acc;

            if (materialType === 'texture') {
                material = this.getMaterialForBlock(type);
            } else {
                switch (materialType) {
                    case 'glossy':
                        material = new THREE.MeshStandardMaterial({ 
                            color: baseColor,
                            roughness: 0.1,
                            metalness: 0.2,
                            flatShading: false
                        });
                        break;
                    case 'mirror':
                        material = new THREE.MeshPhysicalMaterial({ 
                            color: 0xffffff,
                            metalness: 1.0,
                            roughness: 0.05,
                            envMapIntensity: 1.5,
                            flatShading: false
                        });
                        break;
                    case 'glass':
                        material = new THREE.MeshPhysicalMaterial({ 
                            color: 0xffffff,
                            metalness: 0.1,
                            roughness: 0.05,
                            transmission: 0.95,
                            ior: 1.5,
                            thickness: 1.0,
                            envMapIntensity: 1.2,
                            transparent: true,
                            flatShading: false
                        });
                        break;
                    case 'wireframe':
                        material = new THREE.MeshBasicMaterial({ 
                            color: 0x007acc,
                            wireframe: true,
                            transparent: true,
                            opacity: 0.3
                        });
                        break;
                    case 'solid':
                    default:
                        material = new THREE.MeshStandardMaterial({ 
                            color: baseColor,
                            roughness: 0.7,
                            metalness: 0.0,
                            flatShading: false
                        });
                        break;
                }
            }

            const mesh = new THREE.Mesh(mergedGeometry, material);
            if (materialType !== 'wireframe') {
                mesh.castShadow = true;
                mesh.receiveShadow = true;
            }
            groupMeshes.push(mesh);
        }

        // Use a Group to hold all multi-material meshes
        this.mainMesh = new THREE.Group();
        groupMeshes.forEach(m => this.mainMesh.add(m));
        this.scene.add(this.mainMesh);
        
        // Add outline edges for all meshes combined (optional, might be slow)
        // For simplicity, we can just merge all geometries once for edges
        const allGeometries = [];
        const matrix = new THREE.Matrix4();
        for (let i = 0; i < blocks.length; i++) {
            const b = blocks[i];
            matrix.makeTranslation(b.x, b.y, b.z);
            const blockGeo = baseGeometry.clone();
            blockGeo.applyMatrix4(matrix);
            allGeometries.push(blockGeo);
        }
        let mergedAllGeometry = BufferGeometryUtils.mergeGeometries(allGeometries, true);
        const edgeGeometry = new THREE.EdgesGeometry(mergedAllGeometry);
        const edgesMat = new THREE.LineBasicMaterial({ 
            color: 0x000000, 
            linewidth: 1,
            opacity: 0.25,
            transparent: true,
            depthTest: true,
            depthWrite: false
        });
        this.edgesMesh = new THREE.LineSegments(edgeGeometry, edgesMat);
        if (materialType === 'wireframe') {
            this.edgesMesh.visible = false;
        }
        this.scene.add(this.edgesMesh);
    }

    setLightIntensity(intensity) {
        if (this.sunLight) {
            this.sunLight.intensity = intensity;
        }
    }

    setGridVisibility(visible) {
        if (this.gridHelper) {
            this.gridHelper.visible = visible;
        }
    }

    animate() {
        requestAnimationFrame(() => this.animate());
        this.controls.update();
        this.renderer.render(this.scene, this.camera);
    }
}