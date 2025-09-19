export class ManagerMap {
    constructor(input) {
        this.emitter = input.emitter;
        this.modData = input.modData;

        this.mapEditorMap = new window.OPRSClasses.MapEditorMap({
            canvasId: input.mapEditor.canvasId,
            emitter: this.emitter,
            modData: this.modData,
        });

        // this.miniMap = new window.OPRSClasses.MiniMapParchment({
        //     canvasId: input.miniMap.canvasId,
        //     zoomCachedData: this.parchment.zoomCachedData,
        //     cameraWidth: this.parchment.canvas.width,
        //     cameraHeight: this.parchment.canvas.height,
        //     cameraOffsetX: this.parchment.cameraParam.offsetX,
        //     cameraOffsetY: this.parchment.cameraParam.offsetY,
        //     zoomLevel: this.parchment.cameraParam.zoomLevel,
        //     emitter: this.emitter,
        // });

        const parent = this;
        this.emitter.on({
            event: Shared.EMITTER_SIGNAL.PARCHMENT_PANNED,
            handler: function () {
                parent.handleParchmentPanned({ parent, });
            },
        });
        this.emitter.on({
            event: Shared.EMITTER_SIGNAL.PARCHMENT_ZOOMED,
            handler: function () {
                parent.handleParchmentZoomed({ parent, });
            },
        });
        this.emitter.on({
            event: Shared.EMITTER_SIGNAL.MINI_MAP_CLICKED,
            handler: function () {
                parent.handleMiniMapClicked({ parent, });
            },
        });
    }

    setup(input) {
        this.mapEditorMap.setup();
        // this.miniMap.setup({
        //     zoomCachedData: this.parchment.zoomCachedData,
        //     cameraWidth: this.parchment.canvas.width,
        //     cameraHeight: this.parchment.canvas.height,
        //     cameraOffsetX: this.parchment.cameraParam.offsetX,
        //     cameraOffsetY: this.parchment.cameraParam.offsetY,
        //     zoomLevel: this.parchment.cameraParam.zoomLevel,
        // });
        // this.miniMap.draw({
        //     canvasWidth: this.miniMap.canvas.width,
        //     canvasHeight: this.miniMap.canvas.height,
        //     scaledMapParam: this.miniMap.scaledMapParam,
        //     scaledCameraParam: this.miniMap.scaledCameraParam,
        //     ctx: this.miniMap.ctx,
        // });
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
        const {
            templateMapName = 'training ground test',
            seed, } = input;
        const templateMapData = this.modData[Shared.MOD_STRING.MOD_DATA_TYPE.TEMPLATE_MAP][templateMapName];
        const templateMap = new window.OPRSClasses.TemplateMap({
            templateMapName, templateMapData,
            featureData: this.modData.feature,
        });
        await this.mapEditorMap.preloadMapTexture({
            templateMap,
            modTileData: this.modData.tile,
        });

        this.generatorMap = new window.OPRSClasses.GeneratorMap({
            modData: this.modData,
            mapParam: this.mapEditorMap.mapParam,
            hexParam: this.mapEditorMap.hexParam,
            gridParam: this.mapEditorMap.gridParam,
            hexWidthPerInch: window.OPRSClasses.Parchment.userMapInput.hexWidthPerInch,
            templateMap,
            hexTextureMap: this.mapEditorMap.hexTextureMap,
            seed,
        });
    }
    requestAnimationFrame(input) {
        requestAnimationFrame(this.mapEditorMap.loop);
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
            hexTextureMap: this.mapEditorMap.hexTextureMap,
        });
        if (this.mapEditorMap.highlightRegionMap.has(regionName)) {
            this.mapEditorMap.highlightRegionMap.delete(regionName);
            return;
        }
        this.mapEditorMap.highlightRegionMap.set(regionName, { color, deviation, });
    }
}