export class VoxelSpace {
    constructor() {
        this.voxels = new Map();
    }

    add(x, y, z) {
        const ix = Math.round(x);
        const iy = Math.round(y);
        const iz = Math.round(z);
        const key = `${ix},${iy},${iz}`;
        if (!this.voxels.has(key)) {
            this.voxels.set(key, { x: ix, y: iy, z: iz });
        }
    }

    has(x, y, z) {
        const key = `${Math.round(x)},${Math.round(y)},${Math.round(z)}`;
        return this.voxels.has(key);
    }

    toArray() {
        return Array.from(this.voxels.values());
    }
}
