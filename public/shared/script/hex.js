class Hex {
    static TRANSVERSE_MOD_PARAM = {
        [Shared.HEX_DIRECTION.LEFT]: { qMod: -1, rMod: 0, sMod: 1, },
        [Shared.HEX_DIRECTION.RIGHT]: { qMod: 1, rMod: 0, sMod: -1, },
        [Shared.HEX_DIRECTION.TOP_LEFT]: { qMod: 0, rMod: -1, sMod: 1, },
        [Shared.HEX_DIRECTION.BOTTOM_RIGHT]: { qMod: 0, rMod: 1, sMod: -1, },
        [Shared.HEX_DIRECTION.TOP_RIGHT]: { qMod: 1, rMod: -1, sMod: 0, },
        [Shared.HEX_DIRECTION.BOTTOM_LEFT]: { qMod: -1, rMod: 1, sMod: 0, },
    };

    /**
     * Initializes a hex tile instance with calculated pixel positions for its center and corners,
     * as well as storing its cube coordinates and a unique key.
     *
     * @param {number} input.centerX - The X coordinate of the hex center in pixels.
     * @param {number} input.centerY - The Y coordinate of the hex center in pixels.
     * @param {number} input.side - The outer radius of the hex (distance from center to corner).
     * @param {number} input.hexHalfWidth - Half the width of the hex tile in pixels.
     * @param {number} input.q - Cube coordinate q of the hex.
     * @param {number} input.r - Cube coordinate r of the hex.
     * @param {number} input.s - Cube coordinate s of the hex (should satisfy q + r + s = 0).
     */
    constructor(input) {
        const halfHeight = input.side / 2;
        this.centerX = input.centerX;
        this.centerY = input.centerY;
        this.point0 = input.centerX - input.side;

        this.topX = input.centerX;
        this.topY = input.centerY - input.side;

        this.bottomX = input.centerX;
        this.bottomY = input.centerY + input.side;

        this.topLeftX = input.centerX - input.hexHalfWidth;
        this.topLeftY = input.centerY - halfHeight;

        this.topRightX = input.centerX + input.hexHalfWidth;
        this.topRightY = input.centerY - halfHeight;

        this.bottomLeftX = input.centerX - input.hexHalfWidth;
        this.bottomLeftY = input.centerY + halfHeight;

        this.bottomRightX = input.centerX + input.hexHalfWidth;
        this.bottomRightY = input.centerY + halfHeight;

        this.q = input.q;
        this.r = input.r;
        this.s = input.s;

        this.qX = input.centerX - input.hexHalfWidth * 0.4;
        this.qY = input.centerY - halfHeight * 0.9;
        this.rX = input.centerX + input.hexHalfWidth * 0.6;
        this.rY = input.centerY;
        this.sX = input.centerX - input.hexHalfWidth * 0.4;
        this.sY = input.centerY + halfHeight * 0.9;

        this.key = Hex.createListKey({
            q: this.q,
            r: this.r,
            s: this.s,
        });
    };

    /**
     * Creates a closed path outlining the hex shape on the canvas, adjusted for camera offset.
     * Intended for use with `stroke()` or `fill()` to render the hex tile.
     *
     * @param {CanvasRenderingContext2D} input.canvasCtx - The 2D rendering context used to draw on the canvas.
     * @param {number} input.cameraOffsetX - Horizontal camera offset to apply.
     * @param {number} input.cameraOffsetY - Vertical camera offset to apply.
     */
    createPath(input) {
        input.canvasCtx.moveTo(this.topX - input.cameraOffsetX, this.topY - input.cameraOffsetY);
        input.canvasCtx.lineTo(this.topRightX - input.cameraOffsetX, this.topRightY - input.cameraOffsetY);
        input.canvasCtx.lineTo(this.bottomRightX - input.cameraOffsetX, this.bottomRightY - input.cameraOffsetY);
        input.canvasCtx.lineTo(this.bottomX - input.cameraOffsetX, this.bottomY - input.cameraOffsetY);
        input.canvasCtx.lineTo(this.bottomLeftX - input.cameraOffsetX, this.bottomLeftY - input.cameraOffsetY);
        input.canvasCtx.lineTo(this.topLeftX - input.cameraOffsetX, this.topLeftY - input.cameraOffsetY);
        input.canvasCtx.lineTo(this.topX - input.cameraOffsetX, this.topY - input.cameraOffsetY);
    };

    /**
     * Draws the cube coordinates (q, r, s) of the hex tile on the canvas at their respective label positions,
     * adjusted for camera offset.
     *
     * @param {Object} input - Parameters for rendering.
     * @param {CanvasRenderingContext2D} input.canvasCtx - The 2D rendering context used to draw text on the canvas.
     * @param {number} input.cameraOffsetX - Horizontal camera offset to apply.
     * @param {number} input.cameraOffsetY - Vertical camera offset to apply.
     */
    drawCoord(input) {
        input.canvasCtx.fillText(this.q, this.qX - input.cameraOffsetX, this.qY - input.cameraOffsetY);
        input.canvasCtx.fillText(this.r, this.rX - input.cameraOffsetX, this.rY - input.cameraOffsetY);
        input.canvasCtx.fillText(this.s, this.sX - input.cameraOffsetX, this.sY - input.cameraOffsetY);
    };

    /**
     * Rounds fractional cube coordinates to the nearest valid hex tile coordinate.
     * Ensures the cube coordinates fall exactly on a valid hex tile by rounding and correcting
     * the component with the largest rounding error to maintain the cube constraint (q + r + s = 0).
     * Taken from https://www.redblobgames.com/grids/hexagons/#rounding
     *
     * @param {number} input.fracQ - Fractional q coordinate.
     * @param {number} input.fracR - Fractional r coordinate.
     * @param {number} input.fracS - Fractional s coordinate (should satisfy fracQ + fracR + fracS ≈ 0).
     *
     * @returns {Object} - Rounded cube coordinates with integer values:
     *   @property {number} q - Rounded q coordinate.
     *   @property {number} r - Rounded r coordinate.
     *   @property {number} s - Rounded s coordinate.
     */
    static cubeRound(input) {
        let q = Math.round(input.fracQ);
        let r = Math.round(input.fracR);
        let s = Math.round(input.fracS);

        let qDiff = Math.abs(q - input.fracQ)
        let rDiff = Math.abs(r - input.fracR)
        let sDiff = Math.abs(s - input.fracS)

        if (qDiff > rDiff && qDiff > sDiff) {
            q = -r - s;
        } else if (rDiff > sDiff) {
            r = -q - s
        } else {
            s = -q - r;
        }
        return { q, r, s };
    };

    /**
     * Converts a 2D canvas pixel coordinate to a cube-coordinate of a hex tile.
     * Maps a pixel coordinate on a pointy-top hex grid to the corresponding hex tile using
     * inverse scaling and axial-to-cube coordinate conversion, followed by rounding to the nearest hex.
     * Taken from https://www.redblobgames.com/grids/hexagons/#pixel-to-hex
     *
     * @param {number} input.pointX - The X position in pixels.
     * @param {number} input.pointY - The Y position in pixels.
     * @param {number} input.side - The outer radius (distance from center to a corner) of the hex.
     * @param {number} input.hexHalfWidth - Half the width of a hex tile in pixels.
     *
     * @returns {Object} - A hex coordinate in cube format with rounded integers:
     *   @property {number} q - Cube coordinate q.
     *   @property {number} r - Cube coordinate r.
     *   @property {number} s - Cube coordinate s.
     */
    static pixelToHexCoord(input) {
        // invert the scaling
        let x = (input.pointX - input.hexHalfWidth) / input.side;
        let y = (input.pointY - input.side) / input.side;
        // cartesian to hex
        let q = (Math.sqrt(3) / 3 * x - 1.0 / 3 * y);
        let r = 2.0 / 3 * y;
        let s = 0 - (q + r);
        return Hex.cubeRound({ fracQ: q, fracR: r, fracS: s, });
    };

    /**
     * Creates a unique string key from cube coordinates.
     *
     * @param {Object} input - Cube coordinates.
     * @param {number} input.q - Cube coordinate q.
     * @param {number} input.r - Cube coordinate r.
     * @param {number} input.s - Cube coordinate s (should satisfy q + r + s = 0).
     *
     * @returns {string} - A string key in the format "q,r,s", used for indexing or storing hexes in maps or sets.
     */
    static createListKey(input) {
        return `${input.q},${input.r},${input.s}`;
    };

    /**
     * Retrieves a hex tile object from a list based on a pixel coordinate lookup.
     *
     * @param {number} input.pointX - The X position in pixels.
     * @param {number} input.pointY - The Y position in pixels.
     * @param {number} input.side - The outer radius of a hex (distance from center to corner).
     * @param {number} input.hexHalfWidth - Half the width of a hex tile in pixels.
     * @param {Object} input.hexList - A map of hexes keyed by "q,r,s" string keys.
     *
     * @returns {Hex} - The hex object corresponding to the pixel location, or undefined if not found.
     */
    static getHexFromCoord(input) {
        let hexCoord = Hex.pixelToHexCoord({
            pointX: input.pointX,
            pointY: input.pointY,
            side: input.side,
            hexHalfWidth: input.hexHalfWidth,
        });
        let listKey = Hex.createListKey({ q: hexCoord.q, r: hexCoord.r, s: hexCoord.s, });
        return input.hexList[listKey];
    };

    /**
     * Finds the hex tile located a specified distance away in a given direction from a starting hex.
     *
     * @param {Object} input - Parameters for the search.
     * @param {number} input.q - Cube coordinate q of the starting hex.
     * @param {number} input.r - Cube coordinate r of the starting hex.
     * @param {number} input.s - Cube coordinate s of the starting hex.
     * @param {string} input.direction - Direction to move in (must be a valid key in TRANSVERSE_MOD_PARAM).
     * @param {number} [input.distance=1] - Number of hexes to move in the specified direction; defaults to 1 if missing or invalid.
     * @param {Object} input.hexList - A map of hex tiles keyed by "q,r,s" strings.
     *
     * @returns {Object} - The object returned by `transverseHex`, containing:
     *   @property {number} q - The q coordinate of the resulting hex.
     *   @property {number} r - The r coordinate of the resulting hex.
     *   @property {number} s - The s coordinate of the resulting hex.
     *   @property {string} hexListKey - The key string "q,r,s" of the resulting hex.
     *   @property {Object} transversedHexes - Map of all hexes traversed, keyed by their "q,r,s" string.
     *
     * Throws:
     *   An error if the given direction is invalid (not found in TRANSVERSE_MOD_PARAM).
     */
    static getHexDataDistanceOfHex(input) {
        if (input.distance == null || isNaN(input.distance)) {
            input.distance = 1;
        }
        const modData = Hex.TRANSVERSE_MOD_PARAM[input.direction];
        if (!modData) {
            throw new Error(`[Hex] ${window.taggedString.invalidHexDirection(input.direction)}`);
        }
        const result = this.transverseHex({
            r: input.r, q: input.q, s: input.s,
            distance: input.distance, hexList: input.hexList,
            qMod: modData.qMod, rMod: modData.rMod, sMod: modData.sMod,
        });
        return result;
    };

    /**
     * Traverses a sequence of hexes in a specified direction and distance starting from a given hex.
     *
     * @param {number} input.q - Cube coordinate q of the starting hex.
     * @param {number} input.r - Cube coordinate r of the starting hex.
     * @param {number} input.s - Cube coordinate s of the starting hex.
     * @param {number} input.distance - Number of hexes to move in the specified direction.
     * @param {number} input.qMod - Increment to apply to q coordinate per step.
     * @param {number} input.rMod - Increment to apply to r coordinate per step.
     * @param {number} input.sMod - Increment to apply to s coordinate per step.
     * @param {Object} input.hexList - A map of hex tiles keyed by "q,r,s".
     *
     * @returns {Object} - An object containing:
     *   @property {number} q - The q coordinate of the last hex reached.
     *   @property {number} r - The r coordinate of the last hex reached.
     *   @property {number} s - The s coordinate of the last hex reached.
     *   @property {string} hexListKey - The key string "q,r,s" of the last hex reached.
     *   @property {Object} transversedHexes - Map of all hexes traversed, keyed by their "q,r,s" string.
     *
     * Throws:
     *   An error if the starting hex (q, r, s) is not found in hexList.
     */
    static transverseHex(input) {
        let q = input.q;
        let s = input.s;
        let r = input.r;
        let hexListKey = Hex.createListKey({ q, r, s, });
        const startingHex = input.hexList[hexListKey];
        if (!startingHex) {
            throw new Error(`[Hex] ${window.taggedString.hexTransverseInvalidStart(input.q, input.r, input.s)}`);
        }
        const transversedHexes = {
            [hexListKey]: startingHex,
        };
        for (let i = 1; i <= input.distance; i++) {
            const newQ = q + input.qMod;
            const newR = r + input.rMod;
            const newS = s + input.sMod;
            const newHexListKey = Hex.createListKey({ q: newQ, r: newR, s: newS, });
            const aHex = input.hexList[newHexListKey];
            if (!aHex) {
                break;
            }
            q = newQ;
            r = newR;
            s = newS;
            hexListKey = newHexListKey;
            transversedHexes[newHexListKey] = aHex;
        }
        return { q, r, s, hexListKey, transversedHexes, };
    };

    // CONSIDER TO REMOVE
    // static getRowMinMaxQS(input) {
    //     const rowConst = Math.floor((input.r - input.minR) / 2);
    //     const rowMinQ = -rowConst; // only work for the current hex grid setup
    //     const rowMaxQ = input.maxQ + rowConst - input.r;
    //     const rowMaxS = -(input.r + rowMinQ);
    //     const rowMinS = -(input.r + rowMaxQ);
    //     return {
    //         minQ: rowMinQ, maxQ: rowMaxQ,
    //         minS: rowMinS, maxS: rowMaxS,
    //     };
    // };
};