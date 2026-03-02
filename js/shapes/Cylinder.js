import { Shape } from './Shape.js';

export class Cylinder extends Shape {
    constructor(params) {
        super(params);
        this.radius = params.radius || 10;
        this.height = params.height || 20;
        this.is3D = true;
    }

    getBoundingBox() {
        const r = Math.ceil(this.radius);
        const h = Math.ceil(this.height / 2);
        return {
            minX: -r, maxX: r,
            minY: -h, maxY: h,
            minZ: -r, maxZ: r
        };
    }

    sdf(x, y, z) {
        const distXZ = Math.sqrt(x*x + z*z) - this.radius;
        const distY = Math.abs(y) - (this.height / 2);
        
        // Exact SDF for finite cylinder
        const d_xz = Math.max(distXZ, 0);
        const d_y = Math.max(distY, 0);
        const exteriorDist = Math.sqrt(d_xz*d_xz + d_y*d_y);
        const interiorDist = Math.min(Math.max(distXZ, distY), 0);
        
        return exteriorDist + interiorDist;
    }
}