export class ProceduralHelix {
    constructor(params) {
        // Podstawowe
        this.radius = params.radius || 10;
        this.height = params.height || 20;
        this.turns = params.turns || 3;
        this.thickness = params.thickness || 2;
        this.tube = params.tube !== undefined ? params.tube : true;
        this.hollow = params.hollow !== undefined ? params.hollow : true;
        
        // Zaawansowane (ArchitecturalHelix)
        this.doubleHelix = params.doubleHelix !== undefined ? params.doubleHelix : false;
        this.connectorSpacing = params.connectorSpacing || 0; // Wartość z UI np w wielokrotnościach PI (lub stały odstęp). Użyjemy t co np. PI/4 jeśli > 0.
        this.connectorThickness = params.connectorThickness || 1;
        
        this.coreRadius = params.coreRadius || 0;
        
        this.ringSpacing = params.ringSpacing || 0;
        this.ringThickness = params.ringThickness || 1;
        
        this.taper = params.taper || 0; // 0 do 1
        
        this.topPlatform = params.topPlatform !== undefined ? params.topPlatform : false;
        this.platformRadius = params.platformRadius || 15;
        this.platformThickness = params.platformThickness || 1;
        
        // Materiały
        this.materialWall = params.materialWall || 'wall';
        this.materialConnector = params.materialConnector || 'detail';
        this.materialCore = params.materialCore || 'core';
        
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

    // Algorytm Bresenhama w 3D do rysowania linii łączników
    drawLine3D(x0, y0, z0, x1, y1, z1, thickness, material) {
        const dx = Math.abs(x1 - x0);
        const dy = Math.abs(y1 - y0);
        const dz = Math.abs(z1 - z0);
        
        const xs = x0 < x1 ? 1 : -1;
        const ys = y0 < y1 ? 1 : -1;
        const zs = z0 < z1 ? 1 : -1;
        
        let p1, p2;
        let x = x0;
        let y = y0;
        let z = z0;

        const drawThickPoint = (px, py, pz) => {
            if (thickness <= 1) {
                this.addBlock(px, py, pz, material);
            } else {
                for (let tx = -thickness; tx <= thickness; tx++) {
                    for (let ty = -thickness; ty <= thickness; ty++) {
                        for (let tz = -thickness; tz <= thickness; tz++) {
                            if (tx * tx + ty * ty + tz * tz <= thickness * thickness) {
                                this.addBlock(px + tx, py + ty, pz + tz, material);
                            }
                        }
                    }
                }
            }
        };

        if (dx >= dy && dx >= dz) {
            p1 = 2 * dy - dx;
            p2 = 2 * dz - dx;
            while (x !== x1) {
                x += xs;
                if (p1 >= 0) { y += ys; p1 -= 2 * dx; }
                if (p2 >= 0) { z += zs; p2 -= 2 * dx; }
                p1 += 2 * dy;
                p2 += 2 * dz;
                drawThickPoint(x, y, z);
            }
        } else if (dy >= dx && dy >= dz) {
            p1 = 2 * dx - dy;
            p2 = 2 * dz - dy;
            while (y !== y1) {
                y += ys;
                if (p1 >= 0) { x += xs; p1 -= 2 * dy; }
                if (p2 >= 0) { z += zs; p2 -= 2 * dy; }
                p1 += 2 * dx;
                p2 += 2 * dz;
                drawThickPoint(x, y, z);
            }
        } else {
            p1 = 2 * dy - dz;
            p2 = 2 * dx - dz;
            while (z !== z1) {
                z += zs;
                if (p1 >= 0) { y += ys; p1 -= 2 * dz; }
                if (p2 >= 0) { x += xs; p2 -= 2 * dz; }
                p1 += 2 * dy;
                p2 += 2 * dx;
                drawThickPoint(x, y, z);
            }
        }
    }

    getBlocks() {
        return this.generate();
    }

    generate() {
        this.blocks.clear();
        
        const h = this.height;
        const turns = Math.max(0.1, this.turns);
        const thick = Math.max(1, Math.round(this.thickness));
        
        const maxT = turns * 2 * Math.PI;
        const pitch = h / maxT;
        const startY = -(h / 2);
        
        // Zoptymalizowany taper z przedziału 0.0 - 1.0
        const getRadius = (yCoord) => {
            const normalizedY = (yCoord - startY) / h;
            return Math.max(0, this.radius * (1 - this.taper * normalizedY));
        };
        
        // 3. RDZEŃ CENTRALNY (CYLINDER)
        if (this.coreRadius > 0) {
            const cRadius = Math.round(this.coreRadius);
            for (let y = 0; y <= h; y++) {
                const py = Math.round(startY + y);
                for (let x = -cRadius; x <= cRadius; x++) {
                    for (let z = -cRadius; z <= cRadius; z++) {
                        const distSq = x * x + z * z;
                        if (distSq <= cRadius * cRadius) {
                            if (!this.hollow || distSq >= (cRadius - 1) * (cRadius - 1)) {
                                this.addBlock(x, py, z, this.materialCore);
                            }
                        }
                    }
                }
            }
        }

        // Krok dla parametru t
        const maxBaseRadius = this.radius;
        const ds = Math.sqrt(maxBaseRadius * maxBaseRadius + pitch * pitch);
        const dt = ds > 0 ? 0.25 / ds : 0.1;
        
        let lastConnectorT = 0;

        const renderHelixStrand = (offsetPhase) => {
            for (let t = 0; t <= maxT; t += dt) {
                const cy = (pitch * t) + startY;
                const currentR = getRadius(cy);
                
                const cx = currentR * Math.cos(t + offsetPhase);
                const cz = currentR * Math.sin(t + offsetPhase);

                // Rysowanie zwoju helisy (tube lub box/sphere)
                if (!this.tube) {
                    for (let dx = -thick; dx <= thick; dx++) {
                        for (let dy = -thick; dy <= thick; dy++) {
                            for (let dz = -thick; dz <= thick; dz++) {
                                if (dx * dx + dy * dy + dz * dz <= thick * thick) {
                                    this.addBlock(cx + dx, cy + dy, cz + dz, this.materialWall);
                                }
                            }
                        }
                    }
                } else {
                    // TRYB RURY Z Frenet-Serret frames 
                    // Biorąc pod uwagę taper, wektor styczny delikatnie ulega zniekształceniu, 
                    // dla gładkości rury zignorujemy mikrozmianę promienia w pochodnej.
                    const tx = -currentR * Math.sin(t + offsetPhase);
                    const ty = pitch;
                    const tz = currentR * Math.cos(t + offsetPhase);
                    const tLen = Math.sqrt(tx * tx + ty * ty + tz * tz);
                    
                    const Tx = tx / tLen;
                    const Ty = ty / tLen;
                    const Tz = tz / tLen;

                    const Nx = -Math.cos(t + offsetPhase);
                    const Ny = 0;
                    const Nz = -Math.sin(t + offsetPhase);

                    const Bx = Ty * Nz - Tz * Ny;
                    const By = Tz * Nx - Tx * Nz;
                    const Bz = Tx * Ny - Ty * Nx;

                    const alphaStep = 0.25 / thick;

                    for (let alpha = 0; alpha < 2 * Math.PI; alpha += alphaStep) {
                        const cosA = Math.cos(alpha);
                        const sinA = Math.sin(alpha);

                        if (this.hollow) {
                            const px = cx + thick * (Nx * cosA + Bx * sinA);
                            const py = cy + thick * (Ny * cosA + By * sinA);
                            const pz = cz + thick * (Nz * cosA + Bz * sinA);
                            this.addBlock(px, py, pz, this.materialWall);
                        } else {
                            for (let rad = 0; rad <= thick; rad += 0.5) {
                                const px = cx + rad * (Nx * cosA + Bx * sinA);
                                const py = cy + rad * (Ny * cosA + By * sinA);
                                const pz = cz + rad * (Nz * cosA + Bz * sinA);
                                this.addBlock(px, py, pz, this.materialWall);
                            }
                        }
                    }
                }
                
                // 2. ŁĄCZNIKI (tylko w pierwszej fali wywołujemy, bo łączą się z drugą)
                if (this.doubleHelix && offsetPhase === 0 && this.connectorSpacing > 0) {
                    if (t - lastConnectorT >= this.connectorSpacing) {
                        lastConnectorT = t;
                        
                        const oppCx = currentR * Math.cos(t + Math.PI);
                        const oppCz = currentR * Math.sin(t + Math.PI);
                        
                        this.drawLine3D(
                            Math.round(cx), Math.round(cy), Math.round(cz), 
                            Math.round(oppCx), Math.round(cy), Math.round(oppCz), 
                            this.connectorThickness, this.materialConnector
                        );
                    }
                }
            }
        };

        // Główna helisa
        renderHelixStrand(0);

        // 1. PODWÓJNA HELISA (Przesunięta o PI)
        if (this.doubleHelix) {
            renderHelixStrand(Math.PI);
        }

        // 4. PIERŚCIENIE STRUKTURALNE
        if (this.ringSpacing > 0) {
            const rt = Math.round(this.ringThickness);
            
            for (let y = 0; y <= h; y += this.ringSpacing) {
                const py = Math.round(startY + y);
                const currentRingR = Math.round(getRadius(py));
                
                if (currentRingR > 0) {
                    // Generuj poziomy pierścień (koło)
                    for (let x = -currentRingR - rt; x <= currentRingR + rt; x++) {
                        for (let z = -currentRingR - rt; z <= currentRingR + rt; z++) {
                            const distSq = x * x + z * z;
                            const rMin = currentRingR - rt;
                            const rMax = currentRingR + rt;
                            if (distSq <= rMax * rMax && (!this.hollow || distSq >= rMin * rMin)) {
                                this.addBlock(x, py, z, this.materialWall);
                            }
                        }
                    }
                }
            }
        }

        // 6. PLATFORMY (TOP)
        if (this.topPlatform) {
            const pRadius = Math.round(this.platformRadius);
            const pThickness = Math.round(this.platformThickness);
            const topY = Math.round(startY + h);
            
            for (let yOffset = 0; yOffset < pThickness; yOffset++) {
                const py = topY + yOffset;
                for (let x = -pRadius; x <= pRadius; x++) {
                    for (let z = -pRadius; z <= pRadius; z++) {
                        if (x * x + z * z <= pRadius * pRadius) {
                            this.addBlock(x, py, z, this.materialWall);
                        }
                    }
                }
            }
            
            // Subtelny gzyms platformy
            const pyBase = topY;
            for (let x = -pRadius - 1; x <= pRadius + 1; x++) {
                for (let z = -pRadius - 1; z <= pRadius + 1; z++) {
                    const distSq = x * x + z * z;
                    if (distSq <= (pRadius + 1) * (pRadius + 1) && distSq > pRadius * pRadius) {
                         this.addBlock(x, pyBase, z, this.materialConnector);
                    }
                }
            }
        }

        return Array.from(this.blocks.values());
    }
}