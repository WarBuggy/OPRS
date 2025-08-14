export class Parchment extends OPRSClasses.BaseMainSurface {
    static userMapInput = {
        mapWidthInInch: 72,
        mapHeightInInch: 48,
        hexWidthPerInch: 1,
    };

    /**
     * @param {string} input.canvasId - The DOM ID of the target canvas element.
     * @param {EventEmitter} input.emitter - An event emitter instance for broadcasting UI events.
     */
    constructor(input) {
        super(input);
        this.addKeyboardPanEvent();
        this.addMouseMoveEvent();
        this.addMouseWheelZoomEvent();
        this.addMouseDragEvents();
        this.addToggleOptionKeyEvent();

        // Bind loop so manager can call it
        this.loop = this.loop.bind(this);

        // CONSIDER TO REMOVE
        this.addAnimationLoopKeyEvent();
    };

    /**
     * Initializes the setup by pre-calculating zoom parameters and loading the default zoom data.
     * Pre-calculates parameters for all zoom levels based on canvas size and map configuration.
     * Retrieves pre-cached zoom data from storage for the 'landscape' mode.
     * Sets the current hex, map, grid, and camera parameters from the loaded data.
     * Note: Portrait mode is currently not supported.
     */
    setup() {
        this.canvas.width = this.canvas.parentElement.offsetWidth;
        this.canvas.height = this.canvas.parentElement.offsetHeight;
        const drawMapWidthAndHeight = this.setMapWidthAndHeight({
            userInputWidth: Parchment.userMapInput.mapWidthInInch,
            userInputHeight: Parchment.userMapInput.mapHeightInInch,
        });
        this.zoomCachedData = this.preCalculateParamsFromZoomData({
            canvasWidth: this.canvas.width,
            canvasHeight: this.canvas.height,
            mapWidthInInch: drawMapWidthAndHeight.width,
            mapHeightInInch: drawMapWidthAndHeight.height,
            hexWidthPerInch: Parchment.userMapInput.hexWidthPerInch,
        });
        // NOTE: there is no plan to support map editor in portrait mode
        const mode = 'landscape';
        const preCachedZoomData = this.getPreCachedZoomLevelDataFromStorage({
            mode,
            cachedData: this.zoomCachedData,
        });

        this.hexParam = preCachedZoomData.hexParam;
        this.mapParam = preCachedZoomData.mapParam;
        this.gridParam = preCachedZoomData.gridParam;
        this.cameraParam = preCachedZoomData.cameraParam;
    };

    /**
     * Runs the main animation loop to render the hex map.
     * Clears the canvas each frame.
     * Draws the map boundary rectangle.
     * Retrieves visible hexes based on camera position and viewport size.
     * Highlights the hex currently under the mouse cursor, optionally showing coordinates.
     * Optionally draws the hex grid outlines and hex coordinates for all visible hexes.
     * Contains commented-out performance profiling code for runtime measurement.
     *
     * @param {DOMHighResTimeStamp} timestamp - The current time passed by requestAnimationFrame.
     */
    animationLoop(timestamp) {
        const start = performance.now();

        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        // draw map boundary
        this.ctx.strokeStyle = 'cyan';
        this.ctx.strokeRect(-this.cameraParam.offsetX, -this.cameraParam.offsetY,
            this.mapParam.width, this.mapParam.height);

        const visibleHexes = this.getVisibleHexes({
            hexSide: this.hexParam.side,
            hexHalfWidth: this.hexParam.halfWidth,
            cameraOffsetX: this.cameraParam.offsetX,
            cameraOffsetY: this.cameraParam.offsetY,
            hexList: this.gridParam.hexList,
            canvasWidth: this.canvas.width,
            canvasHeight: this.canvas.height,
            estimateHexPerWidth: this.gridParam.estimateHexPerWidth,
            estimateHexPerHeight: this.gridParam.estimateHexPerHeight,
            flipped: this.flipped,
            mapWidth: this.mapParam.width,
        });
        // highlight current mouse over hex
        const mouseOverHex = this.userInputParam.currentMouseOverHex;
        if (mouseOverHex != null) {
            delete visibleHexes[mouseOverHex.key];
            this.ctx.beginPath();
            mouseOverHex.createPath({
                canvasCtx: this.ctx,
                cameraOffsetX: this.cameraParam.offsetX,
                cameraOffsetY: this.cameraParam.offsetY,
            });
            this.ctx.closePath();
            this.ctx.fillStyle = 'rgba(255, 215, 0, 0.6)';
            this.ctx.fill();
            if (this.option.visual.showHexCoord) {
                this.ctx.font = (this.hexParam.coordFontSize * 1.5) + 'px Arial';
                this.ctx.fillStyle = '#222222';
                mouseOverHex.drawCoord({
                    canvasCtx: this.ctx,
                    cameraOffsetX: this.cameraParam.offsetX,
                    cameraOffsetY: this.cameraParam.offsetY,
                });
            }
        }
        // draw hexes
        // CONSIDER TO REMOVE
        // this.ctx.strokeStyle = 'red';
        // this.ctx.beginPath();
        // for (let key in this.gridParam.hexList) {
        //     let aHex = this.gridParam.hexList[key];
        //     aHex.createPath({
        //         canvasCtx: this.ctx,
        //         cameraOffsetX: this.cameraParam.offsetX,
        //         cameraOffsetY: this.cameraParam.offsetY,
        //     });
        // }
        // this.ctx.stroke();

        if (this.option.visual.showHexGrid) {
            this.ctx.strokeStyle = '#555';
            this.ctx.beginPath();
            for (let key in visibleHexes) {
                let aHex = visibleHexes[key];
                aHex.createPath({
                    canvasCtx: this.ctx,
                    cameraOffsetX: this.cameraParam.offsetX,
                    cameraOffsetY: this.cameraParam.offsetY,
                });
            }
            this.ctx.stroke();
        }

        if (this.option.visual.showHexCoord) {
            // draw hex coords
            this.ctx.font = this.hexParam.coordFontSize + 'px Arial';
            this.ctx.fillStyle = '#888888';
            this.ctx.textBaseline = 'middle';
            // CONSIDER TO REMOVE
            // for (let key in this.gridParam.hexList) {
            //     let aHex = this.gridParam.hexList[key];
            //     aHex.drawCoord({
            //         canvasCtx: this.ctx,
            //         cameraOffsetX: this.cameraParam.offsetX,
            //         cameraOffsetY: this.cameraParam.offsetY,
            //     });
            // };
            for (let key in visibleHexes) {
                let aHex = visibleHexes[key];
                aHex.drawCoord({
                    canvasCtx: this.ctx,
                    cameraOffsetX: this.cameraParam.offsetX,
                    cameraOffsetY: this.cameraParam.offsetY,
                });
            };
        }

        // CONSIDER TO REMOVE
        // const end = performance.now();
        // const diff = end - start;
        // if (this.maxDrawTime == null) {
        //     this.maxDrawTime = diff;
        //     this.totalFrame = 1;
        //     this.totalTime = diff;
        // } else {
        //     this.maxDrawTime = Math.max(this.maxDrawTime, diff);
        //     this.totalFrame++;
        //     this.totalTime += diff;
        // }
        // console.log(`Runtime: ${(end - start).toFixed(3)} ms. Max: ${this.maxDrawTime} ms. Avg: ${this.totalTime / this.totalFrame} ms.`);
    };

    /**
     * Adds keyboard event listener for camera panning.
     * Listens for WASD keys to move the camera up, left, down, and right respectively.
     * Updates camera offsets by moveSpeed on key press.
     * Clamps camera offsets within allowed bounds.
     * Updates the mouse map position accordingly.
     * Emits a signal to notify that the parchment (map) has been panned.
     */
    addKeyboardPanEvent() {
        const parent = this;
        document.addEventListener('keydown', (e) => {
            switch (e.key.toLowerCase()) {
                case 'w': parent.cameraParam.offsetY -= parent.cameraParam.moveSpeed; break;
                case 'a': parent.cameraParam.offsetX -= parent.cameraParam.moveSpeed; break;
                case 's': parent.cameraParam.offsetY += parent.cameraParam.moveSpeed; break;
                case 'd': parent.cameraParam.offsetX += parent.cameraParam.moveSpeed; break;
            };
            parent.clampCameraOffset({
                cameraParam: parent.cameraParam,
            });
            parent.updateMouseMapPosition({
                userInputParam: parent.userInputParam,
                cameraParam: parent.cameraParam,
                hexParam: parent.hexParam,
                gridParam: parent.gridParam,
                flipped: parent.flipped,
                mapWidth: parent.mapParam.width,
                logHexCoord: parent.option.visual.logHexCoord,
            });
            parent.emitter.emit(Shared.EMITTER_SIGNAL.PARCHMENT_PANNED);
        });
    };

    /**
     * Adds mousemove event listener on the canvas.
     * Tracks the mouse position relative to the canvas.
     * Updates the mouse map position using current camera, hex, and grid parameters.
     */
    addMouseMoveEvent() {
        this.userInputParam.mousePos = { x: 0, y: 0 };
        this.userInputParam.mouseMapPos = { x: 0, y: 0 };
        const parent = this;
        this.canvas.addEventListener('mousemove', (e) => {
            const rect = parent.canvas.getBoundingClientRect();
            parent.userInputParam.mousePos.x = e.clientX - rect.left;
            parent.userInputParam.mousePos.y = e.clientY - rect.top;
            parent.updateMouseMapPosition({
                userInputParam: parent.userInputParam,
                cameraParam: parent.cameraParam,
                hexParam: parent.hexParam,
                gridParam: parent.gridParam,
                flipped: parent.flipped,
                mapWidth: parent.mapParam.width,
                logHexCoord: parent.option.visual.logHexCoord,
            });
        });
    };

    /**
     * Adds mouse wheel event listener to handle zooming in and out on the map.
     * Zooms based on wheel direction, cycling through predefined zoom levels.
     * Updates hex, map, grid, and camera parameters based on new zoom level.
     * Adjusts camera offset to keep mouse position stable relative to map content.
     * Updates mouse map position accordingly.
     * Emits a zoom event when zoom level changes.
     */
    addMouseWheelZoomEvent() {
        const mode = 'landscape';
        const parent = this;
        this.canvas.addEventListener('wheel', (e) => {
            e.preventDefault();

            // get before zoom data
            let oldMouseMapPosX = parent.userInputParam.mouseMapPos.x;
            let oldMouseMapPosY = parent.userInputParam.mouseMapPos.y;
            const oldSide = this.hexParam.side;

            const zoomLevels = Object.keys(this.zoomSettings.landscape.levels)
                .map(Number)
                .sort((a, b) => a - b);

            let currentZoom = parseFloat(localStorage.getItem(parent.STORAGE_KEYS.ZOOM_LEVEL));

            const direction = e.deltaY < 0 ? 1 : -1;  // wheel up = zoom in, down = zoom out
            let currentIndex = zoomLevels.indexOf(currentZoom);

            if (direction > 0 && currentIndex < zoomLevels.length - 1) {
                currentIndex++;
            } else if (direction < 0 && currentIndex > 0) {
                currentIndex--;
            }

            // Get zoom-related pre-cached data
            const newZoom = zoomLevels[currentIndex];
            const modeData = parent.getDisplayModeData({ mode, });
            const preCachedZoomData = parent.getPreCachedZoomLevelData({
                mode,
                modeData,
                parsed: newZoom,
                cachedData: parent.zoomCachedData,
            });
            parent.hexParam = preCachedZoomData.hexParam;
            parent.mapParam = preCachedZoomData.mapParam;
            parent.gridParam = preCachedZoomData.gridParam;
            parent.setHexDrawXCoord({ hexList: parent.gridParam.hexList, flipped: parent.flipped, });
            parent.cameraParam = preCachedZoomData.cameraParam;
            localStorage.setItem(parent.STORAGE_KEYS.ZOOM_LEVEL, newZoom);

            // Update after zoom
            const scale = parent.hexParam.side / oldSide;
            const newMouseMapPosX = oldMouseMapPosX * scale;
            const newMouseMapPosY = oldMouseMapPosY * scale;
            let newCameraOffsetX = newMouseMapPosX - parent.userInputParam.mousePos.x;
            if (parent.flipped) {
                newCameraOffsetX = parent.mapParam.width - newMouseMapPosX - parent.userInputParam.mousePos.x;
            }
            const newCameraOffsetY = newMouseMapPosY - parent.userInputParam.mousePos.y;
            parent.clampCameraOffset({
                cameraParam: parent.cameraParam,
                valueX: newCameraOffsetX, valueY: newCameraOffsetY,
            });
            // Update mouse position on map
            parent.updateMouseMapPosition({
                userInputParam: parent.userInputParam,
                cameraParam: parent.cameraParam,
                hexParam: parent.hexParam,
                gridParam: parent.gridParam,
                flipped: parent.flipped,
                mapWidth: parent.mapParam.width,
                logHexCoord: parent.option.visual.logHexCoord,
            });
            parent.emitter.emit(Shared.EMITTER_SIGNAL.PARCHMENT_ZOOMED);
        }, { passive: false });
    };

    /**
     * Adds mouse drag event listeners to enable dragging the map view.
     * Initializes drag state and updates camera offsets based on drag movements,
     * while enforcing drag threshold and clamping camera position within bounds.
     * Emits a signal when the map is panned via dragging.
     */
    addMouseDragEvents() {
        this.userInputParam.isDragging = false;
        this.userInputParam.lastDragPos = { x: 0, y: 0 };
        this.userInputParam.dragStartPos = { x: 0, y: 0 };
        this.userInputParam.dragThreshold = 5; // pixels to distinguish drag vs click

        const parent = this;
        const canvas = this.canvas;
        canvas.addEventListener('mousedown', (e) => {
            parent.userInputParam.isDragging = true;
            parent.userInputParam.lastDragPos = {
                x: parent.userInputParam.mousePos.x,
                y: parent.userInputParam.mousePos.y,
            };
            parent.userInputParam.dragStartPos = {
                x: parent.userInputParam.mousePos.x,
                y: parent.userInputParam.mousePos.y,
            };
        });

        canvas.addEventListener('mousemove', (e) => {
            if (parent.userInputParam.isDragging) {
                const currentX = parent.userInputParam.mousePos.x;
                const currentY = parent.userInputParam.mousePos.y;
                const dx = currentX - parent.userInputParam.lastDragPos.x;
                const dy = currentY - parent.userInputParam.lastDragPos.y;

                // Calculate total drag distance from start to detect drag threshold
                const distX = currentX - parent.userInputParam.dragStartPos.x;
                const distY = currentY - parent.userInputParam.dragStartPos.y;
                const distTotal = Math.sqrt(distX * distX + distY * distY);

                if (distTotal >= parent.userInputParam.dragThreshold) {
                    // Update camera offsets
                    parent.cameraParam.offsetX -= dx;
                    parent.cameraParam.offsetY -= dy;
                    // Clamp offsets
                    parent.clampCameraOffset({ cameraParam: parent.cameraParam, });
                    parent.userInputParam.lastDragPos = { x: currentX, y: currentY };
                    parent.emitter.emit(Shared.EMITTER_SIGNAL.PARCHMENT_PANNED);
                }
            }
        });

        // Mouseup on canvas ends drag
        canvas.addEventListener('mouseup', () => {
            parent.userInputParam.isDragging = false;
        });

        // Also listen globally for mouseup to handle mouseup outside canvas
        window.addEventListener('mouseup', () => {
            parent.userInputParam.isDragging = false;
        });

        // On mouse leaving canvas, if dragging, simulate mouseup at canvas edge
        canvas.addEventListener('mouseleave', (e) => {
            if (parent.userInputParam.isDragging) {
                // Clamp last drag pos to canvas edge
                let clampedX = parent.userInputParam.lastDragPos.x;
                let clampedY = parent.userInputParam.lastDragPos.y;
                clampedX = Math.min(Math.max(clampedX, 0), parent.canvas.width);
                clampedY = Math.min(Math.max(clampedY, 0), parent.canvas.height);
                parent.userInputParam.lastDragPos = { x: clampedX, y: clampedY };
                // End dragging
                parent.userInputParam.isDragging = false;
            }
        });
    };

    /**
     * Handles a click event on the mini-map by updating the main camera offset
     * to center the view around the clicked position, then clamps the offset within valid bounds.
     * Emits a signal indicating the main parchment (map) has been panned.
     *
     * @param {number} input.miniMapScaledClickOffsetX - The scaled X coordinate of the click on the mini-map.
     * @param {number} input.miniMapScaledClickOffsetY - The scaled Y coordinate of the click on the mini-map.
     */
    onMiniMapClicked(input) {
        this.cameraParam.offsetX = input.miniMapScaledClickOffsetX - (this.canvas.width / 2);
        this.cameraParam.offsetY = input.miniMapScaledClickOffsetY - (this.canvas.height / 2);
        this.clampCameraOffset({
            cameraParam: this.cameraParam,
        });
        this.emitter.emit(Shared.EMITTER_SIGNAL.PARCHMENT_PANNED);
    };

    /**
     * Runs the animation loop at a maximum of 30 frames per second.
     * Skips frames if called too quickly to maintain frame rate.
     * Calls the animationLoop method on each valid frame.
     *
     * @param {DOMHighResTimeStamp} timestamp - The current time provided by requestAnimationFrame.
     */
    loop(timestamp) {
        if (!this._isLooping) return;
        const minFrameTime = 1000 / 30; // 30 FPS
        if (!this._lastFrameTime) this._lastFrameTime = timestamp;
        const elapsed = timestamp - this._lastFrameTime;
        if (elapsed >= minFrameTime) {
            this._lastFrameTime = timestamp;
            this.animationLoop(timestamp);
        };
        requestAnimationFrame(this.loop);
    };

    /**
     * Toggles the animation loop state between running and paused.
     * When resumed, starts the loop using requestAnimationFrame.
     * Logs the current state ('Resume' or 'Pause') to the console.
     */
    toggleLoop() {
        if (!this._isLooping) {
            this._isLooping = true;
            requestAnimationFrame(this.loop);
            console.log('Resume');
            return;
        }
        this._isLooping = false;
        this._lastFrameTime = null;
        console.log('Pause');
    };

    /**
     * Initializes the zoomSettings property with predefined zoom levels and default zoom for supported modes.
     * Currently supports 'landscape' mode with specific zoom level mappings.
     */
    declareZoomSettings() {
        this.STORAGE_KEYS.ZOOM_LEVEL = Shared.STORAGE_KEYS.ZOOM_LEVEL_MAP_EDITOR_PARCHMENT;
        this.zoomSettings = {
            landscape: {
                levels: {
                    0.5: 6,
                    1: 12,
                    2: 24,
                },
                defaultZoomLevel: 1,
            },
            // CONSIDER TO REMOVE
            // portrait: {
            //     levels: {
            //         0.5: 8,
            //         1: 16,
            //         2: 32,
            //     },
            //     defaultZoomLevel: 1,
            // }
        };
    };

    /**
     * Adds a global keyboard event listener to toggle the animation loop on Ctrl + 'P' key press.
     */
    addAnimationLoopKeyEvent() {
        const parent = this;
        window.addEventListener('keydown', function (e) {
            if (e.ctrlKey && e.key.toLowerCase() === 'p') {
                e.preventDefault();
                parent.toggleLoop();
            }
        });
    };

    /**
     * Adds global keyboard event listeners to toggle visual options:
     * - Ctrl + '/' toggles visibility of hex coordinates.
     * - Ctrl + '.' toggles visibility of the hex grid.
     * - Ctrl + ',' toggles logging of hex coordinates to debug console.
     */
    addToggleOptionKeyEvent() {
        const parent = this;
        window.addEventListener('keydown', function (e) {
            if (e.ctrlKey && e.key.toLowerCase() === '.') {
                e.preventDefault();
                parent.option.visual.showHexGrid = !parent.option.visual.showHexGrid;
                return;
            }
            if (e.ctrlKey && e.key.toLowerCase() === '/') {
                parent.option.visual.showHexCoord = !parent.option.visual.showHexCoord;
                return;
            }
            if (e.ctrlKey && e.key.toLowerCase() === ',') {
                e.preventDefault();
                parent.option.visual.logHexCoord = !parent.option.visual.logHexCoord;
                return;
            }
        });
    };
};