// Coord system starts at top left corner of the map (i.e top left corner is 0,0).
// The padded edge is 1 inch on all four sides of the map.
// That makes the coord of the padded-map's top left corner is in the negative.

export class MapMain {
    static DEFAULT_MAP_INPUT = {
        WIDTH_IN_INCH: 72,
        HEIGHT_IN_INCH: 48,
        TILE_PER_INCH: 1,
    };

    constructor(input) {
        const { canvasId, emitter, } = input;

        this.STORAGE_KEY_LIST = {};
        this.userInputParam = {
            mousePos: { x: 0, y: 0 },
            mouseMapPos: { x: 0, y: 0 },
            currentMouseOverTile: null,
            isDragging: false,
            lastDragPos: { x: 0, y: 0 },
            dragStartPos: { x: 0, y: 0 },
            dragThreshold: 5,
        };
        this.option = {
            visual: {
                showGrid: true,
                showCoord: false,
                logCoord: false,
            },
        };

        this.canvas = document.getElementById(canvasId);
        if (!this.canvas) throw new Error(`[MapMain] ${taggedString.mapMainCanvasNotFound(canvasId)}`);
        this.ctx = this.canvas.getContext('2d');
        this._isLooping = true;
        this._lastFrameTime = null;
        this.emitter = emitter;
        this.processUserMapInput(input);
        this.defineZoomSettings(input);
        this.setup(input);
    }

    processUserMapInput(input) {
        const {
            mapWidthInInch = MapMain.DEFAULT_MAP_INPUT.WIDTH_IN_INCH,
            mapHeightInInch = MapMain.DEFAULT_MAP_INPUT.HEIGHT_IN_INCH,
            tilePerInch = MapMain.DEFAULT_MAP_INPUT.TILE_PER_INCH,
        } = input;

        if (!Number.isInteger(tilePerInch) || tilePerInch < 1) {
            throw new Error(`[MapMain] ${taggedString.mapMainInvalidTilePerInch(tilePerInch)}`);
        }
        input.mapWidthInInch = mapWidthInInch;
        if (!Number.isInteger(mapWidthInInch) || mapWidthInInch < 1) {
            throw new Error(`[MapMain] ${taggedString.mapMainInvalidMapWidthInInch(mapWidthInInch)}`);
        }
        input.mapHeightInInch = mapHeightInInch;
        if (!Number.isInteger(mapHeightInInch) || mapHeightInInch < 1) {
            throw new Error(`[MapMain] ${taggedString.mapMainInvalidMapHeightInInch(mapHeightInInch)}`);
        }
        input.tilePerInch = tilePerInch;
    };

    setMapWidthAndHeight(input) {
        const { userInputWidth, userInputHeight, } = input;
        let mapWidthInInch = userInputWidth;
        let mapHeightInInch = userInputHeight;
        if (userInputWidth > userInputHeight) {
            mapWidthInInch = userInputHeight;
            mapHeightInInch = userInputWidth;
        }
        return { mapWidthInInch, mapHeightInInch, };
    }

    getCurrentZoomDataFromStorage(input) {
        const { displayMode, zoomData, } = input;
        const modeData = zoomData[displayMode];
        if (!modeData) {
            throw new Error(`[MapMain] ${taggedString.mapMainInvalidDisplayMode(displayMode)}`);
        }
        const defaultZoom = modeData.default;
        if (defaultZoom === undefined) {
            throw new Error(`[MapMain] ${taggedString.mapMainNoDefaultZoomLevelFound(displayMode)}`);
        }
        const defaultZoomData = modeData.levelMap.get(defaultZoom);
        if (!defaultZoomData) {
            throw new Error(`[MapMain] ${taggedString.mapMainNoDefaultZoomLevelDataFound(displayMode)}`);
        }

        const stored = localStorage.getItem(this.STORAGE_KEY_LIST.ZOOM_LEVEL);
        if (stored === null) {
            localStorage.setItem(this.STORAGE_KEY_LIST.ZOOM_LEVEL, defaultZoom);
            console.log(taggedString.mapMainnoZoomInStorage());
            console.log(taggedString.mapMainFallBackToDefaultZoomLevel());
            return { currentZoomLevel: defaultZoom, currentZoomData: defaultZoomData, };
        }

        const currentZoomLevel = parseFloat(stored);
        const currentZoomData = modeData.levelMap.get(currentZoomLevel);
        if (!currentZoomData) {
            throw new Error(`[MapMain] ${taggedString.mapMainNoZoomLevelDataFound(displayMode, stored)}`);
        }
        return { currentZoomLevel, currentZoomData, };
    }

    calculateBaseMapParam(input) {
        const { tilePerInch, mapWidthInInch, mapHeightInInch, } = input;
        this.mapParam = {
            widthInInch: mapWidthInInch,
            heightInInch: mapHeightInInch,
            maxCol: mapWidthInInch * tilePerInch,
            maxRow: mapHeightInInch * tilePerInch,
            flipped: false,
            tilePerInch: tilePerInch,
        };
        this.tileArray = [];
        for (let col = 0; col < this.mapParam.maxCol; col++) {
            this.tileArray[col] = [];
            for (let row = 0; row < this.mapParam.maxRow; row++) {
                const tile = new OPRSClasses.Tile({ col, row, });
                this.tileArray[col].push(tile);
            }
        }
    }

    calculateCameraParam(input) {
        // Bounds when adding offsets:
        const {
            padHorizontal, padVertical,
            mapWidth, mapHeight,
            canvasWidth, canvasHeight, tileSize, zoomLevel,
        } = input;

        let minOffsetX, maxOffsetX, minOffsetY, maxOffsetY;
        if (mapWidth + 2 * padHorizontal <= canvasWidth) {
            // Map smaller than canvas → lock position (centered)
            minOffsetX = maxOffsetX = (mapWidth - canvasWidth) / 2;
        } else {
            // Map larger than canvas → allow movement with padding
            minOffsetX = -padHorizontal;
            maxOffsetX = mapWidth + padHorizontal - canvasWidth;
        }

        if (mapHeight + 2 * padVertical <= canvasHeight) {
            minOffsetY = maxOffsetY = (mapHeight - canvasHeight) / 2;
        } else {
            minOffsetY = -padVertical;
            maxOffsetY = mapHeight + padVertical - canvasHeight;
        }

        // Center camera
        let offsetX = Math.round((mapWidth - canvasWidth) / 2);
        let offsetY = Math.round((mapHeight - canvasHeight) / 2);

        // Clamp to bounds
        offsetX = Shared.clamp({ max: maxOffsetX, min: minOffsetX, value: offsetX, }).clampedValue;
        offsetY = Shared.clamp({ max: maxOffsetY, min: minOffsetY, value: offsetY, }).clampedValue;

        const moveSpeed = Math.round(tileSize * 1.3);
        return {
            maxOffsetX, maxOffsetY,
            minOffsetX, minOffsetY,
            offsetX, offsetY, moveSpeed, zoomLevel,
        };
    }

    processZoomData(input) {
        const {
            tileSize, canvasWidth, canvasHeight,
            mapWidthInInch, mapHeightInInch, tilePerInch, zoomLevel,
        } = input;
        const pixelPerInch = tilePerInch * tileSize;
        this.mapParam.side = tileSize;
        this.mapParam.halfSide = tileSize / 2;
        this.mapParam.coordFontSize = tileSize * 0.15;
        this.mapParam.pixelPerInch = pixelPerInch;
        this.mapParam.width = pixelPerInch * mapWidthInInch;
        this.mapParam.height = pixelPerInch * mapHeightInInch;
        this.mapParam.padHorizontal = pixelPerInch * 1;
        this.mapParam.padVertical = pixelPerInch * 1;
        this.mapParam.tilePerCanvasWidth = Math.ceil(canvasWidth / tileSize);
        this.mapParam.tilePerCanvasHeight = Math.ceil(canvasHeight / tileSize);
        for (let col = 0; col < this.mapParam.maxCol; col++) {
            for (let row = 0; row < this.mapParam.maxRow; row++) {
                this.tileArray[col][row].calculateCoord({
                    side: this.mapParam.side,
                    halfSide: this.mapParam.halfSide,
                    mapWidth: this.mapParam.width,
                });
            }
        }
        this.cameraParam = this.calculateCameraParam({
            padHorizontal: this.mapParam.padHorizontal,
            padVertical: this.mapParam.padVertical,
            mapWidth: this.mapParam.width,
            mapHeight: this.mapParam.height,
            canvasWidth, canvasHeight, tileSize, zoomLevel,
        });
    }

    getVisbileTileData(input) {
        const { cameraParam, mapParam, tileArray, } = input;
        const { offsetX, offsetY, } = cameraParam;
        const {
            side, tilePerCanvasWidth, tilePerCanvasHeight, maxCol, maxRow,
        } = mapParam;
        const currentCol = Math.floor(Math.max(offsetX, 0) / side);
        const currentRow = Math.floor(Math.max(offsetY, 0) / side);
        const rightMostCol = Math.min(currentCol + tilePerCanvasWidth, maxCol);
        const bottomMostRow = Math.min(currentRow + tilePerCanvasHeight, maxRow);
        const visibleTileList = [];
        for (let col = currentCol; col < rightMostCol; col++) {
            for (let row = currentRow; row < bottomMostRow; row++) {
                visibleTileList.push(tileArray[col][row]);
            }
        }
        return { visibleTileList, currentCol, currentRow, };
    }

    /**
     * Clamps the camera offset values to ensure they stay within allowed bounds.
     * Uses `Shared.clamp` to restrict offsetX and offsetY within min and max bounds.
     * Updates `cameraParam.offsetX` and `cameraParam.offsetY` with clamped values.
     *
     * @param {Object} input.cameraParam - Camera parameters containing offset bounds and current offsets.
     * @param {number} [input.valueX] - Optional horizontal offset value to clamp; defaults to current offsetX.
     * @param {number} [input.valueY] - Optional vertical offset value to clamp; defaults to current offsetY.
     */
    clampCameraOffset(input) {
        const { cameraParam, } = input;
        if (!input.valueX) {
            input.valueX = cameraParam.offsetX;
        }
        if (!input.valueY) {
            input.valueY = cameraParam.offsetY;
        }
        ({ clampedValue: cameraParam.offsetX, } = Shared.clamp({
            max: cameraParam.maxOffsetX, min: cameraParam.minOffsetX, value: input.valueX,
        }));
        ({ clampedValue: cameraParam.offsetY } = Shared.clamp({
            max: cameraParam.maxOffsetY, min: cameraParam.minOffsetY, value: input.valueY,
        }));
    }

    updateMouseMapPosition(input) {
        const { userInputParam, cameraParam, mapParam, tileArray, logCoord, } = input;
        const { mouseMapPos, mousePos, } = userInputParam;
        const { offsetX, offsetY, } = cameraParam;
        const { side, flipped, mapWidth, } = mapParam;
        mouseMapPos.x = mousePos.x + offsetX;
        mouseMapPos.y = mousePos.y + offsetY;
        if (flipped) {
            mouseMapPos.x = mapWidth - mouseMapPos.x;
        }
        const { tile, } = OPRSClasses.Tile.getTileFromCoord({
            mapX: mouseMapPos.x,
            mapY: mouseMapPos.y,
            side, tileArray,
        });
        userInputParam.currentMouseOverTile = tile;

        if (logCoord) {
            if (tile) {
                console.debug(tile.col, tile.row);
            } else {
                console.debug('Out of bound');
            }
        }
    }

    defineZoomSettings(input) {
        throw new Error(`[MapMain] ${taggedString.generalImplementInSubClass('defineZoomSettings')}`);
    };

    setup(input) {
        throw new Error(`[MapMain] ${taggedString.generalImplementInSubClass('setup')}`);
    }
}