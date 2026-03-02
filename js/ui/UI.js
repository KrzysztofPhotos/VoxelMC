import { Sphere } from '../shapes/Sphere.js';
import { Circle } from '../shapes/Circle.js';
import { Ellipse } from '../shapes/Ellipse.js';
import { Ellipsoid } from '../shapes/Ellipsoid.js';
import { Cylinder } from '../shapes/Cylinder.js';
import { Cone } from '../shapes/Cone.js';
import { Torus } from '../shapes/Torus.js';
import { ProceduralHouse } from '../shapes/ProceduralHouse.js';
import { ProceduralTower } from '../shapes/ProceduralTower.js';
import { ProceduralArchBridge } from '../shapes/ProceduralArchBridge.js';
import { ProceduralParaboloid } from '../shapes/ProceduralParaboloid.js';
import { ProceduralHelix } from '../shapes/ProceduralHelix.js';
import { Renderer2D } from '../renderer/Renderer2D.js';
import { exportJSON, exportCSV, copyToClipboard } from '../export/Exporter.js';
import { BlockRegistry } from '../materials/BlockRegistry.js';

export class UI {
    constructor() {
        this.shapeSelect = document.getElementById('shape-select');
        this.materialSelect = document.getElementById('material-select');
        this.blockTypeGroup = document.getElementById('block-type-group');
        this.blockTypeSelect = document.getElementById('block-type-select');
        this.backgroundSelect = document.getElementById('background-select');
        this.showGrid = document.getElementById('show-grid');
        this.dynamicParams = document.getElementById('dynamic-params');
        this.btnGenerate = document.getElementById('btn-generate');
        this.modeShell = document.getElementById('mode-shell');
        this.wallThicknessGroup = document.getElementById('wall-thickness-group');
        this.wallThickness = document.getElementById('wall-thickness');
        
        this.layerSlider = document.getElementById('layer-slider');
        this.layerDisplay = document.getElementById('layer-display');
        
        this.lightControls = document.getElementById('light-controls');
        this.lightSlider = document.getElementById('light-slider');
        this.lightDisplay = document.getElementById('light-display');
        
        this.btnView2D = document.getElementById('btn-view-2d');
        this.btnView3D = document.getElementById('btn-view-3d');
        
        this.view2D = document.getElementById('view-2d');
        this.view3D = document.getElementById('view-3d');
        
        this.btnExportJSON = document.getElementById('btn-export-json');
        this.btnExportCSV = document.getElementById('btn-export-csv');
        this.btnCopyClip = document.getElementById('btn-copy-clip');

        this.renderer2D = new Renderer2D('canvas-2d');
        
        // Lazy load 3D renderer
        this.renderer3D = null;
        this.currentBlocks = [];

        this.shapeConfigs = {
            helix: { class: ProceduralHelix, params: [
                { name: 'radius', label: 'Promień', value: 10 },
                { name: 'height', label: 'Wysokość', value: 40 },
                { name: 'turns', label: 'Ilość Obrotów', value: 3, step: 0.1 },
                { name: 'thickness', label: 'Grubość Linii', value: 2 },
                { name: 'tube', label: 'Tryb Rury', value: true, type: 'checkbox' },
                { name: 'doubleHelix', label: 'Podwójna Helisa', value: true, type: 'checkbox' },
                { name: 'connectorSpacing', label: 'Łączniki (0=Brak)', value: 1.5, step: 0.1 },
                { name: 'coreRadius', label: 'Rdzeń (0=Brak)', value: 3 },
                { name: 'ringSpacing', label: 'Pierścienie (0=Brak)', value: 10 },
                { name: 'taper', label: 'Zwężanie (0-1)', value: 0.5, step: 0.1, min: 0 },
                { name: 'topPlatform', label: 'Platforma Szczytowa', value: true, type: 'checkbox' }
            ]},
            paraboloid: { class: ProceduralParaboloid, params: [
                { name: 'radius', label: 'Promień', value: 15 },
                { name: 'height', label: 'Wysokość', value: 10 }
            ]},
            bridge: { class: ProceduralArchBridge, params: [
                { name: 'span', label: 'Długość (Rozpiętość)', value: 60 },
                { name: 'width', label: 'Szerokość', value: 7 },
                { name: 'thickness', label: 'Grubość Łuku', value: 3 },
                { name: 'segments', label: 'Ilość Segmentów', value: 3 },
                { name: 'curveAmount', label: 'Skręt Mostu', value: 0.5, step: 0.1, min: 0 },
                { name: 'hasGate', label: 'Dodaj Bramę', value: true, type: 'checkbox' }
            ]},
            house: { class: ProceduralHouse, params: [
                { name: 'width', label: 'Szerokość', value: 11 },
                { name: 'depth', label: 'Głębokość', value: 11 },
                { name: 'height', label: 'Wysokość Ścian', value: 5 },
                { name: 'roofHeight', label: 'Wysokość Dachu', value: 5 }
            ]},
            tower: { class: ProceduralTower, params: [
                { name: 'radius', label: 'Promień', value: 8 },
                { name: 'height', label: 'Wysokość', value: 24 },
                { name: 'wallThickness', label: 'Grubość Ściany', value: 1 },
                { name: 'hasRoof', label: 'Dodaj dach', value: true, type: 'checkbox' }
            ]},
            sphere: { class: Sphere, params: [{ name: 'radius', label: 'Promień', value: 10 }] },
            circle: { class: Circle, params: [{ name: 'radius', label: 'Promień', value: 10 }] },
            ellipse: { class: Ellipse, params: [
                { name: 'width', label: 'Szerokość', value: 20 },
                { name: 'height', label: 'Wysokość', value: 10 }
            ]},
            ellipsoid: { class: Ellipsoid, params: [
                { name: 'width', label: 'Szerokość', value: 20 },
                { name: 'height', label: 'Wysokość', value: 10 },
                { name: 'depth', label: 'Głębokość', value: 15 }
            ]},
            cylinder: { class: Cylinder, params: [
                { name: 'radius', label: 'Promień', value: 10 },
                { name: 'height', label: 'Wysokość', value: 20 }
            ]},
            cone: { class: Cone, params: [
                { name: 'radius', label: 'Promień', value: 10 },
                { name: 'height', label: 'Wysokość', value: 20 }
            ]},
            torus: { class: Torus, params: [
                { name: 'majorRadius', label: 'Promień główny', value: 15 },
                { name: 'minorRadius', label: 'Promień rurki', value: 5 }
            ]}
        };

        this.initBlockRegistry();
        this.initEventListeners();
        this.updateParamsUI();
        this.generate();
    }

    initBlockRegistry() {
        this.blockTypeSelect.innerHTML = '';
        for (const [key, block] of Object.entries(BlockRegistry)) {
            const option = document.createElement('option');
            option.value = key;
            option.innerText = block.name;
            this.blockTypeSelect.appendChild(option);
        }
    }

    initEventListeners() {
        this.shapeSelect.addEventListener('change', () => {
            this.updateParamsUI();
            this.generate();
        });
        
                        this.materialSelect.addEventListener('change', () => {
                            this.blockTypeGroup.style.display = this.materialSelect.value === 'texture' ? 'flex' : 'none';
                            this.generate();
                        });
                        
                        this.blockTypeSelect.addEventListener('change', () => this.generate());
                
                        this.backgroundSelect.addEventListener('change', (e) => {                            if (this.renderer3D) {
                                this.renderer3D.setBackground(e.target.value);
                            }
                        });
                
                        this.showGrid.addEventListener('change', (e) => {
                            if (this.renderer3D) {
                                this.renderer3D.setGridVisibility(e.target.checked);
                            }
                        });
                
                        this.modeShell.addEventListener('change', () => {            this.wallThicknessGroup.style.display = this.modeShell.checked ? 'flex' : 'none';
            this.generate();
        });

        this.wallThickness.addEventListener('input', () => this.generate());

        this.btnGenerate.addEventListener('click', () => this.generate());

        this.layerSlider.addEventListener('input', (e) => {
            const val = parseInt(e.target.value);
            this.layerDisplay.innerText = val;
            this.renderer2D.setLayer(val);
        });

        this.lightSlider.addEventListener('input', (e) => {
            const val = parseFloat(e.target.value);
            this.lightDisplay.innerText = val.toFixed(1);
            if (this.renderer3D) {
                this.renderer3D.setLightIntensity(val);
            }
        });

        this.btnView2D.addEventListener('click', () => this.switchView('2d'));
        this.btnView3D.addEventListener('click', async () => {
            if (!this.renderer3D) {
                // Load ThreeJS dynamically
                const { Renderer3D } = await import('../renderer/Renderer3D.js');
                this.renderer3D = new Renderer3D('canvas-3d');
                this.renderer3D.setBackground(this.backgroundSelect.value);
                this.renderer3D.setGridVisibility(this.showGrid.checked);
                const materialType = this.materialSelect ? this.materialSelect.value : 'solid';
                const textureType = this.blockTypeSelect ? this.blockTypeSelect.value : 'stone';
                this.renderer3D.setData(this.currentBlocks, materialType, textureType);
            }
            this.switchView('3d');
        });

        this.btnExportJSON.addEventListener('click', () => exportJSON(this.currentBlocks));
        this.btnExportCSV.addEventListener('click', () => exportCSV(this.currentBlocks));
        this.btnCopyClip.addEventListener('click', () => copyToClipboard(this.currentBlocks));
        
        // Resize events
        window.addEventListener('resize', () => {
            if (this.view2D.classList.contains('active')) this.renderer2D.resize();
            if (this.renderer3D && this.view3D.classList.contains('active')) this.renderer3D.resize();
        });
    }

    updateParamsUI() {
        const shape = this.shapeSelect.value;
        const config = this.shapeConfigs[shape];
        
        this.dynamicParams.innerHTML = '';
        
        config.params.forEach(param => {
            const group = document.createElement('div');
            group.className = 'control-group';
            
            const label = document.createElement('label');
            label.innerText = param.label;
            
            let input;
            if (param.type === 'checkbox') {
                input = document.createElement('input');
                input.type = 'checkbox';
                input.id = `param-${param.name}`;
                input.checked = param.value;
                input.addEventListener('change', () => this.generate());
                
                const labelWrapper = document.createElement('label');
                labelWrapper.appendChild(input);
                labelWrapper.appendChild(document.createTextNode(' ' + param.label));
                group.appendChild(labelWrapper);
            } else {
                input = document.createElement('input');
                input.type = 'number';
                input.id = `param-${param.name}`;
                input.value = param.value;
                if (param.step) input.step = param.step;
                if (param.min !== undefined) input.min = param.min;
                else input.min = 1;
                input.addEventListener('input', () => this.generate());
                
                group.appendChild(label);
                group.appendChild(input);
            }
            
            this.dynamicParams.appendChild(group);
        });
    }

    switchView(view) {
        if (view === '2d') {
            this.btnView2D.classList.add('active');
            this.btnView3D.classList.remove('active');
            this.view2D.classList.add('active');
            this.view3D.classList.remove('active');
            this.lightControls.style.display = 'none';
            document.getElementById('layer-controls').style.display = 'flex';
            this.renderer2D.resize();
        } else {
            this.btnView3D.classList.add('active');
            this.btnView2D.classList.remove('active');
            this.view3D.classList.add('active');
            this.view2D.classList.remove('active');
            this.lightControls.style.display = 'flex';
            document.getElementById('layer-controls').style.display = 'none';
            if (this.renderer3D) this.renderer3D.resize();
        }
    }

    generate() {
        const shapeType = this.shapeSelect.value;
        const config = this.shapeConfigs[shapeType];
        
        const params = {
            hollow: this.modeShell.checked,
            thickness: parseInt(this.wallThickness.value) || 1
        };
        
        config.params.forEach(param => {
            const el = document.getElementById(`param-${param.name}`);
            if (param.type === 'checkbox') {
                params[param.name] = el.checked;
            } else {
                params[param.name] = parseFloat(el.value);
            }
        });

        const ShapeClass = config.class;
        const shape = new ShapeClass(params);
        
        this.currentBlocks = shape.getBlocks();
        
        this.updateLayerControls(shapeType);
        
        const currentY = parseInt(this.layerSlider.value) || 0;
        this.renderer2D.setData(this.currentBlocks, currentY);
        
        if (this.renderer3D) {
            const materialType = this.materialSelect ? this.materialSelect.value : 'solid';
            const textureType = this.blockTypeSelect ? this.blockTypeSelect.value : 'stone';
            this.renderer3D.setData(this.currentBlocks, materialType, textureType);
        }
    }

    updateLayerControls(shapeType) {
        if (this.currentBlocks.length === 0) {
            this.layerSlider.min = 0;
            this.layerSlider.max = 0;
            this.layerSlider.value = 0;
            this.layerDisplay.innerText = 0;
            return;
        }

        let minY = Infinity, maxY = -Infinity;
        this.currentBlocks.forEach(b => {
            if (b.y < minY) minY = b.y;
            if (b.y > maxY) maxY = b.y;
        });

        this.layerSlider.min = minY;
        this.layerSlider.max = maxY;
        
        // keep old value if within range
        let currentY = parseInt(this.layerSlider.value);
        if (isNaN(currentY) || currentY < minY || currentY > maxY) {
            currentY = minY; // start from bottom
        }
        
        // For 2D shapes, only y=0 is used usually
        if (shapeType === 'circle' || shapeType === 'ellipse') {
            currentY = 0;
        }

        this.layerSlider.value = currentY;
        this.layerDisplay.innerText = currentY;
    }
}