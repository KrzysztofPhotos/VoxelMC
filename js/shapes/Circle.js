import { Shape } from './Shape.js';

export class Circle extends Shape {
    constructor(params) {
        super(params);
        this.radius = params.radius || 10;
        this.is3D = false;
    }

    getBoundingBox() {
        const r = Math.ceil(this.radius);
        return {
            minX: -r, maxX: r,
            minY: 0, maxY: 0,
            minZ: -r, maxZ: r
        };
    }

    sdf(x, y, z) {
        if (y !== 0) return 999;
        return Math.sqrt(x*x + z*z) - this.radius;
    }
}