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
        this.flipped = false;

        this.canvas = document.getElementById(canvasId);
        if (!this.canvas) throw new Error(`[MapMain] ${taggedString.mapMainCanvasNotFound(canvasId)}`);
        this.ctx = this.canvas.getContext('2d');
        this._isLooping = true;
        this._lastFrameTime = null;
        this.emitter = emitter;
        this.processUserMapInput(input);
        const { zoomData, } = this.declareZoomSettings(input);
        input.zoomData = zoomData;
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
        const minOffsetX = -padHorizontal;
        const minOffsetY = -padVertical;

        const maxOffsetX = mapWidth + padHorizontal - canvasWidth;
        const maxOffsetY = mapHeight + padVertical - canvasHeight;

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
        const currentCol = Math.floor(this.cameraParam.offsetX / this.mapParam.side);
        const currentRow = Math.floor(this.cameraParam.offsetY / this.mapParam.side);
        const rightMostCol = Math.min(currentCol + this.mapParam.tilePerCanvasWidth,
            this.mapParam.maxCol);
        const bottomMostRow = Math.min(currentRow + this.mapParam.tilePerCanvasHeight,
            this.mapParam.maxRow);
        const visibleTileList = [];
        for (let col = currentCol; col < rightMostCol; col++) {
            for (let row = currentRow; row < bottomMostRow; row++) {
                visibleTileList.push(this.tileArray[col][row]);
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
        cameraParam.offsetX = Shared.clamp({
            max: cameraParam.maxOffsetX, min: cameraParam.minOffsetX, value: input.valueX,
        });
        cameraParam.offsetY = Shared.clamp({
            max: cameraParam.maxOffsetY, min: cameraParam.minOffsetY, value: input.valueY,
        });
    }



    /**
     * Updates the mouse position relative to the map (world coordinates) based on current camera offset,
     * and determines which hex tile the mouse is currently over.
     * Calculates the map-relative mouse coordinates by adding camera offset to canvas mouse position.
     * Uses `Hex.getHexFromCoord` to find which hex the mouse is currently over.
     * Updates `userInputParam.currentMouseOverHex` with the found hex or null if none.
     * Outputs debug info about the hex under the mouse or if the mouse is out of bounds.
     *
     * @param {Object} input.userInputParam - User interaction state, including mouse positions.
     * @param {Object} input.userInputParam.mousePos - Current mouse pixel position relative to the canvas ({ x, y }).
     * @param {Object} input.userInputParam.mouseMapPos - Mouse position adjusted for camera offset ({ x, y }), updated by this function.
     * @param {Object} input.userInputParam.currentMouseOverHex - The hex currently under the mouse; updated by this function.
     * @param {Object} input.cameraParam - Camera parameters, including current offsets.
     * @param {Object} input.hexParam - Hex size parameters (side length, half width).
     * @param {Object} input.gridParam - Grid data, including the list of hex tiles.
     * @param {boolean} input.flipped - Is this map flipped (mirror image)?
     */
    updateMouseMapPosition(input) {
        input.userInputParam.mouseMapPos.x = input.userInputParam.mousePos.x + input.cameraParam.offsetX;
        input.userInputParam.mouseMapPos.y = input.userInputParam.mousePos.y + input.cameraParam.offsetY;
        if (input.flipped) {
            input.userInputParam.mouseMapPos.x = input.mapWidth - input.userInputParam.mouseMapPos.x;
        }
        const currentMouseOverHex = window.OPRSClasses.Hex.getHexFromCoord({
            pointX: input.userInputParam.mouseMapPos.x,
            pointY: input.userInputParam.mouseMapPos.y,
            side: input.hexParam.side,
            hexHalfWidth: input.hexParam.halfWidth,
            hexArray: input.gridParam.hexArray,
        }).hex;
        input.userInputParam.currentMouseOverHex = currentMouseOverHex;
        // CONSIDER TO REMOVE
        // console.debug(parent.userInputParam.mouseMapPos);
        // console.debug(Parchment.mapParam.padHorizontal, Parchment.mapParam.padVertical);
        // if (parent.userInputParam.currentMouseOverHex) {
        //     console.debug(`offset X: ${parent.userInputParam.mouseMapPos.x}, offset Y: ${parent.userInputParam.mouseMapPos.y}, (${parent.userInputParam.currentMouseOverHex.q}, ${parent.userInputParam.currentMouseOverHex.r}, ${parent.userInputParam.currentMouseOverHex.s}), centerX: ${parent.userInputParam.currentMouseOverHex.centerX}, centerY: ${parent.userInputParam.currentMouseOverHex.centerY}`);
        // } else {
        //     console.debug(`No found in hex list`);
        // }
        if (input.logHexCoord) {
            if (currentMouseOverHex) {
                console.debug(currentMouseOverHex.q, currentMouseOverHex.r, currentMouseOverHex.s);
            } else {
                console.debug('Out of bound');
            }
        }
    }

    /**
     * Determines and returns all hex tiles visible within the current camera viewport,
     * including a safety padding area around the edges to avoid clipping.
     * Finds the starting hex based on the camera offset adjusted for small safety padding.
     * Expands visibility bounds by a fixed safeguard distance around the viewport edges.
     * Iteratively traverses hex rows and columns within these expanded bounds.
     * Collects and returns all traversed hexes as a flat object.
     *
     * @param {number} input.cameraOffsetX - Current horizontal camera offset in pixels.
     * @param {number} input.cameraOffsetY - Current vertical camera offset in pixels.
     * @param {number} input.hexHalfWidth - Half the width of a hex tile in pixels.
     * @param {number} input.hexSide - Outer radius (center to corner) of a hex tile.
     * @param {HexArray} input.hexArray - Array that stores all the hexes in the grid.
     * @param {number} input.estimateHexPerWidth - Estimated number of hexes visible horizontally.
     * @param {number} input.estimateHexPerHeight - Estimated number of hexes visible vertically.
     * @param {boolean} input.flipped - Is this map flipped (mirror image)?
     *
     * @returns {Object<string, Hex>} - An Map containing all hex tiles visible within the viewport plus padding,
     *   keyed by hexes' keys.
     *
     * Throws:
     *   An error if it cannot find a valid starting hex at the camera position.
     */
    getVisibleHexes(input) {
        const safeguardHexDistance = 3;
        const horizontalSafetyPad = input.hexHalfWidth * 0.05;
        const verticalSafetyPad = input.hexSide * 0.05;
        let startX = Math.max(input.cameraOffsetX, input.hexHalfWidth) + horizontalSafetyPad;
        const startY = Math.max(input.cameraOffsetY, input.hexSide) + verticalSafetyPad;
        if (input.flipped) {
            startX = Math.min(input.mapWidth - input.cameraOffsetX, input.mapWidth - input.hexHalfWidth) - horizontalSafetyPad;
        }
        const startHex = window.OPRSClasses.Hex.getHexFromCoord({
            pointX: startX, pointY: startY, hexArray: input.hexArray,
            side: input.hexSide, hexHalfWidth: input.hexHalfWidth,
        }).hex;
        if (!startHex) {
            throw new Error(`[MapMain] ${taggedString.failedToGetStartHex(input.cameraOffsetX, input.cameraOffsetY)}`);
        }
        const safeguardHexData = window.OPRSClasses.Hex.getHexDataDistanceOfHex({
            distance: safeguardHexDistance,
            direction: Shared.HEX_DIRECTION.TOP_LEFT,
            hexArray: input.hexArray,
            q: startHex.q, r: startHex.r, s: startHex.s,
            flipped: input.flipped,
        });
        const safeGuardHex = input.hexArray.get({ q: safeguardHexData.q, r: safeguardHexData.r, }).hex;
        const safeGuardHorizontalDistance = input.estimateHexPerWidth + (safeguardHexDistance * 2);
        const safeGuardVerticalDistance = input.estimateHexPerHeight + (safeguardHexDistance * 2);
        const visibleHexes = new Map();
        let currentQ = safeGuardHex.q;
        let currentR = safeGuardHex.r;
        let currentS = safeGuardHex.s;
        for (let r = 0; r < safeGuardVerticalDistance; r++) {
            let direction = Shared.HEX_DIRECTION.BOTTOM_RIGHT;
            if (r % 2 == 1) {
                direction = Shared.HEX_DIRECTION.BOTTOM_LEFT;
            }
            const transverseLeftData = window.OPRSClasses.Hex.getHexDataDistanceOfHex({
                q: currentQ, r: currentR, s: currentS,
                distance: safeGuardHorizontalDistance,
                direction: Shared.HEX_DIRECTION.RIGHT,
                hexArray: input.hexArray,
                flipped: input.flipped,
            });
            // copy transversed hexes to visible hex map
            transverseLeftData.transversedHexes.forEach((value, key) => visibleHexes.set(key, value));
            const transverseBottomRightData = window.OPRSClasses.Hex.getHexDataDistanceOfHex({
                q: currentQ, r: currentR, s: currentS,
                distance: 1,
                direction,
                hexArray: input.hexArray,
                flipped: input.flipped,
            });
            if (transverseBottomRightData.q == currentQ &&
                transverseBottomRightData.r == currentR &&
                transverseBottomRightData.s == currentS) {
                break;
            }
            currentQ = transverseBottomRightData.q;
            currentR = transverseBottomRightData.r;
            currentS = transverseBottomRightData.s;
        }
        return { visibleHexes, };
    }

    // For debug purpose
    flipMap(input) {
        this.flipped = !this.flipped;
        if (!input) {
            input = {
                hexArray: this.gridParam.hexArray,
            };
        }
        if (!input.hexArray) {
            input.hexArray = this.gridParam.hexArray;
        }
        for (const hex of input.hexArray.toArray()) {
            hex.flip({ flipped: this.flipped, });
        }
    }

    declareZoomSettings(input) {
        throw new Error(`[MapMain] ${taggedString.generalImplementInSubClass('declareZoomSettings')}`);
    };

    setup(input) {
        throw new Error(`[MapMain] ${taggedString.generalImplementInSubClass('setup')}`);
    }


}