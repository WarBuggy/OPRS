class Parchment extends BaseMainSurface {
    static userMapInput = {
        mapWidthInInch: 72,
        mapHeightInInch: 48,
        hexWidthPerInch: 1,
    };

    constructor(input) {
        super(input);
        this.declareZoomSettings();
        this.setup();
        this.addKeyboardPanEvent();
        this.addMouseMoveEvent();
        this.addMouseWheelZoomEvent();
        this.addMouseDragEvents();
        // Bind loop so manager can call it
        this.loop = this.loop.bind(this);
    };

    setup() {
        this.zoomCachedData = this.preCalculateParamsFromZoomData({
            canvasWidth: this.canvas.width,
            canvasHeight: this.canvas.height,
            mapWidthInInch: Parchment.userMapInput.mapWidthInInch,
            mapHeightInInch: Parchment.userMapInput.mapHeightInInch,
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

    animationLoop(timestamp) {
        const ctx = this.canvas.getContext('2d');
        ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        // draw hexes
        ctx.strokeStyle = 'red';
        ctx.beginPath();
        for (let key in this.gridParam.hexList) {
            let aHex = this.gridParam.hexList[key];
            aHex.createPath({
                canvasCtx: ctx,
                cameraOffsetX: this.cameraParam.offsetX,
                cameraOffsetY: this.cameraParam.offsetY,
            });
        }
        ctx.stroke();

        // draw map boundary
        ctx.strokeStyle = 'cyan';
        ctx.beginPath();
        ctx.moveTo(this.cameraParam.offsetX, this.cameraParam.offsetY);
        ctx.lineTo(this.mapParam.width + this.cameraParam.offsetX, this.cameraParam.offsetY);
        ctx.lineTo(this.mapParam.width + this.cameraParam.offsetX, this.mapParam.height + this.cameraParam.offsetY);
        ctx.lineTo(this.cameraParam.offsetX, this.mapParam.height + this.cameraParam.offsetY);
        ctx.lineTo(this.cameraParam.offsetX, this.cameraParam.offsetY);
        ctx.stroke();

        // draw hex coords
        ctx.font = this.hexParam.coordFontSize + 'px Arial';
        ctx.fillStyle = 'green';
        ctx.textBaseline = 'middle';
        for (let key in this.gridParam.hexList) {
            let aHex = this.gridParam.hexList[key];
            aHex.drawCoord({
                canvasCtx: ctx,
                cameraOffsetX: this.cameraParam.offsetX,
                cameraOffsetY: this.cameraParam.offsetY,
            });
        };
    };

    addKeyboardPanEvent() {
        const parent = this;
        document.addEventListener('keydown', (e) => {
            switch (e.key.toLowerCase()) {
                case 'w': parent.cameraParam.offsetY += parent.cameraParam.moveSpeed; break;
                case 'a': parent.cameraParam.offsetX += parent.cameraParam.moveSpeed; break;
                case 's': parent.cameraParam.offsetY -= parent.cameraParam.moveSpeed; break;
                case 'd': parent.cameraParam.offsetX -= parent.cameraParam.moveSpeed; break;
            };
            parent.clampCameraOffset({
                cameraParam: parent.cameraParam,
            });
            parent.updateMouseMapPosition({
                userInputParam: parent.userInputParam,
                cameraParam: parent.cameraParam,
                hexParam: parent.hexParam,
                gridParam: parent.gridParam,
            });
            parent.emitter.emit(Shared.EMITTER_SIGNAL.PARCHMENT_PANNED);
        });
    };

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
            });
        });
    };

    addMouseWheelZoomEvent() {
        const mode = 'landscape';
        const parent = this;
        this.canvas.addEventListener('wheel', (e) => {
            e.preventDefault();

            // get before zoom data
            const unpadMapPosBeforeX = parent.userInputParam.mousePos.x - parent.cameraParam.offsetX - this.mapParam.padHorizontal;
            const unpadMapPosBeforeY = parent.userInputParam.mousePos.y - parent.cameraParam.offsetY - this.mapParam.padVertical;
            const sideBefore = this.hexParam.side;

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
            parent.cameraParam = preCachedZoomData.cameraParam;
            localStorage.setItem(parent.STORAGE_KEYS.ZOOM_LEVEL, newZoom);

            // Update after zoom
            const scale = parent.hexParam.side / sideBefore;
            const unpadMapPosAfterX = unpadMapPosBeforeX * scale;
            const unpadMapPosAfterY = unpadMapPosBeforeY * scale;
            const newOffsetX = parent.userInputParam.mousePos.x - unpadMapPosAfterX - parent.mapParam.padHorizontal;
            const newOffsetY = parent.userInputParam.mousePos.y - unpadMapPosAfterY - parent.mapParam.padVertical;
            parent.clampCameraOffset({
                cameraParam: parent.cameraParam,
                valueX: newOffsetX, valueY: newOffsetY,
            });
            // Update mouse position on map
            parent.updateMouseMapPosition({
                userInputParam: parent.userInputParam,
                cameraParam: parent.cameraParam,
                hexParam: parent.hexParam,
                gridParam: parent.gridParam,
            });

            parent.emitter.emit(Shared.EMITTER_SIGNAL.PARCHMENT_ZOOMED);
        }, { passive: false });
    };

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
                    parent.cameraParam.offsetX += dx;
                    parent.cameraParam.offsetY += dy;
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

    pauseLoop() {
        this._isLooping = false;
        this._lastFrameTime = null;
    };

    resumeLoop() {
        if (!this._isLooping) {
            this._isLooping = true;
            requestAnimationFrame(this.loop);
        }
    };

    declareZoomSettings() {
        this.zoomSettings = {
            landscape: {
                levels: {
                    0.5: 6,
                    1: 12,
                    2: 24,
                },
                defaultZoomLevel: 1,
            },
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
};