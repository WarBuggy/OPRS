export class ManagerMap {

    constructor(input) {
        this.emitter = input.emitter;

        this.parchment = new window.OPRSClasses.Parchment({
            canvasId: input.parchment.canvasId,
            emitter: this.emitter,
        });

        this.miniMap = new window.OPRSClasses.MiniMapParchment({
            canvasId: input.miniMap.canvasId,
            zoomCachedData: this.parchment.zoomCachedData,
            cameraWidth: this.parchment.canvas.width,
            cameraHeight: this.parchment.canvas.height,
            cameraOffsetX: this.parchment.cameraParam.offsetX,
            cameraOffsetY: this.parchment.cameraParam.offsetY,
            zoomLevel: this.parchment.cameraParam.zoomLevel,
            emitter: this.emitter,
        });

        const parent = this;
        this.emitter.on(Shared.EMITTER_SIGNAL.PARCHMENT_PANNED, function () {
            parent.handleParchmentPanned({ parent, });
        });
        this.emitter.on(Shared.EMITTER_SIGNAL.PARCHMENT_ZOOMED, function () {
            parent.handleParchmentZoomed({ parent, });
        });
        this.emitter.on(Shared.EMITTER_SIGNAL.MINI_MAP_CLICKED, function () {
            parent.handleMiniMapClicked({ parent, });
        });

        this.modData = input.modData;
        this.regionList = new Map();
        // Create the default region list
        this.populateRegionList({
            regionDataList: this.modData[Shared.MOD_STRING.MOD_DATA_TYPE.REGION],
            mapParam: this.parchment.mapParam,
            gridParam: this.parchment.gridParam,
            hexParam: this.parchment.hexParam,
            regionList: this.regionList,
        });
        this.populateRegionList({
            regionDataList: this.modData.biome.grassland.regionList,
            mapParam: this.parchment.mapParam,
            gridParam: this.parchment.gridParam,
            hexParam: this.parchment.hexParam,
            regionList: this.regionList,
        });
        requestAnimationFrame(this.parchment.loop);
    }

    setup(input) {
        this.parchment.setup();
        this.miniMap.setup({
            zoomCachedData: this.parchment.zoomCachedData,
            cameraWidth: this.parchment.canvas.width,
            cameraHeight: this.parchment.canvas.height,
            cameraOffsetX: this.parchment.cameraParam.offsetX,
            cameraOffsetY: this.parchment.cameraParam.offsetY,
            zoomLevel: this.parchment.cameraParam.zoomLevel,
        });
        this.miniMap.draw({
            canvasWidth: this.miniMap.canvas.width,
            canvasHeight: this.miniMap.canvas.height,
            scaledMapParam: this.miniMap.scaledMapParam,
            scaledCameraParam: this.miniMap.scaledCameraParam,
            ctx: this.miniMap.ctx,
        });
    }

    handleParchmentPanned(input) {
        input.parent.miniMap.onCameraPanned({
            cameraOffsetX: input.parent.parchment.cameraParam.offsetX,
            cameraOffsetY: input.parent.parchment.cameraParam.offsetY,
        });
    }

    handleParchmentZoomed(input) {
        input.parent.miniMap.onCameraZoomed({
            zoomLevel: input.parent.parchment.cameraParam.zoomLevel,
            cameraOffsetX: input.parent.parchment.cameraParam.offsetX,
            cameraOffsetY: input.parent.parchment.cameraParam.offsetY,
        });
    }

    handleMiniMapClicked(input) {
        input.parent.parchment.onMiniMapClicked({
            miniMapScaledClickOffsetX: input.parent.miniMap.userInputParam.scaledClickOffsetX,
            miniMapScaledClickOffsetY: input.parent.miniMap.userInputParam.scaledClickOffsetY,
        });
    }

    populateRegionList(input) {
        const { regionDataList, mapParam, gridParam, hexParam, regionList, } = input;
        // Perform topological sort and process regions
        const { sortedRegionList, unresolvableRegionList, } =
            this.topoSortRegions({ regionDataList, regionList, });
        for (const regionName of sortedRegionList) {
            if (regionList.has(regionName)) continue;
            const regionData = regionDataList[regionName];
            try {
                const region = new window.OPRSClasses.Region({
                    regionName, regionData,
                    mapParam, gridParam, hexParam, regionList
                });
                regionList.set(regionName, region);
                console.log(`[ManagerMap] ${taggedString.managerMapRegionCreated(regionName, region.keys.size)}`);
            } catch (e) {
                console.error(`[ManagerMap] ${taggedString.managerMapFailedToCreateRegion(regionName, e)}`);
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
                console.warn(`[ManagerMap] ${taggedString.managerMapCircularDependency([...tempMark].join(', '))}`);
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
                        console.warn(`[ManagerMap] ${taggedString.managerMapMissingDependency(depName, regionName)}`);
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
}