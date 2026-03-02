import { Shape } from './Shape.js';

export class Cone extends Shape {
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
        // Base at y = -height/2, tip at y = height/2
        const h_half = this.height / 2;
        
        if (y < -h_half) return -y - h_half; // below base
        if (y > h_half) return y - h_half;   // above tip
        
        const currentRadius = this.radius * (1 - (y + h_half) / this.height);
        
        const distXZ = Math.sqrt(x*x + z*z) - currentRadius;
        const distY = Math.abs(y) - h_half;
        
        return Math.max(distXZ, distY);
    }
}