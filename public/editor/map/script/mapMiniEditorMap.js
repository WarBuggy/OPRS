// Let the mini map represent a scaled viewport of the main map, showing which part is visible in the main map viewport.
// The main map zoom and pan remain controlled by direct user input on the main map.
// There is no zooming on the mini map. 
// Click on the mini map will pan to that location on the parchment.

export class MapMiniEditorMap extends OPRSClasses.MapMini {

    /**
     * Initializes the BaseMiniMap instance with zoom configuration, camera setup, and event bindings.
     *
     * @param {Object} input.zoomCachedData - Precomputed zoom-level data organized by mode and zoom level.
     * @param {number} input.cameraWidth - Width of the camera viewport (in pixels).
     * @param {number} input.cameraHeight - Height of the camera viewport (in pixels).
     * @param {number} input.cameraOffsetX - Initial horizontal offset of the camera (in pixels).
     * @param {number} input.cameraOffsetY - Initial vertical offset of the camera (in pixels).
     * @param {number|string} input.side - Map tile size.
     */
    constructor(input) {
        const { mapParam, cameraWidth, cameraHeight, cameraOffsetX, cameraOffsetY, } = input;
        super(input);
        this.setup({ mapParam, cameraWidth, cameraHeight, cameraOffsetX, cameraOffsetY, });
        this.addMouseMoveEvents();
        this.addMouseClickEvent();
        this.draw({
            canvasWidth: this.canvas.width,
            canvasHeight: this.canvas.height,
            scaledMapParam: this.scaledMapParam,
            scaledCameraParam: this.scaledCameraParam,
            ctx: this.ctx,
        });
    }

    setup(input) {
        const { mapParam, cameraWidth, cameraHeight, cameraOffsetX, cameraOffsetY, } = input;
        this.canvas.width = this.canvas.parentElement.offsetWidth;
        this.canvas.height = this.canvas.parentElement.offsetHeight;
        this.processZoomData({ mapParam, cameraWidth, cameraHeight, cameraOffsetX, cameraOffsetY, });
    }

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
        const { canvasWidth, canvasHeight, scaledMapParam, scaledCameraParam, ctx, } = input;
        ctx.clearRect(0, 0, canvasWidth, canvasHeight);
        ctx.strokeStyle = 'blue';
        ctx.strokeRect(scaledMapParam.withPaddingOffsetX, scaledMapParam.withPaddingOffsetY,
            scaledMapParam.widthWithPadding, scaledMapParam.heightWithPadding);
        ctx.strokeStyle = 'cyan';
        ctx.strokeRect(scaledMapParam.offsetX, scaledMapParam.offsetY,
            scaledMapParam.width, scaledMapParam.height);

        const cameraX = scaledMapParam.offsetX + scaledCameraParam.offsetX;
        const cameraY = scaledMapParam.offsetY + scaledCameraParam.offsetY;
        ctx.strokeStyle = 'green';
        ctx.strokeRect(cameraX, cameraY, scaledCameraParam.width, scaledCameraParam.height);
    }

    /**
     * Updates the camera offset based on pan input and triggers a redraw of the mini-map.
     *
     * @param {number} input.cameraOffsetX - New horizontal camera offset.
     * @param {number} input.cameraOffsetY - New vertical camera offset.
     */
    onMapMainPanned(input) {
        const { cameraOffsetX, cameraOffsetY, } = input;
        this.setNewCameraOffset({
            scaledCameraParam: this.scaledCameraParam,
            scale: this.scaledMapParam.scale,
            cameraOffsetX, cameraOffsetY,
        });
        this.draw({
            canvasWidth: this.canvas.width,
            canvasHeight: this.canvas.height,
            scaledMapParam: this.scaledMapParam,
            scaledCameraParam: this.scaledCameraParam,
            ctx: this.ctx,
        });
    }

    onMapMainZoomed(input) {
        const { mapParam, cameraWidth, cameraHeight, cameraOffsetX, cameraOffsetY, } = input;
        this.processZoomData({
            mapParam, cameraWidth, cameraHeight,
            cameraOffsetX, cameraOffsetY,
        });
        this.draw({
            canvasWidth: this.canvas.width,
            canvasHeight: this.canvas.height,
            scaledMapParam: this.scaledMapParam,
            scaledCameraParam: this.scaledCameraParam,
            ctx: this.ctx,
        });
    }

    /**
     * Binds a 'click' event listener to the canvas to compute the scaled click offset
     * relative to the mini-map. Emits a signal if the click occurred inside the padded map.
     *
     * @param {Object} input - Unused, reserved for mod or future extension.
     */
    addMouseClickEvent(input) {
        this.canvas.addEventListener('click', (e) => {
            if (!this.userInputParam.cursorInsidePaddedMap) {
                return;
            }
            this.userInputParam.scaledClickOffsetX =
                (this.userInputParam.mouseX - this.scaledMapParam.offsetX) / this.scaledMapParam.scale;
            this.userInputParam.scaledClickOffsetY =
                (this.userInputParam.mouseY - this.scaledMapParam.offsetY) / this.scaledMapParam.scale;
            this.emitter.emit({
                event: Shared.EMITTER_SIGNAL.MAP_MINI_CLICKED,
            });
        });
    }

    /**
     * Binds a 'mousemove' event listener to the canvas to track cursor position
     * and determine whether the pointer is within the scaled map padding area.
     *
     * @param {Object} input - Unused, reserved for mod or future extension.
     */
    addMouseMoveEvents(input) {
        this.canvas.addEventListener('mousemove', (e) => {
            const bounds = this.canvas.getBoundingClientRect();
            const mouseX = e.clientX - bounds.left;
            const mouseY = e.clientY - bounds.top;
            this.userInputParam.mouseX = mouseX;
            this.userInputParam.mouseY = mouseY;
            this.userInputParam.cursorInsidePaddedMap =
                mouseX >= this.scaledMapParam.withPaddingOffsetX && mouseX <= this.scaledMapParam.withPaddingOffsetX + this.scaledMapParam.widthWithPadding &&
                mouseY >= this.scaledMapParam.withPaddingOffsetY && mouseY <= this.scaledMapParam.withPaddingOffsetY + this.scaledMapParam.heightWithPadding
            this.canvas.style.cursor = this.userInputParam.cursorInsidePaddedMap ? 'pointer' : 'default';
        });
    }
}