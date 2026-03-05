import { Shape } from './Shape.js';

export class ProceduralSpiralStairs extends Shape {
    constructor(params) {
        super(params);
        this.radius = params.radius || 10;
        this.height = params.height || 20;
        this.stepHeight = params.stepHeight || 1;
        this.stepDepth = params.stepDepth || 2;
        this.stairWidth = params.stairWidth || 5;
        this.innerRadius = params.innerRadius || 2;
        this.centralColumn = params.centralColumn !== undefined ? params.centralColumn : true;
    }

    // Since this is a procedural generator overriding generate, we need to populate this.space directly.
    generate() {
        const customAddBlock = (x, y, z, type = 'stone') => {
            const ix = Math.round(x);
            const iy = Math.round(y);
            const iz = Math.round(z);
            const key = `${ix},${iy},${iz}`;
            if (!this.space.voxels.has(key)) {
                this.space.voxels.set(key, { x: ix, y: iy, z: iz, type });
            }
        };

        // 1. Central Column (Core)
        if (this.centralColumn) {
            const colType = 'stone_bricks';
            for (let y = 0; y <= this.height; y++) {
                for (let x = -this.innerRadius; x <= this.innerRadius; x++) {
                    for (let z = -this.innerRadius; z <= this.innerRadius; z++) {
                        if (x * x + z * z <= this.innerRadius * this.innerRadius) {
                            customAddBlock(x, y, z, colType);
                        }
                    }
                }
            }
        }

        // 2. Spiral Stairs
        const stepCount = Math.floor(this.height / this.stepHeight);
        
        // Ensure stairWidth doesn't exceed the available space from innerRadius to radius
        const actualOuterRadius = Math.min(this.radius, this.innerRadius + this.stairWidth);
        
        // Calculate the angle each step takes up based on arc length at the outer edge
        const angleStep = this.stepDepth / this.radius;

        for (let stepIndex = 0; stepIndex <= stepCount; stepIndex++) {
            const t = stepIndex * angleStep;
            
            // To make a solid step that doesn't have holes, we iterate over the arc 
            // from t to t + angleStep (roughly) and over the radius from inner to outer.
            
            // To ensure thick enough steps, especially at the outer edge, 
            // we sample sub-angles within the step's angle range.
            const subSteps = Math.ceil(this.stepDepth * 3); // Over-sample to fill gaps
            
            for (let s = 0; s < subSteps; s++) {
                const currentT = t + (s / subSteps) * angleStep;
                
                for (let r = this.innerRadius; r <= actualOuterRadius; r += 0.4) {
                    const x = r * Math.cos(currentT);
                    const z = r * Math.sin(currentT);
                    
                    // Base step level
                    const y = stepIndex * this.stepHeight;
                    
                    // Fill step height to avoid gaps if stepHeight > 1
                    // Also step y is bounded by total height
                    for(let dy = 0; dy < this.stepHeight; dy++) {
                       if (y - dy >= 0 && y - dy <= this.height) {
                           customAddBlock(x, y - dy, z, 'oak_planks');
                       }
                    }
                }
            }
        }
    }
}
