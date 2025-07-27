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

    constructor() {
        this.canvas = document.getElementById('canvasParchment');
        this.setup();
        this.addNavigationEvents();
        this.testDraw({
            hexList: Parchment.gridParam.hexList,
            mapParam: Parchment.mapParam,
            cameraOffsetX: this.cameraParam.cameraOffsetX,
            cameraOffsetY: this.cameraParam.cameraOffsetY,
        });
    };

    setup() {
        const mode = 'landscape';
        const divParent = this.canvas.parentElement;
        this.canvas.width = divParent.offsetWidth;
        this.canvas.height = divParent.offsetHeight;
        this.hexesPerDimension = Shared.getZoomLevelDataFromStorage(
            {
                // NOTE: there is no plan to support map editor in portrait mode
                mode: mode,
            });
        Parchment.hexParam = Shared.calculateHexParam({
            mode: mode,
            hexesPerDimension: this.hexesPerDimension,
            decidingLength: this.canvas.height,
        });
        const result = Shared.setupHexList({
            hexWidthPerInch: 1,
            hexWidth: Parchment.hexParam.width,
            mapWidthInInch: 72,
            mapHeightInInch: 48,
            hexHalfWidth: Parchment.hexParam.halfWidth,
            side: Parchment.hexParam.side,
        });
        Parchment.mapParam = result.mapParam;
        Parchment.gridParam.hexList = result.hexList;
        this.cameraParam = this.calculateCameraParam({
            expectedMapWidth: Parchment.mapParam.expectedWidth,
            expectedMapHeight: Parchment.mapParam.expectedHeight,
            mapWidth: Parchment.mapParam.width,
            mapHeight: Parchment.mapParam.height,
            canvasWidth: this.canvas.width,
            canvasHeight: this.canvas.height,
            hexWidth: Parchment.hexParam.width,
        });
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

    calculateCameraParam(input) {
        const maxOffsetX = input.expectedMapWidth - input.mapWidth;
        const maxOffsetY = input.expectedMapHeight - input.mapHeight;
        const minOffsetX = input.canvasWidth - input.mapWidth - maxOffsetX;
        const minOffsetY = input.canvasHeight - input.mapHeight - maxOffsetY;
        let cameraOffsetX = maxOffsetX;
        let cameraOffsetY = maxOffsetY;
        let moveSpeed = input.hexWidth * 1.3;
        return {
            maxOffsetX, maxOffsetY,
            minOffsetX, minOffsetY,
            cameraOffsetX, cameraOffsetY,
            moveSpeed,
        };
    };

    addNavigationEvents() {
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
};