class BaseMainSurface {
    constructor(input) {
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
        this.STORAGE_KEYS = {
            ZOOM_LEVEL: input.storageKeyZoomLevel,
        };
        this.canvas = document.getElementById(input.canvasId);
        if (!this.canvas) throw new Error(`[BaseMainSurface] Parchment canvas not found`);
        this.ctx = this.canvas.getContext('2d');
        this.canvas.width = this.canvas.parentElement.offsetWidth;
        this.canvas.height = this.canvas.parentElement.offsetHeight;
        this._isLooping = true;
        this._lastFrameTime = null;
        this.emitter = input.emitter;
        this.declareZoomSettings();
        this.setup();
    };

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

    getDisplayModeData(input) {
        const modeData = this.zoomSettings[input.mode];
        if (!modeData) {
            throw new Error(`[BaseMainSurface] ${window.taggedString.invalidDisplayMode(input.mode)}`);
        }
        return modeData;
    };

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

    calculateMapAndGridParam(input) {
        const pixelPerInch = input.hexWidthPerInch * input.hexWidth;
        const expectedMapWidthInPixel = input.mapWidthInInch * pixelPerInch;
        const expectedMapHeightInPixel = input.mapHeightInInch * pixelPerInch;

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
        while (yCoord + input.side <= expectedMapHeightInPixel) {
            xCoord = input.hexHalfWidth;
            if (r % 2 != 0) {
                xCoord = input.hexWidth;
            }
            q = - Math.floor(r / 2);
            s = - (q + r);
            while (xCoord + input.hexHalfWidth <= expectedMapWidthInPixel) {
                let aHex = new Hex({
                    centerX: xCoord,
                    centerY: yCoord,
                    q, r, s,
                    side: input.side,
                    hexHalfWidth: input.hexHalfWidth,
                });
                let listKey = Hex.createListKey({ q, r, s, });
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
            padHorizontal: input.side * 2,
            padVertical: input.side * 2,
        };
        result.gridParam.minQ = minQ;
        result.gridParam.maxQ = maxQ;
        result.gridParam.minR = 0;
        result.gridParam.maxR = r - 1;
        result.gridParam.minS = minS;
        result.gridParam.maxS = maxS;
        return result;
    };

    calculateCameraParam(input) {
        // Bounds when adding offsets:
        const maxOffsetX = input.padHorizontal;
        const maxOffsetY = input.padVertical;

        const minOffsetX = input.canvasWidth - input.mapWidth - input.padHorizontal;
        const minOffsetY = input.canvasHeight - input.mapHeight - input.padVertical;

        // Center camera: offsetX/Y = canvasCenter - mapCenter
        const totalWidth = input.mapWidth + input.padHorizontal * 2;
        const totalHeight = input.mapHeight + input.padVertical * 2;
        let offsetX = (input.canvasWidth / 2) - (totalWidth / 2);
        let offsetY = (input.canvasHeight / 2) - (totalHeight / 2);
        // Clamp to bounds
        offsetX = Math.min(maxOffsetX, Math.max(minOffsetX, offsetX));
        offsetY = Math.min(maxOffsetY, Math.max(minOffsetY, offsetY));

        const moveSpeed = input.hexWidth * 1.3;
        return {
            maxOffsetX, maxOffsetY,
            minOffsetX, minOffsetY,
            offsetX, offsetY,
            moveSpeed,
            zoomLevel: input.zoomLevel,
        };
    };

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

    clampCameraOffset(input) {
        const cameraParam = input.cameraParam;
        if (!input.valueX) {
            input.valueX = cameraParam.offsetX;
        }
        if (!input.valueY) {
            input.valueY = cameraParam.offsetY;
        }
        cameraParam.offsetX = Math.max(cameraParam.minOffsetX,
            Math.min(cameraParam.maxOffsetX, input.valueX));
        cameraParam.offsetY = Math.max(cameraParam.minOffsetY,
            Math.min(cameraParam.maxOffsetY, input.valueY));
    };

    updateMouseMapPosition(input) {
        input.userInputParam.mouseMapPos.x = input.userInputParam.mousePos.x - input.cameraParam.offsetX;
        input.userInputParam.mouseMapPos.y = input.userInputParam.mousePos.y - input.cameraParam.offsetY;
        input.userInputParam.currentMouseOverHex = Hex.getHexFromCoord({
            pointX: input.userInputParam.mouseMapPos.x,
            pointY: input.userInputParam.mouseMapPos.y,
            side: input.hexParam.side,
            hexHalfWidth: input.hexParam.halfWidth,
            hexList: input.gridParam.hexList,
        });
        // CONSIDER TO REMOVE
        // console.debug(parent.userInputParam.mouseMapPos);
        // console.debug(Parchment.mapParam.padHorizontal, Parchment.mapParam.padVertical);
        // if (parent.userInputParam.currentMouseOverHex) {
        //     console.debug(`offset X: ${parent.userInputParam.mouseMapPos.x}, offset Y: ${parent.userInputParam.mouseMapPos.y}, (${parent.userInputParam.currentMouseOverHex.q}, ${parent.userInputParam.currentMouseOverHex.r}, ${parent.userInputParam.currentMouseOverHex.s}), centerX: ${parent.userInputParam.currentMouseOverHex.centerX}, centerY: ${parent.userInputParam.currentMouseOverHex.centerY}`);
        // } else {
        //     console.debug(`No found in hex list`);
        // }
    };

    // CONSIDER TO REMOVE
    // calculateRowMinMaxQS(input) {
    //     const result = {};
    //     for (let r = input.minR; r <= input.maxR; r++) {
    //         const rowResult = Hex.getRowMinMaxQS({
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