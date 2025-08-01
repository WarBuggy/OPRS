class BaseMiniMap {
    constructor(input) {
        this.userInputParam = {
            mouseX: null,
            mouseY: null,
            cursorInsidePaddedMap: false,
            scaledClickOffsetX: null,
            scaledClickOffsetY: null,
        };

        this.canvas = document.getElementById(input.canvasId);
        if (!this.canvas) throw new Error(`[BaseMiniMap] Mini-map canvas not found`);
        this.canvas.width = this.canvas.parentElement.offsetWidth;
        this.canvas.height = this.canvas.parentElement.offsetHeight;
        this.ctx = this.canvas.getContext(`2d`);
        this.emitter = input.emitter;
    };

    preCalculateParamsFromZoomData(input) {
        const result = {};
        for (const [mode, modeData] of Object.entries(input.zoomCachedData)) {
            result[mode] = {};
            for (const [zoomLevel, zoomData] of Object.entries(modeData)) {
                const scaledMapParam = this.scaleRectToFit({
                    fullMapWidth: zoomData.mapParam.width,
                    fullMapHeight: zoomData.mapParam.height,
                    mapPadHorizontal: zoomData.mapParam.padHorizontal,
                    mapPadVertical: zoomData.mapParam.padVertical,
                });
                const scaledCameraParam = {
                    width: input.cameraWidth * scaledMapParam.scale,
                    height: input.cameraHeight * scaledMapParam.scale,
                }
                result[mode][parseFloat(zoomLevel)] = {
                    scaledMapParam,
                    scaledCameraParam,
                };
            }
        };
        return result;
    };

    getPreCachedZoomLevelData(input) {
        const preCachedData = input.zoomCachedData[input.mode]?.[parseFloat(input.zoomLevel)];
        if (!preCachedData) {
            throw new Error(`[BaseMiniMap] ${window.taggedString.noPreCachedZoomLevelDataFound(input.mode, input.zoomLevel)}`);
        }
        return preCachedData;
    };

    scaleRectToFit(input) {
        const mapWidthWithPadding = input.fullMapWidth + (input.mapPadHorizontal * 2);
        const mapHeightWithPadding = input.fullMapHeight + (input.mapPadVertical * 2);
        const scale = Math.min(this.canvas.width / mapWidthWithPadding, this.canvas.height / mapHeightWithPadding);
        const newWidth = input.fullMapWidth * scale;
        const newHeight = input.fullMapHeight * scale;
        const widthWithPadding = mapWidthWithPadding * scale;
        const heightWithPadding = mapHeightWithPadding * scale;
        const withPaddingOffsetX = (this.canvas.width - widthWithPadding) / 2;
        const withPaddingOffsetY = (this.canvas.height - heightWithPadding) / 2;
        const offsetX = (this.canvas.width - newWidth) / 2;
        const offsetY = (this.canvas.height - newHeight) / 2;
        return {
            scale,
            width: newWidth,
            height: newHeight,
            offsetX,
            offsetY,
            widthWithPadding, heightWithPadding,
            withPaddingOffsetX, withPaddingOffsetY,
        };
    };

};