import { Sphere } from '../shapes/Sphere.js';
import { Circle } from '../shapes/Circle.js';
import { Ellipse } from '../shapes/Ellipse.js';
import { Ellipsoid } from '../shapes/Ellipsoid.js';
import { Cylinder } from '../shapes/Cylinder.js';
import { Cone } from '../shapes/Cone.js';
import { Torus } from '../shapes/Torus.js';
import { ProceduralHouse } from '../shapes/ProceduralHouse.js';
import { ProceduralMedievalHouse } from '../shapes/ProceduralMedievalHouse.js';
import { ProceduralTower } from '../shapes/ProceduralTower.js';
import { ProceduralArchBridge } from '../shapes/ProceduralArchBridge.js';
import { ProceduralParaboloid } from '../shapes/ProceduralParaboloid.js';
import { ProceduralHelix } from '../shapes/ProceduralHelix.js';
import { Renderer2D } from '../renderer/Renderer2D.js';
import { exportJSON, exportCSV, copyToClipboard, exportOBJ, exportSTL, exportMCFunction, exportSchematic } from '../export/Exporter.js';
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
        this.btnExportOBJ = document.getElementById('btn-export-obj');
        this.btnExportSTL = document.getElementById('btn-export-stl');
        this.btnExportSchematic = document.getElementById('btn-export-schematic');
        this.btnExportMCFunction = document.getElementById('btn-export-mcfunction');
        this.btnCopyClip = document.getElementById('btn-copy-clip');

        this.presetSelect = document.getElementById('preset-select');
        this.btnSavePreset = document.getElementById('btn-save-preset');
        this.btnDeletePreset = document.getElementById('btn-delete-preset');

        this.renderer2D = new Renderer2D('canvas-2d');
        
        // Lazy load 3D renderer
        this.renderer3D = null;
        this.currentBlocks = [];

        this.shapeConfigs = {
            helix: { class: ProceduralHelix, params: [
                { name: 'radius', label: 'Radius', value: 10 },
                { name: 'height', label: 'Height', value: 40 },
                { name: 'turns', label: 'Number of Turns', value: 3, step: 0.1 },
                { name: 'thickness', label: 'Line Thickness', value: 2 },
                { name: 'tube', label: 'Tube Mode', value: true, type: 'checkbox' },
                { name: 'doubleHelix', label: 'Double Helix', value: true, type: 'checkbox' },
                { name: 'connectorSpacing', label: 'Connectors (0=None)', value: 1.5, step: 0.1 },
                { name: 'coreRadius', label: 'Core (0=None)', value: 3 },
                { name: 'ringSpacing', label: 'Rings (0=None)', value: 10 },
                { name: 'taper', label: 'Taper (0-1)', value: 0.5, step: 0.1, min: 0 },
                { name: 'topPlatform', label: 'Top Platform', value: true, type: 'checkbox' }
            ]},
            paraboloid: { class: ProceduralParaboloid, params: [
                { name: 'radius', label: 'Radius', value: 15 },
                { name: 'height', label: 'Height', value: 10 }
            ]},
            bridge: { class: ProceduralArchBridge, params: [
                { name: 'span', label: 'Length (Span)', value: 60 },
                { name: 'width', label: 'Width', value: 7 },
                { name: 'thickness', label: 'Arch Thickness', value: 3 },
                { name: 'segments', label: 'Number of Segments', value: 3 },
                { name: 'curveAmount', label: 'Bridge Curve', value: 0.5, step: 0.1, min: 0 },
                { name: 'hasGate', label: 'Add Gate', value: true, type: 'checkbox' }
            ]},
            house: { class: ProceduralHouse, params: [
                { name: 'width', label: 'Width', value: 11 },
                { name: 'depth', label: 'Depth', value: 11 },
                { name: 'height', label: 'Wall Height', value: 5 },
                { name: 'roofHeight', label: 'Roof Height', value: 5 }
            ]},
            medieval_house: { class: ProceduralMedievalHouse, params: [
                { name: 'width', label: 'Width', value: 11 },
                { name: 'depth', label: 'Depth', value: 11 },
                { name: 'wallHeight', label: 'Wall Height', value: 6 },
                { name: 'roofHeight', label: 'Roof Height', value: 5 },
                { name: 'overhang', label: 'Roof Overhang', value: 1 },
                { name: 'timberFrame', label: 'Timber Frame', value: true, type: 'checkbox' },
                { name: 'chimney', label: 'Chimney', value: true, type: 'checkbox' },
                { name: 'foundationHeight', label: 'Foundation Height', value: 1 },
                { name: 'windowCount', label: 'Window Count', value: 4 }
            ]},
            tower: { class: ProceduralTower, params: [
                { name: 'radius', label: 'Radius', value: 8 },
                { name: 'height', label: 'Height', value: 24 },
                { name: 'wallThickness', label: 'Wall Thickness', value: 1 },
                { name: 'hasRoof', label: 'Add Roof', value: true, type: 'checkbox' }
            ]},
            sphere: { class: Sphere, params: [{ name: 'radius', label: 'Radius', value: 10 }] },
            circle: { class: Circle, params: [{ name: 'radius', label: 'Radius', value: 10 }] },
            ellipse: { class: Ellipse, params: [
                { name: 'width', label: 'Width', value: 20 },
                { name: 'height', label: 'Height', value: 10 }
            ]},
            ellipsoid: { class: Ellipsoid, params: [
                { name: 'width', label: 'Width', value: 20 },
                { name: 'height', label: 'Height', value: 10 },
                { name: 'depth', label: 'Depth', value: 15 }
            ]},
            cylinder: { class: Cylinder, params: [
                { name: 'radius', label: 'Radius', value: 10 },
                { name: 'height', label: 'Height', value: 20 }
            ]},
            cone: { class: Cone, params: [
                { name: 'radius', label: 'Radius', value: 10 },
                { name: 'height', label: 'Height', value: 20 }
            ]},
            torus: { class: Torus, params: [
                { name: 'majorRadius', label: 'Major Radius', value: 15 },
                { name: 'minorRadius', label: 'Minor Radius', value: 5 }
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
        this.btnExportOBJ.addEventListener('click', () => exportOBJ(this.currentBlocks));
        this.btnExportSTL.addEventListener('click', () => exportSTL(this.currentBlocks));
        this.btnExportMCFunction.addEventListener('click', () => exportMCFunction(this.currentBlocks));
        this.btnExportSchematic.addEventListener('click', () => exportSchematic(this.currentBlocks));
        this.btnCopyClip.addEventListener('click', () => copyToClipboard(this.currentBlocks));

        this.btnSavePreset.addEventListener('click', () => this.savePreset());
        this.btnDeletePreset.addEventListener('click', () => this.deletePreset());
        this.presetSelect.addEventListener('change', () => this.loadPreset());
        
        this.loadPresetsList();
        
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

    getPresets() {
        const presets = localStorage.getItem('voxelgen_presets');
        return presets ? JSON.parse(presets) : {};
    }

    savePresets(presets) {
        localStorage.setItem('voxelgen_presets', JSON.stringify(presets));
        this.loadPresetsList();
    }

    loadPresetsList() {
        const presets = this.getPresets();
        const currentVal = this.presetSelect.value;
        this.presetSelect.innerHTML = '<option value="">-- Select Preset --</option>';
        for (const name in presets) {
            const option = document.createElement('option');
            option.value = name;
            option.innerText = name;
            this.presetSelect.appendChild(option);
        }
        if (presets[currentVal]) {
            this.presetSelect.value = currentVal;
        }
    }

    savePreset() {
        let name = prompt("Enter preset name:");
        if (!name) return;
        name = name.trim();
        if (name === '') return;

        const shapeType = this.shapeSelect.value;
        const config = this.shapeConfigs[shapeType];

        const params = {
            shape: shapeType,
            material: this.materialSelect.value,
            blockType: this.blockTypeSelect.value,
            hollow: this.modeShell.checked,
            thickness: this.wallThickness.value,
            values: {}
        };

        config.params.forEach(param => {
            const el = document.getElementById(`param-${param.name}`);
            if (param.type === 'checkbox') {
                params.values[param.name] = el.checked;
            } else {
                params.values[param.name] = parseFloat(el.value);
            }
        });

        const presets = this.getPresets();
        presets[name] = params;
        this.savePresets(presets);
        this.presetSelect.value = name;
    }

    deletePreset() {
        const name = this.presetSelect.value;
        if (!name) {
            alert("No preset selected!");
            return;
        }
        if (confirm(`Delete preset "${name}"?`)) {
            const presets = this.getPresets();
            delete presets[name];
            this.savePresets(presets);
            this.presetSelect.value = '';
        }
    }

    loadPreset() {
        const name = this.presetSelect.value;
        if (!name) return;
        const presets = this.getPresets();
        const preset = presets[name];
        if (!preset) return;

        this.shapeSelect.value = preset.shape;
        this.materialSelect.value = preset.material || 'solid';
        this.blockTypeSelect.value = preset.blockType || 'stone';

        this.modeShell.checked = preset.hollow;
        this.wallThickness.value = preset.thickness || 1;
        this.wallThicknessGroup.style.display = preset.hollow ? 'flex' : 'none';
        this.blockTypeGroup.style.display = preset.material === 'texture' ? 'flex' : 'none';

        this.updateParamsUI();

        const config = this.shapeConfigs[preset.shape];
        config.params.forEach(param => {
            const el = document.getElementById(`param-${param.name}`);
            if (preset.values[param.name] !== undefined) {
                if (param.type === 'checkbox') {
                    el.checked = preset.values[param.name];
                } else {
                    el.value = preset.values[param.name];
                }
            }
        });

        this.generate();
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