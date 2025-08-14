// Let the mini map represent a scaled viewport of the main map, showing which part is visible in the main map viewport.
// The main map zoom and pan remain controlled by direct user input on the main map.
// There is no zooming on the mini map. 
// Click on the mini map will pan to that location on the parchment.

export class MiniMapParchment extends OPRSClasses.BaseMiniMap {
    static ONLY_SUPPORTED_MODE = 'landscape';
    /**
     * Initializes the BaseMiniMap instance with zoom configuration, camera setup, and event bindings.
     *
     * @param {Object} input.zoomCachedData - Precomputed zoom-level data organized by mode and zoom level.
     * @param {number} input.cameraWidth - Width of the camera viewport (in pixels).
     * @param {number} input.cameraHeight - Height of the camera viewport (in pixels).
     * @param {number} input.cameraOffsetX - Initial horizontal offset of the camera (in pixels).
     * @param {number} input.cameraOffsetY - Initial vertical offset of the camera (in pixels).
     * @param {number|string} input.zoomLevel - Default zoom level to initialize the view.
     */
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
        this.draw({
            canvasWidth: this.canvas.width,
            canvasHeight: this.canvas.height,
            scaledMapParam: this.scaledMapParam,
            scaledCameraParam: this.scaledCameraParam,
            ctx: this.ctx,
        });
    };

    /**
     * Initializes zoom cached data and sets parameters for the current zoom level and camera offsets.
     *
     * @param {Object} input.zoomCachedData - Pre-cached zoom data by mode and zoom level.
     * @param {number} input.cameraWidth - Width of the camera viewport in pixels.
     * @param {number} input.cameraHeight - Height of the camera viewport in pixels.
     * @param {number} input.zoomLevel - Initial zoom level to apply.
     * @param {number} input.cameraOffsetX - Initial horizontal camera offset.
     * @param {number} input.cameraOffsetY - Initial vertical camera offset.
     */
    setup(input) {
        this.canvas.width = this.canvas.parentElement.offsetWidth;
        this.canvas.height = this.canvas.parentElement.offsetHeight;
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

    /**
     * Clears the provided canvas context and draws the mini-map boundaries and camera viewport.
     * Uses different stroke colors to distinguish the padded map, map area, and camera view.
     *
     * @param {CanvasRenderingContext2D} input.ctx - Canvas rendering context to draw on.
     * @param {number} input.canvasWidth - Width of the canvas in pixels.
     * @param {number} input.canvasHeight - Height of the canvas in pixels.
     * @param {Object} input.scaledMapParam - Scaled map parameters including padded and unpadded dimensions and offsets.
     * @param {number} input.scaledMapParam.withPaddingOffsetX - X offset including padding.
     * @param {number} input.scaledMapParam.withPaddingOffsetY - Y offset including padding.
     * @param {number} input.scaledMapParam.widthWithPadding - Width including padding.
     * @param {number} input.scaledMapParam.heightWithPadding - Height including padding.
     * @param {number} input.scaledMapParam.offsetX - X offset of the map area without padding.
     * @param {number} input.scaledMapParam.offsetY - Y offset of the map area without padding.
     * @param {number} input.scaledMapParam.width - Width of the map area without padding.
     * @param {number} input.scaledMapParam.height - Height of the map area without padding.
     * @param {Object} input.scaledCameraParam - Scaled camera viewport parameters.
     * @param {number} input.scaledCameraParam.offsetX - X offset of the camera viewport.
     * @param {number} input.scaledCameraParam.offsetY - Y offset of the camera viewport.
     * @param {number} input.scaledCameraParam.width - Width of the camera viewport.
     * @param {number} input.scaledCameraParam.height - Height of the camera viewport.
     */
    draw(input) {
        input.ctx.clearRect(0, 0, input.canvasWidth, input.canvasHeight);
        input.ctx.strokeStyle = 'blue';
        input.ctx.strokeRect(input.scaledMapParam.withPaddingOffsetX, input.scaledMapParam.withPaddingOffsetY,
            input.scaledMapParam.widthWithPadding, input.scaledMapParam.heightWithPadding);
        input.ctx.strokeStyle = 'cyan';
        input.ctx.strokeRect(input.scaledMapParam.offsetX, input.scaledMapParam.offsetY,
            input.scaledMapParam.width, input.scaledMapParam.height);

        const cameraX = input.scaledMapParam.offsetX + input.scaledCameraParam.offsetX;
        const cameraY = input.scaledMapParam.offsetY + input.scaledCameraParam.offsetY;
        input.ctx.strokeStyle = 'green';
        input.ctx.strokeRect(cameraX, cameraY,
            input.scaledCameraParam.width, input.scaledCameraParam.height);
    };

    /**
     * Updates the camera offset based on pan input and triggers a redraw of the mini-map.
     *
     * @param {number} input.cameraOffsetX - New horizontal camera offset.
     * @param {number} input.cameraOffsetY - New vertical camera offset.
     */
    onCameraPanned(input) {
        this.setNewCameraOffset(input);
        this.draw({
            canvasWidth: this.canvas.width,
            canvasHeight: this.canvas.height,
            scaledMapParam: this.scaledMapParam,
            scaledCameraParam: this.scaledCameraParam,
            ctx: this.ctx,
        });
    };

    /**
     * Updates the scaled camera offsets by applying the current map scale to raw camera offsets.
     *
     * @param {number} input.cameraOffsetX - The raw horizontal camera offset.
     * @param {number} input.cameraOffsetY - The raw vertical camera offset.
     */
    setNewCameraOffset(input) {
        this.scaledCameraParam.offsetX = input.cameraOffsetX * this.scaledMapParam.scale;
        this.scaledCameraParam.offsetY = input.cameraOffsetY * this.scaledMapParam.scale;
    };

    /**
     * Updates internal scaled map and camera parameters based on the given zoom level
     * and camera offsets after a zoom event.
     *
     * @param {Object} input.zoomCachedData - Pre-cached zoom data organized by mode and zoom level.
     * @param {string} input.mode - Mode to use for lookup (currently fixed in usage).
     * @param {number|string} input.zoomLevel - Zoom level to fetch parameters for.
     * @param {number} input.cameraOffsetX - Camera horizontal offset before scaling.
     * @param {number} input.cameraOffsetY - Camera vertical offset before scaling.
     */
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

    /**
     * Updates mini-map parameters when the main camera is zoomed and triggers a redraw.
     *
     * @param {number} input.zoomLevel - The new zoom level to apply.
     * @param {number} input.cameraOffsetX - New horizontal camera offset.
     * @param {number} input.cameraOffsetY - New vertical camera offset.
     */
    onCameraZoomed(input) {
        this.setNewParamsOnZoomed({
            zoomCachedData: this.zoomCachedData,
            zoomLevel: input.zoomLevel,
            cameraOffsetX: input.cameraOffsetX,
            cameraOffsetY: input.cameraOffsetY,
        });
        this.draw({
            canvasWidth: this.canvas.width,
            canvasHeight: this.canvas.height,
            scaledMapParam: this.scaledMapParam,
            scaledCameraParam: this.scaledCameraParam,
            ctx: this.ctx,
        });
    };

    /**
     * Binds a 'click' event listener to the canvas to compute the scaled click offset
     * relative to the mini-map. Emits a signal if the click occurred inside the padded map.
     *
     * @param {Object} input - Unused, reserved for mod or future extension.
     */
    addMouseClickEvent(input) {
        const parent = this;
        this.canvas.addEventListener('click', function (event) {
            if (!parent.userInputParam.cursorInsidePaddedMap) {
                return;
            }
            parent.userInputParam.scaledClickOffsetX =
                (parent.userInputParam.mouseX - parent.scaledMapParam.offsetX) / parent.scaledMapParam.scale;
            parent.userInputParam.scaledClickOffsetY =
                (parent.userInputParam.mouseY - parent.scaledMapParam.offsetY) / parent.scaledMapParam.scale;
            parent.emitter.emit(Shared.EMITTER_SIGNAL.MINI_MAP_CLICKED);
        });
    };

    /**
     * Binds a 'mousemove' event listener to the canvas to track cursor position
     * and determine whether the pointer is within the scaled map padding area.
     *
     * @param {Object} input - Unused, reserved for mod or future extension.
     */
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