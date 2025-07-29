class Parchment extends WorkSurface {
    static userMapInput = {
        mapWidthInInch: 72,
        mapHeightInInch: 48,
        hexWidthPerInch: 1,
    };

    constructor(input) {
        super(input);
        this.addPanEvents();
        this.addMouseEvents();
        this.addZoomEvents();
        this.testDraw({
            hexList: this.gridParam.hexList,
            mapParam: this.mapParam,
            cameraOffsetX: this.cameraParam.offsetX,
            cameraOffsetY: this.cameraParam.offsetY,
        });
    };

    declareZoomSettings() {
        this.zoomSettings = {
            landscape: {
                levels: {
                    0.5: 6,
                    1: 12,
                    2: 24,
                },
                defaultZoomLevel: 1,
            },
            // portrait: {
            //     levels: {
            //         0.5: 8,
            //         1: 16,
            //         2: 32,
            //     },
            //     defaultZoomLevel: 1,
            // }
        };
    };

    setup() {
        const divParent = this.canvas.parentElement;
        this.canvas.width = divParent.offsetWidth;
        this.canvas.height = divParent.offsetHeight;
        this.zoomCachedData = this.preCalculateParamsFromZoomData({
            canvasWidth: this.canvas.width,
            canvasHeight: this.canvas.height,
            mapWidthInInch: Parchment.userMapInput.mapWidthInInch,
            mapHeightInInch: Parchment.userMapInput.mapHeightInInch,
            hexWidthPerInch: Parchment.userMapInput.hexWidthPerInch,
        });
        // NOTE: there is no plan to support map editor in portrait mode
        const mode = 'landscape';
        const preCachedZoomData = this.getPreCachedZoomLevelDataFromStorage(
            {
                mode,
                cachedData: this.zoomCachedData,
            });
        this.hexParam = preCachedZoomData.hexParam;
        this.mapParam = preCachedZoomData.mapParam;
        this.gridParam = preCachedZoomData.gridParam;
        this.cameraParam = preCachedZoomData.cameraParam;
    };

    testDraw(input) {
        let ctx = this.canvas.getContext('2d');
        ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

        // draw hexes
        ctx.strokeStyle = 'red';
        ctx.beginPath();
        for (let key in input.hexList) {
            let aHex = input.hexList[key];
            aHex.createPath({
                canvasCtx: ctx,
                cameraOffsetX: input.cameraOffsetX,
                cameraOffsetY: input.cameraOffsetY,
            });
        }
        ctx.stroke();

        // draw map boundary
        ctx.strokeStyle = 'cyan';
        ctx.beginPath();
        ctx.moveTo(input.cameraOffsetX, input.cameraOffsetY);
        ctx.lineTo(input.mapParam.width + input.cameraOffsetX, input.cameraOffsetY);
        ctx.lineTo(input.mapParam.width + input.cameraOffsetX, input.mapParam.height + input.cameraOffsetY);
        ctx.lineTo(input.cameraOffsetX, input.mapParam.height + input.cameraOffsetY);
        ctx.lineTo(input.cameraOffsetX, input.cameraOffsetY);
        ctx.stroke();

        // draw hex coords
        ctx.font = this.hexParam.coordFontSize + 'px Arial';
        ctx.fillStyle = 'green';
        ctx.textBaseline = 'middle';
        for (let key in input.hexList) {
            let aHex = input.hexList[key];
            aHex.drawCoord({
                canvasCtx: ctx,
                cameraOffsetX: input.cameraOffsetX,
                cameraOffsetY: input.cameraOffsetY,
            });
        }
    };

    addPanEvents() {
        const parent = this;
        document.addEventListener('keydown', (e) => {
            switch (e.key.toLowerCase()) {
                case 'w': parent.cameraParam.offsetY += parent.cameraParam.moveSpeed; break;
                case 'a': parent.cameraParam.offsetX += parent.cameraParam.moveSpeed; break;
                case 's': parent.cameraParam.offsetY -= parent.cameraParam.moveSpeed; break;
                case 'd': parent.cameraParam.offsetX -= parent.cameraParam.moveSpeed; break;
            };
            parent.cameraParam.offsetX = Math.max(parent.cameraParam.minOffsetX,
                Math.min(parent.cameraParam.maxOffsetX, parent.cameraParam.offsetX));
            parent.cameraParam.offsetY = Math.max(parent.cameraParam.minOffsetY,
                Math.min(parent.cameraParam.maxOffsetY, parent.cameraParam.offsetY));
            parent.updateMouseMapPosition({
                userInputParam: parent.userInputParam,
                cameraParam: parent.cameraParam,
                hexParam: parent.hexParam,
                gridParam: parent.gridParam,
            });
            parent.testDraw({
                hexList: parent.gridParam.hexList,
                mapParam: parent.mapParam,
                cameraOffsetX: parent.cameraParam.offsetX,
                cameraOffsetY: parent.cameraParam.offsetY,
            });
        });
    };

    addZoomEvents() {
        const mode = 'landscape';
        const parent = this;
        this.canvas.addEventListener('wheel', (e) => {
            e.preventDefault();

            // get before zoom data
            const unpadMapPosBeforeX = parent.userInputParam.mousePos.x - parent.cameraParam.offsetX - this.mapParam.padHorizontal;
            const unpadMapPosBeforeY = parent.userInputParam.mousePos.y - parent.cameraParam.offsetY - this.mapParam.padVertical;
            const sideBefore = this.hexParam.side;

            const zoomLevels = Object.keys(this.zoomSettings.landscape.levels)
                .map(Number)
                .sort((a, b) => a - b);

            let currentZoom = parseFloat(localStorage.getItem(parent.STORAGE_KEYS.ZOOM_LEVEL));

            const direction = e.deltaY < 0 ? 1 : -1;  // wheel up = zoom in, down = zoom out
            let currentIndex = zoomLevels.indexOf(currentZoom);

            if (direction > 0 && currentIndex < zoomLevels.length - 1) {
                currentIndex++;
            } else if (direction < 0 && currentIndex > 0) {
                currentIndex--;
            }

            // Get zoom-related pre-cached data
            const newZoom = zoomLevels[currentIndex];
            const modeData = parent.getDisplayModeData({ mode, });
            const preCachedZoomData = parent.getPreCachedZoomLevelData({
                mode,
                modeData,
                parsed: newZoom,
                cachedData: parent.zoomCachedData,
            });
            parent.hexParam = preCachedZoomData.hexParam;
            parent.mapParam = preCachedZoomData.mapParam;
            parent.gridParam = preCachedZoomData.gridParam;
            parent.cameraParam = preCachedZoomData.cameraParam;
            localStorage.setItem(parent.STORAGE_KEYS.ZOOM_LEVEL, newZoom);

            // Update after zoom
            const scale = parent.hexParam.side / sideBefore;
            const unpadMapPosAfterX = unpadMapPosBeforeX * scale;
            const unpadMapPosAfterY = unpadMapPosBeforeY * scale;
            const newOffsetX = parent.userInputParam.mousePos.x - unpadMapPosAfterX - parent.mapParam.padHorizontal;
            const newOffsetY = parent.userInputParam.mousePos.y - unpadMapPosAfterY - parent.mapParam.padVertical;
            // Make sure within bound
            parent.cameraParam.offsetX = Math.max(parent.cameraParam.minOffsetX,
                Math.min(parent.cameraParam.maxOffsetX, newOffsetX));
            parent.cameraParam.offsetY = Math.max(parent.cameraParam.minOffsetY,
                Math.min(parent.cameraParam.maxOffsetY, newOffsetY));
            // Update mouse position on map
            parent.updateMouseMapPosition({
                userInputParam: parent.userInputParam,
                cameraParam: parent.cameraParam,
                hexParam: parent.hexParam,
                gridParam: parent.gridParam,
            });

            parent.testDraw({
                hexList: parent.gridParam.hexList,
                mapParam: parent.mapParam,
                cameraOffsetX: parent.cameraParam.offsetX,
                cameraOffsetY: parent.cameraParam.offsetY,
            });
        }, { passive: false });
    };

    addMouseEvents() {
        this.userInputParam.mousePos = { x: 0, y: 0 };
        this.userInputParam.mouseMapPos = { x: 0, y: 0 };
        const parent = this;
        this.canvas.addEventListener('mousemove', (e) => {
            const rect = parent.canvas.getBoundingClientRect();
            parent.userInputParam.mousePos.x = e.clientX - rect.left;
            parent.userInputParam.mousePos.y = e.clientY - rect.top;
            parent.updateMouseMapPosition({
                userInputParam: parent.userInputParam,
                cameraParam: parent.cameraParam,
                hexParam: parent.hexParam,
                gridParam: parent.gridParam,
            });
        });
    };

    updateMouseMapPosition(input) {
        input.userInputParam.mouseMapPos.x = input.userInputParam.mousePos.x - input.cameraParam.offsetX;
        input.userInputParam.mouseMapPos.y = input.userInputParam.mousePos.y - input.cameraParam.offsetY;
        input.userInputParam.currentMouseOverHex = Hex.getHexFromCoord({
            pointX: input.userInputParam.mouseMapPos.x,
            pointY: input.userInputParam.mouseMapPos.y,
            side: input.hexParam.side,
            hexHalfWidth: input.hexParam.halfWidth,
            hexList: input.gridParam.hexList,
        });
        // console.debug(parent.userInputParam.mouseMapPos);
        // console.debug(Parchment.mapParam.padHorizontal, Parchment.mapParam.padVertical);
        // if (parent.userInputParam.currentMouseOverHex) {
        //     console.debug(`offset X: ${parent.userInputParam.mouseMapPos.x}, offset Y: ${parent.userInputParam.mouseMapPos.y}, (${parent.userInputParam.currentMouseOverHex.q}, ${parent.userInputParam.currentMouseOverHex.r}, ${parent.userInputParam.currentMouseOverHex.s}), centerX: ${parent.userInputParam.currentMouseOverHex.centerX}, centerY: ${parent.userInputParam.currentMouseOverHex.centerY}`);
        // } else {
        //     console.debug(`No found in hex list`);
        // }
    };
};