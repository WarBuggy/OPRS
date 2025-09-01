export class Region {
    constructor(input) {
        const { regionName, regionData, mapParam, gridParam, hexParam, regionList } = input;
        this.name = regionName;
        this.keys = new Set();
        for (const shape of regionData.shapeList) {
            const box = this.regionToClampedPixelBox({ shape, mapParam, });
            const cornerHexes = this.getCornerHexes({
                box,
                side: hexParam.side,
                hexHalfWidth: hexParam.halfWidth,
                hexHeight: hexParam.height,
                hexArray: gridParam.hexArray,
            });
            const keys = this.getRegionHexKeys({ cornerHexes, hexArray: gridParam.hexArray, }).keys;
            for (const item of keys) {
                this.keys.add(item);
            }
        }
        // Merge included regions
        if (regionData.include) {
            for (const includeName of regionData.include) {
                const includeRegion = regionList.get(includeName);
                if (!includeRegion) {
                    throw new Error(`Included region "${includeName}" not resolved yet`);
                }
                for (const key of includeRegion.keys) {
                    this.keys.add(key);
                }
            }
        }

        // Remove excluded regions
        if (regionData.exclude) {
            for (const excludeName of regionData.exclude) {
                const excludeRegion = regionList.get(excludeName);
                if (!excludeRegion) {
                    throw new Error(`Excluded region "${excludeName}" not resolved yet`);
                }
                for (const key of excludeRegion.keys) {
                    this.keys.delete(key);
                }
            }
        }
    }

    /**
     * Convert a region definition into a clamped pixel bounding box.
     * Handles both fractional (relative) and inch-based units.
     * Ensures the returned box stays fully within the map boundaries.
     * Returns {left, right, top, bottom} in pixels, ready for hex membership checks.
     *
     * @param {Object} input.mapParam - { width, height, pixelPerInch }
     * @param {Object} input.regionData - { x, y, width, height, xInInch?, yInInch?, widthInInch?, heightInInch? }
     * @returns {Object} - { left, right, top, bottom } in pixels, clamped inside map
     */
    regionToClampedPixelBox(input) {
        const { shape, mapParam } = input;
        // Destructure region values, default _InInch flags to false
        const {
            x = 0,
            y = 0,
            width = 0,
            height = 0,
            xInInch = false,
            yInInch = false,
            widthInInch = false,
            heightInInch = false
        } = shape;

        // Convert each dimension to pixels
        const xPx = xInInch ? x * mapParam.pixelPerInch : x * mapParam.width;
        const yPx = yInInch ? y * mapParam.pixelPerInch : y * mapParam.height;
        const widthPx = widthInInch ? width * mapParam.pixelPerInch : width * mapParam.width;
        const heightPx = heightInInch ? height * mapParam.pixelPerInch : height * mapParam.height;

        // Compute normalized bounding box
        const left = Math.min(xPx, xPx + widthPx);
        const right = Math.max(xPx, xPx + widthPx);
        const top = Math.min(yPx, yPx + heightPx);
        const bottom = Math.max(yPx, yPx + heightPx);

        // Clamp box inside map boundaries
        const leftClamped = Math.max(0, left);
        const rightClamped = Math.min(mapParam.width, right);
        const topClamped = Math.max(0, top);
        const bottomClamped = Math.min(mapParam.height, bottom);

        return { left: leftClamped, right: rightClamped, top: topClamped, bottom: bottomClamped };
    }

    /**
     * Find the hexes corresponding to the four corners of a pixel bounding box.
     * If a corner does not belong to any hex, moves it inward by ±0.5 hexWidth / ±0.5 hexHeight depending on corner.
     * Throws an error if a corner still cannot be matched.
     *
     * @param {Object} box - { left, right, top, bottom } in pixels
     * @param {Object} hexHalfWidth - half the width of a hex
     * @param {Object} hexHeight - the height of a hex
     * @param {Object} hexArray - 2 dimensional array contains all the hexes
     * @param {Object} side - outer radius of a hex
     * @returns {Object} - { topLeft, topRight, bottomLeft, bottomRight } hex instances
     */
    getCornerHexes(input) {
        const { left, right, top, bottom } = input.box;
        const dev = 3; // pixels to make sure the final coord inside an neighboring hex
        const hexHalfWidth = input.hexHalfWidth;
        const hexHalfHeight = 0.5 * input.hexHeight;
        const side = input.side;
        const hexArray = input.hexArray;
        const corners = {
            topLeft: { x: left, y: top, dx: hexHalfWidth + dev, dy: hexHalfHeight + dev },
            topRight: { x: right, y: top, dx: -hexHalfWidth - dev, dy: hexHalfHeight + dev },
            bottomLeft: { x: left, y: bottom, dx: hexHalfWidth + dev, dy: -hexHalfHeight - dev },
            bottomRight: { x: right, y: bottom, dx: -hexHalfWidth - dev, dy: -hexHalfHeight - dev },
        };
        const result = {};
        for (const [cornerName, corner] of Object.entries(corners)) {
            let hex = window.OPRSClasses.Hex.getHexFromCoord({ pointX: corner.x, pointY: corner.y, side, hexArray, hexHalfWidth, }).hex;
            if (!hex) {
                const movedX = corner.x + corner.dx;
                const movedY = corner.y + corner.dy;
                hex = window.OPRSClasses.Hex.getHexFromCoord({ pointX: movedX, pointY: movedY, side, hexArray, hexHalfWidth, }).hex;
                if (!hex) {
                    throw new Error(taggedString.regionNoCornerHexFound(cornerName, corner.x, corner.y));
                }
            }

            result[cornerName] = hex;
        }
        return result;
    }

    /**
     * Generate a Set of all hex keys inside a region defined by 4 corner hexes
     * Assumes odd-r, pointy-top layout
     * Ensures last row extends fully to bottomRight.q
     *
     * @param {Object} input.cornerHexes - { topLeft, topRight, bottomLeft, bottomRight } Hex instances
     * @param {HexArray} input.hexArray - 2D array of all hexes
     * @returns {Set<number>} - Set of hex keys inside the region
     */
    getRegionHexKeys(input) {
        const { topLeft, topRight, bottomLeft, bottomRight } = input.cornerHexes;
        const hexArray = input.hexArray;

        const minR = topLeft.r;
        const maxR = bottomLeft.r;

        const qMinFirstRow = topLeft.q;
        const qMaxFirstRow = topRight.q;

        const keys = new Set();
        let lastHex = null;

        // Traverse all rows
        for (let r = minR; r <= maxR; r++) {
            const rowOffset = r - minR;
            const qMin = qMinFirstRow - Math.floor(rowOffset / 2);
            const qMax = qMaxFirstRow - Math.floor((rowOffset + 1) / 2);

            for (let q = qMin; q <= qMax; q++) {
                const hex = hexArray.get({ q, r, }).hex;
                if (hex) {
                    keys.add(hex.key);
                    lastHex = hex; // keep track of last hex processed
                }
            }
        }

        // Extend last row to bottomRight.q if needed
        if (lastHex) {
            for (let q = lastHex.q + 1; q <= bottomRight.q; q++) {
                const hex = hexArray.get({ q, r: lastHex.r, }).hex;
                if (hex) keys.add(hex.key);
            }
        }

        return { keys, };
    }
}