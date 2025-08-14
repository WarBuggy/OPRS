export class BaseMiniMap {

    /**
     * Initializes the BaseMiniMap instance by setting up canvas, context, and user input tracking.
     *
     * @param {string} input.canvasId - The DOM ID of the mini-map canvas element.
     * @param {EventEmitter} input.emitter - Event emitter used for communicating interactions.
     *
     * Throws:
     *   An error if the canvas element cannot be found in the DOM.
     */
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
        this.ctx = this.canvas.getContext(`2d`);
        this.emitter = input.emitter;
    };

    /**
     * Precomputes scaled layout and camera dimensions for all zoom levels in all modes
     * using cached unscaled parameters.
     *
     * @param {Object} input.zoomCachedData - Cached zoom data from `calculateParamsFromZoomData`.
     * @param {number} input.cameraWidth - Camera viewport width in pixels.
     * @param {number} input.cameraHeight - Camera viewport height in pixels.
     *
     * @returns {Object} - Nested cache object structured by mode and zoom level:
     *   Each zoom level object contains:
     *   @property {Object} scaledMapParam - Scaled dimensions and offsets for fitting the padded map:
     *     @property {number} scale - Uniform scale factor applied.
     *     @property {number} width - Scaled width of the unpadded map.
     *     @property {number} height - Scaled height of the unpadded map.
     *     @property {number} offsetX - Horizontal offset to center unpadded map in canvas.
     *     @property {number} offsetY - Vertical offset to center unpadded map in canvas.
     *     @property {number} widthWithPadding - Scaled total width of the padded map.
     *     @property {number} heightWithPadding - Scaled total height of the padded map.
     *     @property {number} withPaddingOffsetX - Horizontal offset to center padded map.
     *     @property {number} withPaddingOffsetY - Vertical offset to center padded map.
     *   @property {Object} scaledCameraParam - Camera dimensions adjusted by map scale:
     *     @property {number} width - Scaled camera width.
     *     @property {number} height - Scaled camera height.
     */
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

    /**
     * Retrieves pre-cached zoom-level data for a specific mode and zoom level.
     *
     * @param {string} input.mode - The current mode (e.g., "view", "edit") used as top-level cache key.
     * @param {number|string} input.zoomLevel - The zoom level to retrieve. Parsed as float.
     * @param {Object} input.zoomCachedData - Precomputed zoom data structured by mode and zoom level.
     *
     * @returns {Object} - Cached zoom-level object for the specified mode and level:
     *   @property {Object} scaledMapParam - Scaled dimensions and offsets for fitting the padded map:
     *     @property {number} scale - Uniform scale factor applied.
     *     @property {number} width - Scaled width of the unpadded map.
     *     @property {number} height - Scaled height of the unpadded map.
     *     @property {number} offsetX - Horizontal offset to center unpadded map in canvas.
     *     @property {number} offsetY - Vertical offset to center unpadded map in canvas.
     *     @property {number} widthWithPadding - Scaled total width of the padded map.
     *     @property {number} heightWithPadding - Scaled total height of the padded map.
     *     @property {number} withPaddingOffsetX - Horizontal offset to center padded map.
     *     @property {number} withPaddingOffsetY - Vertical offset to center padded map.
     *   @property {Object} scaledCameraParam - Camera dimensions adjusted by map scale:
     *     @property {number} width - Scaled camera width.
     *     @property {number} height - Scaled camera height.
     *
     * Throws
     *   An error if no cached zoom-level data is found for the specified mode and zoom level.
     */
    getPreCachedZoomLevelData(input) {
        const preCachedData = input.zoomCachedData[input.mode]?.[parseFloat(input.zoomLevel)];
        if (!preCachedData) {
            throw new Error(`[BaseMiniMap] ${window.taggedString.noPreCachedZoomLevelDataFound(input.mode, input.zoomLevel)}`);
        }
        return preCachedData;
    };

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