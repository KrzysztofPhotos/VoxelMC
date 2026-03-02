import { Shape } from './Shape.js';

export class Ellipsoid extends Shape {
    constructor(params) {
        super(params);
        this.width = (params.width || 20) / 2;   // x axis
        this.height = (params.height || 10) / 2; // y axis
        this.depth = (params.depth || 15) / 2;   // z axis
        this.is3D = true;
    }

    getBoundingBox() {
        const rx = Math.ceil(this.width);
        const ry = Math.ceil(this.height);
        const rz = Math.ceil(this.depth);
        return {
            minX: -rx, maxX: rx,
            minY: -ry, maxY: ry,
            minZ: -rz, maxZ: rz
        };
    }

    sdf(x, y, z) {
        // Approximate SDF for ellipsoid
        const r = Math.sqrt(x*x + y*y + z*z);
        if (r === 0) return -Math.min(this.width, this.height, this.depth);
        
        const x_norm = x / r;
        const y_norm = y / r;
        const z_norm = z / r;
        
        // Find distance to boundary in this direction
        const denom = Math.sqrt(
            Math.pow(x_norm / this.width, 2) + 
            Math.pow(y_norm / this.height, 2) + 
            Math.pow(z_norm / this.depth, 2)
        );
        const r_bound = 1 / denom;
        return r - r_bound;
    }
}