export class GeneratorMap {

    static HEX_OFFSET = {
        LEFT: { qMod: -1, rMod: 0, },
        TOP_LEFT: { qMod: 0, rMod: -1, },
        BOTTOM_LEFT: { qMod: -1, rMod: +1, },
        RIGHT: { qMod: 1, rMod: 0, },
        TOP_RIGHT: { qMod: +1, rMod: -1, },
        BOTTOM_RIGHT: { qMod: 0, rMod: +1, },
    };

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
        console.log(`[GeneratorMap] ${taggedString.generatorMapDone(this.rng.seed)}`);
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
                        console.warn(`[GeneratorMap] ${taggedString.generatorMapInvalidHex(key, tileType)}`);
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
            throw new Error(`[GeneratorMap] ${taggedString.generatorMapInvalidDefaultTileName(defaultTileName)}`);
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
            console.warn(`[GeneratorMap] ${taggedString.generatorMapInvalidHexData(hex.q, hex.r, hex.key)}`);
            return null;
        }

        // Otherwise, check patch definitions
        const patchData = patches[tile.name];
        if (!patchData) return null;

        const matchedPatchDef = patchData[regionListStr]?.[patchIndex];
        if (!matchedPatchDef) {
            console.warn(`[GeneratorMap] ${taggedString.generatorMapNoPatchDefFound(tile.name, regionListStr, patchIndex)}`);
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

    updateHexData(input) {
        const {
            hex,
            tileData,
            hexTextureMap,
            tileMap,
            patchIndex,
            regionListStr,
        } = input;

        // Get old tile name before updating
        const hexTexture = hexTextureMap.get(hex.key);
        const oldTileName = hexTexture.tile.name;

        // Update hex texture with new tile
        this.setHexTexture({
            hex,
            tileData,
            hexTextureMap,
            patchIndex,
            regionListStr,
        });

        // Update tileMap: add hex to new tile set
        const tileName = tileData.name;
        let tileSet = tileMap.get(tileName);
        if (!tileSet) {
            tileSet = new Set();
            tileMap.set(tileName, tileSet);
        }
        tileSet.add(hex.key);

        // Remove hex from old tile set if different
        if (oldTileName !== tileName) {
            const oldTileSet = tileMap.get(oldTileName);
            if (oldTileSet) {
                oldTileSet.delete(hex.key);
            }
        }
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

        this.updateHexData({
            hex,
            tileData,
            hexTextureMap,
            tileMap,
            patchIndex,
            regionListStr,
        });

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
        const { recommendedDimension, forcedDimension, spineDirection, } = input;
        const { size, width, height, } = recommendedDimension;
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
        const { spineHexList, size, spineDirection, recommendedDimension } = input;
        const spineLength = spineHexList.length;
        const ribList = [];

        if (spineLength === 1) {
            const ribLength = Math.max(size - spineLength, 0);
            ribList.push({ spineHex: spineHexList[0], length: ribLength, });
            return { ribList };
        }

        const leftoverHexes = size - spineLength;
        if (leftoverHexes <= 0) {
            // No room for ribs, all lengths 0
            spineHexList.forEach(hex => ribList.push({ spineHex: hex, length: 0 }));
            return { ribList };
        }

        // Max rib length at middle of spine (triangle height)
        const triangleHeight = Math.floor((2 * leftoverHexes) / spineLength);
        const mid = Math.floor(spineLength / 2);

        // Assign initial rib lengths based on distance from middle
        spineHexList.forEach((hex, i) => {
            const distFromMid = Math.abs(i - mid);
            const maxLength = Math.max(Math.ceil(triangleHeight - (triangleHeight * distFromMid) / mid), 1);
            ribList.push({ spineHex: hex, length: maxLength, });
        });

        // Adjust rib lengths to match exact blob size
        let currentSize = spineLength + ribList.reduce((sum, rib) => sum + rib.length, 0);
        const maxRibLength =
            spineDirection === 'width' ? recommendedDimension.height : recommendedDimension.width;

        while (currentSize !== size) {
            const idx = this.rng.nextInt(0, ribList.length - 1);
            const rib = ribList[idx];

            if (currentSize > size) {
                if (rib.length > 0) {
                    rib.length--;
                    currentSize--;
                }
            } else {
                if (rib.length < maxRibLength) {
                    rib.length++;
                    currentSize++;
                }
            }
        }

        return { ribList };
    }

    checkHexEligibility(input) {
        const {
            q, r,
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

        const { hex } = hexArray.get({ q, r, });
        if (!hex) return { allowed: false, };

        // Check if the tile can be overwritten
        const overwriteCheck = this.canOverwrite({
            hex,
            tileName,
            patchDef,
            patches,
            defaultTileName,
            tileSet,
            hexTextureMap,
        });
        if (!overwriteCheck.allowed) return { allowed: false, };

        // Try placing outside region if allowed
        let allowed = false;
        for (let attempt = 0; attempt < softFailLimit; attempt++) {
            if (this.canPlaceOutsideRegion({ hex, region, allowOutsideRegion, }).allowed) {
                allowed = true;
                break;
            }
        }
        return { allowed, hex, };
    }

    tryPlaceBlobHex({
        direction,
        lastStep,
        placedHexList,
        stepInstruction,
        hexArray,
        tileName,
        patchDef,
        patches,
        defaultTileName,
        tileSet,
        hexTextureMap,
        region,
        allowOutsideRegion,
        softFailLimit,
        tileData,
        tileMap,
        patchIndex,
        regionListStr,
    }) {
        const nextStepKeyList = stepInstruction[direction][lastStep[direction]];
        const lastHex = placedHexList[direction][placedHexList[direction].length - 1];
        for (const nextStepKey of nextStepKeyList) {
            const stepOffset = GeneratorMap.HEX_OFFSET[nextStepKey];
            const nextCoord = {
                q: lastHex.q + stepOffset.qMod,
                r: lastHex.r + stepOffset.rMod,
            };

            const { allowed, hex: nextHex } = this.checkHexEligibility({
                q: nextCoord.q, r: nextCoord.r,
                hexArray, tileName, patchDef, patches, defaultTileName, tileSet,
                hexTextureMap, region, allowOutsideRegion, softFailLimit,
            });

            if (!allowed) continue;

            lastStep[direction] = nextStepKey;
            placedHexList[direction].push(nextHex);

            this.updateHexData({
                hex: nextHex,
                tileData,
                tileMap,
                hexTextureMap,
                patchIndex,
                regionListStr,
            });

            return { success: true, };
        }
        return { success: false, };
    }

    growSpine(input) {
        const {
            startHex,
            spineLength,
            hexArray,
            tileData,
            tileName,
            patchDef,
            patches,
            defaultTileName,
            tileSet,
            tileMap,
            hexTextureMap,
            region,
            allowOutsideRegion,
            patchIndex,
            regionListStr,
            isHorizontal = true,
            softFailLimit = 3,
        } = input;
        const growthData = {
            // Horizontal spine growth
            [true]: { // true = horizontal
                directionList: ['leftDir', 'rightDir',],

                stepInstruction: {
                    leftDir: {
                        TOP_LEFT: ['BOTTOM_LEFT', 'LEFT', 'TOP_LEFT',],
                        LEFT: ['LEFT', 'TOP_LEFT', 'BOTTOM_LEFT',],
                        BOTTOM_LEFT: ['TOP_LEFT', 'LEFT', 'BOTTOM_LEFT',]
                    },
                    rightDir: {
                        TOP_RIGHT: ['BOTTOM_RIGHT', 'RIGHT', 'TOP_RIGHT',],
                        RIGHT: ['RIGHT', 'TOP_RIGHT', 'BOTTOM_RIGHT',],
                        BOTTOM_RIGHT: ['TOP_RIGHT', 'right', 'BOTTOM_RIGHT',]
                    },
                },
                lastStep: {
                    leftDir: 'LEFT',
                    rightDir: 'RIGHT',
                },
                possible: {
                    leftDir: true,
                    rightDir: true,
                },
            },

            // Vertical spine growth
            [false]: { // false = vertical
                directionList: ['upDir', 'downDir',],
                stepInstruction: {
                    upDir: {
                        TOP_LEFT: ['TOP_RIGHT', 'TOP_LEFT'],
                        TOP_RIGHT: ['TOP_LEFT', 'TOP_RIGHT'],
                    },
                    downDir: {
                        BOTTOM_LEFT: ['BOTTOM_RIGHT', 'BOTTOM_LEFT'],
                        BOTTOM_RIGHT: ['BOTTOM_LEFT', 'BOTTOM_RIGHT'],
                    },
                },
                lastStep: {
                    upDir: 'TOP_LEFT',
                    downDir: 'BOTTOM_LEFT',
                },
                possible: {
                    upDir: true,
                    downDir: true,
                },
            },
        };
        const directionList = growthData[isHorizontal].directionList;
        const stepInstruction = growthData[isHorizontal].stepInstruction;
        const lastStep = growthData[isHorizontal].lastStep;
        const possible = growthData[isHorizontal].possible;

        const placedHexList = {};
        for (const dir of directionList) placedHexList[dir] = [startHex];

        let currentLength = 1;
        let directionIndex = this.rng.nextInt(0, directionList.length - 1);
        while (directionList.some(d => possible[d]) && currentLength < spineLength) {
            directionIndex = 1 - directionIndex; // alternate directions
            const direction = directionList[directionIndex];
            if (!possible[direction]) continue;
            const { success } = this.tryPlaceBlobHex({
                direction, lastStep, stepInstruction, placedHexList,
                hexArray, tileName, patchDef, patches, defaultTileName, tileSet,
                hexTextureMap, region, allowOutsideRegion,
                tileData, tileMap, patchIndex, regionListStr, softFailLimit,
            });
            if (!success) {
                possible[direction] = false;
                continue;
            }
            currentLength = Object.values(placedHexList).reduce((sum, list) => sum + list.length - 1, 0);
        }
        // Combine lists (avoid double startHex)
        const spineHexList = placedHexList[directionList[0]].slice(1).reverse().concat(placedHexList[directionList[1]]);
        return { spineHexList };
    }

    growRib(input) {
        const {
            ribList,
            hexArray,
            tileData,
            tileName,
            patchDef,
            patches,
            defaultTileName,
            tileMap,
            tileSet,
            hexTextureMap,
            region,
            allowOutsideRegion,
            patchIndex,
            regionListStr,
            isHorizontal = true,
            softFailLimit = 3,
        } = input;
        const growthData = {
            [true]: { // true is for horizontal growth
                directionList: ['leftDir', 'rightDir',],
                // Horizontal ribs grow straight in q-axis only.
                stepInstruction: {
                    leftDir: {
                        LEFT: ['LEFT',],
                    },
                    rightDir: {
                        RIGHT: ['RIGHT',],
                    },
                },
                lastStep: {
                    leftDir: 'LEFT',
                    rightDir: 'RIGHT',
                },
                possible: {
                    leftDir: true,
                    rightDir: true,
                },
            },
            [false]: { // false is for vertical growth
                directionList: ['upDir', 'downDir',],
                // Vertical growth must zigzag because hexes do not stack perfectly vertically.
                // Each step alternates between left and right to simulate "straight" vertical ribs.
                stepInstruction: {
                    upDir: {
                        TOP_LEFT: ['TOP_RIGHT',],
                        TOP_RIGHT: ['TOP_LEFT',],
                    },
                    downDir: {
                        BOTTOM_LEFT: ['BOTTOM_RIGHT',],
                        BOTTOM_RIGHT: ['BOTTOM_LEFT',],
                    },
                },
                // Always start vertical ribs biased to the "left" side,
                // so that the first zigzag alternates correctly when stepping.
                lastStep: {
                    upDir: 'TOP_LEFT',
                    downDir: 'BOTTOM_LEFT',
                },
                possible: {
                    upDir: true,
                    downDir: true,
                },
            },
        };
        const directionList = growthData[isHorizontal].directionList;
        const stepInstruction = growthData[isHorizontal].stepInstruction;

        const allRibList = new Map();
        let totalSize = 0;
        let currentSize = 0;
        for (const rib of ribList) {
            const { spineHex, length: ribLength, } = rib;
            const spineRibLength = ribLength + 1;
            totalSize = totalSize + spineRibLength;

            // new copy per rib
            const possible = { ...growthData[isHorizontal].possible };
            const lastStep = { ...growthData[isHorizontal].lastStep };
            const placedHexList = {};
            // Each direction tracks its own sequence of placed hexes.
            // They all begin anchored at the spineHex, which acts as the rib root.
            for (const dir of growthData[isHorizontal].directionList) {
                placedHexList[dir] = [rib.spineHex];
            }

            let currentRibLength = 0;
            let directionIndex = this.rng.nextInt(0, directionList.length - 1);
            // Stop if both directions are blocked OR if we already reached the target rib length.
            while (directionList.some(d => possible[d]) && currentRibLength < ribLength) {
                directionIndex = 1 - directionIndex;
                const direction = directionList[directionIndex];
                if (!possible[direction]) continue; // skip this direction if not possible
                const { success } = this.tryPlaceBlobHex({
                    direction, lastStep, stepInstruction, placedHexList,
                    hexArray, tileName, patchDef, patches, defaultTileName, tileSet,
                    hexTextureMap, region, allowOutsideRegion,
                    tileData, tileMap, patchIndex, regionListStr, softFailLimit,
                });
                if (!success) {
                    possible[direction] = false;
                    continue;
                }
                // remove start hex from both placeHexList(s)
                currentRibLength = Object.values(placedHexList)
                    .reduce((sum, list) => sum + list.length - 1, 0);
            }
            const spineRibList = placedHexList[directionList[0]].slice(1).reverse().concat(placedHexList[directionList[1]]);
            allRibList.set(spineHex.key, {
                possible,
                spineHex,
                lastStep,
                placedHexList,
            });
            currentSize = currentSize + spineRibList.length;
        }
        console.log(currentSize, totalSize);

        // Since hard/soft limits can prevent the blob to reach recommended size,
        // loop through the ribs to grow until reaching recommended size,
        // but stop if every rib has been marked unexpandable.
        const availableRibKeys = new Set(allRibList.keys());
        while (currentSize < totalSize && availableRibKeys.size > 0) {
            const keys = Array.from(allRibList.keys());
            // Pick a random key
            const randomKey = keys[this.rng.nextInt(0, keys.length - 1)];
            // Get the corresponding value
            const randomRibData = allRibList.get(randomKey);
            const { possible, lastStep, placedHexList, } = randomRibData;

            const possibleDirection = Object.keys(possible).filter(dir => possible[dir]);
            if (possibleDirection.length < 1) {
                // Rib cannot grow further, remove from available set
                availableRibKeys.delete(randomKey);
                continue; // continue to check another random rib
            }
            const direction = possibleDirection[this.rng.nextInt(0, possibleDirection.length - 1)];
            const { success } = this.tryPlaceBlobHex({
                direction, lastStep, stepInstruction, offset, placedHexList,
                hexArray, tileName, patchDef, patches, defaultTileName, tileSet,
                hexTextureMap, region, allowOutsideRegion,
                tileData, tileMap, patchIndex, regionListStr, softFailLimit,
            });
            if (!success) {
                possible[direction] = false;
                continue;
            }
            currentSize++;
        }
        console.log(currentSize, totalSize);
        return { allRibList };
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

    __growBlob(input) {
        const {
            startHex,
            recommendedDimension,
            forcedDimension,
            patchDef,
            hexArray,
            tileData,
            tileMap,
            hexTextureMap,
            region,
            defaultTileName,
            patches,
            tileSet,
            patchIndex,
            regionListStr,
        } = input;

        // Determine the spine
        const { spineDirection, } = this.getSpineDirection({ forcedDimension });
        const { spineLength } = this.calculateSpineLength({
            recommendedDimension,
            forcedDimension,
            spineDirection,
        });
        let isHorizontalSpine = false;
        if (spineDirection == 'width') {
            isHorizontalSpine = true;
        }
        // Grow the vertical spine
        const { spineHexList } = this.growSpine({
            startHex,
            spineLength,
            hexArray,
            tileData,
            tileName: tileData.name,
            patchDef,
            patches,
            defaultTileName,
            tileSet,
            tileMap,
            hexTextureMap,
            region,
            allowOutsideRegion: patchDef.allowOutsideRegion,
            patchIndex,
            regionListStr,
            isHorizontal: isHorizontalSpine,
        });
        const { ribList } = this.calculateRibLengthList({
            spineHexList,
            size: recommendedDimension.size,
            spineDirection,
            recommendedDimension,
        });
        const { allRibList, } = this.growRib({
            ribList,
            hexArray,
            tileData,
            tileName: tileData.name,
            patchDef,
            patches,
            defaultTileName,
            tileMap,
            tileSet,
            hexTextureMap,
            region,
            allowOutsideRegion: patchDef.allowOutsideRegion,
            patchIndex,
            regionListStr,
            isHorizontal: !isHorizontalSpine,
        });
        const placedHexList = new Set();
        allRibList.forEach((key, _) => {
            placedHexList.add(key);
        });
        return { placedHexList, };
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
                placedHexList = this.__growBlob({
                    startHex,
                    recommendedDimension,
                    forcedDimension,
                    patchDef,
                    hexArray,
                    tileData,
                    tileMap,
                    hexTextureMap,
                    region,
                    defaultTileName,
                    patches,
                    tileSet,
                    patchIndex,
                    regionListStr,
                });
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
                throw new Error(`[GeneratorMap] ${taggedString.generatorMapUnknownTile(tileName)}`);
            }
            for (const [regionListStr, patchDefList] of Object.entries(tilePatches)) {
                // Split comma-separated region keys and trim whitespace
                const regionKeyList = regionListStr.split(',').map(k => k.trim());
                for (const regionKey of regionKeyList) {
                    const region = regionList.get(regionKey);
                    if (!region) {
                        console.warn(`[GeneratorMap] ${taggedString.generatorMapUnknownRegion(regionKey, biomeName)}`);
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

