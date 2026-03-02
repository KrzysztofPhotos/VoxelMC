export class ProceduralHouse {
    constructor(params) {
        this.width = params.width || 11;
        this.depth = params.depth || 11;
        this.height = params.height || 5;
        this.roofHeight = params.roofHeight || 5;
        this.materialWall = params.materialWall || 'wall';
        this.materialRoof = params.materialRoof || 'roof';
        this.materialFloor = params.materialFloor || 'floor';
        
        this.blocks = new Map();
        this.is3D = true;
    }

    addBlock(x, y, z, type) {
        const ix = Math.round(x);
        const iy = Math.round(y);
        const iz = Math.round(z);
        const key = `${ix},${iy},${iz}`;
        this.blocks.set(key, { x: ix, y: iy, z: iz, type });
    }

    removeBlock(x, y, z) {
        const ix = Math.round(x);
        const iy = Math.round(y);
        const iz = Math.round(z);
        const key = `${ix},${iy},${iz}`;
        this.blocks.delete(key);
    }

    getBlocks() {
        return this.generate();
    }

    generate() {
        this.blocks.clear();

        // 7) Centering and symmetry - symmetric coordinates from -halfW to halfW
        // Center always exactly at (0,0)
        const halfW = Math.floor(this.width / 2);
        const halfD = Math.floor(this.depth / 2);
        
        // 1) Foundation
        for (let x = -halfW; x <= halfW; x++) {
            for (let z = -halfD; z <= halfD; z++) {
                this.addBlock(x, 0, z, this.materialFloor);
            }
        }

        // 2) Walls (hollow) - outer only
        for (let y = 1; y <= this.height; y++) {
            // Front and Back
            for (let x = -halfW; x <= halfW; x++) {
                this.addBlock(x, y, -halfD, this.materialWall);
                this.addBlock(x, y, halfD, this.materialWall);
            }
            // Left and Right (no corners, no duplicates)
            for (let z = -halfD + 1; z <= halfD - 1; z++) {
                this.addBlock(-halfW, y, z, this.materialWall);
                this.addBlock(halfW, y, z, this.materialWall);
            }
        }

        // 3) Roof proportions and safety
        let maxRoofHeight = Math.floor(this.width / 2);
        if (this.roofHeight > maxRoofHeight) {
            this.roofHeight = maxRoofHeight;
        }
        if (this.roofHeight > this.height) {
            this.roofHeight = Math.floor(this.height * 0.8);
            if (this.roofHeight > maxRoofHeight) {
                this.roofHeight = maxRoofHeight;
            }
        }
        if (this.roofHeight < 1) this.roofHeight = 1;

        // 3) Gabled roof
        // Overhang starts 1 block outside the walls
        let prevLeft = -halfW - 2;
        let prevRight = halfW + 2;

        for (let ry = 0; ry <= this.roofHeight; ry++) {
            let y = this.height + ry;
            let progress = ry / this.roofHeight;
            
            // Guarantee no vertical walls and flat blocks
            // Linear interpolation ensures roof meets perfectly at x=0 (ridge)
            let currentLeft = Math.round((-halfW - 1) * (1 - progress));
            let currentRight = Math.round((halfW + 1) * (1 - progress));
            
            for (let z = -halfD; z <= halfD; z++) {
                // Fill any "gaps" in roof slope by drawing continuous segments (slope rasterization)
                for (let x = prevLeft + 1; x <= currentLeft; x++) {
                    this.addBlock(x, y, z, this.materialRoof);
                }
                for (let x = currentRight; x <= prevRight - 1; x++) {
                    this.addBlock(x, y, z, this.materialRoof);
                }
            }
            
            prevLeft = currentLeft;
            prevRight = currentRight;
        }

        // 4) Door
        // Exactly in the middle (x=0), cut from existing front wall
        if (halfW >= 1) { // Don't remove if it's extreme corner (min body width is 3)
            this.removeBlock(0, 1, -halfD);
            if (this.height >= 2) {
                this.removeBlock(0, 2, -halfD);
            }
        }

        // 5) Windows
        // Size 1x1, at half wall height
        if (halfD >= 1 && this.height >= 2) {
            let winY = Math.max(1, Math.floor(this.height / 2));
            this.removeBlock(-halfW, winY, 0); // Left window
            this.removeBlock(halfW, winY, 0);  // Right window
        }

        return Array.from(this.blocks.values());
    }
}