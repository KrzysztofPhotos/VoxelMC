export class ProceduralParaboloid {
    constructor(params) {
        this.radius = params.radius || 15;
        this.height = params.height || 10;
        this.thickness = params.thickness || 1;
        this.hollow = params.hollow !== undefined ? params.hollow : true;
        
        this.materialWall = params.materialWall || 'wall';
        
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

    getBlocks() {
        return this.generate();
    }

    generate() {
        this.blocks.clear();
        
        const r = Math.round(this.radius);
        const h = Math.round(this.height);
        const thick = Math.max(1, Math.round(this.thickness));
        
        if (r === 0) {
            this.addBlock(0, 0, 0, this.materialWall);
            return Array.from(this.blocks.values());
        }

        // 2) Wyznacz współczynnik a
        // y = a * (x^2 + z^2)
        // dla x^2 + z^2 = r^2 -> y = h
        // a = h / r^2
        const a = h / (r * r);

        // 3) Dla każdego x i z w zakresie [-radius, radius]
        for (let x = -r; x <= r; x++) {
            for (let z = -r; z <= r; z++) {
                const rSq = x * x + z * z;
                
                if (rSq <= r * r) {
                    const exactY = a * rSq;
                    const topY = Math.round(exactY);
                    
                    // Bez przerw w pionie - potrzebujemy połączyć obecny y z sąsiadami (dla ostrych zboczy)
                    const prevX_Y = Math.round(a * (Math.pow(x > -r ? x - 1 : x, 2) + z * z));
                    const prevZ_Y = Math.round(a * (x * x + Math.pow(z > -r ? z - 1 : z, 2)));
                    
                    let minConnectY = Math.min(topY, prevX_Y, prevZ_Y);
                    
                    if (!this.hollow) {
                        // 4) Jeśli hollow = false: wypełnij bryłę od y=0 do y
                        for (let y = 0; y <= topY; y++) {
                            this.addBlock(x, y, z, this.materialWall);
                        }
                    } else {
                        // Jeśli hollow = true: generuj tylko powłokę o grubości thickness
                        // Upewnij się, że łata luki przy stromym nachyleniu
                        let bottomY = minConnectY - thick + 1;
                        if (bottomY > topY) bottomY = topY;
                        
                        for (let y = bottomY; y <= topY; y++) {
                            this.addBlock(x, y, z, this.materialWall);
                        }
                    }
                }
            }
        }

        return Array.from(this.blocks.values());
    }
}