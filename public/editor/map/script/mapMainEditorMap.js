export class MapMainEditorMap extends OPRSClasses.MapMain {
    static ONLY_SUPPORTED_DISPLAY_MODE = 'landscape';

    constructor(input) {
        super(input);

        // For debug purpose
        this.highlightRegionMap = new Map();

        this.addKeyboardPanEvent();
        this.addMouseMoveEvent();
        this.addMouseDragEvents();
        this.addMouseWheelZoomEvent();
        this.addToggleOptionKeyEvent();

        // Bind loop so manager can call it
        this.loop = this.loop.bind(this);

        // CONSIDER TO REMOVE
        this.addAnimationLoopKeyEvent();
    }

    defineZoomSettings(input) {
        const { modData, } = input;
        this.STORAGE_KEY_LIST.ZOOM_LEVEL = Shared.STORAGE_KEY_LIST.ZOOM_LEVEL_MAP_EDITOR_MAP;
        const zoomData = {};
        for (const [mode, modeZoomData] of
            Object.entries(modData[Shared.MOD_STRING.MOD_DATA_TYPE.ZOOM_DATA].default)) {
            // every modData object has a name property
            // ignore it
            if (mode == 'name') {
                continue;
            }
            zoomData[mode] = {
                default: modeZoomData.default,
                levelMap: new Map(modeZoomData.levelList),
            };
        }
        this.zoomData = zoomData;
    };

    /**
     * Sets the current hex, map, grid, and camera parameters from the loaded data.
     * Note: Portrait mode is currently not supported.
     */
    setup(input) {
        const { tilePerInch, } = input;
        this.canvas.width = this.canvas.parentElement.offsetWidth;
        this.canvas.height = this.canvas.parentElement.offsetHeight;
        const { mapWidthInInch, mapHeightInInch, } = this.setMapWidthAndHeight({
            userInputWidth: input.mapWidthInInch,
            userInputHeight: input.mapHeightInInch,
        });

        this.calculateBaseMapParam({ mapWidthInInch, mapHeightInInch, tilePerInch, });

        // NOTE: there is no plan to support map editor in portrait mode
        const { currentZoomLevel, currentZoomData, } = this.getCurrentZoomDataFromStorage({
            displayMode: MapMainEditorMap.ONLY_SUPPORTED_DISPLAY_MODE,
            zoomData: this.zoomData,
        });

        this.processZoomData({
            tileSize: currentZoomData,
            canvasWidth: this.canvas.width,
            canvasHeight: this.canvas.height,
            mapWidthInInch, mapHeightInInch, tilePerInch,
            zoomLevel: currentZoomLevel,
        });
    }

    animationLoop(timestamp) {
        // RECORD DRAW TIME
        // const start = performance.now();
        const { offsetX, offsetY, } = this.cameraParam;
        const {
            side, width: mapWidth, height: mapHeight,
            maxCol, maxRow,
            tilePerCanvasWidth, tilePerCanvasHeight,
        } = this.mapParam;
        const { width: canvasWidth, height: canvasHeight, } = this.canvas;

        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

        const { visibleTileList, currentCol, currentRow, } = this.getVisbileTileData({
            cameraParam: this.cameraParam,
            mapParam: this.mapParam,
            tileArray: this.tileArray,
        });

        // for (const tile of visibleTileList) {
        //     aHex.drawTexture({
        //         canvasCtx: this.ctx,
        //         hexWidth: this.hexParam.width,
        //         hexHeight: this.hexParam.height,
        //         cameraOffsetX: this.cameraParam.offsetX,
        //         cameraOffsetY: this.cameraParam.offsetY,
        //         textureList: this.textureList,
        //         hexTextureMap: this.hexTextureMap,
        //     });
        // }

        // highlight current mouse over hex
        const mouseOverTile = this.userInputParam.currentMouseOverTile;
        if (mouseOverTile != null) {
            this.ctx.beginPath();
            mouseOverTile.createPath({
                canvasCtx: this.ctx, side,
                cameraOffsetX: offsetX,
                cameraOffsetY: offsetY,
            });
            this.ctx.closePath();
            this.ctx.fillStyle = 'rgba(255, 215, 0, 0.6)';
            this.ctx.fill();
        }

        if (this.option.visual.showGrid) {
            this.ctx.strokeStyle = '#555';
            this.ctx.beginPath();

            // Explicit starting positions in screen space
            const startX = currentCol * side - offsetX;
            const startY = currentRow * side - offsetY;

            const endCol = Math.min(maxCol, currentCol + tilePerCanvasWidth);
            const endRow = Math.min(maxRow, currentRow + tilePerCanvasHeight);

            const lineTop = Math.max(0, -offsetY);
            const lineBottom = Math.min(mapHeight - offsetY, canvasHeight); // clamp to map edge

            const lineLeft = Math.max(0, -offsetX);
            const lineRight = Math.min(mapWidth - offsetX, canvasWidth); // clamp to map edge

            // Vertical lines
            for (let col = currentCol, x = startX; col <= endCol; col++, x += side) {
                this.ctx.moveTo(x, lineTop);
                this.ctx.lineTo(x, lineBottom);
            }

            // Horizontal lines
            for (let row = currentRow, y = startY; row <= endRow; row++, y += side) {
                this.ctx.moveTo(lineLeft, y);
                this.ctx.lineTo(lineRight, y);
            }

            this.ctx.stroke();
        }

        // Create highlight region hex border lines
        // for (const [regionName, data] of this.highlightRegionMap) {
        //     const { color, deviation, } = data;
        //     this.ctx.strokeStyle = color;
        //     this.ctx.beginPath();
        //     for (const [key, hex] of visibleHexes) {
        //         const hexTexture = this.hexTextureMap.get(key);
        //         if (!hexTexture || !hexTexture.highlightRegionList) continue;
        //         if (hexTexture.highlightRegionList.has(regionName)) {
        //             hex.createRegionHighlightPath({
        //                 canvasCtx: this.ctx,
        //                 cameraOffsetX: this.cameraParam.offsetX,
        //                 cameraOffsetY: this.cameraParam.offsetY,
        //                 deviation,
        //             });
        //         }
        //     }
        //     this.ctx.stroke();
        // }

        if (this.option.visual.showCoord) {
            // draw hex coords
            this.ctx.font = this.mapParam.coordFontSize + 'px Arial';
            this.ctx.fillStyle = '#888888';
            this.ctx.textBaseline = 'middle';
            this.ctx.textAlign = "center";
            // CONSIDER TO REMOVE
            // for (let key in this.gridParam.hexList) {
            //     let aHex = this.gridParam.hexList[key];
            //     aHex.drawCoord({
            //         canvasCtx: this.ctx,
            //         cameraOffsetX: this.cameraParam.offsetX,
            //         cameraOffsetY: this.cameraParam.offsetY,
            //     });
            // };
            for (const tile of visibleTileList) {
                tile.drawCoord({
                    canvasCtx: this.ctx,
                    cameraOffsetX: offsetX,
                    cameraOffsetY: offsetY,
                });
            };
        }

        // draw map boundary
        this.ctx.strokeStyle = 'cyan';
        // Extend the border slightly to fully include edge pixels 
        // and match the hex tile overlap convention
        this.ctx.strokeRect(-offsetX - 1, -offsetY - 1, mapWidth + 2, mapHeight + 2);


        // CALCULATE DRAW TIME
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
    }

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
    }

    toggleLoop(input) {
        if (!this._isLooping) {
            this._isLooping = true;
            requestAnimationFrame(this.loop);
            console.log('Resume');
            return;
        }
        this._isLooping = false;
        this._lastFrameTime = null;
        console.log('Pause');
    }

    addAnimationLoopKeyEvent(input) {
        window.addEventListener('keydown', (e) => {
            if (e.ctrlKey && e.key.toLowerCase() === 'p') {
                e.preventDefault();
                this.toggleLoop();
            }
        });
    }

    addToggleOptionKeyEvent(input) {
        const optionVisual = this.option.visual;

        window.addEventListener('keydown', function (e) {
            if (e.ctrlKey && e.key.toLowerCase() === '.') {
                e.preventDefault();
                optionVisual.showGrid = !optionVisual.showGrid;
                return;
            }
            if (e.ctrlKey && e.key.toLowerCase() === '/') {
                optionVisual.showCoord = !optionVisual.showCoord;
                return;
            }
            if (e.ctrlKey && e.key.toLowerCase() === ',') {
                e.preventDefault();
                optionVisual.logCoord = !optionVisual.logCoord;
                return;
            }
        });
    }

    addModDataTreeEmitterListener(input) {
        this.wasdEnabled = true;
        this.emitter.on({
            event: Shared.EMITTER_SIGNAL.OVERLAY_VISIBLE,
            handler: () => {
                this.wasdEnabled = false;
            },
        });
        this.emitter.on({
            event: Shared.EMITTER_SIGNAL.OVERLAY_CLOSED,
            handler: () => {
                this.wasdEnabled = true;
            },
        });
    }

    addKeyboardPanEvent(input) {
        this.addModDataTreeEmitterListener();
        document.addEventListener('keydown', (e) => {
            if (!this.wasdEnabled) return; // skip if popup is open

            let wasdPressed = false;
            switch (e.key.toLowerCase()) {
                case 'w': this.cameraParam.offsetY -= this.cameraParam.moveSpeed; wasdPressed = true; break;
                case 'a': this.cameraParam.offsetX -= this.cameraParam.moveSpeed; wasdPressed = true; break;
                case 's': this.cameraParam.offsetY += this.cameraParam.moveSpeed; wasdPressed = true; break;
                case 'd': this.cameraParam.offsetX += this.cameraParam.moveSpeed; wasdPressed = true; break;
            };
            if (!wasdPressed) return;
            this.clampCameraOffset({
                cameraParam: this.cameraParam,
            });
            this.updateMouseMapPosition({
                userInputParam: this.userInputParam,
                cameraParam: this.cameraParam,
                mapParam: this.mapParam,
                logCoord: this.option.visual.logCoord,
                tileArray: this.tileArray,
            });
            this.emitter.emit({ event: Shared.EMITTER_SIGNAL.MAP_MAIN_PANNED, });
        });
    }

    addMouseMoveEvent(input) {
        this.userInputParam.mousePos = { x: 0, y: 0 };
        this.userInputParam.mouseMapPos = { x: 0, y: 0 };
        this.canvas.addEventListener('mousemove', (e) => {
            const rect = this.canvas.getBoundingClientRect();
            this.userInputParam.mousePos.x = e.clientX - rect.left;
            this.userInputParam.mousePos.y = e.clientY - rect.top;
            this.updateMouseMapPosition({
                userInputParam: this.userInputParam,
                cameraParam: this.cameraParam,
                mapParam: this.mapParam,
                logCoord: this.option.visual.logCoord,
                tileArray: this.tileArray,
            });
        });
    }

    addMouseDragEvents(input) {
        this.userInputParam.isDragging = false;
        this.userInputParam.lastDragPos = { x: 0, y: 0 };
        this.userInputParam.dragStartPos = { x: 0, y: 0 };
        this.userInputParam.dragThreshold = 5; // pixels to distinguish drag vs click

        this.canvas.addEventListener('mousedown', (e) => {
            this.userInputParam.isDragging = true;
            this.userInputParam.lastDragPos = {
                x: this.userInputParam.mousePos.x,
                y: this.userInputParam.mousePos.y,
            };
            this.userInputParam.dragStartPos = {
                x: this.userInputParam.mousePos.x,
                y: this.userInputParam.mousePos.y,
            };
        });

        this.canvas.addEventListener('mousemove', (e) => {
            if (this.userInputParam.isDragging) {
                const currentX = this.userInputParam.mousePos.x;
                const currentY = this.userInputParam.mousePos.y;
                const dx = currentX - this.userInputParam.lastDragPos.x;
                const dy = currentY - this.userInputParam.lastDragPos.y;

                // Calculate total drag distance from start to detect drag threshold
                const distX = currentX - this.userInputParam.dragStartPos.x;
                const distY = currentY - this.userInputParam.dragStartPos.y;
                const distTotal = Math.sqrt(distX * distX + distY * distY);

                if (distTotal >= this.userInputParam.dragThreshold) {
                    // Update camera offsets
                    this.cameraParam.offsetX -= dx;
                    this.cameraParam.offsetY -= dy;
                    // Clamp offsets
                    this.clampCameraOffset({ cameraParam: this.cameraParam, });
                    this.userInputParam.lastDragPos = { x: currentX, y: currentY };
                    this.emitter.emit({
                        event: Shared.EMITTER_SIGNAL.MAP_MAIN_PANNED,
                    });
                }
            }
        });

        // Mouseup on canvas ends drag
        this.canvas.addEventListener('mouseup', () => {
            this.userInputParam.isDragging = false;
        });

        // Also listen globally for mouseup to handle mouseup outside canvas
        window.addEventListener('mouseup', () => {
            this.userInputParam.isDragging = false;
        });

        // On mouse leaving canvas, if dragging, simulate mouseup at canvas edge
        this.canvas.addEventListener('mouseleave', (e) => {
            if (this.userInputParam.isDragging) {
                // Clamp last drag pos to canvas edge
                let clampedX = this.userInputParam.lastDragPos.x;
                let clampedY = this.userInputParam.lastDragPos.y;
                clampedX = Math.min(Math.max(clampedX, 0), this.canvas.width);
                clampedY = Math.min(Math.max(clampedY, 0), this.canvas.height);
                this.userInputParam.lastDragPos = { x: clampedX, y: clampedY };
                // End dragging
                this.userInputParam.isDragging = false;
            }
        });
    }

    addMouseWheelZoomEvent(input) {
        const { widthInInch, heightInInch, tilePerInch, } = this.mapParam;
        const displayMode = MapMainEditorMap.ONLY_SUPPORTED_DISPLAY_MODE;
        this.canvas.addEventListener('wheel', (e) => {
            e.preventDefault();
            // Get current zoom data
            let oldMouseMapPosX = this.userInputParam.mouseMapPos.x;
            let oldMouseMapPosY = this.userInputParam.mouseMapPos.y;
            const oldSide = this.mapParam.side;
            const zoomLevelList = Array.from(this.zoomData[displayMode].levelMap.keys());
            let currentZoomLevel = this.cameraParam.zoomLevel;
            const direction = e.deltaY < 0 ? 1 : -1;  // wheel up = zoom in, down = zoom out
            let currentZoomIndex = zoomLevelList.indexOf(currentZoomLevel);
            if (direction > 0 && currentZoomIndex < zoomLevelList.length - 1) {
                currentZoomIndex++;
            } else if (direction < 0 && currentZoomIndex > 0) {
                currentZoomIndex--;
            }

            // Update zoom-related data
            const newZoomLevel = zoomLevelList[currentZoomIndex];
            const newZoomData = this.zoomData[displayMode].levelMap.get(newZoomLevel);
            this.processZoomData({
                tileSize: newZoomData,
                canvasWidth: this.canvas.width,
                canvasHeight: this.canvas.height,
                mapWidthInInch: widthInInch, mapHeightInInch: heightInInch, tilePerInch,
                zoomLevel: newZoomLevel,
            });
            localStorage.setItem(this.STORAGE_KEY_LIST.ZOOM_LEVEL, newZoomLevel);

            // Update after zoom
            const scale = this.mapParam.side / oldSide;
            const newMouseMapPosX = oldMouseMapPosX * scale;
            const newMouseMapPosY = oldMouseMapPosY * scale;
            let newCameraOffsetX = newMouseMapPosX - this.userInputParam.mousePos.x;
            if (this.flipped) {
                newCameraOffsetX = this.mapParam.width - newMouseMapPosX - this.userInputParam.mousePos.x;
            }
            const newCameraOffsetY = newMouseMapPosY - this.userInputParam.mousePos.y;
            this.clampCameraOffset({
                cameraParam: this.cameraParam, valueX: newCameraOffsetX, valueY: newCameraOffsetY,
            });
            // Update mouse position on map
            this.updateMouseMapPosition({
                userInputParam: this.userInputParam,
                cameraParam: this.cameraParam,
                mapParam: this.mapParam,
                tileArray: this.tileArray,
                logCoord: this.option.visual.logCoord,
            });
            this.emitter.emit({
                event: Shared.EMITTER_SIGNAL.MAP_MAIN_ZOOMED,
            });
        }, { passive: false });
    }

    onMapMiniClicked(input) {
        const { mapMiniScaledClickOffsetX, mapMiniScaledClickOffsetY, } = input;
        this.cameraParam.offsetX = mapMiniScaledClickOffsetX - (this.canvas.width / 2);
        this.cameraParam.offsetY = mapMiniScaledClickOffsetY - (this.canvas.height / 2);
        this.clampCameraOffset({ cameraParam: this.cameraParam, });
        this.emitter.emit({
            event: Shared.EMITTER_SIGNAL.MAP_MAIN_PANNED,
        });
    }
}