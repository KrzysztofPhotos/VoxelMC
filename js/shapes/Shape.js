import { VoxelSpace } from '../math/VoxelMath.js';

export class Shape {
    constructor(params) {
        this.params = params;
        this.space = new VoxelSpace();
        this.is3D = true;
    }

    getBlocks() {
        this.space = new VoxelSpace();
        this.generate();
        return this.space.toArray();
    }

    addBlock(x, y, z) {
        this.space.add(x, y, z);
    }

    generate() {
        const bounds = this.getBoundingBox();
        const thickness = this.params.hollow ? (this.params.thickness || 1) : Infinity;

        // Iterate over bounding box
        for (let x = bounds.minX; x <= bounds.maxX; x++) {
            for (let y = bounds.minY; y <= bounds.maxY; y++) {
                for (let z = bounds.minZ; z <= bounds.maxZ; z++) {
                    const d = this.sdf(x, y, z);
                    
                    if (d <= 0.5) { // Add 0.5 for voxel rounding logic to ensure smooth edges
                        if (this.params.hollow) {
                            // If hollow, distance to boundary should be within thickness
                            // d is negative inside. -d is depth.
                            const depth = -d;
                            if (depth <= thickness - 0.5) {
                                this.addBlock(x, y, z);
                            }
                        } else {
                            this.addBlock(x, y, z);
                        }
                    }
                }
            }
        }
    }

    getBoundingBox() {
        return { minX: 0, maxX: 0, minY: 0, maxY: 0, minZ: 0, maxZ: 0 };
    }

    // Signed Distance Function. Returns < 0 if inside, > 0 if outside, 0 on surface.
    sdf(x, y, z) {
        return 0;
    }
}