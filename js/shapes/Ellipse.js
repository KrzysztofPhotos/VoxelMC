import { Shape } from './Shape.js';

export class Ellipse extends Shape {
    constructor(params) {
        super(params);
        this.width = (params.width || 20) / 2;
        this.height = (params.height || 10) / 2; // Z axis for 2D
        this.is3D = false;
    }

    getBoundingBox() {
        const rx = Math.ceil(this.width);
        const rz = Math.ceil(this.height);
        return {
            minX: -rx, maxX: rx,
            minY: 0, maxY: 0,
            minZ: -rz, maxZ: rz
        };
    }

    sdf(x, y, z) {
        if (y !== 0) return 999;
        // Exact SDF for ellipse is complex, approximation:
        const x_scaled = x / this.width;
        const z_scaled = z / this.height;
        const distSq = x_scaled * x_scaled + z_scaled * z_scaled;
        
        // This is not a true Euclidean distance, so thickness might be uneven.
        // For voxel generation, converting back to approximate distance space:
        const r = Math.sqrt(x*x + z*z);
        if (r === 0) return -Math.min(this.width, this.height);
        const angle = Math.atan2(z, x);
        const r_bound = (this.width * this.height) / Math.sqrt(Math.pow(this.height * Math.cos(angle), 2) + Math.pow(this.width * Math.sin(angle), 2));
        return r - r_bound;
    }
}