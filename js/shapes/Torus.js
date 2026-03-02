import { Shape } from './Shape.js';

export class Torus extends Shape {
    constructor(params) {
        super(params);
        this.majorRadius = params.majorRadius || 15;
        this.minorRadius = params.minorRadius || 5;
        this.is3D = true;
    }

    getBoundingBox() {
        const outerRadius = Math.ceil(this.majorRadius + this.minorRadius);
        const h = Math.ceil(this.minorRadius);
        return {
            minX: -outerRadius, maxX: outerRadius,
            minY: -h, maxY: h,
            minZ: -outerRadius, maxZ: outerRadius
        };
    }

    sdf(x, y, z) {
        // Distance from center of tube in XZ plane
        const q = Math.sqrt(x*x + z*z) - this.majorRadius;
        // Distance from surface of tube
        return Math.sqrt(q*q + y*y) - this.minorRadius;
    }
}