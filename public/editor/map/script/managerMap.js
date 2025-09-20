export class ManagerMap {
    constructor(input) {
        this.emitter = input.emitter;
        this.modData = input.modData;

        this.mapMain = new OPRSClasses.MapMainEditorMap({
            canvasId: input.mapMain.canvasId,
            emitter: this.emitter,
            modData: this.modData,
        });

        this.mapMini = new OPRSClasses.MapMiniEditorMap({
            canvasId: input.mapMini.canvasId,
            cameraWidth: this.mapMain.canvas.width,
            cameraHeight: this.mapMain.canvas.height,
            cameraOffsetX: this.mapMain.cameraParam.offsetX,
            cameraOffsetY: this.mapMain.cameraParam.offsetY,
            mapParam: this.mapMain.mapParam,
            emitter: this.emitter,
        });

        const parent = this;
        this.emitter.on({
            event: Shared.EMITTER_SIGNAL.MAP_MAIN_PANNED,
            handler: function () {
                parent.handleMapMainPanned({ parent, });
            },
        });
        this.emitter.on({
            event: Shared.EMITTER_SIGNAL.MAP_MAIN_ZOOMED,
            handler: function () {
                parent.handleMapMainZoomed({ parent, });
            },
        });
        this.emitter.on({
            event: Shared.EMITTER_SIGNAL.MAP_MINI_CLICKED,
            handler: function () {
                parent.handleMapMiniClicked({ parent, });
            },
        });
    }

    handleMapMainPanned(input) {
        input.parent.mapMini.onMapMainPanned({
            cameraOffsetX: input.parent.mapMain.cameraParam.offsetX,
            cameraOffsetY: input.parent.mapMain.cameraParam.offsetY,
        });
    }

    handleMapMainZoomed(input) {
        input.parent.mapMini.onMapMainZoomed({
            cameraOffsetX: input.parent.mapMain.cameraParam.offsetX,
            cameraOffsetY: input.parent.mapMain.cameraParam.offsetY,
            cameraWidth: input.parent.mapMain.canvas.width,
            cameraHeight: input.parent.mapMain.canvas.height,
            mapParam: input.parent.mapMain.mapParam,
        });
    }

    handleMapMiniClicked(input) {
        input.parent.mapMain.onMapMiniClicked({
            mapMiniScaledClickOffsetX: input.parent.mapMini.userInputParam.scaledClickOffsetX,
            mapMiniScaledClickOffsetY: input.parent.mapMini.userInputParam.scaledClickOffsetY,
        });
    }

    requestAnimationFrame(input) {
        requestAnimationFrame(this.mapMain.loop);
    }

    async generateRandomMap(input) {
        const {
            templateMapName = 'training ground test',
            seed, } = input;
        const templateMapData = this.modData[Shared.MOD_STRING.MOD_DATA_TYPE.TEMPLATE_MAP][templateMapName];
        const templateMap = new window.OPRSClasses.TemplateMap({
            templateMapName, templateMapData,
            featureData: this.modData.feature,
        });
        await this.mapMainEditorMap.preloadMapTexture({
            templateMap,
            modTileData: this.modData.tile,
        });

        this.generatorMap = new window.OPRSClasses.GeneratorMap({
            modData: this.modData,
            mapParam: this.mapMainEditorMap.mapParam,
            hexParam: this.mapMainEditorMap.hexParam,
            gridParam: this.mapMainEditorMap.gridParam,
            hexWidthPerInch: window.OPRSClasses.Parchment.userMapInput.hexWidthPerInch,
            templateMap,
            hexTextureMap: this.mapMainEditorMap.hexTextureMap,
            seed,
        });
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
            hexTextureMap: this.mapMainEditorMap.hexTextureMap,
        });
        if (this.mapMainEditorMap.highlightRegionMap.has(regionName)) {
            this.mapMainEditorMap.highlightRegionMap.delete(regionName);
            return;
        }
        this.mapMainEditorMap.highlightRegionMap.set(regionName, { color, deviation, });
    }
}