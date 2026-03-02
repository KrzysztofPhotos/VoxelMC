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

        // 7) Centrowanie i symetria - symetryczne współrzędne od -halfW do halfW
        // Środek zawsze idealnie w (0,0)
        const halfW = Math.floor(this.width / 2);
        const halfD = Math.floor(this.depth / 2);
        
        // 1) Fundament
        for (let x = -halfW; x <= halfW; x++) {
            for (let z = -halfD; z <= halfD; z++) {
                this.addBlock(x, 0, z, this.materialFloor);
            }
        }

        // 2) Ściany (hollow) - tylko zewnętrzne
        for (let y = 1; y <= this.height; y++) {
            // Przód i Tył
            for (let x = -halfW; x <= halfW; x++) {
                this.addBlock(x, y, -halfD, this.materialWall);
                this.addBlock(x, y, halfD, this.materialWall);
            }
            // Lewa i Prawa (bez rogów, brak duplikatów)
            for (let z = -halfD + 1; z <= halfD - 1; z++) {
                this.addBlock(-halfW, y, z, this.materialWall);
                this.addBlock(halfW, y, z, this.materialWall);
            }
        }

        // 3) Proporcje i zabezpieczenia dachu
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

        // 3) Dach dwuspadowy
        // Okap zaczyna się o 1 blok poza ścianami
        let prevLeft = -halfW - 2;
        let prevRight = halfW + 2;

        for (let ry = 0; ry <= this.roofHeight; ry++) {
            let y = this.height + ry;
            let progress = ry / this.roofHeight;
            
            // Gwarancja braku pionowych ścian i płaskich bloków
            // Liniowa interpolacja zapewnia idealne zejście się dachu w punkcie x=0 (kalenica)
            let currentLeft = Math.round((-halfW - 1) * (1 - progress));
            let currentRight = Math.round((halfW + 1) * (1 - progress));
            
            for (let z = -halfD; z <= halfD; z++) {
                // Wypełniamy ewentualne "luki" w spadku dachu rysując ciągłe segmenty (rasteryzacja spadku)
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

        // 4) Drzwi
        // Na samym środku (x=0), wycinamy z wygenerowanej już przedniej ściany
        if (halfW >= 1) { // Nie usuwamy, jeśli to skrajny róg (szerokość bryły to min. 3)
            this.removeBlock(0, 1, -halfD);
            if (this.height >= 2) {
                this.removeBlock(0, 2, -halfD);
            }
        }

        // 5) Okna
        // Rozmiar 1x1, na wysokości połowy ściany
        if (halfD >= 1 && this.height >= 2) {
            let winY = Math.max(1, Math.floor(this.height / 2));
            this.removeBlock(-halfW, winY, 0); // Lewe okno
            this.removeBlock(halfW, winY, 0);  // Prawe okno
        }

        return Array.from(this.blocks.values());
    }
}