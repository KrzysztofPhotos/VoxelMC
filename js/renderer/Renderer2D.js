export class Renderer2D {
    constructor(canvasId) {
        this.canvas = document.getElementById(canvasId);
        this.ctx = this.canvas.getContext('2d');
        this.blocks = [];
        this.currentY = 0;
        this.zoom = 15; // pixels per block
        this.offsetX = 0;
        this.offsetY = 0;
        
        this.resize();
        window.addEventListener('resize', () => this.resize());
        
        // Panning logic
        let isDragging = false;
        let lastX, lastY;
        
        this.canvas.addEventListener('mousedown', (e) => {
            isDragging = true;
            lastX = e.clientX;
            lastY = e.clientY;
        });
        
        window.addEventListener('mouseup', () => isDragging = false);
        window.addEventListener('mousemove', (e) => {
            if (isDragging) {
                this.offsetX += e.clientX - lastX;
                this.offsetY += e.clientY - lastY;
                lastX = e.clientX;
                lastY = e.clientY;
                this.render();
            }
            this.updateHover(e);
        });
        
        // Zooming logic
        this.canvas.addEventListener('wheel', (e) => {
            e.preventDefault();
            const delta = e.deltaY > 0 ? -1 : 1;
            this.zoom = Math.max(2, Math.min(100, this.zoom + delta * 2));
            this.render();
        });
    }

    resize() {
        const parent = this.canvas.parentElement;
        this.canvas.width = parent.clientWidth;
        this.canvas.height = parent.clientHeight;
        this.render();
    }

    setData(blocks, currentY) {
        this.blocks = blocks;
        this.setLayer(currentY);
        // Recenter
        this.offsetX = 0;
        this.offsetY = 0;
        this.render();
    }

    setLayer(y) {
        this.currentY = y;
        this.render();
    }

    updateHover(e) {
        const rect = this.canvas.getBoundingClientRect();
        const mouseX = e.clientX - rect.left;
        const mouseY = e.clientY - rect.top;
        
        const centerX = this.canvas.width / 2 + this.offsetX;
        const centerY = this.canvas.height / 2 + this.offsetY;
        
        const gridX = Math.round((mouseX - centerX) / this.zoom);
        const gridZ = Math.round((mouseY - centerY) / this.zoom);
        
        document.getElementById('hover-info').innerText = `X: ${gridX}, Z: ${gridZ}, Y: ${this.currentY}`;
    }

    render() {
        const ctx = this.ctx;
        const width = this.canvas.width;
        const height = this.canvas.height;
        
        ctx.clearRect(0, 0, width, height);
        
        const centerX = width / 2 + this.offsetX;
        const centerY = height / 2 + this.offsetY;
        
        // Draw grid
        ctx.strokeStyle = '#333';
        ctx.lineWidth = 1;
        
        const startX = Math.floor(-centerX / this.zoom);
        const endX = Math.ceil((width - centerX) / this.zoom);
        const startZ = Math.floor(-centerY / this.zoom);
        const endZ = Math.ceil((height - centerY) / this.zoom);

        ctx.beginPath();
        for (let x = startX; x <= endX; x++) {
            const px = centerX + x * this.zoom;
            ctx.moveTo(px, 0);
            ctx.lineTo(px, height);
        }
        for (let z = startZ; z <= endZ; z++) {
            const py = centerY + z * this.zoom;
            ctx.moveTo(0, py);
            ctx.lineTo(width, py);
        }
        ctx.stroke();

        // Draw axes
        ctx.strokeStyle = '#555';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(centerX, 0); ctx.lineTo(centerX, height);
        ctx.moveTo(0, centerY); ctx.lineTo(width, centerY);
        ctx.stroke();

        // Draw blocks for current layer
        const blocksInLayer = this.blocks.filter(b => b.y === this.currentY);
        
        // Basic color map for block types
        const colorMap = {
            'stone': '#888',
            'cobblestone': '#777',
            'stone_bricks': '#999',
            'mossy_cobblestone': '#676',
            'dirt': '#863',
            'grass_block': '#5a3',
            'sand': '#db5',
            'oak_planks': '#a85',
            'spruce_planks': '#642',
            'birch_planks': '#dc9',
            'bricks': '#a54',
            'deepslate': '#333',
            'polished_andesite': '#aaa',
            'quartz_block': '#eee',
            'glass': '#add8e6',
            'water': '#36f',
            'leaves': '#282'
        };

        ctx.strokeStyle = '#fff';
        ctx.lineWidth = 1;

        for (const block of blocksInLayer) {
            const px = centerX + block.x * this.zoom - this.zoom / 2;
            const py = centerY + block.z * this.zoom - this.zoom / 2;
            
            ctx.fillStyle = colorMap[block.type] || '#007acc';
            ctx.fillRect(px, py, this.zoom, this.zoom);
            ctx.strokeRect(px, py, this.zoom, this.zoom);
        }
    }
}