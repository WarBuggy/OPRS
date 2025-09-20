export class MapMini {
    constructor(input) {
        const { canvasId, emitter, } = input;
        this.userInputParam = {
            mouseX: null,
            mouseY: null,
            cursorInsidePaddedMap: false,
            scaledClickOffsetX: null,
            scaledClickOffsetY: null,
        };

        this.canvas = document.getElementById(canvasId);
        if (!this.canvas) throw new Error(`[MapMini] ${taggedString.mapMiniCanvasNotFound(canvasId)}`);
        this.ctx = this.canvas.getContext('2d');
        this.emitter = emitter;
    }

    processZoomData(input) {
        const { mapParam, cameraWidth, cameraHeight, cameraOffsetX, cameraOffsetY, } = input;
        const {
            width: fullMapWidth, height: fullMapHeight,
            padHorizontal: mapPadHorizontal, padVertical: mapPadVertical,
        } = mapParam;
        const scaledMapParam = this.scaleRectToFit({
            fullMapWidth, fullMapHeight,
            mapPadHorizontal, mapPadVertical,
        });
        const scaledCameraParam = {
            width: cameraWidth * scaledMapParam.scale,
            height: cameraHeight * scaledMapParam.scale,
        }
        this.setNewCameraOffset({
            scaledCameraParam, cameraOffsetX, cameraOffsetY,
            scale: scaledMapParam.scale,
        })
        this.scaledMapParam = scaledMapParam;
        this.scaledCameraParam = scaledCameraParam;
    };

    setNewCameraOffset(input) {
        const { scaledCameraParam, cameraOffsetX, cameraOffsetY, scale } = input;
        scaledCameraParam.offsetX = cameraOffsetX * scale;
        scaledCameraParam.offsetY = cameraOffsetY * scale;
    }


    /**
     * Calculates scaling and centering offsets to fit a padded map into the mini-map canvas.
     *
     * @param {number} input.fullMapWidth - Width of the unpadded map.
     * @param {number} input.fullMapHeight - Height of the unpadded map.
     * @param {number} input.mapPadHorizontal - Horizontal padding to apply around the map.
     * @param {number} input.mapPadVertical - Vertical padding to apply around the map.
     *
     * @returns {Object} - Scaled and centered layout parameters for rendering.
     *   @property {number} scale - Uniform scale factor applied to fit the padded map in canvas.
     *   @property {number} width - Scaled width of the unpadded map.
     *   @property {number} height - Scaled height of the unpadded map.
     *   @property {number} offsetX - Horizontal offset to center the unpadded map in canvas.
     *   @property {number} offsetY - Vertical offset to center the unpadded map in canvas.
     *   @property {number} widthWithPadding - Scaled total width of the padded map.
     *   @property {number} heightWithPadding - Scaled total height of the padded map.
     *   @property {number} withPaddingOffsetX - Horizontal offset to center padded map.
     *   @property {number} withPaddingOffsetY - Vertical offset to center padded map.
     */
    scaleRectToFit(input) {
        const { fullMapWidth, fullMapHeight, mapPadHorizontal, mapPadVertical, } = input;
        const mapWidthWithPadding = fullMapWidth + (mapPadHorizontal * 2);
        const mapHeightWithPadding = fullMapHeight + (mapPadVertical * 2);
        const scale = Math.min(this.canvas.width / mapWidthWithPadding, this.canvas.height / mapHeightWithPadding);
        const newWidth = fullMapWidth * scale;
        const newHeight = fullMapHeight * scale;
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
    }
}