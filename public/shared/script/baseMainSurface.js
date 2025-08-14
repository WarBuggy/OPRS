// Coord system starts at top left corner of the map (i.e top left corner is 0,0).
// The padded edge is 1 inch on all four sides of the map.
// That makes the coord of the padded-map's top left corner is in the negative.

export class BaseMainSurface {
    /**
     * Initializes the main surface object responsible for managing canvas rendering, user input,
     * camera controls, and hex grid state for a hex-based map editor.
     *
     * @param {string} input.canvasId - The DOM ID of the target canvas element.
     * @param {EventEmitter} input.emitter - An event emitter instance for broadcasting UI events.
     */
    constructor(input) {
        this.STORAGE_KEYS = {};
        this.hexParam = {
            side: 0,
            width: 0,
            halfWidth: 0,
            height: 0,
            coordFontSize: 0,
        };
        this.mapParam = {
            widthInInch: 0,
            heightInInch: 0,
            expectedWidth: 0,
            expectedHeight: 0,
            width: 0,
            height: 0,
            padHorizontal: 0,
            padVertical: 0,
        };
        this.gridParam = {
            hexList: {},
            estimateHexPerWidth: 0,
            estimateHexPerHeight: 0,
            minQ: 0, maxQ: 0,
            minR: 0, maxR: 0,
            minS: 0, maxS: 0,
        };
        this.cameraParam = {
            maxOffsetX: Infinity, maxOffsetY: Infinity,
            minOffsetX: -Infinity, minOffsetY: -Infinity,
            offsetX: null, offsetY: null,
            moveSpeed: null,
            zoomLevel: null,
        };
        this.userInputParam = {
            mousePos: { x: 0, y: 0 },
            mouseMapPos: { x: 0, y: 0 },
            currentMouseOverHex: null,
            isDragging: false,
            lastDragPos: { x: 0, y: 0 },
            dragStartPos: { x: 0, y: 0 },
            dragThreshold: 5,
        };
        this.option = {
            visual: {
                showHexGrid: true,
                showHexCoord: false,
                logHexCoord: false,
            },
        };
        this.flipped = false;

        this.canvas = document.getElementById(input.canvasId);
        if (!this.canvas) throw new Error(`[BaseMainSurface] Parchment canvas not found`);
        this.ctx = this.canvas.getContext('2d');
        this._isLooping = true;
        this._lastFrameTime = null;
        this.emitter = input.emitter;
        this.declareZoomSettings();
        this.setup();
    };

    /**
     * Retrieves the pre-cached zoom level data for a given display mode, using a value stored in localStorage,
     * or falling back to the default zoom level if no stored value exists.
     *
     * @param {string} input.mode - The current display mode to retrieve zoom data for.
     * @param {Object} input.cachedData - Pre-cached data to be used in case stored zoom level is available.
     *
     * @returns {Object} - The pre-cached data object corresponding to the zoom level.
     *
     * Throws:
     *   An error if the default zoom level is undefined or not listed in available levels.
     */
    getPreCachedZoomLevelDataFromStorage(input) {
        const modeData = this.getDisplayModeData({ mode: input.mode, });
        const defaultZoom = modeData.defaultZoomLevel;
        if (defaultZoom === undefined) {
            throw new Error(`[BaseMainSurface] ${window.taggedString.noDefaultZoomLevelFound(input.mode)}`);
        }
        const levels = Object.keys(modeData.levels).map(Number);
        if (!levels.includes(defaultZoom)) {
            throw new Error(`[BaseMainSurface] ${taggedString.noDefaultZoomLevelDataFound(input.mode)}`);
        }

        const stored = localStorage.getItem(this.STORAGE_KEYS.ZOOM_LEVEL);
        if (stored === null) {
            localStorage.setItem(this.STORAGE_KEYS.ZOOM_LEVEL, defaultZoom);
            console.log(window.taggedString.noZoomInStorage());
            console.log(window.taggedString.fallBackToDefaultZoomLevel());
            return modeData.levels[defaultZoom];
        }

        const parsed = parseFloat(stored);
        const preCachedData = this.getPreCachedZoomLevelData({
            mode: input.mode,
            modeData, parsed,
            cachedData: input.cachedData
        });
        return preCachedData;
    };

    /**
     * Retrieves pre-cached data for a specific zoom level within a given display mode.
     *
     * @param {string} input.mode - The display mode being queried.
     * @param {Object} input.modeData - Zoom settings data for the given mode (should include a `levels` object).
     * @param {number} input.parsed - The zoom level to retrieve.
     * @param {Object} input.cachedData - Object containing all pre-cached zoom data by mode and zoom level.
     *
     * @returns {Object} - The pre-cached data object for the given mode and zoom level.
     * Throws:
     *   An error if no zoom level data exists in `modeData.levels` for the requested level.
     *   An error if no pre-cached data exists in `cachedData` for the requested mode and level.
     */
    getPreCachedZoomLevelData(input) {
        const data = input.modeData.levels[input.parsed];
        if (!data) {
            throw new Error(`[BaseMainSurface] ${window.taggedString.noZoomLevelDataFound(input.mode, input.parsed)}`);
        }
        const preCachedData = input.cachedData[input.mode]?.[input.parsed];
        if (!preCachedData) {
            throw new Error(`[BaseMainSurface] ${window.taggedString.noPreCachedZoomLevelDataFound(input.mode, input.parsed)}`);
        }
        return preCachedData;
    };

    /**
     * Retrieves zoom setting data for a specific display mode from internal configuration.
     *
     * @param {string} input.mode - The name of the display mode to retrieve settings for.
     *
     * @returns {Object} - The zoom settings data associated with the given mode.
     *
     * Throws:
     *   An error if the requested display mode is not defined in `zoomSettings`.
     */
    getDisplayModeData(input) {
        const modeData = this.zoomSettings[input.mode];
        if (!modeData) {
            throw new Error(`[BaseMainSurface] ${window.taggedString.invalidDisplayMode(input.mode)}`);
        }
        return modeData;
    };

    /**
     * Calculates core geometric parameters for hex tiles based on the canvas size,
     * display mode, and number of hexes across the key dimension.
     *
     * @param {number} input.canvasWidth - Width of the canvas in pixels.
     * @param {number} input.canvasHeight - Height of the canvas in pixels.
     * @param {string} input.mode - Display mode, either 'landscape' or 'portrait'.
     * @param {number} input.hexesPerDimension - Number of hexes along the primary dimension (height for landscape, width for portrait).
     *
     * @returns {Object} - Calculated hex geometry values:
     *   @property {number} side - Outer radius (center to corner) of a hex.
     *   @property {number} width - Width of a hex from flat side to flat side.
     *   @property {number} halfWidth - Half the width of a hex.
     *   @property {number} height - Full height of a hex from point to point.
     *   @property {number} coordFontSize - Recommended font size for drawing cube coordinates.
     *
     * Throws:
     *   An error if `hexesPerDimension` is not a valid positive integer.
     */
    calculateHexParam(input) {
        if (!Number.isInteger(input.hexesPerDimension) || input.hexesPerDimension < 1) {
            throw new Error(`[BaseMainSurface] ${window.taggedString.invalidNumberOfHexes()}`);
        }
        let side = 0;
        if (input.mode === 'landscape') {
            let decidingLength = input.canvasHeight;
            side = decidingLength / (1.5 * (input.hexesPerDimension - 1) + 2);
        } else {
            let decidingLength = input.canvasWidth;
            side = decidingLength / (input.hexesPerDimension * Math.sqrt(3));
        }
        const width = side * Math.sqrt(3);
        const halfWidth = width / 2;
        const height = side * 2;
        const coordFontSize = side * 0.15;
        return {
            side,
            width,
            halfWidth,
            height,
            coordFontSize,
        };
    };

    /**
     * Determines the map's width and height based on user input,
     * ensuring the smaller value is always assigned as the width
     * and the larger as the height.
     *
     * @param {number} input.userInputWidth - The width provided by the user.
     * @param {number} input.userInputHeight - The height provided by the user.
     * @returns {Object} An object containing:
     *   @property {number} width  - The smaller of the two input values.
     *   @property {number} height - The larger of the two input values.
     */
    setMapWidthAndHeight(input) {
        let width = input.userInputWidth;
        let height = input.userInputHeight;
        if (input.userInputWidth > input.userInputHeight) {
            width = input.userInputHeight;
            height = input.userInputWidth;
        }
        return { width, height, };
    };

    /**
     * Calculates map layout and hex grid parameters based on physical map size,
     * hex sizing, and canvas resolution.
     * Iteratively places hexes in a staggered pointy-top grid starting from top-left.
     * Tracks bounds of Q, R, and S cube coordinates while placing.
     * Calculates map's expected and final rendered dimensions.
     * Uses hardcoded 1.5 * side for vertical step and full width for horizontal step.
     * 
     * @param {number} input.hexWidthPerInch - Number of hexes that fit in one inch horizontally.
     * @param {number} input.hexWidth - Pixel width of a hex.
     * @param {number} input.hexHalfWidth - Half the pixel width of a hex.
     * @param {number} input.side - Outer radius of a hex (center to corner).
     * @param {number} input.mapWidthInInch - Total map width in inches.
     * @param {number} input.mapHeightInInch - Total map height in inches.
     * @param {number} input.canvasWidth - Width of the canvas in pixels.
     * @param {number} input.canvasHeight - Height of the canvas in pixels.
     *
     * @returns {Object} Object with `mapParam` and `gridParam` properties:
     *   @property {Object} mapParam - Calculated map layout dimensions:
     *     @property {number} widthInInch - Input width in inches.
     *     @property {number} heightInInch - Input height in inches.
     *     @property {number} expectedWidth - Target width in pixels based on hex density.
     *     @property {number} expectedHeight - Target height in pixels.
     *     @property {number} width - Actual pixel width used (based on hex placement).
     *     @property {number} height - Actual pixel height used (rounded to nearest hex row).
     *     @property {number} padHorizontal - Horizontal padding in pixels (1 inch).
     *     @property {number} padVertical - Vertical padding in pixels (1 inch).
     *
     *   @property {Object} gridParam - Metadata and full list of placed hexes:
     *     @property {Object<string, Hex>} hexList - Dictionary of all hexes, keyed by cube coordinates.
     *     @property {number} minQ - Minimum Q coordinate in the grid.
     *     @property {number} maxQ - Maximum Q coordinate.
     *     @property {number} minR - Minimum R coordinate (always 0).
     *     @property {number} maxR - Maximum R coordinate.
     *     @property {number} minS - Minimum S coordinate.
     *     @property {number} maxS - Maximum S coordinate.
     *     @property {number} hexPerEvenRow - Number of hexes on any even row (max number of hexes in any row).
     *     @property {number} estimateHexPerWidth - Rough estimate of how many hexes fit horizontally.
     *     @property {number} estimateHexPerHeight - Rough estimate of vertical hex count.
     */
    calculateMapAndGridParam(input) {
        const pixelPerInch = input.hexWidthPerInch * input.hexWidth;
        const hexPerEvenRow = input.mapWidthInInch * input.hexWidthPerInch;
        const expectedMapWidthInPixel = input.mapWidthInInch * pixelPerInch;
        const expectedMapHeightInPixel = input.mapHeightInInch * pixelPerInch;
        let rowNum = Math.floor(((expectedMapHeightInPixel - input.side) / (1.5 * input.side)) + 1);
        // Ensure the number of rows is an odd number.
        // So the last row is always full (not shifted).
        if (rowNum % 2 == 0) {
            rowNum++;
        }

        let yCoord = input.side;
        let q = 0;
        let r = 0;
        let s = 0;
        let xCoord = input.hexHalfWidth;
        const result = {
            gridParam: { hexList: {}, },
            mapParam: {},
        };
        let maxX = -Infinity;
        let minQ = Infinity, maxQ = -Infinity;
        let minS = Infinity, maxS = -Infinity;
        for (let row = 0; row < rowNum; row++) {
            let maxHex = hexPerEvenRow;
            xCoord = input.hexHalfWidth;
            if (r % 2 != 0) {
                xCoord = input.hexWidth;
                maxHex = hexPerEvenRow - 1;
            }
            q = - Math.floor(r / 2);
            s = - (q + r);
            for (let hex = 0; hex < maxHex; hex++) {
                let aHex = new OPRSClasses.Hex({
                    centerX: xCoord,
                    centerY: yCoord,
                    q, r, s,
                    side: input.side,
                    hexHalfWidth: input.hexHalfWidth,
                });
                let listKey = window.OPRSClasses.Hex.createListKey({ q, r, s, });
                result.gridParam.hexList[listKey] = aHex;

                // Update maxX
                const right = xCoord + input.hexHalfWidth;
                maxX = Math.max(maxX, right);

                // Update q and s bounds
                minQ = Math.min(minQ, q);
                maxQ = Math.max(maxQ, q);
                minS = Math.min(minS, s);
                maxS = Math.max(maxS, s);

                xCoord = xCoord + input.hexWidth;
                q = q + 1;
                s = s - 1;
            }
            yCoord = yCoord + (input.side * 1.5);
            r = r + 1;
        }
        result.mapParam = {
            widthInInch: input.mapWidthInInch,
            heightInInch: input.mapHeightInInch,
            expectedWidth: expectedMapWidthInPixel,
            expectedHeight: expectedMapHeightInPixel,
            width: maxX,
            height: yCoord - (input.side / 2),
            padHorizontal: pixelPerInch * 1,
            padVertical: pixelPerInch * 1,
        };
        result.gridParam.minQ = minQ;
        result.gridParam.maxQ = maxQ;
        result.gridParam.minR = 0;
        result.gridParam.maxR = r - 1;
        result.gridParam.minS = minS;
        result.gridParam.maxS = maxS;
        result.gridParam.estimateHexPerWidth = Math.floor(input.canvasWidth / input.hexHalfWidth / 2);
        result.gridParam.estimateHexPerHeight = Math.floor(input.canvasHeight / input.side / 1.5) + 1;
        result.gridParam.hexPerEvenRow = hexPerEvenRow;
        this.setHexListFlipCoord({
            hexList: result.gridParam.hexList,
            mapWidth: maxX,
        });
        return result;
    };

    /**
     * Calculates initial camera parameters including offset bounds, centered position, and movement speed.
     * Clamps the initial camera offset to stay within extended bounds.
     * Calculates camera move speed proportional to hex width.
     * Centering is based on the difference between canvas size and map size.
     *
     * @param {number} input.mapWidth - Width of the rendered map in pixels.
     * @param {number} input.mapHeight - Height of the rendered map in pixels.
     * @param {number} input.canvasWidth - Width of the canvas viewport in pixels.
     * @param {number} input.canvasHeight - Height of the canvas viewport in pixels.
     * @param {number} input.padHorizontal - Extra horizontal padding to allow camera movement beyond map edges.
     * @param {number} input.padVertical - Extra vertical padding to allow camera movement beyond map edges.
     * @param {number} input.hexWidth - Width of a single hex in pixels (used to scale move speed).
     * @param {number} input.zoomLevel - Current zoom level (passed through to return).
     *
     * @returns {Object} Object containing calculated camera properties:
     *   @property {number} maxOffsetX - Maximum allowed X offset.
     *   @property {number} maxOffsetY - Maximum allowed Y offset.
     *   @property {number} minOffsetX - Minimum allowed X offset.
     *   @property {number} minOffsetY - Minimum allowed Y offset.
     *   @property {number} offsetX - Initial clamped horizontal offset (centered).
     *   @property {number} offsetY - Initial clamped vertical offset (centered).
     *   @property {number} moveSpeed - Pixel amount camera moves per step, scaled by hex size.
     *   @property {number} zoomLevel - Same zoom level passed in input.
     */
    calculateCameraParam(input) {
        // Bounds when adding offsets:
        const minOffsetX = -input.padHorizontal;
        const minOffsetY = -input.padVertical;

        const maxOffsetX = input.mapWidth + input.padHorizontal - input.canvasWidth;
        const maxOffsetY = input.mapHeight + input.padVertical - input.canvasHeight;

        // Center camera
        let offsetX = (input.mapWidth - input.canvasWidth) / 2;
        let offsetY = (input.mapHeight - input.canvasHeight) / 2;
        // Clamp to bounds
        offsetX = Shared.clamp({ max: maxOffsetX, min: minOffsetX, value: offsetX, });
        offsetY = Shared.clamp({ max: maxOffsetY, min: minOffsetY, value: offsetY, });

        const moveSpeed = input.hexWidth * 1.3;
        return {
            maxOffsetX, maxOffsetY,
            minOffsetX, minOffsetY,
            offsetX, offsetY,
            moveSpeed,
            zoomLevel: input.zoomLevel,
        };
    };

    /**
     * Computes all key rendering and interaction parameters based on zoom-level configuration and canvas settings.
     * Determines hex geometry using canvas dimensions and layout mode.
     * Calculates map layout and hex grid data using physical map size and hex dimensions.
     * Computes camera limits and centered offset based on map size and canvas size.
     * 
     * @param {string} input.mode - Display mode ('landscape' or 'portrait').
     * @param {number} input.hexesPerDimension - Number of hexes along the deciding canvas dimension.
     * @param {number} input.canvasWidth - Width of the canvas in pixels.
     * @param {number} input.canvasHeight - Height of the canvas in pixels.
     * @param {number} input.hexWidthPerInch - Hex width in inches, used for scaling map size.
     * @param {number} input.mapWidthInInch - Width of the map in inches.
     * @param {number} input.mapHeightInInch - Height of the map in inches.
     * @param {number} input.zoomLevel - Zoom level used to calculate camera state.
     *
     * @returns {Object} Aggregated rendering parameters:
     *   @property {Object} hexParam - Hexagon size and layout measurements (side, width, height, etc.).
     *   @property {Object} mapParam - Pixel dimensions of the full map with padding.
     *   @property {Object} gridParam - Grid metadata including bounds and hex list.
     *   @property {Object} cameraParam - Initial camera settings including offset, bounds, and move speed.
     *
     * Behavior:
     
     */
    calculateParamsFromZoomData(input) {
        const hexParam = this.calculateHexParam({
            mode: input.mode,
            hexesPerDimension: input.hexesPerDimension,
            canvasWidth: input.canvasWidth,
            canvasHeight: input.canvasHeight,
        });
        const metaData = this.calculateMapAndGridParam({
            hexWidthPerInch: input.hexWidthPerInch,
            mapWidthInInch: input.mapWidthInInch,
            mapHeightInInch: input.mapHeightInInch,
            hexWidth: hexParam.width,
            hexHalfWidth: hexParam.halfWidth,
            side: hexParam.side,
            canvasWidth: input.canvasWidth,
            canvasHeight: input.canvasHeight,
        });
        const cameraParam = this.calculateCameraParam({
            padHorizontal: metaData.mapParam.padHorizontal,
            padVertical: metaData.mapParam.padVertical,
            mapWidth: metaData.mapParam.width,
            mapHeight: metaData.mapParam.height,
            canvasWidth: input.canvasWidth,
            canvasHeight: input.canvasHeight,
            hexWidth: hexParam.width,
            zoomLevel: input.zoomLevel,
        });
        return {
            hexParam,
            mapParam: metaData.mapParam,
            gridParam: metaData.gridParam,
            cameraParam,
        };
    };

    /**
     * Precomputes and caches all rendering parameters for every zoom level across all display modes.
     * Iterates over all display modes and their zoom levels defined in `this.zoomSettings`.
     * For each zoom level, calculates all rendering parameters by calling `calculateParamsFromZoomData`.
     * Returns a comprehensive cache object mapping modes and zoom levels to their computed parameters.
     *
     * @param {number} input.canvasWidth - Width of the canvas in pixels.
     * @param {number} input.canvasHeight - Height of the canvas in pixels.
     * @param {number} input.mapWidthInInch - Width of the map in inches.
     * @param {number} input.mapHeightInInch - Height of the map in inches.
     * @param {number} input.hexWidthPerInch - Number of hexes horizontally per inch.
     *
     * @returns {Object} - Nested cache object structured by mode and zoom level:
     *   Each zoom level object contains:
     *   @property {Object} hexParam - Hexagon size and layout measurements (side, width, height, etc.).
     *   @property {Object} mapParam - Pixel dimensions of the full map with padding.
     *   @property {Object} gridParam - Grid metadata including bounds and hex list.
     *   @property {Object} cameraParam - Initial camera settings including offset, bounds, and move speed.
     */
    preCalculateParamsFromZoomData(input) {
        const result = {};
        for (const [mode, modeData] of Object.entries(this.zoomSettings)) {
            result[mode] = {};
            const levelData = modeData.levels;
            for (const [zoomLevel, zoomData] of Object.entries(levelData)) {
                let params = this.calculateParamsFromZoomData({
                    mode,
                    hexesPerDimension: zoomData,
                    canvasWidth: input.canvasWidth,
                    canvasHeight: input.canvasHeight,
                    mapWidthInInch: input.mapWidthInInch,
                    mapHeightInInch: input.mapHeightInInch,
                    hexWidthPerInch: input.hexWidthPerInch,
                    zoomLevel,
                });
                result[mode][zoomLevel] = params;
            }
        };
        return result;
    };

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
        const cameraParam = input.cameraParam;
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
    };

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
            hexList: input.gridParam.hexList,
        });
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
    };

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
     * @param {Object<string, Hex>} input.hexList - Dictionary of all hex tiles keyed by cube coordinates.
     * @param {number} input.estimateHexPerWidth - Estimated number of hexes visible horizontally.
     * @param {number} input.estimateHexPerHeight - Estimated number of hexes visible vertically.
     * @param {boolean} input.flipped - Is this map flipped (mirror image)?
     *
     * @returns {Object<string, Hex>} - An object containing all hex tiles visible within the viewport plus padding,
     *   keyed by their cube coordinate keys.
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
            pointX: startX, pointY: startY, hexList: input.hexList,
            side: input.hexSide, hexHalfWidth: input.hexHalfWidth,
        });
        if (!startHex) {
            throw new Error(`[BaseMainSurface] ${taggedString.failedToGetStartHex(input.cameraOffsetX, input.cameraOffsetY)}`);
        }
        const safeguardHexData = window.OPRSClasses.Hex.getHexDataDistanceOfHex({
            distance: safeguardHexDistance,
            direction: Shared.HEX_DIRECTION.TOP_LEFT,
            hexList: input.hexList,
            q: startHex.q, r: startHex.r, s: startHex.s,
            flipped: input.flipped,
        });
        const safeGuardHex = safeguardHexData.transversedHexes[safeguardHexData.hexListKey];
        const safeGuardHorizontalDistance = input.estimateHexPerWidth + (safeguardHexDistance * 2);
        const safeGuardVerticalDistance = input.estimateHexPerHeight + (safeguardHexDistance * 2);
        let result = {};
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
                hexList: input.hexList,
                flipped: input.flipped,
            });
            result = { ...result, ...transverseLeftData.transversedHexes };
            const transverseBottomRightData = window.OPRSClasses.Hex.getHexDataDistanceOfHex({
                q: currentQ, r: currentR, s: currentS,
                distance: 1,
                direction,
                hexList: input.hexList,
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
        return result;
    };

    /**
     * Set horizontal flip coord to be the draw coord for every hex in the provided hex list.
     *
     * @param {Object} input.hexList - A dictionary of hexes keyed by their cube coordinates.
     * @param {number} input.mapWidth - Total pixel width of the map, used to calculate flipped positions.
     */
    setHexListFlipCoord(input) {
        for (const [key, hex] of Object.entries(input.hexList)) {
            hex.setFlipCoord({ mapWidth: input.mapWidth, });
        }
    };

    /**
     * Updates the drawing X coordinates for each hex in the provided hex list.
     * Delegates to each hex's `flip` method to set either the flipped or normal
     * X coordinates based on the `flipped` flag.
     *
     * @param {Object} input.hexList - A map of hex keys to Hex instances.
     * @param {boolean} input.flipped - Whether to apply flipped X coordinates.
     */
    setHexDrawXCoord(input) {
        for (const [key, hex] of Object.entries(input.hexList)) {
            hex.flip({ flipped: input.flipped, });
        }
    };

    // For debug purpose
    flipMap(input) {
        this.flipped = !this.flipped;
        if (!input) {
            input = {
                hexList: this.gridParam.hexList,
            };
        }
        if (!input.hexList) {
            input.hexList = this.gridParam.hexList;
        }
        for (const [key, hex] of Object.entries(input.hexList)) {
            hex.flip({ flipped: this.flipped, });
        }
    };

    // CONSIDER TO REMOVE
    // calculateRowMinMaxQS(input) {
    //     const result = {};
    //     for (let r = input.minR; r <= input.maxR; r++) {
    //         const rowResult = window.OPRSClasses.Hex.getRowMinMaxQS({
    //             r, maxQ: input.maxQ, minR: input.minR,
    //         });
    //         result[r] = rowResult;
    //     }
    //     return result;
    // };

    declareZoomSettings() {
        throw new Error("[BaseMainSurface] Zoom settings must be implemented in subclass!");
    };

    setup() {
        throw new Error("BaseMainSurface] Setup must be implemented in subclass!");
    };
};