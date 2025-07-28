class Parchment {
    static hexParam = {
        side: 0,
        width: 0,
        halfWidth: 0,
        height: 0,
        coordFontSize: 0,
    };

    static mapParam = {
        widthInInch: 0,
        heightInInch: 0,
        expectedWidth: 0,
        expectedHeight: 0,
        width: 0,
        height: 0,
        minQ: 0, maxQ: 0,
        minR: 0, maxR: 0,
        minS: 0, maxS: 0,
    };

    static gridParam = {
        hexList: {},
    };

    static userMapInput = {
        mapWidthInInch: 72,
        mapHeightInInch: 48,
        hexWidthPerInch: 1,
    };

    constructor() {
        this.cameraParam = {};
        this.userInputParam = {};
        this.canvas = document.getElementById('canvasParchment');
        this.setup();
        this.addPanEvents();
        this.addMouseEvents();
        this.addZoomEvents();
        this.testDraw({
            hexList: Parchment.gridParam.hexList,
            mapParam: Parchment.mapParam,
            cameraOffsetX: this.cameraParam.offsetX,
            cameraOffsetY: this.cameraParam.offsetY,
        });
    };

    setup() {

        const divParent = this.canvas.parentElement;
        this.canvas.width = divParent.offsetWidth;
        this.canvas.height = divParent.offsetHeight;
        this.zoomCachedData = Shared.preCalculateParamsFromZoomData({
            canvasWidth: this.canvas.width,
            canvasHeight: this.canvas.height,
        });
        // NOTE: there is no plan to support map editor in portrait mode
        const mode = 'landscape';
        const preCachedZoomData = Shared.getPreCachedZoomLevelDataFromStorage(
            {
                mode,
                cachedData: this.zoomCachedData,
            });
        Parchment.hexParam = preCachedZoomData.hexParam;
        Parchment.mapParam = preCachedZoomData.mapParam;
        Parchment.gridParam.hexList = preCachedZoomData.hexList;
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
        ctx.font = Parchment.hexParam.coordFontSize + 'px Arial';
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
            });
            parent.testDraw({
                hexList: Parchment.gridParam.hexList,
                mapParam: Parchment.mapParam,
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
            const unpadMapPosBeforeX = parent.userInputParam.mousePos.x - parent.cameraParam.offsetX - Parchment.mapParam.padHorizontal;
            const unpadMapPosBeforeY = parent.userInputParam.mousePos.y - parent.cameraParam.offsetY - Parchment.mapParam.padVertical;
            const sideBefore = Parchment.hexParam.side;

            const zoomLevels = Object.keys(Shared.zoomSettings.landscape.levels)
                .map(Number)
                .sort((a, b) => a - b);

            let currentZoom = parseFloat(localStorage.getItem(Shared.STORAGE_KEYS.ZOOM_LEVEL));

            const direction = e.deltaY < 0 ? 1 : -1;  // wheel up = zoom in, down = zoom out
            let currentIndex = zoomLevels.indexOf(currentZoom);

            if (direction > 0 && currentIndex < zoomLevels.length - 1) {
                currentIndex++;
            } else if (direction < 0 && currentIndex > 0) {
                currentIndex--;
            }

            // Get zoom-related pre-cached data
            const newZoom = zoomLevels[currentIndex];
            const modeData = Shared.getDisplayModeData({ mode, });
            const preCachedZoomData = Shared.getPreCachedZoomLevelData({
                mode,
                modeData,
                parsed: newZoom,
                cachedData: parent.zoomCachedData,
            });
            Parchment.hexParam = preCachedZoomData.hexParam;
            Parchment.mapParam = preCachedZoomData.mapParam;
            Parchment.gridParam.hexList = preCachedZoomData.hexList;
            parent.cameraParam = preCachedZoomData.cameraParam;
            localStorage.setItem(Shared.STORAGE_KEYS.ZOOM_LEVEL, newZoom);

            // Update after zoom
            const scale = Parchment.hexParam.side / sideBefore;
            const unpadMapPosAfterX = unpadMapPosBeforeX * scale;
            const unpadMapPosAfterY = unpadMapPosBeforeY * scale;
            const newOffsetX = parent.userInputParam.mousePos.x - unpadMapPosAfterX - Parchment.mapParam.padHorizontal;
            const newOffsetY = parent.userInputParam.mousePos.y - unpadMapPosAfterY - Parchment.mapParam.padVertical;
            // Make sure within bound
            parent.cameraParam.offsetX = Math.max(parent.cameraParam.minOffsetX,
                Math.min(parent.cameraParam.maxOffsetX, newOffsetX));
            parent.cameraParam.offsetY = Math.max(parent.cameraParam.minOffsetY,
                Math.min(parent.cameraParam.maxOffsetY, newOffsetY));
            // Update mouse position on map
            parent.updateMouseMapPosition({
                userInputParam: parent.userInputParam,
                cameraParam: parent.cameraParam,
            });

            parent.testDraw({
                hexList: Parchment.gridParam.hexList,
                mapParam: Parchment.mapParam,
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
            });
        });
    };

    updateMouseMapPosition(input) {
        input.userInputParam.mouseMapPos.x = input.userInputParam.mousePos.x - input.cameraParam.offsetX;
        input.userInputParam.mouseMapPos.y = input.userInputParam.mousePos.y - input.cameraParam.offsetY;
        input.userInputParam.currentMouseOverHex = Hex.getHexFromCoord({
            pointX: input.userInputParam.mouseMapPos.x,
            pointY: input.userInputParam.mouseMapPos.y,
            side: Parchment.hexParam.side,
            hexHalfWidth: Parchment.hexParam.halfWidth,
            hexList: Parchment.gridParam.hexList,
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