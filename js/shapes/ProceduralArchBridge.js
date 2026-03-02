export class ProceduralArchBridge {
    constructor(params) {
        this.span = params.span || 60; // Increased span for multiple arches
        this.width = params.width || 7;
        this.thickness = params.thickness || 3;
        
        // New parameters for segmented version
        this.segments = params.segments || 3;
        this.curveAmount = params.curveAmount || 0.5; // 0 to 0.7
        this.hasGate = params.hasGate !== undefined ? params.hasGate : 1;
        
        this.materialMain = params.materialMain || 'stone_bricks';
        this.materialDetail = params.materialDetail || 'stone';
        
        this.blocks = new Map();
        this.is3D = true;
    }

    hash(x, y, z) {
        let h = Math.imul(x ^ (y << 1), 0x9E3779B9);
        h = Math.imul(h ^ (z >> 1), 0x2545F491);
        h = Math.imul(h ^ (h >> 16), 0x85EBCA6B);
        h ^= h >> 13;
        return (h >>> 0) / 4294967296;
    }

    addBlock(x, y, z, type) {
        const ix = Math.round(x);
        const iy = Math.round(y);
        const iz = Math.round(z);
        const key = `${ix},${iy},${iz}`;
        if (!this.blocks.has(key)) {
            this.blocks.set(key, { x: ix, y: iy, z: iz, type });
        }
    }

    removeBlock(x, y, z) {
        const ix = Math.round(x);
        const iy = Math.round(y);
        const iz = Math.round(z);
        const key = `${ix},${iy},${iz}`;
        this.blocks.delete(key);
    }

    getBlockType(x, y, z, baseType, maxY) {
        if (baseType !== this.materialMain && baseType !== this.materialDetail) {
            return baseType;
        }
        
        const rand = this.hash(x, y, z);
        
        const isBottom40 = y < (maxY * 0.4);
        if (isBottom40) {
            if (rand < 0.05) return 'mossy_stone_bricks';
            if (rand < 0.10) return 'cracked_stone_bricks';
        }
        
        if (rand > 0.85) return 'stone';
        if (rand > 0.75) return 'cobblestone';
        
        return baseType;
    }

    getBlocks() {
        return this.generate();
    }

    generate() {
        this.blocks.clear();

        // 5) PROPORTIONS AND PARAMETERS
        let s = Math.round(this.span);
        if (s % 2 !== 0) s += 1;
        
        let w = Math.round(this.width);
        if (w < 5) w = 5;
        
        let segs = Math.max(1, Math.round(this.segments));
        let curve = Math.max(0, Math.min(0.7, this.curveAmount));

        const halfS = s / 2;
        const halfW = Math.floor(w / 2);
        const maxCurveZ = w * 1.5;
        
        const segmentLength = s / segs;
        const ah = Math.max(3, Math.round(segmentLength / 4));
        const ph = Math.max(0, Math.round(s / 6)); // Pillar base
        let thick = Math.max(2, Math.round(this.thickness));

        const platformBaseY = ph + ah; 
        const maxStructureY = platformBaseY + 10; 

        const addB = (x, y, z, type) => {
            const finalType = this.getBlockType(x, y, z, type, maxStructureY);
            this.addBlock(x, y, z, finalType);
        };

        // 2) GENTLE CURVE (Z-axis curvature)
        const getCurveZ = (x) => {
            // normalized progress from 0 to 1
            const progress = (x + halfS) / s;
            return Math.sin(progress * Math.PI) * curve * maxCurveZ;
        };

        // Function calculating arch Y within a given segment
        const getSegmentArchY = (x) => {
            // Find which segment we are in (index from 0 to segs-1)
            let segIndex = Math.floor((x + halfS) / segmentLength);
            // Protection against index overflow at x = halfS
            if (segIndex >= segs) segIndex = segs - 1;
            
            // Middle of this segment
            const segMidX = -halfS + (segIndex + 0.5) * segmentLength;
            // Local X relative to segment middle
            const localX = x - segMidX;
            const halfSegL = segmentLength / 2;
            
            // Parabola for this segment: y = a(x^2) + archHeight
            const a = -ah / (halfSegL * halfSegL);
            return a * (localX * localX) + ah;
        };

        // =====================================
        // 1) MAIN SUPPORT ARCHES AND SECONDARY HOLES (Multi-segmented)
        // =====================================
        for (let x = -halfS; x <= halfS; x++) {
            const parabolaY = getSegmentArchY(x);
            const topArchY = Math.round(ph + parabolaY);
            
            const prevParabolaY = x > -halfS ? getSegmentArchY(x - 1) : parabolaY;
            const prevArchY = Math.round(ph + prevParabolaY);
            
            const maxConnectY = Math.max(topArchY, prevArchY);
            const minConnectY = Math.min(topArchY, prevArchY);
            
            // Z Offset
            const curveOffsetZ = Math.round(getCurveZ(x));
            
            // Upper part narrower by 1 block for lighter proportions
            const currentHalfW = Math.max(2, halfW - (parabolaY > ah * 0.8 ? 1 : 0));

            for (let localZ = -currentHalfW - 1; localZ <= currentHalfW + 1; localZ++) {
                const isEdge = (localZ === -currentHalfW - 1 || localZ === currentHalfW + 1);
                const absoluteZ = localZ + curveOffsetZ;
                
                // Two-layer Roman style
                if (isEdge) {
                    for (let y = minConnectY - thick - 1; y <= maxConnectY; y++) {
                        if (y >= ph - 2) {
                            addB(x, y, absoluteZ, this.materialDetail);
                        }
                    }
                } else {
                    for (let y = minConnectY - thick; y <= maxConnectY; y++) {
                        if (y >= ph) {
                            addB(x, y, absoluteZ, this.materialMain);
                        }
                    }
                }
            }
            
            // --- Relief holes and Platform along the arch ---
            // Relief arches can be inserted in the widest parts of the segment (at pillars)
            let isHole = false;
            let segIndex = Math.floor((x + halfS) / segmentLength);
            if (segIndex >= segs) segIndex = segs - 1;
            const segMidX = -halfS + (segIndex + 0.5) * segmentLength;
            const localX = x - segMidX;
            const halfSegL = segmentLength / 2;
            
            // Small relief holes at 2/3 of segment half-length
            const secArchCenterLocal = halfSegL * 0.75;
            const secArchRadius = Math.floor(halfSegL * 0.15); 
            
            const checkSecondaryArch = (center) => {
                const dx = Math.abs(localX - center);
                if (dx <= secArchRadius) {
                    const coeff = -secArchRadius / (secArchRadius * secArchRadius);
                    const sy = coeff * (dx * dx) + secArchRadius;
                    if (topArchY > ph && topArchY < platformBaseY - sy) return true;
                }
                return false;
            };

            if (checkSecondaryArch(-secArchCenterLocal)) isHole = true;
            if (checkSecondaryArch(secArchCenterLocal)) isHole = true;

            const archBaseY = topArchY;
            const hump = Math.round(Math.cos(((x + halfS)/s - 0.5) * Math.PI) * 1.0);
            const ySurface = platformBaseY + hump;

            // Fill between arch and platform
            for (let y = archBaseY + 1; y <= ySurface - 1; y++) {
                if (isHole && y < ySurface - 2) continue;
                for (let localZ = -halfW; localZ <= halfW; localZ++) {
                    addB(x, y, localZ + curveOffsetZ, this.materialMain);
                }
            }

            // Platform (Curved floor)
            for (let localZ = -halfW; localZ <= halfW; localZ++) {
                addB(x, ySurface, localZ + curveOffsetZ, this.materialMain);
            }
            
            // Cornice
            addB(x, ySurface, -halfW - 1 + curveOffsetZ, this.materialDetail);
            addB(x, ySurface, halfW + 1 + curveOffsetZ, this.materialDetail);

            // RAILINGS along the curve
            const wallY = ySurface + 1;
            for (let side of [-1, 1]) {
                const zEdge = side * halfW + curveOffsetZ;
                
                // Defensive wall 3 blocks high
                for (let wy = 0; wy < 3; wy++) {
                    addB(x, wallY + wy, zEdge, this.materialMain);
                }
                
                // Narrow arrow slit every 6 blocks
                if (Math.abs(x) % 6 === 3) {
                    this.removeBlock(x, wallY + 1, zEdge);
                    this.removeBlock(x, wallY + 2, zEdge);
                }
                
                // Small protruding pillar every 10 blocks
                if (Math.abs(x) % 10 === 0) {
                    const pillarZ = zEdge + side; // External projection
                    for (let wy = -1; wy <= 3; wy++) {
                        addB(x, wallY + wy, pillarZ, this.materialDetail);
                    }
                    addB(x, wallY + 4, pillarZ, this.materialDetail);
                    addB(x, wallY + 4, zEdge, this.materialDetail);
                }
            }
            
            // Fix arrow slit removal in pillar if collision occurred
            if (Math.abs(x) % 6 === 3) {
                this.blocks.delete(`${Math.round(x)},${Math.round(wallY + 1)},${Math.round(-halfW + curveOffsetZ)}`);
                this.blocks.delete(`${Math.round(x)},${Math.round(wallY + 1)},${Math.round(halfW + curveOffsetZ)}`);
            }
        }

        // =====================================
        // 3) PILLARS UNDER SEGMENTS
        // =====================================
        // Each segment has a pillar at its ends: i=0...segs
        for (let i = 0; i <= segs; i++) {
            const px = -halfS + i * segmentLength;
            // Skip edge boundaries (stairs are there)
            if (i === 0 || i === segs) continue;
            
            const pxR = Math.round(px);
            const curveOffsetZ = Math.round(getCurveZ(pxR));
            const archYAtPillar = Math.round(ph + getSegmentArchY(pxR));
            const pWidth = halfW;

            for (let y = -2; y <= archYAtPillar; y++) {
                // Upward tapering profile
                let expandBase = 0;
                if (y < ph * 0.1) expandBase = 2; // Very thick at bottom
                else if (y < ph * 0.4) expandBase = 1;

                for (let x = pxR - 2 - expandBase; x <= pxR + 2 + expandBase; x++) {
                    for (let localZ = -pWidth - 1 - expandBase; localZ <= pWidth + 1 + expandBase; localZ++) {
                        addB(x, y, localZ + curveOffsetZ, this.materialMain);
                    }
                }

                // Water breakers (sharp wedges underwater) and buttresses - pointed at Z axis edges
                if (y < ph * 0.5) {
                    const wedgeLen = Math.max(0, Math.floor(5 - (y / (ph * 0.5)) * 5));
                    if (wedgeLen > 0) {
                        for (let lz = pWidth; lz <= pWidth + wedgeLen; lz++) {
                            const wx = Math.floor(1.5 - (lz - pWidth) / wedgeLen);
                            for (let x = pxR - wx; x <= pxR + wx; x++) {
                                addB(x, y, lz + curveOffsetZ, this.materialDetail);
                                addB(x, y, -lz + curveOffsetZ, this.materialDetail);
                            }
                        }
                    }
                }
            }
        }

        // =====================================
        // 6) LIGHTER STAIRS CONSTRUCTION
        // =====================================
        const endPlatformY = platformBaseY + Math.round(Math.cos(0.5 * Math.PI) * 1.0);
        
        for (let i = 1; i <= endPlatformY + 2; i++) {
            const leftX = -halfS - i;
            const rightX = halfS + i;
            const stepY = endPlatformY - i;
            
            if (stepY < -2) break;
            
            const curveOffsetLeft = Math.round(getCurveZ(leftX));
            const curveOffsetRight = Math.round(getCurveZ(rightX));

            // Under each step, only descend 2 blocks to create a lightweight structure
            for (let localZ = -halfW; localZ <= halfW; localZ++) {
                for (let y = stepY - 2; y <= stepY; y++) {
                    addB(leftX, y, localZ + curveOffsetLeft, this.materialMain);
                    addB(rightX, y, localZ + curveOffsetRight, this.materialMain);
                }
            }
            
            // Side shielding walls - 1 block thick to the bottom
            for (let y = -2; y <= stepY + 3; y++) {
                addB(leftX, y, -halfW - 1 + curveOffsetLeft, this.materialMain);
                addB(leftX, y, halfW + 1 + curveOffsetLeft, this.materialMain);
                addB(rightX, y, -halfW - 1 + curveOffsetRight, this.materialMain);
                addB(rightX, y, halfW + 1 + curveOffsetRight, this.materialMain);
            }
            
            // Side wall cornice
            addB(leftX, stepY + 4, -halfW - 1 + curveOffsetLeft, this.materialDetail);
            addB(leftX, stepY + 4, halfW + 1 + curveOffsetLeft, this.materialDetail);
            addB(rightX, stepY + 4, -halfW - 1 + curveOffsetRight, this.materialDetail);
            addB(rightX, stepY + 4, halfW + 1 + curveOffsetRight, this.materialDetail);
        }

        // =====================================
        // 7) CENTRAL GATE TOWER IN CURVATURE
        // =====================================
        if (this.hasGate) {
            const gateW = halfW; 
            const gateD = 2; 
            const gateH = 6; 
            const ySurfaceCenter = platformBaseY + Math.round(Math.cos(0) * 1.0) + 1;
            
            // Tower stands at x=0. Calculate center offset.
            const centerCurveOffsetZ = Math.round(getCurveZ(0));
            
            for (let x = -gateD; x <= gateD; x++) {
                // Gentle gate bend to match platform at this X fraction
                const localCurveZ = Math.round(getCurveZ(x));
                
                for (let localZ = -gateW - 1; localZ <= gateW + 1; localZ++) {
                    const absoluteZ = localZ + localCurveZ;
                    for (let y = ySurfaceCenter; y <= ySurfaceCenter + gateH; y++) {
                        
                        const isPassage = Math.abs(localZ) < gateW;
                        const passageArchY = ySurfaceCenter + 4 - Math.abs(x) * 0.8; 
                        
                        if (isPassage && y < passageArchY) {
                            this.removeBlock(x, y, absoluteZ);
                        } else {
                            addB(x, y, absoluteZ, this.materialMain);
                        }
                    }
                }
            }
            
            // Gate crowning with respect to exact middle
            const topY = ySurfaceCenter + gateH;
            for (let x = -gateD - 1; x <= gateD + 1; x++) {
                const localCurveZ = Math.round(getCurveZ(x));
                for (let localZ = -gateW - 2; localZ <= gateW + 2; localZ++) {
                    const absoluteZ = localZ + localCurveZ;
                    addB(x, topY, absoluteZ, this.materialDetail);
                    
                    if (x === -gateD - 1 || x === gateD + 1 || localZ === -gateW - 2 || localZ === gateW + 2) {
                        const dist = Math.abs(x) + Math.abs(localZ);
                        if (dist % 3 !== 2) {
                            addB(x, topY + 1, absoluteZ, this.materialDetail);
                            addB(x, topY + 2, absoluteZ, this.materialDetail);
                        }
                    }
                }
            }
        } else {
            // Lanterns
            const placeLantern = (lx, ly, lz) => {
                addB(lx, ly, lz, this.materialDetail); 
                addB(lx, ly + 1, lz, this.materialDetail); 
                this.addBlock(lx, ly + 2, lz, 'glass'); 
                addB(lx, ly + 3, lz, this.materialDetail); 
            };
            const lampYCenter = platformBaseY + 1;
            const cZ = Math.round(getCurveZ(0));
            placeLantern(0, lampYCenter + 1, -halfW + cZ);
            placeLantern(0, lampYCenter + 1, halfW + cZ);
        }

        return Array.from(this.blocks.values());
    }
}