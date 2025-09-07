export class ManagerMap {
    constructor(input) {
        this.emitter = input.emitter;
        this.modData = input.modData;

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

    async generateRandomMap(input) {
        const { biomeName = 'training ground', seed, } = input;
        await this.parchment.preloadBiomeTexture({
            biome: this.modData.biome[biomeName],
            modTileData: this.modData.tile,
        });

        this.mapGenerator = new window.OPRSClasses.MapGenerator({
            modData: this.modData,
            mapParam: this.parchment.mapParam,
            hexParam: this.parchment.hexParam,
            gridParam: this.parchment.gridParam,
            biome: this.modData.biome[biomeName],
            biomeName,
            hexTextureMap: this.parchment.hexTextureMap,
            seed,
        });
    }
    requestAnimationFrame(input) {
        requestAnimationFrame(this.parchment.loop);
    }

    toggleRegionHighlight(input) {
        const { regionName, color = 'red', deviation = 0, } = input;
        const region = this.mapGenerator.regionList.get(regionName);
        if (!region) {
            return;
        }
        this.mapGenerator.toggleRegionHighlight({
            region,
            regionName,
            hexTextureMap: this.parchment.hexTextureMap,
        });
        if (this.parchment.highlightRegionMap.has(regionName)) {
            this.parchment.highlightRegionMap.delete(regionName);
            return;
        }
        this.parchment.highlightRegionMap.set(regionName, { color, deviation, });
    }
}