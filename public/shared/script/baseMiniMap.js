class BaseMiniMap {
    constructor(input) {
        this.canvas = document.getElementById(input.canvasId);
        if (!this.canvas) throw new Error(`[BaseMiniMap] Mini-map canvas not found`);
        this.ctx = this.canvas.getContext(`2d`);
    };
};