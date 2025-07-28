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
        this.addZoomEvents();
        this.testDraw({
            hexList: Parchment.gridParam.hexList,
            mapParam: Parchment.mapParam,
            cameraOffsetX: this.cameraParam.cameraOffsetX,
            cameraOffsetY: this.cameraParam.cameraOffsetY,
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
            let dx = 0;
            let dy = 0;
            switch (e.key.toLowerCase()) {
                case 'w': dy += parent.cameraParam.moveSpeed; break;
                case 'a': dx += parent.cameraParam.moveSpeed; break;
                case 's': dy -= parent.cameraParam.moveSpeed; break;
                case 'd': dx -= parent.cameraParam.moveSpeed; break;
            };
            parent.cameraParam.cameraOffsetX = Math.max(parent.cameraParam.minOffsetX,
                Math.min(parent.cameraParam.maxOffsetX, parent.cameraParam.cameraOffsetX + dx));
            parent.cameraParam.cameraOffsetY = Math.max(parent.cameraParam.minOffsetY,
                Math.min(parent.cameraParam.maxOffsetY, parent.cameraParam.cameraOffsetY + dy));
            parent.testDraw({
                hexList: Parchment.gridParam.hexList,
                mapParam: Parchment.mapParam,
                cameraOffsetX: parent.cameraParam.cameraOffsetX,
                cameraOffsetY: parent.cameraParam.cameraOffsetY,
            });
        });
    };

    addZoomEvents() {
        const mode = 'landscape';
        const parent = this;
        this.canvas.addEventListener('wheel', (e) => {
            e.preventDefault();
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

            // Get zoom-related data
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
        }, { passive: false });
    };

    addMouseEvents() {
        this.userInputParam.mousePos = { x: 0, y: 0 };
        this.userInputParam.mouseMapPos = { x: 0, y: 0 };

        canvas.addEventListener('mousemove', (e) => {
            const rect = canvas.getBoundingClientRect();

            mousePos.x = e.clientX - rect.left;
            mousePos.y = e.clientY - rect.top;

            // Adjust for camera offset
            mouseMapPos.x = mousePos.x - cameraOffsetX;
            mouseMapPos.y = mousePos.y - cameraOffsetY;
        });
    };
};