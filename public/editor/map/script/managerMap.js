export class ManagerMap {

    constructor(input) {
        this.emitter = new window.OPRSClasses.EventEmitter();

        this.parchment = new window.OPRSClasses.Parchment({
            canvasId: input.parchment.canvasId,
            emitter: this.emitter,
        });

        this.miniMap = new window.OPRSClasses.MiniMapParchment({
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
        this.emitter.on(Shared.EMITTER_SIGNAL.MINI_MAP_CLICKED, function () {
            parent.handleMiniMapClicked(parent);
        });

        requestAnimationFrame(this.parchment.loop);
    };

    setup(input) {
        this.parchment.setup();
        this.miniMap.setup({
            zoomCachedData: this.parchment.zoomCachedData,
            cameraWidth: this.parchment.canvas.width,
            cameraHeight: this.parchment.canvas.height,
            cameraOffsetX: this.parchment.cameraParam.offsetX,
            cameraOffsetY: this.parchment.cameraParam.offsetY,
            zoomLevel: this.parchment.cameraParam.zoomLevel,
        });
        this.miniMap.draw({
            canvasWidth: this.miniMap.canvas.width,
            canvasHeight: this.miniMap.canvas.height,
            scaledMapParam: this.miniMap.scaledMapParam,
            scaledCameraParam: this.miniMap.scaledCameraParam,
            ctx: this.miniMap.ctx,
        });
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

    handleMiniMapClicked(parent) {
        parent.parchment.onMiniMapClicked({
            miniMapScaledClickOffsetX: parent.miniMap.userInputParam.scaledClickOffsetX,
            miniMapScaledClickOffsetY: parent.miniMap.userInputParam.scaledClickOffsetY,
        });
    };
};