export class Tile {
    constructor(input) {
        const { col, row, } = input;
        this.col = col;
        this.row = row;
        this.flipped = false;
    }

    createPath(input) {
        const { canvasCtx, side, cameraOffsetX, cameraOffsetY, } = input;
        const x = this.x - cameraOffsetX;
        const y = this.y - cameraOffsetY;
        canvasCtx.moveTo(x, y);
        canvasCtx.lineTo(x + side, y);
        canvasCtx.lineTo(x + side, y + side);
        canvasCtx.lineTo(x, y + side);
        canvasCtx.lineTo(x, y);
    }

    drawCoord(input) {
        const { canvasCtx, cameraOffsetX, cameraOffsetY, } = input;
        const centerX = this.centerX - cameraOffsetX;
        const centery = this.centerY - cameraOffsetY;
        canvasCtx.fillText(`${this.col}, ${this.row}`, centerX, centery);
    }

    static pixelToTileCoord(input) {
        const { mapX, mapY, side, } = input;
        // invert the scaling
        const col = Math.floor(mapX / side);
        const row = Math.floor(mapY / side);
        return { col, row, };
    }

    static getTileFromCoord(input) {
        const { mapX, mapY, side, tileArray } = input;
        const { col, row, } = window.OPRSClasses.Tile.pixelToTileCoord({ mapX, mapY, side, });
        return { tile: tileArray[col][row], };
    }

    calculateCoord(input) {
        const { side, halfSide, mapWidth, } = input;
        this.x = this.col * side;
        this.y = this.row * side;
        this.centerX = this.x + halfSide;
        this.centerY = this.y + halfSide;
        if (this.flipped) {
            this.x = mapWidth - this.x;
            this.centerX = mapWidth - this.centerX;
        }
    }


    /**
     * Finds the hex tile located a specified distance away in a given direction from a starting hex.
     *
     * @param {Object} input - Parameters for the search.
     * @param {number} input.q - Cube coordinate q of the starting hex.
     * @param {number} input.r - Cube coordinate r of the starting hex.
     * @param {number} input.s - Cube coordinate s of the starting hex.
     * @param {string} input.direction - Direction to move in (must be a valid key in TRANSVERSE_MOD_PARAM).
     * @param {number} [input.distance=1] - Number of hexes to move in the specified direction; defaults to 1 if missing or invalid.
     * @param {Object} input.hexArray - Array contains all the grid's hexes.
     * @param {boolean} input.flipped - Is this map flipped (mirror image)?
     *
     * @returns {Object} - The object returned by `transverseHex`, containing:
     *   @property {number} q - The q coordinate of the resulting hex.
     *   @property {number} r - The r coordinate of the resulting hex.
     *   @property {number} s - The s coordinate of the resulting hex.
     *   @property {Map} transversedHexes - A map of all transversed hex, using a hex's key as key.
     *
     * Throws:
     *   An error if the given direction is invalid (not found in TRANSVERSE_MOD_PARAM).
     */
    static getHexDataDistanceOfHex(input) {
        if (input.distance == null || isNaN(input.distance)) {
            input.distance = 1;
        }
        let flipMode = window.OPRSClasses.Hex.FLIPMODE_STANDARD;
        if (input.flipped) {
            flipMode = window.OPRSClasses.Hex.FLIPMODE_FLIPPED;
        }
        const modData = window.OPRSClasses.Hex.TRANSVERSE_MOD_PARAM[input.direction]?.[flipMode];
        if (!modData) {
            throw new Error(`[Hex] ${window.taggedString.invalidHexDirection(input.direction)}`);
        }
        const result = this.transverseHex({
            r: input.r, q: input.q, s: input.s,
            distance: input.distance, hexArray: input.hexArray,
            qMod: modData.qMod, rMod: modData.rMod, sMod: modData.sMod,
        });
        return result;
    }

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
     * @param {Object} input.hexArray - Array contains all the grid's hexes.
     *
     * @returns {Object} - An object containing:
     *   @property {number} q - The q coordinate of the last hex reached.
     *   @property {number} r - The r coordinate of the last hex reached.
     *   @property {number} s - The s coordinate of the last hex reached.
     *   @property {Map} transversedHexes - A map of all transversed hex, using a hex's key as key.
     *
     * Throws:
     *   An error if the starting hex (q, r, s) is not found in hex array.
     */
    static transverseHex(input) {
        let q = input.q;
        let s = input.s;
        let r = input.r;
        const startingHex = input.hexArray.get({ q, r, }).hex;
        if (!startingHex) {
            throw new Error(`[Hex] ${window.taggedString.hexTransverseInvalidStart(q, r, s)}`);
        }
        const transversedHexes = new Map();
        transversedHexes.set(startingHex.key, startingHex);
        for (let i = 1; i <= input.distance; i++) {
            const newQ = q + input.qMod;
            const newR = r + input.rMod;
            const newS = s + input.sMod;
            const aHex = input.hexArray.get({ q: newQ, r: newR, }).hex;
            if (!aHex) {
                break;
            }
            q = newQ;
            r = newR;
            s = newS;
            transversedHexes.set(aHex.key, aHex);
        }
        return { q, r, s, transversedHexes, };
    }

    /**
     * Updates x coordinates used for drawing when the map is flipped (mirror image)
     *
     * @param {number} input.mapWidth - Total pixel width of the map, used as the axis of reflection.
     */
    setFlipCoord(input) {
        this.flippedCenterX = Math.round(input.mapWidth - this.centerX);
        this.flippedLeftX = Math.round(input.mapWidth - this.leftX);
        this.flippedRightX = Math.round(input.mapWidth - this.rightX);

        this.flippedQx = Math.round(input.mapWidth - this.qX);
        this.flippedRx = Math.round(input.mapWidth - this.rX);
        this.flippedSx = Math.round(input.mapWidth - this.sX);

    }

    /**
     * Sets the drawing coordinates of the hex depending on the flip state.
     *
     * @param {boolean} input.flipped - Whether to use flipped coordinates for rendering.
     */
    flip(input) {
        if (input.flipped) {
            this.drawCenterX = this.flippedCenterX;
            this.drawLeftX = this.flippedLeftX;
            this.drawRightX = this.flippedRightX;

            this.drawQx = this.flippedQx;
            this.drawRx = this.flippedRx;
            this.drawSx = this.flippedSx;

            return;
        }
        this.drawCenterX = this.centerX;
        this.drawLeftX = this.leftX;
        this.drawRightX = this.rightX;

        this.drawQx = this.qX;
        this.drawRx = this.rX;
        this.drawSx = this.sX;
    }



    /**
     * Creates q and r coordinate from a number
     * @param {Object} input 
     * @param {number} input.key - The number that used as key
     *
     * @returns {number, number, } - Cube coordinate q and r
     */
    static decode(input) {
        const { key, } = input;
        const r = (key & Hex.ENCODE_PARAM.MASK) - Hex.ENCODE_PARAM.OFFSET;
        const q = ((key >> Hex.ENCODE_PARAM.BITS) & Hex.ENCODE_PARAM.MASK) - Hex.ENCODE_PARAM.OFFSET;
        return { q, r, };
    }

    getNeighborList(input) {
        const { hexArray, } = input;
        const neighborOffsets = [
            [+1, 0], // right
            [+1, -1], // top-right
            [0, -1], // top-left
            [-1, 0], // left
            [-1, +1], // bottom-left
            [0, +1], // bottom-right
        ];
        const neighborList = [];
        for (const [dq, dr] of neighborOffsets) {
            const nq = this.q + dq;
            const nr = this.r + dr;
            // Assume we have a function to get hex by q,r
            const neighbor = hexArray.get({ q: nq, r: nr, }).hex;
            if (neighbor) neighborList.push(neighbor);
        }
        return { neighborList, };
    }

    drawTexture(input) {
        const {
            canvasCtx, hexTextureMap, textureList,
            cameraOffsetX, cameraOffsetY, hexWidth, hexHeight,
        } = input;
        const hexTexture = hexTextureMap.get(this.key);
        const img = textureList[hexTexture.tile.name][hexTexture.textureIndex];
        const x = this.leftX - cameraOffsetX;
        const y = this.topY - cameraOffsetY;
        // Overlap edges slightly to prevent tiny gaps between hex tiles
        canvasCtx.drawImage(img, x - 1, y - 1, hexWidth + 2, hexHeight + 2);
    }

    createRegionHighlightPath(input) {
        const { canvasCtx, cameraOffsetX, cameraOffsetY, deviation, } = input;
        canvasCtx.moveTo(this.drawCenterX - cameraOffsetX, this.topY + deviation - cameraOffsetY);
        canvasCtx.lineTo(this.drawRightX - deviation - cameraOffsetX, this.upperY - cameraOffsetY);
        canvasCtx.lineTo(this.drawRightX - deviation - cameraOffsetX, this.lowerY - cameraOffsetY);
        canvasCtx.lineTo(this.drawCenterX - cameraOffsetX, this.bottomY - deviation - cameraOffsetY);
        canvasCtx.lineTo(this.drawLeftX + deviation - cameraOffsetX, this.lowerY - cameraOffsetY);
        canvasCtx.lineTo(this.drawLeftX + deviation - cameraOffsetX, this.upperY - cameraOffsetY);
        canvasCtx.lineTo(this.drawCenterX - cameraOffsetX, this.topY + deviation - cameraOffsetY);
    }

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
}