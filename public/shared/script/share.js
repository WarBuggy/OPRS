class Shared {
    static STORAGE_KEYS = {
        LANGUAGE: 'language',
        ZOOM_LEVEL: 'zoomLevel',
    };

    static zoomSettings = {
        landscape: {
            levels: {
                0.5: 6,
                1: 12,
                2: 24,
            },
            defaultZoomLevel: 1,
        },
        portrait: {
            levels: {
                0.5: 8,
                1: 16,
                2: 32,
            },
            defaultZoomLevel: 1,
        }
    };

    static getCurrentLanguage() {
        let lang = localStorage.getItem(Shared.STORAGE_KEYS.LANGUAGE);
        if (!lang) {
            lang = 'en';
            localStorage.setItem(Shared.STORAGE_KEYS.LANGUAGE, lang);
        }
        return lang;
    };

    static getTranslatableTexts() {
        const lang = Shared.getCurrentLanguage();
        const texts = window.translatableTexts?.[lang];

        if (!texts) {
            console.error(`No text set found for language "${lang}". Falling back to English.`);
            return window.translatableTexts.en;
        }
        return texts;
    };

    static getPreCachedZoomLevelDataFromStorage(input) {
        const modeData = Shared.getDisplayModeData({ mode: input.mode, });
        const defaultZoom = modeData.defaultZoomLevel;
        if (defaultZoom === undefined) {
            throw new Error(window.taggedString.noDefaultZoomLevelFound(input.mode));
        }
        const levels = Object.keys(modeData.levels).map(Number);
        if (!levels.includes(defaultZoom)) {
            throw new Error(taggedString.noDefaultZoomLevelDataFound(input.mode));
        }

        const stored = localStorage.getItem(Shared.STORAGE_KEYS.ZOOM_LEVEL);
        if (stored === null) {
            localStorage.setItem(Shared.STORAGE_KEYS.ZOOM_LEVEL, defaultZoom);
            console.log(window.taggedString.noZoomInStorage());
            console.log(window.taggedString.fallBackToDefaultZoomLevel());
            return modeData.levels[defaultZoom];
        }

        const parsed = parseFloat(stored);
        const preCachedData = Shared.getPreCachedZoomLevelData({
            mode: input.mode,
            modeData, parsed,
            cachedData: input.cachedData
        });
        return preCachedData;
    };

    static getPreCachedZoomLevelData(input) {
        const data = input.modeData.levels[input.parsed];
        if (!data) {
            throw new Error(window.taggedString.noZoomLevelDataFound(input.mode, input.parsed));
        }
        const preCachedData = input.cachedData[input.mode]?.[input.parsed];
        if (!preCachedData) {
            throw new Error(window.taggedString.noPreCachedZoomLevelDataFound(input.mode, input.parsed));
        }
        return preCachedData;
    };

    static getDisplayModeData(input) {
        const modeData = Shared.zoomSettings[input.mode];
        if (!modeData) {
            throw new Error(window.taggedString.invalidDisplayMode(input.mode));
        }
        return modeData;
    };

    static calculateHexParam(input) {
        if (!Number.isInteger(input.hexesPerDimension) || input.hexesPerDimension < 1) {
            throw new Error(window.taggedString.invalidNumberOfHexes());
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

    static setupHexList(input) {
        const pixelPerInch = input.hexWidthPerInch * input.hexWidth;
        const expectedMapWidthInPixel = input.mapWidthInInch * pixelPerInch;
        const expectedMapHeightInPixel = input.mapHeightInInch * pixelPerInch;

        let yCoord = input.side;
        let q = 0;
        let r = 0;
        let s = 0;
        let xCoord = input.hexHalfWidth;
        const result = {
            hexList: {},
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
                result.hexList[listKey] = aHex;

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
            minQ, maxQ,
            minR: 0, maxR: r - 1,
            minS, maxS,
        };
        return result;
    };

    static calculateCameraParam(input) {
        const maxOffsetX = input.expectedMapWidth - input.mapWidth;
        const maxOffsetY = input.expectedMapHeight - input.mapHeight;
        const minOffsetX = input.canvasWidth - input.mapWidth - maxOffsetX;
        const minOffsetY = input.canvasHeight - input.mapHeight - maxOffsetY;
        let cameraOffsetX = maxOffsetX;
        let cameraOffsetY = maxOffsetY;
        let moveSpeed = input.hexWidth * 1.3;
        return {
            maxOffsetX, maxOffsetY,
            minOffsetX, minOffsetY,
            cameraOffsetX, cameraOffsetY,
            moveSpeed,
        };
    };

    static calculateParamsFromZoomData(input) {
        const hexParam = Shared.calculateHexParam({
            mode: input.mode,
            hexesPerDimension: input.hexesPerDimension,
            canvasWidth: input.canvasWidth,
            canvasHeight: input.canvasHeight,
        });
        const metaData = Shared.setupHexList({
            hexWidthPerInch: Parchment.userMapInput.hexWidthPerInch,
            mapWidthInInch: Parchment.userMapInput.mapWidthInInch,
            mapHeightInInch: Parchment.userMapInput.mapHeightInInch,
            hexWidth: hexParam.width,
            hexHalfWidth: hexParam.halfWidth,
            side: hexParam.side,
        });
        const cameraParam = Shared.calculateCameraParam({
            expectedMapWidth: metaData.mapParam.expectedWidth,
            expectedMapHeight: metaData.mapParam.expectedHeight,
            mapWidth: metaData.mapParam.width,
            mapHeight: metaData.mapParam.height,
            canvasWidth: input.canvasWidth,
            canvasHeight: input.canvasHeight,
            hexWidth: hexParam.width,
        });
        return {
            hexParam,
            mapParam: metaData.mapParam,
            hexList: metaData.hexList,
            cameraParam,
        };
    };

    static preCalculateParamsFromZoomData(input) {
        const result = {};
        for (const [mode, modeData] of Object.entries(Shared.zoomSettings)) {
            result[mode] = {};
            const levelData = modeData.levels;
            for (const [zoomLevel, zoomData] of Object.entries(levelData)) {
                let params = Shared.calculateParamsFromZoomData({
                    mode,
                    hexesPerDimension: zoomData,
                    canvasWidth: input.canvasWidth,
                    canvasHeight: input.canvasHeight,
                });
                result[mode][zoomLevel] = params;
            }
        };
        return result;
    };
};