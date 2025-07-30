class ManagerMap {
    constructor(input) {
        this.emitter = new EventEmitter();

        this.parchment = new Parchment({
            canvasId: input.parchment.canvasId,
            storageKeyZoomLevel: input.parchment.storageKeyZoomLevel,
            emitter: this.emitter,
        });
        this.emitter.on(Shared.EMITTER_SIGNAL.PARCHMENT_PANNED, this.handleParchmentPanned);
        this.emitter.on(Shared.EMITTER_SIGNAL.PARCHMENT_ZOOMED, this.handleParchmentZoomed);

        requestAnimationFrame(this.parchment.loop);
    };

    handleParchmentPanned() {
        console.log('patchment panned');
    }

    handleParchmentZoomed() {
        console.log('patchment zoomed');
    }
};