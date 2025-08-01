// Let the mini map represent a scaled viewport of the main map, showing which part is visible in the main map viewport.
// The main map zoom and pan remain controlled by direct user input on the main map.
// There is no zooming on the mini map. 
// Click on the mini map will pan to that location on the parchment.

class MiniMapParchment extends BaseMiniMap {
    static ONLY_SUPPORTED_MODE = 'landscape';

    constructor(input) {
        super(input);
        this.setup({
            zoomCachedData: input.zoomCachedData,
            cameraWidth: input.cameraWidth,
            cameraHeight: input.cameraHeight,
            cameraOffsetX: input.cameraOffsetX,
            cameraOffsetY: input.cameraOffsetY,
            zoomLevel: input.zoomLevel,
        });
        this.addMouseMoveEvents();
        this.addMouseClickEvent();
        this.draw();
    };

    setup(input) {
        this.zoomCachedData = this.preCalculateParamsFromZoomData({
            zoomCachedData: input.zoomCachedData,
            cameraWidth: input.cameraWidth,
            cameraHeight: input.cameraHeight,
        });
        this.setNewParamsOnZoomed({
            zoomCachedData: this.zoomCachedData,
            zoomLevel: input.zoomLevel,
            cameraOffsetX: input.cameraOffsetX,
            cameraOffsetY: input.cameraOffsetY,
        });
    };
    draw() {
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        this.ctx.strokeStyle = 'blue';
        this.ctx.strokeRect(this.scaledMapParam.withPaddingOffsetX, this.scaledMapParam.withPaddingOffsetY,
            this.scaledMapParam.widthWithPadding, this.scaledMapParam.heightWithPadding);
        this.ctx.strokeStyle = 'cyan';
        this.ctx.strokeRect(this.scaledMapParam.offsetX, this.scaledMapParam.offsetY,
            this.scaledMapParam.width, this.scaledMapParam.height);

        const cameraX = this.scaledMapParam.offsetX - this.scaledCameraParam.offsetX;
        const cameraY = this.scaledMapParam.offsetY - this.scaledCameraParam.offsetY;
        this.ctx.strokeStyle = 'green';
        this.ctx.strokeRect(cameraX, cameraY,
            this.scaledCameraParam.width, this.scaledCameraParam.height);
    };

    onCameraPanned(input) {
        this.setNewCameraOffset(input);
        this.draw();
    };

    setNewCameraOffset(input) {
        this.scaledCameraParam.offsetX = input.cameraOffsetX * this.scaledMapParam.scale;
        this.scaledCameraParam.offsetY = input.cameraOffsetY * this.scaledMapParam.scale;
    };

    setNewParamsOnZoomed(input) {
        const zoomData = this.getPreCachedZoomLevelData({
            zoomCachedData: input.zoomCachedData,
            mode: MiniMapParchment.ONLY_SUPPORTED_MODE,
            zoomLevel: input.zoomLevel,
        });
        this.scaledMapParam = zoomData.scaledMapParam;
        this.scaledCameraParam = zoomData.scaledCameraParam;
        this.scaledCameraParam.offsetX = input.cameraOffsetX * this.scaledMapParam.scale;
        this.scaledCameraParam.offsetY = input.cameraOffsetY * this.scaledMapParam.scale;
    };

    onCameraZoomed(input) {
        this.setNewParamsOnZoomed({
            zoomCachedData: this.zoomCachedData,
            zoomLevel: input.zoomLevel,
            cameraOffsetX: input.cameraOffsetX,
            cameraOffsetY: input.cameraOffsetY,
        });
        this.draw();
    };

    addMouseClickEvent(input) {
        const parent = this;
        this.canvas.addEventListener('click', function (event) {
            if (!parent.userInputParam.cursorInsidePaddedMap) {
                return;
            }
            parent.userInputParam.scaledClickOffsetX =
                (parent.userInputParam.mouseX - parent.scaledMapParam.withPaddingOffsetX - (parent.scaledCameraParam.width / 2)) / parent.scaledMapParam.scale;
            parent.userInputParam.scaledClickOffsetY =
                (parent.userInputParam.mouseY - parent.scaledMapParam.withPaddingOffsetY - (parent.scaledCameraParam.height / 2)) / parent.scaledMapParam.scale;
            parent.emitter.emit(Shared.EMITTER_SIGNAL.MINI_MAP_CLICKED);
        });
    };

    addMouseMoveEvents(input) {
        const parent = this;
        this.canvas.addEventListener('mousemove', function (event) {
            const bounds = parent.canvas.getBoundingClientRect();
            const mouseX = event.clientX - bounds.left;
            const mouseY = event.clientY - bounds.top;
            parent.userInputParam.mouseX = mouseX;
            parent.userInputParam.mouseY = mouseY;
            parent.userInputParam.cursorInsidePaddedMap =
                mouseX >= parent.scaledMapParam.withPaddingOffsetX && mouseX <= parent.scaledMapParam.withPaddingOffsetX + parent.scaledMapParam.widthWithPadding &&
                mouseY >= parent.scaledMapParam.withPaddingOffsetY && mouseY <= parent.scaledMapParam.withPaddingOffsetY + parent.scaledMapParam.heightWithPadding
            parent.canvas.style.cursor = parent.userInputParam.cursorInsidePaddedMap ? 'pointer' : 'default';
        });
    };
};