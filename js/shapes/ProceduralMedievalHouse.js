export class ProceduralMedievalHouse {
    constructor(params) {
        this.width = params.width || 11;
        this.depth = params.depth || 11;
        this.wallHeight = params.wallHeight || 6;
        this.roofHeight = params.roofHeight || 5;
        this.overhang = params.overhang || 1;
        this.timberFrame = params.timberFrame !== undefined ? params.timberFrame : true;
        this.chimney = params.chimney !== undefined ? params.chimney : true;
        this.foundationHeight = params.foundationHeight || 1;
        this.windowCount = params.windowCount || 4;

        this.blocks = new Map();
        this.is3D = true;
    }

    addBlock(x, y, z, type) {
        const key = `${Math.round(x)},${Math.round(y)},${Math.round(z)}`;
        this.blocks.set(key, { x: Math.round(x), y: Math.round(y), z: Math.round(z), type });
    }

    removeBlock(x, y, z) {
        const key = `${Math.round(x)},${Math.round(y)},${Math.round(z)}`;
        this.blocks.delete(key);
    }

    getBlocks() {
        return this.generate();
    }

    generate() {
        this.blocks.clear();

        const halfW = Math.floor(this.width / 2);
        const halfD = Math.floor(this.depth / 2);

        // Materials
        const foundationMat = 'cobblestone';
        const wallBottomMat = 'stone_bricks';
        const wallTopMat = 'quartz_block';
        const frameMat = 'spruce_planks';
        const roofMat = 'deepslate';
        const roofRidgeMat = 'polished_andesite';
        const chimneyMat = 'bricks';
        const glassMat = 'glass';

        // 1. FOUNDATION
        const fHeight = Math.max(1, this.foundationHeight);
        for (let y = 0; y < fHeight; y++) {
            for (let x = -halfW - 1; x <= halfW + 1; x++) {
                for (let z = -halfD - 1; z <= halfD + 1; z++) {
                    this.addBlock(x, y, z, foundationMat);
                }
            }
        }

        // 2. WALLS
        const startY = fHeight;
        const bHeight = Math.max(1, Math.floor(this.wallHeight / 2));

        for (let y = startY; y < startY + this.wallHeight; y++) {
            const isBottom = (y - startY) < bHeight;
            const isTopLevel = (y === startY + this.wallHeight - 1);

            for (let x = -halfW; x <= halfW; x++) {
                for (let z = -halfD; z <= halfD; z++) {
                    // Only outer walls
                    if (x === -halfW || x === halfW || z === -halfD || z === halfD) {
                        let mat = isBottom ? wallBottomMat : wallTopMat;

                        // Timber frame
                        if (this.timberFrame && !isBottom) {
                            // Corners
                            if (Math.abs(x) === halfW && Math.abs(z) === halfD) {
                                mat = frameMat;
                            } else {
                                // Vertical pillars every 3 blocks
                                if ((z === -halfD || z === halfD) && Math.abs(x) % 3 === 0) mat = frameMat;
                                if ((x === -halfW || x === halfW) && Math.abs(z) % 3 === 0) mat = frameMat;
                            }
                        }

                        // Horizontal reinforcements
                        if (this.timberFrame && (y === startY + bHeight || isTopLevel)) {
                            mat = frameMat;
                        }

                        this.addBlock(x, y, z, mat);
                    }
                }
            }
        }

        // DECORATIVE BEAMS (Protruding corners)
        if (this.timberFrame) {
            for (let y = startY; y < startY + this.wallHeight; y++) {
                this.addBlock(-halfW - 1, y, -halfD - 1, frameMat);
                this.addBlock(halfW + 1, y, -halfD - 1, frameMat);
                this.addBlock(-halfW - 1, y, halfD + 1, frameMat);
                this.addBlock(halfW + 1, y, halfD + 1, frameMat);
            }
        }

        // 3. ROOF (Gabled)
        const roofStartY = startY + this.wallHeight;
        const oH = Math.max(0, this.overhang);

        for (let ry = 0; ry <= this.roofHeight; ry++) {
            let currentHalfW = halfW + oH - ry; 
            if (currentHalfW < 0) continue;

            let y1 = roofStartY + ry;
            let y2 = roofStartY + ry + 1;

            for (let z = -halfD - oH; z <= halfD + oH; z++) {
                let mat = (z === -halfD - oH || z === halfD + oH) ? frameMat : roofMat;

                this.addBlock(-currentHalfW, y1, z, mat);
                this.addBlock(-currentHalfW, y2, z, mat);
                this.addBlock(currentHalfW, y1, z, mat);
                this.addBlock(currentHalfW, y2, z, mat);
            }
        }
        
        // Wall triangles (Gables)
        for (let ry = 0; ry < this.roofHeight; ry++) {
            let fillW = halfW - 1 - ry;
            if (fillW < 0) break;
            let y = roofStartY + ry;
            for (let x = -fillW; x <= fillW; x++) {
                this.addBlock(x, y, -halfD, wallTopMat);
                this.addBlock(x, y, halfD, wallTopMat);
            }
        }
        
        // Ridge beam
        const ridgeY = roofStartY + this.roofHeight;
        for (let z = -halfD - oH; z <= halfD + oH; z++) {
            this.addBlock(0, ridgeY + 1, z, roofRidgeMat);
        }

        // 4. CHIMNEY
        if (this.chimney && halfW >= 2 && halfD >= 2) {
            let cx = halfW - 1;
            let cz = halfD - 1;
            for (let cy = startY + bHeight; cy <= ridgeY + 3; cy++) {
                this.addBlock(cx, cy, cz, chimneyMat);
                this.addBlock(cx - 1, cy, cz, chimneyMat);
                this.addBlock(cx, cy, cz - 1, chimneyMat);
                this.addBlock(cx - 1, cy, cz - 1, chimneyMat);
            }
        }

        // 6. DOOR
        if (halfW >= 1) {
            const doorZ = -halfD;
            this.removeBlock(0, startY, doorZ);
            this.removeBlock(0, startY + 1, doorZ);
            this.addBlock(0, startY, doorZ, 'oak_planks');
            this.addBlock(0, startY + 1, doorZ, glassMat);
            this.addBlock(0, startY - 1, doorZ - 1, foundationMat);
            this.addBlock(0, startY + 2, doorZ - 1, frameMat);
        }

        // 5. WINDOWS
        if (this.wallHeight >= 3) {
            const winY = startY + bHeight;
            let currentWindows = 0;

            // Side walls
            if (halfD >= 3 && currentWindows < this.windowCount) {
                this.addBlock(-halfW, winY, 0, glassMat);
                this.addBlock(-halfW, winY + 1, 0, glassMat);
                this.addBlock(-halfW - 1, winY, 0, frameMat);
                currentWindows++;
            }
            if (halfD >= 3 && currentWindows < this.windowCount) {
                this.addBlock(halfW, winY, 0, glassMat);
                this.addBlock(halfW, winY + 1, 0, glassMat);
                this.addBlock(halfW + 1, winY, 0, frameMat);
                currentWindows++;
            }
            
            // Front/Back
            if (halfW >= 3 && currentWindows < this.windowCount) {
                this.addBlock(-halfW + 2, winY, -halfD, glassMat);
                this.addBlock(-halfW + 2, winY + 1, -halfD, glassMat);
                currentWindows++;
            }
            if (halfW >= 3 && currentWindows < this.windowCount) {
                this.addBlock(halfW - 2, winY, -halfD, glassMat);
                this.addBlock(halfW - 2, winY + 1, -halfD, glassMat);
                currentWindows++;
            }
            if (halfW >= 3 && currentWindows < this.windowCount) {
                this.addBlock(-halfW + 2, winY, halfD, glassMat);
                this.addBlock(-halfW + 2, winY + 1, halfD, glassMat);
                currentWindows++;
            }
            if (halfW >= 3 && currentWindows < this.windowCount) {
                this.addBlock(halfW - 2, winY, halfD, glassMat);
                this.addBlock(halfW - 2, winY + 1, halfD, glassMat);
                currentWindows++;
            }
        }

        return Array.from(this.blocks.values());
    }
}