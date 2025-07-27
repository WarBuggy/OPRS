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

    static getZoomLevelDataFromStorage(input) {
        const modeData = Shared.zoomSettings[input.mode];
        if (modeData == null) {
            throw new Error(window.taggedString.invalidDisplayMode(input.mode));
        }

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
        const data = modeData.levels[parsed];
        if (data === undefined || data === null) {
            throw new Error(window.taggedString.noZoomLevelDataFound(input.mode, parsed));
        }
        return data;
    };

    static calculateHexParam(input) {
        if (!Number.isInteger(input.hexesPerDimension) || input.hexesPerDimension < 1) {
            throw new Error(window.taggedString.invalidNumberOfHexes());
        }
        let side = 0;
        if (input.mode === 'landscape') {
            side = input.decidingLength / (1.5 * (input.hexesPerDimension - 1) + 2);
        } else {
            side = input.decidingLength / (input.hexesPerDimension * Math.sqrt(3));
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
};