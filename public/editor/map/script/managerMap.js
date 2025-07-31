class ManagerMap {
    constructor(input) {
        this.emitter = new EventEmitter();

        this.parchment = new Parchment({
            canvasId: input.parchment.canvasId,
            storageKeyZoomLevel: input.parchment.storageKeyZoomLevel,
            emitter: this.emitter,
        });

        this.miniMap = new MiniMapParchment({
            canvasId: input.miniMap.canvasId,
            zoomCachedData: this.parchment.zoomCachedData,
            cameraWidth: this.parchment.canvas.width,
            cameraHeight: this.parchment.canvas.height,
            cameraOffsetX: this.parchment.cameraParam.offsetX,
            cameraOffsetY: this.parchment.cameraParam.offsetY,
            zoomLevel: this.parchment.cameraParam.zoomLevel,
            emitter: this.emitter,
        });

        const parent = this;
        this.emitter.on(Shared.EMITTER_SIGNAL.PARCHMENT_PANNED, function () {
            parent.handleParchmentPanned(parent);
        });
        this.emitter.on(Shared.EMITTER_SIGNAL.PARCHMENT_ZOOMED, function () {
            parent.handleParchmentZoomed(parent);
        });

        requestAnimationFrame(this.parchment.loop);
    };

    handleParchmentPanned(parent) {
        parent.miniMap.onCameraPanned({
            cameraOffsetX: parent.parchment.cameraParam.offsetX,
            cameraOffsetY: parent.parchment.cameraParam.offsetY,
        });
    };

    handleParchmentZoomed(parent) {
        parent.miniMap.onCameraZoomed({
            zoomLevel: parent.parchment.cameraParam.zoomLevel,
            cameraOffsetX: parent.parchment.cameraParam.offsetX,
            cameraOffsetY: parent.parchment.cameraParam.offsetY,
        });
    };
};