export class ProceduralTower {
    constructor(params) {
        this.radius = params.radius || 8;
        
        // 5) PROPORTIONS: Automatic correction
        this.height = params.height || 15;
        if (this.height < this.radius * 3) {
            this.height = this.radius * 3;
        }

        this.wallThickness = params.wallThickness || 1;
        this.materialWall = params.materialWall || 'wall';
        this.materialTop = params.materialTop || 'top';
        this.materialRoof = params.materialRoof || 'roof';
        this.hasRoof = params.hasRoof !== undefined ? params.hasRoof : false; 
        
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
        
        const r = Math.round(this.radius);
        const h = Math.round(this.height);
        const thickness = Math.max(1, Math.round(this.wallThickness));
        
        const isInRing = (x, z, outerR, innerR) => {
            const dist = Math.sqrt(x * x + z * z);
            return dist <= outerR + 0.5 && dist > innerR + 0.5;
        };

        // Returns smoothly tapering radius based on height
        const getRadiusAt = (y, maxH, baseR) => {
            const p = y / maxH;
            if (p < 0.40) return baseR;
            if (p < 0.50) { // Smooth transition R -> R-1
                const t = (p - 0.40) / 0.10;
                return baseR - t;
            }
            if (p < 0.80) return baseR - 1;
            if (p < 0.90) { // Smooth transition R-1 -> R-2
                const t = (p - 0.80) / 0.10;
                return baseR - 1 - t;
            }
            return Math.max(1, baseR - 2);
        };

        const shaftTopY = h - 2; 

        // =====================================
        // 1) BASE
        // =====================================
        // Massive plinth (height = 2, radius = r + 2)
        for (let y = 0; y < 2; y++) {
            for (let x = -r - 3; x <= r + 3; x++) {
                for (let z = -r - 3; z <= r + 3; z++) {
                    if (isInRing(x, z, r + 2, r - thickness - 1)) {
                        this.addBlock(x, y, z, this.materialWall);
                    }
                }
            }
        }

        // =====================================
        // 2) SHAFT AND TAPERING
        // =====================================
        const ringLevels = [
            Math.floor(shaftTopY * 0.30),
            Math.floor(shaftTopY * 0.55),
            Math.floor(shaftTopY * 0.75)
        ];

        for (let y = 2; y < shaftTopY; y++) {
            const currentR = getRadiusAt(y, shaftTopY, r);
            const isRing = ringLevels.includes(y);
            
            for (let x = -r - 2; x <= r + 2; x++) {
                for (let z = -r - 2; z <= r + 2; z++) {
                    
                    // Thin dividing ring (only 3-4 times per tower)
                    if (isRing && isInRing(x, z, currentR + 1, currentR)) {
                        this.addBlock(x, y, z, this.materialWall);
                    }
                    // Standard wall
                    else if (isInRing(x, z, currentR, currentR - thickness)) {
                        this.addBlock(x, y, z, this.materialWall);
                        
                        // Vertical ribs every 90 degrees
                        if (x === 0 || z === 0) {
                            if (isInRing(x, z, currentR, currentR - 1)) {
                                if (x === 0) {
                                    this.addBlock(0, y, z > 0 ? z + 1 : z - 1, this.materialWall);
                                } else if (z === 0) {
                                    this.addBlock(x > 0 ? x + 1 : x - 1, y, 0, this.materialWall);
                                }
                            }
                        }
                    }
                }
            }
        }

        // =====================================
        // SHAFT WINDOWS
        // =====================================
        // Arranged alternately on 3 levels
        const windowLevels = [
            Math.floor(shaftTopY * 0.40),
            Math.floor(shaftTopY * 0.60),
            Math.floor(shaftTopY * 0.80)
        ];
        
        for (let i = 0; i < windowLevels.length; i++) {
            const y = windowLevels[i];
            const isDiagonal = (i % 2 !== 0);
            const currentR = Math.round(getRadiusAt(y, shaftTopY, r));
            
            for (let d = 0; d <= r + 2; d++) {
                if (d > currentR - thickness - 2) {
                    if (isDiagonal) {
                        const offset = Math.round(d * 0.7071); 
                        for (let wy = 0; wy < 2; wy++) { // Window height 2
                            this.removeBlock(offset, y + wy, offset);
                            this.removeBlock(-offset, y + wy, offset);
                            this.removeBlock(offset, y + wy, -offset);
                            this.removeBlock(-offset, y + wy, -offset);
                        }
                    } else {
                        for (let wy = 0; wy < 2; wy++) { // Window height 2
                            this.removeBlock(0, y + wy, -d);
                            this.removeBlock(0, y + wy, d);
                            this.removeBlock(-d, y + wy, 0);
                            this.removeBlock(d, y + wy, 0);
                        }
                    }
                }
            }
        }

        // Door at level 2
        for (let y = 2; y < 5; y++) { 
            for (let z = -r - 3; z <= 0; z++) {
                this.removeBlock(0, y, z);
            }
        }
        // Remove base blocks for entrance
        for (let y = 0; y < 2; y++) {
            for (let z = -r - 3; z <= -r; z++) {
                this.removeBlock(0, y, z);
                this.removeBlock(-1, y, z);
                this.removeBlock(1, y, z);
            }
        }

        // =====================================
        // 3) MACHICOLATIONS (DEFENSIVE BALCONY)
        // =====================================
        const topR = Math.round(getRadiusAt(shaftTopY, shaftTopY, r)); 
        const machicolationY1 = shaftTopY;
        const machicolationOuterR = topR + 2; // protrudes 2 blocks
        const machicolationCircumference = 2 * Math.PI * machicolationOuterR;
        const machicolationSegments = Math.max(16, Math.round(machicolationCircumference / 2) * 2);

        for (let x = -machicolationOuterR - 1; x <= machicolationOuterR + 1; x++) {
            for (let z = -machicolationOuterR - 1; z <= machicolationOuterR + 1; z++) {
                // Support wall
                if (isInRing(x, z, topR, topR - thickness)) {
                    this.addBlock(x, machicolationY1, z, this.materialTop);
                }
                
                // Overhanging balcony
                if (isInRing(x, z, machicolationOuterR, topR)) {
                    const angle = Math.atan2(z, x);
                    const normalizedAngle = (angle + Math.PI) / (Math.PI * 2);
                    const segment = Math.floor(normalizedAngle * machicolationSegments);
                    
                    // Every second block is a murder hole in the balcony floor
                    if (segment % 2 === 0) {
                        this.addBlock(x, machicolationY1, z, this.materialTop);
                    }
                }
            }
        }

        const machicolationY2 = shaftTopY + 1;
        for (let x = -machicolationOuterR - 1; x <= machicolationOuterR + 1; x++) {
            for (let z = -machicolationOuterR - 1; z <= machicolationOuterR + 1; z++) {
                if (isInRing(x, z, machicolationOuterR, topR - thickness)) {
                    this.addBlock(x, machicolationY2, z, this.materialTop);
                }
            }
        }

        // Internal platform on the balcony
        for (let x = -topR - 1; x <= topR + 1; x++) {
            for (let z = -topR - 1; z <= topR + 1; z++) {
                const dist = Math.sqrt(x * x + z * z);
                if (dist <= topR + 0.5) {
                    this.addBlock(x, machicolationY2, z, this.materialWall);
                }
            }
        }

        // =====================================
        // 4) CROWN
        // =====================================
        const crownY = h;
        const crownOuterR = machicolationOuterR;
        
        // Inner parapet
        for (let x = -crownOuterR - 1; x <= crownOuterR + 1; x++) {
            for (let z = -crownOuterR - 1; z <= crownOuterR + 1; z++) {
                if (isInRing(x, z, crownOuterR - 1, topR)) {
                    this.addBlock(x, crownY, z, this.materialTop);
                }
            }
        }

        // Battlements (2 full / 1 gap)
        const crownCircumference = 2 * Math.PI * crownOuterR;
        const blockPatternLength = 3;
        const crownSegments = Math.max(12, Math.round(crownCircumference / blockPatternLength) * blockPatternLength); 
        
        for (let x = -crownOuterR - 1; x <= crownOuterR + 1; x++) {
            for (let z = -crownOuterR - 1; z <= crownOuterR + 1; z++) {
                if (isInRing(x, z, crownOuterR, crownOuterR - 1)) {
                     const angle = Math.atan2(z, x);
                     const normalizedAngle = (angle + Math.PI) / (Math.PI * 2);
                     const segment = Math.floor(normalizedAngle * crownSegments);
                     
                     if (segment % 3 !== 2) {
                         this.addBlock(x, crownY, z, this.materialTop);
                         this.addBlock(x, crownY + 1, z, this.materialTop);
                     }
                }
            }
        }

        // =====================================
        // 5) CONICAL ROOF (OPTIONAL)
        // =====================================
        if (this.hasRoof) {
            const roofStartY = crownY;
            const roofH = Math.max(r, Math.round(r * 1.2));
            // Roof overhangs crown by 1
            const roofBaseRadius = crownOuterR + 1;
            
            for (let ry = 0; ry <= roofH; ry++) {
                const currentY = roofStartY + ry;
                const progress = ry / roofH;
                const currentRoofRadius = roofBaseRadius * (1 - progress);
                
                // Spire
                if (currentRoofRadius < 0.5) {
                    this.addBlock(0, currentY, 0, this.materialRoof || this.materialTop);
                    this.addBlock(0, currentY + 1, 0, this.materialRoof || this.materialTop);
                    break;
                }
                
                // Filled roof circle
                const crInt = Math.ceil(currentRoofRadius);
                for (let x = -crInt - 1; x <= crInt + 1; x++) {
                    for (let z = -crInt - 1; z <= crInt + 1; z++) {
                        const dist = Math.sqrt(x * x + z * z);
                        if (dist <= currentRoofRadius + 0.5) {
                            this.addBlock(x, currentY, z, this.materialRoof || this.materialTop);
                        }
                    }
                }
            }
        }

        return Array.from(this.blocks.values());
    }
}