class Grid {
    static gridParam = {
        hexPerInch: 1,
    };

    static hexParam = {
        radius: 0,
        halfWidth: 0,
        halfHeight: 0,
        width: 0,
        height: 0,
    };

    static mapParam = {
        hexWidth: 0,
        hexHeight: 0,
    };

    constructor(screen, camera, map) {
        this.map = map;
        this.hexList = {};
        this.setup(screen, camera, map);
    };

    setup(screen, camera, map) {
        this.setupMapParam(map);
        this.setupHexParam(screen, camera);
        this.setupHexList();

        let ctx = camera.canvasCtx;
        ctx.clearRect(0, 0, this.viewportWidth, this.viewportHeight);
        ctx.strokeStyle = 'red';
        ctx.beginPath();
        for (let key in this.hexList) {
            let aHex = this.hexList[key];
            aHex.createPath(ctx);
        }
        ctx.stroke();

        ctx.font = Grid.hexParam.coordFontSize + 'px Arial';
        ctx.fillStyle = 'green';
        ctx.textBaseline = 'middle';
        for (let key in this.hexList) {
            let aHex = this.hexList[key];
            aHex.drawCoord(ctx);
        }
    };

    setupHexParam(screen, camera) {
        let currentZoomLevel = camera.zoom.getCurrentLevel();
        if (screen.orientation == Screen.ORIENTATION_LANDSCAPE) {
            Grid.hexParam.radius = camera.viewportHeight / currentZoomLevel.hexPerCanvasHeightInLandscape;
        } else {
            Grid.hexParam.radius = camera.viewportWidth / currentZoomLevel.hexPerCanvasWidthInPotrait;
        }
        Grid.hexParam.halfWidth = Grid.hexParam.radius * Math.cos(Math.PI / 6);
        Grid.hexParam.halfHeight = Grid.hexParam.radius * Math.sin(Math.PI / 6);
        Grid.hexParam.width = Grid.hexParam.halfWidth * 2;
        Grid.hexParam.height = Grid.hexParam.halfHeight * 2;
        Grid.hexParam.coordFontSize = Grid.hexParam.radius * 0.15;
    };

    setupMapParam(map) {
        Grid.mapParam.hexWidth = map.width * Grid.gridParam.hexPerInch;
        Grid.mapParam.hexHeight = map.height * Grid.gridParam.hexPerInch;
    };

    setupHexList() {
        let verticalHexNum = 0;
        let yCoord = Grid.hexParam.radius;
        let q = 0;
        let r = 0;
        let s = 0;
        let xCoord = Grid.hexParam.halfWidth;
        while (verticalHexNum < Grid.mapParam.hexHeight) {
            let horizontalHexNum = 0;
            let maxHorizontalHexNum = Grid.mapParam.hexWidth;
            xCoord = Grid.hexParam.halfWidth;
            if (r % 2 != 0) {
                maxHorizontalHexNum = maxHorizontalHexNum - 1;
                xCoord = xCoord + Grid.hexParam.halfWidth;
            }
            q = - Math.floor(r / 2);
            s = - (q + r);
            while (horizontalHexNum < maxHorizontalHexNum) {
                let aHex = new Hex(xCoord, yCoord, q, r, s);
                let listKey = Hex.createListKey(q, r, s);
                this.hexList[listKey] = aHex;

                xCoord = xCoord + Grid.hexParam.width;
                q = q + 1;
                s = s - 1;

                horizontalHexNum++;
            }
            yCoord = yCoord + Grid.hexParam.radius + Grid.hexParam.halfHeight;
            r = r + 1;
            verticalHexNum++;
        }
        Grid.gridParam.width = xCoord + Grid.hexParam.width;
        Grid.gridParam.height = yCoord + Grid.hexParam.radius;
    };
};