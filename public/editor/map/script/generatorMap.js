export class GeneratorMap {
    constructor(input) {
        const { biome, biomeName, mapParam, gridParam, hexParam, seed, hexTextureMap, } = input;
        this.modData = input.modData;
        this.rng = new window.OPRSClasses.SeededRandom({ seed, });
        this.regionList = new Map();
        // Create the default region list
        this.populateRegionList({
            regionDataList: this.modData[Shared.MOD_STRING.MOD_DATA_TYPE.REGION],
            mapParam, gridParam, hexParam,
            regionList: this.regionList,
        });
        // Create biome region list
        this.populateRegionList({
            regionDataList: biome.regionList,
            mapParam, gridParam, hexParam,
            regionList: this.regionList,
        });
        this.fillDefaultTile({
            hexArray: gridParam.hexArray,
            defaultTileName: biome.defaultTile,
            modTileData: this.modData.tile,
            hexTextureMap,
        });
        this.tileMap = new Map();
        this.generatePatches({
            biome, biomeName,
            hexArray: gridParam.hexArray,
            regionList: this.regionList,
            tileMap: this.tileMap,
            modTileData: this.modData.tile,
            hexTextureMap,
            gridParam,
        });
    }

    /**
     * Pick a starting hex for a patch.
     * @param {Region} input.region - The container region
     * @param {Array} input.hexArray - Array of all hex instances
     * @param {Array} [input.mustBeNextTo] - Optional array of tile names to prefer adjacency
     * @param {Map} [input.tileMap] - Mapping of tiles in the container region { tileType : Set of hexIds } 
     * @returns {Hex} A hex instance inside the region
     */
    pickStartingHex(input) {
        const { region, hexArray, mustBeNextTo, tileMap, } = input;

        // Convert region keys set to array
        const candidateHexes = Array.from(region.keys).map(key => hexArray.getByKey({ key, }));
        // If there is an mustBeNextTo requirement and tiles exist, filter candidates
        let filteredHexes = candidateHexes;
        if (mustBeNextTo.length > 0) {
            const hexesWithAdjacency = new Set();
            for (const tileType of mustBeNextTo) {
                const tileHexSet = tileMap.get(tileType);
                if (!tileHexSet || tileHexSet.size === 0) continue; // skip if no such tiles
                const regionTileKeyList = [...tileHexSet].filter(k => region.keys.has(k));
                for (const key of regionTileKeyList) {
                    const { hex } = hexArray.getByKey({ key, });
                    if (!hex) {
                        console.warn(`[MapGenerator] ${taggedString.mapGeneratorInvalidHex(key, tileType)}`);
                    }
                    const { neighborList } = hex.getNeighborList({ hexArray, });
                    for (const neighbor of neighborList) {
                        if (region.keys.has(neighbor.key)) {
                            hexesWithAdjacency.add(neighbor.key);
                        }
                    }
                }
            }

            if (hexesWithAdjacency.size > 0) {
                filteredHexes = Array.from(hexesWithAdjacency).map(key => hexArray.getByKey({ key, }));
            }
        }
        if (filteredHexes.length === 0) {
            return { startHex: null };
        }
        // Pick a random starting hex
        const { hex } = filteredHexes[this.rng.nextInt(0, filteredHexes.length - 1)];
        return { startHex: hex, };
    }

    getRecommendedDimension(input) {
        const {
            patchDef,
            mapHexCount,
            mapMaxHexWidth,
            mapMaxHexHeight,
            regionHexCount,
            regionMaxHexWidth,
            regionMaxHexHeight,
        } = input;

        const size = this.convertValue({
            def: patchDef.size,
            mapDimensionCount: mapHexCount,
            regionDimensionCount: regionHexCount,
        }).value;
        const result = { size, width: Infinity, height: Infinity, };

        if (patchDef.width && patchDef.width.value) {
            result.width = this.convertValue({
                def: patchDef.width,
                mapDimensionCount: mapMaxHexWidth,
                regionDimensionCount: regionMaxHexWidth,
            }).value;
        }

        if (patchDef.height && patchDef.height.value) {
            result.height = this.convertValue({
                def: patchDef.height,
                mapDimensionCount: mapMaxHexHeight,
                regionDimensionCount: regionMaxHexHeight,
            }).value;
        }

        return result;
    }

    convertValue(input) {
        const { def, mapDimensionCount, regionDimensionCount } = input;
        if (!def) return { value: null, };
        const { type = "region", value, deviation = 0 } = def;

        let base;
        switch (type) {
            case "hex":
                base = value;
                break;
            case "map":
                base = mapDimensionCount * value;
                break;
            case "region":
            default:
                base = regionDimensionCount * value;
                break;
        }

        // Apply deviation
        if (deviation > 0) {
            const delta = base * deviation;
            base = base + (this.rng.next() * 2 - 1) * delta;
        }

        return { value: Math.max(1, Math.round(base)), };
    }

    /**
     * Calculate the actual number of patches to generate
     * @param {Object} patch - patch definition
     * @returns {number} actual quantity can be zero)
     */
    calculateActualQuantity(input) {
        let quantity = input.quantity ?? 1;
        const deviation = input.quantityDeviation ?? 0;

        // Apply deviation as ±percentage of quantity
        if (deviation > 0) {
            const delta = quantity * deviation;
            quantity = quantity + (this.rng.next() * 2 - 1) * delta;
        }
        return { actualQuantity: Math.max(0, Math.round(quantity)), };
    }

    populateRegionList(input) {
        const { regionDataList, mapParam, gridParam, hexParam, regionList, } = input;
        // Perform topological sort and process regions
        const { sortedRegionList, unresolvableRegionList, } =
            this.topoSortRegions({ regionDataList, regionList, });
        for (const regionName of sortedRegionList) {
            if (regionList.has(regionName)) continue;
            const regionData = regionDataList[regionName];
            if (!regionData.shapeList) {
                regionData.shapeList = [];
            }
            try {
                const region = new window.OPRSClasses.Region({
                    regionName, regionData,
                    mapParam, gridParam, hexParam, regionList
                });
                regionList.set(regionName, region);
                console.log(`[GeneratorMap] ${taggedString.generatorMapRegionCreated(regionName, region.keys.size)}`);
            } catch (e) {
                console.error(`[GeneratorMap] ${taggedString.generatorMapFailedToCreateRegion(regionName, e)}`);
                unresolvableRegionList.push(regionName);
            }
        }
    }

    // Topological sort for include/exclude dependencies
    topoSortRegions(input) {
        const { regionDataList, regionList, } = input;
        const visited = new Set();
        const tempMark = new Set();
        const sorted = [];
        const unresolvable = new Set();

        const visit = (regionName, regionData) => {
            if (tempMark.has(regionName)) {
                // Circular dependency detected
                console.warn(`[GeneratorMap] ${taggedString.generatorMapCircularDependency([...tempMark].join(', '))}`);
                for (const name of tempMark) {
                    unresolvable.add(name);
                }
                return;
            }
            if (!visited.has(regionName) && !unresolvable.has(regionName)) {
                tempMark.add(regionName);

                // Gather all dependencies (include + exclude)
                const deps = [...(regionData.include ?? []), ...(regionData.exclude ?? [])];

                for (const depName of deps) {
                    const depRegion = regionDataList[depName] || regionList.get(depName);
                    if (depRegion) {
                        visit(depName, depRegion);
                    } else {
                        // Missing reference
                        console.warn(`[GeneratorMap] ${taggedString.generatorMapMissingDependency(depName, regionName)}`);
                        unresolvable.add(regionName);
                        tempMark.delete(regionName);
                        return;
                    }
                }

                tempMark.delete(regionName);
                visited.add(regionName);

                if (!unresolvable.has(regionName)) {
                    sorted.push(regionName);
                }
            }
        };

        // Process regions with no includes/excludes first
        for (const [regionName, regionData] of Object.entries(regionDataList)) {
            if ((!regionData.include || regionData.include.length === 0) &&
                (!regionData.exclude || regionData.exclude.length === 0)) {
                visit(regionName, regionData);
            }
        }

        // Process the rest
        for (const [regionName, regionData] of Object.entries(regionDataList)) {
            if (!visited.has(regionName) && !unresolvable.has(regionName)) {
                visit(regionName, regionData);
            }
        }

        return {
            sortedRegionList: sorted,
            unresolvableRegionList: Array.from(unresolvable),
        };
    }

    fillDefaultTile(input) {
        const { hexArray, defaultTileName, modTileData, hexTextureMap, } = input;
        const defaultTile = modTileData[defaultTileName];
        if (!defaultTile) {
            throw new Error(`[MapGenerator] ${taggedString.mapGeneratorInvalidDefaultTileName(defaultTileName)}`);
        }
        for (const hex of hexArray.toArray()) {
            this.setHexTexture({ hex, tileData: defaultTile, hexTextureMap, });
        }
    }

    getTileRulesForHex(input) {
        const { hex, patches, defaultTileName, tileSet, hexTextureMap, } = input;
        const { tile, patchIndex, regionListStr, } = hexTextureMap.get(hex.key);

        // Default tile has fixed rule
        if (tile.name === defaultTileName) {
            return {
                overwrite: [],
                overwritten: tileSet,
                mustBeNextTo: [],
            };
        }

        // Otherwise, look up patchDef using stored properties
        if (!regionListStr || patchIndex === undefined) {
            console.warn(`[MapGenerator] ${taggedString.mapGeneratorInvalidHexData(hex.q, hex.r, hex.key)}`);
            return null;
        }

        // Otherwise, check patch definitions
        const patchData = patches[tile.name];
        if (!patchData) return null;

        const matchedPatchDef = patchData[regionListStr]?.[patchIndex];
        if (!matchedPatchDef) {
            console.warn(`[MapGenerator] ${taggedString.mapGeneratorNoPatchDefFound(tile.name, regionListStr, patchIndex)}`);
            return null;
        }
        const {
            overwrite = [],
            overwritten = [],
            mustBeNextTo = [],
        } = matchedPatchDef;
        return { overwrite, overwritten, mustBeNextTo, };
    }

    getForcedDimension(input) {
        const { patchDef } = input;
        // PatchDef is assumed to come from JSON, so insertion order is preserved
        let forcedDimension = null;
        for (const key of Object.keys(patchDef)) {
            if ((key === "size" || key === "width" || key === "height") && patchDef[key]?.force) {
                forcedDimension = key; // last one with force wins
            }
        }
        return { forcedDimension, }; // may be null if none are forced
    }

    canPlaceOutsideRegion(input) {
        const { hex, region, allowOutsideRegion = 0 } = input;
        const isOutsideRegion = !region.keys.has(hex.key);
        if (!isOutsideRegion) return { allowed: true, }; // inside region is always allowed
        return { allowed: this.rng.next() < allowOutsideRegion, };
    }

    canOverwrite(input) {
        const { hex, tileName, patchDef, patches, defaultTileName, tileSet, hexTextureMap } = input;
        const currentTileRules = this.getTileRulesForHex({
            hex,
            patches,
            defaultTileName,
            tileSet,
            hexTextureMap,
        });

        if (!currentTileRules) return { allowed: false, }; // invalid hex

        if (currentTileRules.overwritten.length > 0 && !currentTileRules.overwritten.includes(tileName)) {
            return { allowed: false, };
        }
        const hexTexture = hexTextureMap.get(hex.key);
        const { overwrite = [], } = patchDef;
        if (overwrite.length > 0 && !overwrite.includes(hexTexture.tile.name)) {
            return { allowed: false, };
        }

        return { allowed: true, };
    }

    decideGrowthDirection(input) {
        const { blobState, recommendedDimension, forcedDimension } = input;
        const { size, width, height } = recommendedDimension;
        const { size: currentSize, currentWidth } = blobState;
        const currentHeight = blobState.rMax - blobState.rMin + 1;

        let canGrowWidth = currentWidth < width;
        let canGrowHeight = currentHeight < height;
        let sizeNotReached = currentSize < size;

        // Forced dimension takes priority
        if (forcedDimension === "width") {
            if (canGrowWidth) return { direction: "width" };
            else if (sizeNotReached || canGrowHeight) return { direction: "height" };
            else return { terminate: true };
        }
        if (forcedDimension === "height") {
            if (canGrowHeight) return { direction: "height" };
            else if (sizeNotReached || canGrowWidth) return { direction: "width" };
            else return { terminate: true };
        }

        // No forced dimension: size > width/height
        if (!sizeNotReached) return { terminate: true };

        const possibleDims = [];
        if (canGrowWidth) possibleDims.push("width");
        if (canGrowHeight) possibleDims.push("height");

        if (possibleDims.length === 0) return { terminate: true };
        if (possibleDims.length === 1) return { direction: possibleDims[0] };

        // Both width and height possible → pick randomly
        const direction = possibleDims[this.rng.nextInt(0, possibleDims.length - 1)];
        return { direction };
    }

    placeHex(input) {
        const { hex, tileData, tileMap, rowMap, blobState, patchIndex, regionListStr, placed, hexTextureMap, } = input;

        // Update blobState
        blobState.size = (blobState.size || 0) + 1;
        blobState.rMin = blobState.rMin !== null ? Math.min(blobState.rMin, hex.r) : hex.r;
        blobState.rMax = blobState.rMax !== null ? Math.max(blobState.rMax, hex.r) : hex.r;

        // Update rowMap
        let row = rowMap.get(hex.r);
        if (!row) {
            row = { qMin: hex.q, qMax: hex.q, width: 1, growWidth: new Set(), growHeight: new Set() };
            rowMap.set(hex.r, row);
        } else {
            row.qMin = Math.min(row.qMin, hex.q);
            row.qMax = Math.max(row.qMax, hex.q);
            row.width = row.qMax - row.qMin + 1;
        }

        // Update currentWidth for convenience
        blobState.currentWidth = Math.max(...Array.from(rowMap.values()).map(r => r.width));

        // Place the tile
        const hexTexture = hexTextureMap.get(hex.key);
        const oldTileName = hexTexture.tile.name;
        this.setHexTexture({ hex, tileData, hexTextureMap, patchIndex, regionListStr, });

        // Update tileMap
        const tileName = tileData.name;
        let tileSet = tileMap.get(tileName);
        if (!tileSet) {
            tileSet = new Set();
            tileMap.set(tileName, tileSet);
        }
        tileSet.add(hex.key);
        const oldTileSet = tileMap.get(oldTileName);
        if (oldTileName !== tileName && oldTileSet) {
            oldTileSet.delete(hex.key);
        }

        placed.add(hex.key);

        return { blobState, row };
    }

    handleNeighborList(input) {
        const { neighborList, placed, rowMap, mapMinR, mapMaxR, } = input;
        for (const neighbor of neighborList) {
            if (placed.has(neighbor.key)) continue;
            // Candidate rows to consider: neighbor row itself, one above, one below
            const candidateRows = [neighbor.r - 1, neighbor.r, neighbor.r + 1];

            for (const candidateRow of candidateRows) {
                // skip row that is too far from current north and south edge
                if (candidateRow < mapMinR || candidateRow > mapMaxR) continue;
                const row = rowMap.get(candidateRow);
                if (!row) continue;
                if (candidateRow === neighbor.r) {
                    row.growWidth.add(neighbor);
                } else {
                    row.growHeight.add(neighbor);
                }
            }
        }
    }

    processHexAndNeighbor(input) {
        const {
            hex,
            tileData,
            tileMap,
            rowMap,
            blobState,
            patchIndex,
            regionListStr,
            placed,
            hexArray,
            hexTextureMap,
            mapMinR, mapMaxR,
        } = input;

        // Place the hex
        this.placeHex({
            hex,
            tileData,
            tileMap,
            rowMap,
            blobState,
            patchIndex,
            regionListStr,
            placed,
            hexTextureMap,
        });
        // Add neighbors to rowMap queues
        const { neighborList } = hex.getNeighborList({ hexArray });
        this.handleNeighborList({
            neighborList,
            placed,
            rowMap,
            mapMinR,
            mapMaxR,
        });
    }

    chooseCandidateHex(input) {
        const {
            rowMap,
            blobState,
            growthDirection,
            placed,
            region,
            allowOutsideRegion,
            tileName,
            patchDef,
            patches,
            defaultTileName,
            recommendedDimension,
            tileSet,
            hexTextureMap,
        } = input;

        const candidates = [];

        // Collect candidate hexes only in the chosen growth direction
        for (const row of rowMap.values()) {
            const setToUse = growthDirection === "width" ? row.growWidth : row.growHeight;
            for (const hex of setToUse) {
                if (placed.has(hex.key)) continue;

                // Simulate the new dimension if this hex is placed
                let newDimensionSize;
                if (growthDirection === "width") {
                    const newQMin = Math.min(row.qMin, hex.q);
                    const newQMax = Math.max(row.qMax, hex.q);
                    newDimensionSize = newQMax - newQMin + 1;
                    if (newDimensionSize > recommendedDimension.width) continue; // too wide
                } else {
                    const newRMin = Math.min(blobState.rMin, hex.r);
                    const newRMax = Math.max(blobState.rMax, hex.r);
                    newDimensionSize = newRMax - newRMin + 1;
                    if (newDimensionSize > recommendedDimension.height) continue; // too tall
                }

                candidates.push({ hex, row, newDimensionSize });
            }
        }

        if (candidates.length === 0) return { terminate: true }; // no valid candidates

        let chosenCandidate;

        if (growthDirection === "height") {
            // Prefer candidates that extend the blob vertically
            const borderCandidates = candidates.filter(c =>
                c.hex.r === blobState.rMin - 1 || c.hex.r === blobState.rMax + 1
            );
            chosenCandidate = borderCandidates.length > 0
                ? borderCandidates[this.rng.nextInt(0, borderCandidates.length - 1)]
                : candidates[this.rng.nextInt(0, candidates.length - 1)]; // fallback random
        } else {
            // Width: choose candidate with newDimensionSize closest to recommended width
            const minDiff = Math.min(...candidates.map(c => Math.abs(c.newDimensionSize - recommendedDimension.width)));
            const bestCandidates = candidates.filter(c => Math.abs(c.newDimensionSize - recommendedDimension.width) === minDiff);
            chosenCandidate = bestCandidates[this.rng.nextInt(0, bestCandidates.length - 1)];
        }

        const { hex, row } = chosenCandidate;

        // Remove it from the row queue
        if (growthDirection === "width") row.growWidth.delete(hex);
        else row.growHeight.delete(hex);

        // Already used?
        if (placed.has(hex.key)) return { skip: true };

        // Validate placement
        if (!this.canPlaceOutsideRegion({ hex, region, allowOutsideRegion, }).allowed) return { skip: true };
        if (!this.canOverwrite({ hex, tileName, patchDef, patches, defaultTileName, tileSet, hexTextureMap, }).allowed) return { skip: true };

        return { hex, row };
    }

    getSpineDirection(input) {
        const { forcedDimension, } = input;
        // If a dimension is forced, the spine goes along that dimension
        if (forcedDimension === 'width' || forcedDimension === 'height') {
            return { spineDirection: forcedDimension };
        }

        // If no forced dimension, choose randomly between width and height
        const spineDirection = this.rng.next() < 0.5 ? 'width' : 'height';
        return { spineDirection };
    }

    calculateSpineLength(input) {
        const { recommendedDimensions, forcedDimension, spineDirection } = input;
        const { size, width, height } = recommendedDimensions;

        let spineLength;

        // If spineDirection has a finite recommended dimension, use it
        if (spineDirection === 'width' && isFinite(width)) {
            spineLength = width;
        } else if (spineDirection === 'height' && isFinite(height)) {
            spineLength = height;
        } else {
            // If both dimensions are infinite, choose spine length as sqrt of size
            spineLength = Math.ceil(Math.sqrt(size));
        }

        // Ensure spineLength does not exceed recommendedSize
        if (!forcedDimension && spineLength > size) spineLength = size;

        return { spineLength };
    }

    calculateRibLengthList(input) {
        const { spineLength, spineDirection, recommendedDimensions, } = input;
        const { size, width, height } = recommendedDimensions;

        if (spineLength === 1) {
            const ribLength = Math.max(size - spineLength, 0);
            return { ribLengthList: [ribLength] };
        }

        const leftoverHexes = size - spineLength;
        if (leftoverHexes <= 0) return { ribLengthList: Array(spineLength).fill(0) };

        // Max rib length at the middle of the spine (triangle height * 2)
        const triangleHeight = (2 * leftoverHexes) / spineLength;

        const ribLengthList = [];

        // Place ribs starting from middle of spine
        const mid = Math.floor(spineLength / 2);

        for (let i = 0; i < spineLength; i++) {
            const distFromMid = Math.abs(i - mid);
            // Linear decrease toward spine ends
            const maxLength = Math.max(triangleHeight - (triangleHeight * distFromMid) / mid, 1);
            const ribLength = Math.ceil(maxLength);
            ribLengthList.push(ribLength);
        }

        // Calculate current blob size
        let currentSize = spineLength + ribLengthList.reduce((a, b) => a + b, 0);
        // Determine max dimension for ribs
        const maxRibLength = spineDirection === 'width' ? height : width;

        // Adjust rib lengths to match exact size
        while (currentSize !== size) {
            const idx = this.rng.nextInt(0, ribLengthList.length - 1);

            if (currentSize > size) {
                // Decrease rib length but not below 0
                if (ribLengthList[idx] > 0) {
                    ribLengthList[idx]--;
                    currentSize--;
                }
            } else {
                // Increase rib length but not exceed max dimension
                if (ribLengthList[idx] < maxRibLength) {
                    ribLengthList[idx]++;
                    currentSize++;
                }
            }
        }

        return { ribLengthList };
    }

    growVerticalSpine(input) {
        const {
            startHex,
            spineLength,
            hexArray,
            tileName,
            patchDef,
            patches,
            defaultTileName,
            tileSet,
            hexTextureMap,
            region,
            allowOutsideRegion,
            softFailLimit = 3,
        } = input;
        // Define movement vectors for vertical growth
        const directions = {
            topLeft: { qMod: 0, rMod: 1, },
            topRight: { qMod: 1, rMod: 1, },
            bottomLeft: { qMod: -1, rMod: -1, },
            bottomRight: { qMod: 0, rMod: -1, },
        };
        let spineHexList = [];
        // Randomize initial zig-zag direction
        const upDirection = 'up';
        const downDirection = 'down';
        const possible = {
            [upDirection]: true,
            [downDirection]: true,
        };
        const lastStep = {
            [upDirection]: this.rng.next() < 0.5 ? directions.topLeft : directions.topRight,
            [downDirection]: this.rng.next() < 0.5 ? directions.bottomLeft : directions.bottomRight,
        };
        const placedHexList = {
            [upDirection]: [startHex],
            [downDirection]: [startHex],
        };

        for (let i = 0; ; i++) {
            let direction = null;
            let directionOption = null;
            if (i % 2 === 0 && possible[upDirection]) { // Grow up
                direction = upDirection;
                directionOption = lastStep[direction] === directions.topLeft
                    ? [directions.topRight, directions.topLeft]
                    : [directions.topLeft, directions.topRight];
            } else if (i % 2 === 1 && possible[downDirection]) { // Grow down
                direction = downDirection;
                directionOption = lastStep[direction] === directions.bottomLeft
                    ? [directions.bottomRight, directions.bottomLeft]
                    : [directions.bottomLeft, directions.bottomRight];
            }
            if (direction == null) break; // Stop if both directions cannot continue
            const lastHex = placedHexList[direction][placedHexList[direction].length - 1];

            let placed = false;
            for (const stepDirection of directionOption) {
                const { qMod, rMod } = stepDirection;
                const nextHexCoord = {
                    q: lastHex.q + qMod,
                    r: lastHex.r + rMod,
                };
                const { hex: nextHex } = hexArray.get({ q: nextHexCoord.q, r: nextHexCoord.r });
                if (nextHex == null) {
                    continue; // continue to check the the next direction option
                }
                if (!this.canOverwrite({ hex: nextHex, tileName, patchDef, patches, defaultTileName, tileSet, hexTextureMap, }).allowed) {
                    continue; // continue to check the the next direction option
                }

                let softFailCount = 0;
                while (softFailCount < softFailLimit) {
                    if (this.canPlaceOutsideRegion({ hex: nextHex, region, allowOutsideRegion, }).allowed) {
                        break; // break out of soft fail check while loop
                    }
                    softFailCount++;
                }
                if (softFailCount >= softFailLimit) {
                    continue; // continue to check the the next direction option
                }
                lastStep[direction] = stepDirection;
                placedHexList[direction].push(nextHex);
                placed = true;
                // build a new placed hex list
                spineHexList = placedHexList[upDirection].slice(1).reverse().concat(placedHexList[downDirection]);
                break; // no need to check for the next direction option
            }
            if (!placed) {
                possible[direction] = false;
            }
            // Stop if both directions cannot continue
            if (!possible[upDirection] && !possible[downDirection]) break;
            if (spineHexList.length >= spineLength) break;
        }
        return { spineHexList, };
    }

    __growRandom(input) {
        const {
            startHex,
            recommendedDimension,
            forcedDimension,
            patchDef,
            hexArray,
            tileData,
            tileMap,
            region,
            defaultTileName,
            patches,
            tileSet,
            patchIndex,
            regionListStr,
            hexTextureMap,
            mapMinR, mapMaxR,
        } = input;
        const blobState = {
            size: 0,         // total hexes placed
            rMin: null,      // minimum row index
            rMax: null,      // maximum row index
            currentWidth: 0, // optional convenience for width tracking
        };
        const rowMap = new Map(); // r -> { qMin, qMax, width, growWidth: Set, growHeight: Set }
        const allowOutsideRegion = patchDef.allowOutsideRegion;
        const placed = new Set();
        // Process the first hex and its neighbor
        this.processHexAndNeighbor({
            hex: startHex,
            tileData,
            tileMap,
            rowMap,
            blobState,
            patchIndex,
            regionListStr,
            placed,
            hexArray,
            hexTextureMap,
            mapMinR, mapMaxR,
        });

        // --- Main growth loop ---
        let growthDecision = this.decideGrowthDirection({
            blobState,
            recommendedDimension,
            forcedDimension
        });
        while (!growthDecision.terminate) {
            const candidate = this.chooseCandidateHex({
                rowMap,
                blobState,
                growthDirection: growthDecision.direction,
                placed,
                region,
                allowOutsideRegion,
                tileName: tileData.name,
                patchDef,
                patches,
                defaultTileName,
                tileSet,
                recommendedDimension,
                hexTextureMap,
            });
            if (candidate.terminate === true) break;   // stop growing
            if (candidate.skip === true) continue;    // bad candidate, skip iteration
            this.processHexAndNeighbor({
                hex: candidate.hex,
                tileData,
                tileMap,
                rowMap,
                blobState,
                patchIndex,
                regionListStr,
                placed,
                hexArray,
                hexTextureMap,
                mapMinR, mapMaxR,
            });

            growthDecision = this.decideGrowthDirection({
                blobState,
                recommendedDimension,
                forcedDimension
            });
        }
        return { placedHexList: placed, };
    }

    placePatch(input) {
        const {
            region,
            hexArray,
            tileMap,
            patchDef,
            recommendedDimension,
            tileData,
            defaultTileName,
            patchIndex,
            regionListStr,
            patches,
            tileSet,
            forcedDimension,
            hexTextureMap,
            mapMinR, mapMaxR,
        } = input;

        // Step 1: Pick a starting hex

        const { shape, mustBeNextTo = [], } = patchDef;
        let placedHexList = new Set();
        const { startHex } = this.pickStartingHex({ region, hexArray, mustBeNextTo, tileMap, });
        if (!startHex) return { placedHexList, };
        // Step 3: Grow the patch based on shape
        switch (shape) {
            case "blob":
                // TODO: implement __growBlob
                break;
            case "line":
                // TODO: implement __growLine
                break;
            case "random":
            default:
                placedHexList = this.__growRandom({
                    startHex,
                    recommendedDimension,
                    forcedDimension,
                    patchDef,
                    hexArray,
                    tileData,
                    tileMap,
                    region,
                    defaultTileName,
                    patches,
                    tileSet,
                    patchIndex,
                    regionListStr,
                    hexTextureMap,
                    mapMinR, mapMaxR,
                }).placedHexList;
                break;
        }

        // Step 4: Return placed hexes
        return { placedHexList };
    }

    generatePatches(input) {
        const { biome, biomeName, hexArray, regionList, tileMap, modTileData, hexTextureMap, gridParam, } = input;
        const regionEntireBiome = regionList.get(Shared.MOD_STRING.PREMADE_REGION_NAME.ENTIRE_BIOME);
        const mapHexCount = regionEntireBiome.keys.size;
        const mapMaxHexWidth = regionEntireBiome.maxHexWidth;
        const mapMaxHexHeight = regionEntireBiome.maxHexHeight;

        const placedSummary = {}; // Optional: track placed hexes per tile and region

        for (const [tileName, tilePatches] of Object.entries(biome.patches)) {
            const tileData = modTileData[tileName];
            if (!tileData) {
                throw new Error(`[MapGenerator] ${taggedString.mapGeneratorUnknownTile(tileName)}`);
            }
            for (const [regionListStr, patchDefList] of Object.entries(tilePatches)) {
                // Split comma-separated region keys and trim whitespace
                const regionKeyList = regionListStr.split(',').map(k => k.trim());
                for (const regionKey of regionKeyList) {
                    const region = regionList.get(regionKey);
                    if (!region) {
                        console.warn(`[MapGenerator] ${taggedString.mapGeneratorUnknownRegion(regionKey, biomeName)}`);
                        continue;
                    }
                    for (let i = 0; i < patchDefList.length; i++) {
                        const patchDef = patchDefList[i];
                        const { forcedDimension } = this.getForcedDimension({ patchDef, });
                        const { actualQuantity } = this.calculateActualQuantity(patchDef);
                        for (let q = 0; q < actualQuantity; q++) {
                            const recommendedDimension = this.getRecommendedDimension({
                                patchDef,
                                mapHexCount,
                                mapMaxHexWidth,
                                mapMaxHexHeight,
                                regionHexCount: region.keys.size,
                                regionMaxHexWidth: region.maxHexWidth,
                                regionMaxHexHeight: region.maxHexHeight,
                            });
                            const { placedHexList } = this.placePatch({
                                region,
                                hexArray,
                                tileMap,
                                patchDef,
                                recommendedDimension,
                                forcedDimension,
                                tileData,
                                defaultTileName: biome.defaultTile,
                                patchIndex: i,
                                regionListStr,
                                patches: biome.patches,
                                tileSet: biome.tileSet,
                                hexTextureMap,
                                mapMinR: gridParam.minR,
                                mapMaxR: gridParam.maxR,
                            });
                            // Track summary
                            if (!placedSummary[tileName]) placedSummary[tileName] = {};
                            if (!placedSummary[tileName][regionKey]) placedSummary[tileName][regionKey] = 0;
                            placedSummary[tileName][regionKey] += placedHexList.size;
                        }
                    }
                }
            }
        }
        return { placedSummary };
    }

    setHexTexture(input) {
        const { hex, tileData, hexTextureMap, patchIndex, regionListStr, } = input;
        const randomIndex = this.rng.nextInt(0, tileData.textureList.length - 1);
        let currentValue = hexTextureMap.get(hex.key);
        if (!currentValue) currentValue = {};
        currentValue.tile = tileData;
        currentValue.textureIndex = randomIndex;
        currentValue.patchIndex = patchIndex;
        currentValue.regionListStr = regionListStr;
        hexTextureMap.set(hex.key, currentValue);
    }

    toggleRegionHighlight(input) {
        const { hexTextureMap, regionName, region, } = input;
        for (const key of region.keys) {
            const hexTexture = hexTextureMap.get(key);
            if (!hexTexture) {
                continue;
            }
            if (!hexTexture.highlightRegionList) {
                hexTexture.highlightRegionList = new Set();
            }
            const highlightRegionList = hexTexture.highlightRegionList;
            if (highlightRegionList.has(regionName)) {
                highlightRegionList.delete(regionName);
                continue;
            }
            highlightRegionList.add(regionName);
        }
    }
}

