import { Shape } from './Shape.js';

export class Sphere extends Shape {
    constructor(params) {
        super(params);
        this.radius = params.radius || 10;
        this.is3D = true;
    }

    getBoundingBox() {
        const r = Math.ceil(this.radius);
        return {
            minX: -r, maxX: r,
            minY: -r, maxY: r,
            minZ: -r, maxZ: r
        };
    }

    sdf(x, y, z) {
        return Math.sqrt(x*x + y*y + z*z) - this.radius;
    }
}