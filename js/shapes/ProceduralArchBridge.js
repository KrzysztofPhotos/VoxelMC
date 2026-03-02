export class ProceduralArchBridge {
    constructor(params) {
        this.span = params.span || 60; // Zwiększony span, bo wiele łuków
        this.width = params.width || 7;
        this.thickness = params.thickness || 3;
        
        // Nowe parametry dla wersji segmentowanej
        this.segments = params.segments || 3;
        this.curveAmount = params.curveAmount || 0.5; // od 0 do 0.7
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

        // 5) PROPORCJE I PARAMETRY
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
        const ph = Math.max(0, Math.round(s / 6)); // Baza filarów
        let thick = Math.max(2, Math.round(this.thickness));

        const platformBaseY = ph + ah; 
        const maxStructureY = platformBaseY + 10; 

        const addB = (x, y, z, type) => {
            const finalType = this.getBlockType(x, y, z, type, maxStructureY);
            this.addBlock(x, y, z, finalType);
        };

        // 2) DELIKATNY SKRĘT (Krzywizna w osi Z)
        const getCurveZ = (x) => {
            // progress znormalizowany od 0 do 1
            const progress = (x + halfS) / s;
            return Math.sin(progress * Math.PI) * curve * maxCurveZ;
        };

        // Funkcja obliczająca Y łuku w ramach danego segmentu
        const getSegmentArchY = (x) => {
            // Znajdź w którym jesteśmy segmencie (indeks od 0 do segs-1)
            let segIndex = Math.floor((x + halfS) / segmentLength);
            // Zabezpieczenie przed wyjściem za indeks przy x = halfS
            if (segIndex >= segs) segIndex = segs - 1;
            
            // Środek tego segmentu
            const segMidX = -halfS + (segIndex + 0.5) * segmentLength;
            // Lokalny X względem środka segmentu
            const localX = x - segMidX;
            const halfSegL = segmentLength / 2;
            
            // Parabola dla tego segmentu: y = a(x^2) + archHeight
            const a = -ah / (halfSegL * halfSegL);
            return a * (localX * localX) + ah;
        };

        // =====================================
        // 1) GŁÓWNE ŁUKI NOŚNE I WTÓRNE OTWORY (Wielosegmentowe)
        // =====================================
        for (let x = -halfS; x <= halfS; x++) {
            const parabolaY = getSegmentArchY(x);
            const topArchY = Math.round(ph + parabolaY);
            
            const prevParabolaY = x > -halfS ? getSegmentArchY(x - 1) : parabolaY;
            const prevArchY = Math.round(ph + prevParabolaY);
            
            const maxConnectY = Math.max(topArchY, prevArchY);
            const minConnectY = Math.min(topArchY, prevArchY);
            
            // Przesunięcie Z
            const curveOffsetZ = Math.round(getCurveZ(x));
            
            // Górna część węższa o 1 blok dla lżejszych proporcji
            const currentHalfW = Math.max(2, halfW - (parabolaY > ah * 0.8 ? 1 : 0));

            for (let localZ = -currentHalfW - 1; localZ <= currentHalfW + 1; localZ++) {
                const isEdge = (localZ === -currentHalfW - 1 || localZ === currentHalfW + 1);
                const absoluteZ = localZ + curveOffsetZ;
                
                // Dwuwarstwowy rzymski styl
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
            
            // --- Otwory odciążające i Platforma wzdłuż łuku ---
            // Łuki odciążające można wstawić w najszerszych częściach segmentu (przy filarach)
            let isHole = false;
            let segIndex = Math.floor((x + halfS) / segmentLength);
            if (segIndex >= segs) segIndex = segs - 1;
            const segMidX = -halfS + (segIndex + 0.5) * segmentLength;
            const localX = x - segMidX;
            const halfSegL = segmentLength / 2;
            
            // Małe otwory odciążające na 2/3 długości połówki segmentu
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

            // Wypełnienie między łukiem a platformą
            for (let y = archBaseY + 1; y <= ySurface - 1; y++) {
                if (isHole && y < ySurface - 2) continue;
                for (let localZ = -halfW; localZ <= halfW; localZ++) {
                    addB(x, y, localZ + curveOffsetZ, this.materialMain);
                }
            }

            // Platforma (Podłoga krzywa)
            for (let localZ = -halfW; localZ <= halfW; localZ++) {
                addB(x, ySurface, localZ + curveOffsetZ, this.materialMain);
            }
            
            // Gzyms
            addB(x, ySurface, -halfW - 1 + curveOffsetZ, this.materialDetail);
            addB(x, ySurface, halfW + 1 + curveOffsetZ, this.materialDetail);

            // BARIERKI po krzywej
            const wallY = ySurface + 1;
            for (let side of [-1, 1]) {
                const zEdge = side * halfW + curveOffsetZ;
                
                // Mur obronny wysokości 3 bloki
                for (let wy = 0; wy < 3; wy++) {
                    addB(x, wallY + wy, zEdge, this.materialMain);
                }
                
                // Wąska strzelnica co 6 bloków
                if (Math.abs(x) % 6 === 3) {
                    this.removeBlock(x, wallY + 1, zEdge);
                    this.removeBlock(x, wallY + 2, zEdge);
                }
                
                // Mały wystający słupek co 10 bloków
                if (Math.abs(x) % 10 === 0) {
                    const pillarZ = zEdge + side; // Wypuszczenie na zewnątrz
                    for (let wy = -1; wy <= 3; wy++) {
                        addB(x, wallY + wy, pillarZ, this.materialDetail);
                    }
                    addB(x, wallY + 4, pillarZ, this.materialDetail);
                    addB(x, wallY + 4, zEdge, this.materialDetail);
                }
            }
            
            // Fix usunięcia strzelnicy w słupku jeśli wystąpiło zderzenie
            if (Math.abs(x) % 6 === 3) {
                this.blocks.delete(`${Math.round(x)},${Math.round(wallY + 1)},${Math.round(-halfW + curveOffsetZ)}`);
                this.blocks.delete(`${Math.round(x)},${Math.round(wallY + 1)},${Math.round(halfW + curveOffsetZ)}`);
            }
        }

        // =====================================
        // 3) FILARY POD SEGMENTAMI
        // =====================================
        // Każdy segment ma filar na krańcach: i=0...segs
        for (let i = 0; i <= segs; i++) {
            const px = -halfS + i * segmentLength;
            // Pomijamy krawędzie skrajne (tam są schody)
            if (i === 0 || i === segs) continue;
            
            const pxR = Math.round(px);
            const curveOffsetZ = Math.round(getCurveZ(pxR));
            const archYAtPillar = Math.round(ph + getSegmentArchY(pxR));
            const pWidth = halfW;

            for (let y = -2; y <= archYAtPillar; y++) {
                // Profil zwężający się ku górze
                let expandBase = 0;
                if (y < ph * 0.1) expandBase = 2; // Bardzo gruby na dnie
                else if (y < ph * 0.4) expandBase = 1;

                for (let x = pxR - 2 - expandBase; x <= pxR + 2 + expandBase; x++) {
                    for (let localZ = -pWidth - 1 - expandBase; localZ <= pWidth + 1 + expandBase; localZ++) {
                        addB(x, y, localZ + curveOffsetZ, this.materialMain);
                    }
                }

                // Water breakers (ostre kliny pod wodą) i przypory - szpiczaste na brzegach osi Z
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
        // 6) LŻEJSZA KONSTRUKCJA SCHODÓW
        // =====================================
        const endPlatformY = platformBaseY + Math.round(Math.cos(0.5 * Math.PI) * 1.0);
        
        for (let i = 1; i <= endPlatformY + 2; i++) {
            const leftX = -halfS - i;
            const rightX = halfS + i;
            const stepY = endPlatformY - i;
            
            if (stepY < -2) break;
            
            const curveOffsetLeft = Math.round(getCurveZ(leftX));
            const curveOffsetRight = Math.round(getCurveZ(rightX));

            // Zamiast do Y=0, pod każdym stopniem schodzimy tylko o 2 bloki by zrobić lekką strukturę pod schodami
            for (let localZ = -halfW; localZ <= halfW; localZ++) {
                for (let y = stepY - 2; y <= stepY; y++) {
                    addB(leftX, y, localZ + curveOffsetLeft, this.materialMain);
                    addB(rightX, y, localZ + curveOffsetRight, this.materialMain);
                }
            }
            
            // Boczne ściany osłaniające - grubości 1 bloku do samego dołu
            for (let y = -2; y <= stepY + 3; y++) {
                addB(leftX, y, -halfW - 1 + curveOffsetLeft, this.materialMain);
                addB(leftX, y, halfW + 1 + curveOffsetLeft, this.materialMain);
                addB(rightX, y, -halfW - 1 + curveOffsetRight, this.materialMain);
                addB(rightX, y, halfW + 1 + curveOffsetRight, this.materialMain);
            }
            
            // Gzyms bocznych ścian
            addB(leftX, stepY + 4, -halfW - 1 + curveOffsetLeft, this.materialDetail);
            addB(leftX, stepY + 4, halfW + 1 + curveOffsetLeft, this.materialDetail);
            addB(rightX, stepY + 4, -halfW - 1 + curveOffsetRight, this.materialDetail);
            addB(rightX, stepY + 4, halfW + 1 + curveOffsetRight, this.materialDetail);
        }

        // =====================================
        // 7) CENTRALNA WIEŻA BRAMNA W KRZYWIZNIE
        // =====================================
        if (this.hasGate) {
            const gateW = halfW; 
            const gateD = 2; 
            const gateH = 6; 
            const ySurfaceCenter = platformBaseY + Math.round(Math.cos(0) * 1.0) + 1;
            
            // Wieża stoi na środku x=0. Obliczamy offset dla środka.
            const centerCurveOffsetZ = Math.round(getCurveZ(0));
            
            for (let x = -gateD; x <= gateD; x++) {
                // Delikatne zagięcie bramy by dopasowała się do platformy na tym ułamku X
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
            
            // Zwieńczenie Bramy z uwzględnieniem ścisłego środka
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
            // Latarnie
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