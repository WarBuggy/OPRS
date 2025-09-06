export class Region {
    constructor(input) {
        const { regionName, regionData, mapParam, gridParam, hexParam, regionList } = input;
        this.name = regionName;
        this.keys = new Set();
        const boxes = [];
        for (const shape of regionData.shapeList) {
            const box = this.regionToClampedPixelBox({ shape, mapParam, });
            const cornerHexes = this.getCornerHexes({
                box,
                side: hexParam.side,
                hexHalfWidth: hexParam.halfWidth,
                hexHeight: hexParam.height,
                hexArray: gridParam.hexArray,
            });
            const { keys } = this.getRegionInfo({ cornerHexes, hexArray: gridParam.hexArray, });
            for (const item of keys) {
                this.keys.add(item);
            }
            boxes.push(box);
        }
        this.groups = this.groupOverlappingBoxes({ items: boxes, }).groups;
        // Get intersect of include and exclude
        // This is to avoid including bounding boxes that later excluded. 
        let intersectArray = [];
        if (regionData.include && regionData.exclude) {
            intersectArray = this.getIntersectArrays({
                arr1: regionData.include,
                arr2: regionData.exclude,
            }).intersectArray;
        }
        // Merge included regions
        if (regionData.include) {
            for (const includeName of regionData.include) {
                if (intersectArray.includes(includeName)) continue;
                const includeRegion = regionList.get(includeName);
                if (!includeRegion) {
                    throw new Error(`Included region "${includeName}" not resolved yet`);
                }
                for (const key of includeRegion.keys) {
                    this.keys.add(key);
                }
                this.groups.push(...includeRegion.groups);
                this.groups = this.groupOverlappingBoxes({ items: this.groups, }).groups;
            }
        }

        // Remove excluded regions
        if (regionData.exclude) {
            for (const excludeName of regionData.exclude) {
                if (intersectArray.includes(excludeName)) continue;
                const excludeRegion = regionList.get(excludeName);
                if (!excludeRegion) {
                    throw new Error(`Excluded region "${excludeName}" not resolved yet`);
                }
                for (const key of excludeRegion.keys) {
                    this.keys.delete(key);
                }
            }
        }
        const maxDimension = this.getMaxGroupDimensions({ groups: this.groups, });
        this.maxHexWidth = Math.floor(maxDimension.width / hexParam.width);
        this.maxHexHeight = Math.floor(maxDimension.height / (hexParam.side * 3 / 2));
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
    getRegionInfo(input) {
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

    /**
     * Returns an array of strings that appear in both input arrays
     * Does not modify arr1 or arr2
     * @param {string[]} input.arr1
     * @param {string[]} input.arr2
     * @returns {string[]} intersection of arr1 and arr2
     */
    getIntersectArrays(input) {
        const { arr1, arr2, } = input;
        const set2 = new Set(arr2);           // create a Set from arr2
        // filter arr1 without modifying it
        const intersectArray = arr1.filter(str => set2.has(str));
        return { intersectArray, };
    }

    /**
     * Check if two bounding boxes overlap
     * Each box: { left, right, top, bottom }
     * @param {{left:number, right:number, top:number, bottom:number}} input.a 
     * @param {{left:number, right:number, top:number, bottom:number}} input.b 
     * @returns {boolean} true if boxes overlap
     */
    boxesOverlap(input) {
        const { a, b, } = input;
        const overlap = !(a.right < b.left || a.left > b.right || a.bottom < b.top || a.top > b.bottom);
        return { overlap, };
    }

    /**
     * Groups bounding boxes that overlap each other.
     * Each box: { left, right, top, bottom }
     * @param {Array<{left:number, right:number, top:number, bottom:number}>} input.items
     * @returns {Array<Array>} array of groups, each group is an array of boxes
     */
    groupOverlappingBoxes(input) {
        const { items, } = input;
        // Initialize groups: each item becomes a group (inner arrays are already grouped)
        const groups = items.map(item => Array.isArray(item) ? [...item] : [item]);

        let merged;
        do {
            merged = false;

            for (let i = 0; i < groups.length; i++) {
                for (let j = i + 1; j < groups.length; j++) {
                    const groupA = groups[i];
                    const groupB = groups[j];

                    // Check if any box in groupA overlaps any box in groupB
                    const overlap = groupA.some(boxA =>
                        groupB.some(boxB => this.boxesOverlap({ a: boxA, b: boxB, }).overlap)
                    );

                    if (overlap) {
                        // Merge groupB into groupA and remove groupB
                        groups[i] = groupA.concat(groupB);
                        groups.splice(j, 1);
                        j--; // adjust index after splice
                        merged = true;
                    }
                }
            }
        } while (merged);

        return { groups, };
    }

    /**
     * Compute width and height for a single group of boxes
     * Only considers boxes inside this group
     * @param {Array<{left:number, right:number, top:number, bottom:number}>} input.group
     * @returns {{width: number, height: number}}
     */
    getGroupDimensions(input) {
        let minLeft = Infinity, maxRight = -Infinity;
        let minTop = Infinity, maxBottom = -Infinity;

        for (const box of input.group) {
            if (box.left < minLeft) minLeft = box.left;
            if (box.right > maxRight) maxRight = box.right;
            if (box.top < minTop) minTop = box.top;
            if (box.bottom > maxBottom) maxBottom = box.bottom;
        }

        return {
            width: maxRight - minLeft,
            height: maxBottom - minTop,
        };
    }


    /**
     * Compute max width and height among all groups
     * @param {Array<Array<{left:number, right:number, top:number, bottom:number}>>} input.groups
     * @returns {{maxWidth: number, maxHeight: number}}
     */
    getMaxGroupDimensions(input) {
        let maxWidth = 0;
        let maxHeight = 0;

        for (const group of input.groups) {
            const { width, height } = this.getGroupDimensions({ group, });
            if (width > maxWidth) maxWidth = width;
            if (height > maxHeight) maxHeight = height;
        }

        return { width: maxWidth, height: maxHeight, };
    }

    /*
    CONSIDER TO REMOVE
    test() {
        // single boxes really far apart
        const b1 = { left: 0, right: 10, top: 0, bottom: 10 };
        const b2 = { left: 100, right: 110, top: 0, bottom: 10 };
        const b3 = { left: 200, right: 210, top: 0, bottom: 10 };
        const b4 = { left: 300, right: 310, top: 0, bottom: 10 };

        // group1 (mutually overlapping)
        const bg11 = { left: 200, right: 220, top: 0, bottom: 20 }; // overlaps bg11 + b3
        const bg12 = { left: 215, right: 235, top: 0, bottom: 20 };
        const bg13 = { left: 230, right: 250, top: 0, bottom: 20 };

        // group2 (mutually overlapping)
        const bg21 = { left: 300, right: 320, top: 0, bottom: 20 }; // overlaps bg21 + b4
        const bg22 = { left: 315, right: 335, top: 0, bottom: 20 };
        const bg23 = { left: 330, right: 350, top: 0, bottom: 20 };

        console.log("Case 1 (separate):");
        console.log(this.groupOverlappingBoxes({ items: [b1, b2, b3, b4], }));

        // CASE 2: groups with cross overlaps
        console.log("Case 2 (with cross overlaps):");
        console.log(this.groupOverlappingBoxes({
            items: [
                [bg11, bg12, bg13],
                [bg21, bg22, bg23],
                b1, b2, b3, b4
            ],
        }));
    }

    test2() {
        // Cluster A (horizontal)
        const a1 = { left: 0, right: 20, top: 0, bottom: 10 };
        const a2 = { left: 15, right: 35, top: 0, bottom: 10 };
        const a3 = { left: 30, right: 50, top: 0, bottom: 10 };

        // Cluster B (vertical)
        const b1 = { left: 100, right: 110, top: 0, bottom: 20 };
        const b2 = { left: 100, right: 110, top: 15, bottom: 35 };

        // Cluster C (rectangle 2x2)
        const c1 = { left: 200, right: 220, top: 0, bottom: 10 };
        const c2 = { left: 210, right: 230, top: 0, bottom: 10 };
        const c3 = { left: 200, right: 220, top: 5, bottom: 15 };
        const c4 = { left: 210, right: 230, top: 5, bottom: 15 };

        // Floating boxes
        const f1 = { left: 300, right: 310, top: 0, bottom: 10 };
        const f2 = { left: 400, right: 410, top: 0, bottom: 10 };

        // Cross connection: make f1 slightly overlap a3
        // f1.left = 48;
        // f1.right = 58;

        console.log("Case 3 (separate):");
        console.log(this.groupOverlappingBoxes({ items: [[a1, a2, a3,], [b1, b2,], [c1, c2, c3,], c4, f1, f2,] }));
    }
    */
}