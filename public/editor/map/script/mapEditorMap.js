export class MapEditorMap extends OPRSClasses.MapMain {

    constructor(input) {
        super(input);

        this.addToggleOptionKeyEvent();

        // For debug purpose
        // this.highlightRegionMap = new Map();

        // Bind loop so manager can call it
        this.loop = this.loop.bind(this);

        // CONSIDER TO REMOVE
        this.addAnimationLoopKeyEvent();
    }

    declareZoomSettings(input) {
        const { modData, } = input;
        this.STORAGE_KEY_LIST.ZOOM_LEVEL = Shared.STORAGE_KEY_LIST.ZOOM_LEVEL_MAP_EDITOR_MAP;
        const zoomData = {};
        for (const [mode, modeZoomData] of
            Object.entries(modData[Shared.MOD_STRING.MOD_DATA_TYPE.ZOOM_DATA].default)) {
            // every modData object has a name property
            // ignore it
            if (mode == 'name') {
                continue;
            }
            zoomData[mode] = {
                default: modeZoomData.default,
                levelMap: new Map(modeZoomData.levelList),
            };
        }
        return { zoomData, };
    };

    /**
     * Sets the current hex, map, grid, and camera parameters from the loaded data.
     * Note: Portrait mode is currently not supported.
     */
    setup(input) {
        this.canvas.width = this.canvas.parentElement.offsetWidth;
        this.canvas.height = this.canvas.parentElement.offsetHeight;
        const { mapWidthInInch, mapHeightInInch, } = this.setMapWidthAndHeight({
            userInputWidth: input.mapWidthInInch,
            userInputHeight: input.mapHeightInInch,
        });

        this.calculateBaseMapParam(input);

        // NOTE: there is no plan to support map editor in portrait mode
        this.displayMode = 'landscape';
        const { currentZoomLevel, currentZoomData, } = this.getCurrentZoomDataFromStorage({
            displayMode: this.displayMode,
            zoomData: input.zoomData,
        });

        this.processZoomData({
            tileSize: currentZoomData,
            canvasWidth: this.canvas.width,
            canvasHeight: this.canvas.height,
            mapWidthInInch, mapHeightInInch,
            tilePerInch: input.tilePerInch,
            zoomLevel: currentZoomLevel,
        });
    }

    animationLoop(timestamp) {
        // RECORD DRAW TIME
        // const start = performance.now();

        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

        const { visibleTileList, currentCol, currentRow, } = this.getVisbileTileData();
        // highlight current mouse over hex
        // const mouseOverHex = this.userInputParam.currentMouseOverHex;
        // if (mouseOverHex != null) {
        //     visibleHexes.delete(mouseOverHex.key);
        //     this.ctx.beginPath();
        //     mouseOverHex.createPath({
        //         canvasCtx: this.ctx,
        //         cameraOffsetX: this.cameraParam.offsetX,
        //         cameraOffsetY: this.cameraParam.offsetY,
        //     });
        //     this.ctx.closePath();
        //     this.ctx.fillStyle = 'rgba(255, 215, 0, 0.6)';
        //     this.ctx.fill();
        //     if (this.option.visual.showHexCoord) {
        //         this.ctx.font = (this.hexParam.coordFontSize * 1.5) + 'px Arial';
        //         this.ctx.fillStyle = '#222222';
        //         mouseOverHex.drawCoord({
        //             canvasCtx: this.ctx,
        //             cameraOffsetX: this.cameraParam.offsetX,
        //             cameraOffsetY: this.cameraParam.offsetY,
        //         });
        //     }
        // }

        // for (const tile of visibleTileList) {
        //     aHex.drawTexture({
        //         canvasCtx: this.ctx,
        //         hexWidth: this.hexParam.width,
        //         hexHeight: this.hexParam.height,
        //         cameraOffsetX: this.cameraParam.offsetX,
        //         cameraOffsetY: this.cameraParam.offsetY,
        //         textureList: this.textureList,
        //         hexTextureMap: this.hexTextureMap,
        //     });
        // }


        if (this.option.visual.showGrid) {
            this.ctx.strokeStyle = '#555';
            this.ctx.beginPath();
            const startX = (currentCol * this.mapParam.side) - this.cameraParam.offsetX;
            let currentX = startX;
            if (currentX < 0) {
                currentX = currentX + this.mapParam.side;
            }
            const maxX = currentX + this.canvas.width;
            while (currentX <= maxX) {
                this.ctx.moveTo(currentX, 0);
                this.ctx.lineTo(currentX, this.canvas.height);
                currentX = currentX + this.mapParam.side;
            }
            const startY = (currentRow * this.mapParam.side) - this.cameraParam.offsetY;
            let currentY = startY;
            if (currentY < 0) {
                currentY = currentY + this.mapParam.side;
            }
            const maxY = currentY + this.canvas.height;
            while (currentY <= maxY) {
                this.ctx.moveTo(0, currentY);
                this.ctx.lineTo(this.canvas.width, currentY);
                currentY = currentY + this.mapParam.side;
            }
            this.ctx.stroke();
        }

        // Create highlight region hex border lines
        // for (const [regionName, data] of this.highlightRegionMap) {
        //     const { color, deviation, } = data;
        //     this.ctx.strokeStyle = color;
        //     this.ctx.beginPath();
        //     for (const [key, hex] of visibleHexes) {
        //         const hexTexture = this.hexTextureMap.get(key);
        //         if (!hexTexture || !hexTexture.highlightRegionList) continue;
        //         if (hexTexture.highlightRegionList.has(regionName)) {
        //             hex.createRegionHighlightPath({
        //                 canvasCtx: this.ctx,
        //                 cameraOffsetX: this.cameraParam.offsetX,
        //                 cameraOffsetY: this.cameraParam.offsetY,
        //                 deviation,
        //             });
        //         }
        //     }
        //     this.ctx.stroke();
        // }

        if (this.option.visual.showCoord) {
            // draw hex coords
            this.ctx.font = this.mapParam.coordFontSize + 'px Arial';
            this.ctx.fillStyle = '#888888';
            this.ctx.textBaseline = 'middle';
            this.ctx.textAlign = "center";
            // CONSIDER TO REMOVE
            // for (let key in this.gridParam.hexList) {
            //     let aHex = this.gridParam.hexList[key];
            //     aHex.drawCoord({
            //         canvasCtx: this.ctx,
            //         cameraOffsetX: this.cameraParam.offsetX,
            //         cameraOffsetY: this.cameraParam.offsetY,
            //     });
            // };
            for (const tile of visibleTileList) {
                tile.drawCoord({
                    canvasCtx: this.ctx,
                    cameraOffsetX: this.cameraParam.offsetX,
                    cameraOffsetY: this.cameraParam.offsetY,
                });
            };
        }

        // draw map boundary
        this.ctx.strokeStyle = 'cyan';
        // Extend the border slightly to fully include edge pixels 
        // and match the hex tile overlap convention
        this.ctx.strokeRect(-this.cameraParam.offsetX - 1, -this.cameraParam.offsetY - 1,
            this.mapParam.width + 2, this.mapParam.height + 2);


        // CALCULATE DRAW TIME
        // const end = performance.now();
        // const diff = end - start;
        // if (this.maxDrawTime == null) {
        //     this.maxDrawTime = diff;
        //     this.totalFrame = 1;
        //     this.totalTime = diff;
        // } else {
        //     this.maxDrawTime = Math.max(this.maxDrawTime, diff);
        //     this.totalFrame++;
        //     this.totalTime += diff;
        // }
        // console.log(`Runtime: ${(end - start).toFixed(3)} ms. Max: ${this.maxDrawTime} ms. Avg: ${this.totalTime / this.totalFrame} ms.`);
    }

    loop(timestamp) {
        if (!this._isLooping) return;
        const minFrameTime = 1000 / 30; // 30 FPS
        if (!this._lastFrameTime) this._lastFrameTime = timestamp;
        const elapsed = timestamp - this._lastFrameTime;
        if (elapsed >= minFrameTime) {
            this._lastFrameTime = timestamp;
            this.animationLoop(timestamp);
        };
        requestAnimationFrame(this.loop);
    }

    toggleLoop(input) {
        if (!this._isLooping) {
            this._isLooping = true;
            requestAnimationFrame(this.loop);
            console.log('Resume');
            return;
        }
        this._isLooping = false;
        this._lastFrameTime = null;
        console.log('Pause');
    }

    addAnimationLoopKeyEvent(input) {
        const parent = this;
        window.addEventListener('keydown', function (e) {
            if (e.ctrlKey && e.key.toLowerCase() === 'p') {
                e.preventDefault();
                parent.toggleLoop();
            }
        });
    }

    addToggleOptionKeyEvent(input) {
        const parent = this;
        window.addEventListener('keydown', function (e) {
            if (e.ctrlKey && e.key.toLowerCase() === '.') {
                e.preventDefault();
                parent.option.visual.showGrid = !parent.option.visual.showGrid;
                return;
            }
            if (e.ctrlKey && e.key.toLowerCase() === '/') {
                parent.option.visual.showCoord = !parent.option.visual.showCoord;
                return;
            }
            if (e.ctrlKey && e.key.toLowerCase() === ',') {
                e.preventDefault();
                parent.option.visual.logCoord = !parent.option.visual.logCoord;
                return;
            }
        });
    }
}