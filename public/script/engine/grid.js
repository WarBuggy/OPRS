class Grid {
    static gridParam = {

    };

    static hexParam = {
        radius: 0,
        halfWidth: 0,
        halfHeight: 0,
        width: 0,
        height: 0,
        list: [],
    };

    constructor(screen, camera) {
        this.setup(screen, camera);
    };

    setup(screen, camera) {
        this.calculateHexParam(screen, camera);
        Grid.hexParam.list = [];

        let ctx = camera.canvasCtx;
        ctx.clearRect(0, 0, this.viewportWidth, this.viewportHeight);

        ctx.strokeStyle = 'red';
        ctx.beginPath();

        let y = Grid.hexParam.radius;
        let q = 0;
        let r = 0;
        let s = 0;
        while (y < camera.viewportHeight) {
            let x = Grid.hexParam.halfWidth;
            if (r % 2 != 0) {
                x = x + Grid.hexParam.halfWidth;
            }
            q = 0 - Math.floor(r / 2);
            s = 0 - (q + r);
            while (x < camera.viewportWidth) {
                let aHex = new Hex(x, y, q, r, s);
                aHex.createPath(ctx);
                x = x + Grid.hexParam.width;
                q = q + 1;
                s = s - 1;
                Grid.hexParam.list.push(aHex);
            }
            y = y + Grid.hexParam.radius + Grid.hexParam.halfHeight;
            r = r + 1;
        }
        ctx.stroke();

        ctx.font = Grid.hexParam.coordFontSize + 'px Arial';
        ctx.fillStyle = 'green';
        ctx.textBaseline = 'middle';
        for (let i = 0; i < Grid.hexParam.list.length; i++) {
            let aHex = Grid.hexParam.list[i];
            aHex.drawCoord(ctx);
        }
    };

    calculateHexParam(screen, camera) {
        let currentZoomLevel = camera.zoom.getCurrentLevel();
        if (screen.orientation == Screen.ORIENTATION_LANDSCAPE) {
            Grid.hexParam.radius = camera.viewportHeight / currentZoomLevel.hexPerCanvasHeightInLandscape;
        } else {
            Grid.hexParam.radius = camera.Width / currentZoomLevel.hexPerCanvasWidthInPotrait;
        }
        Grid.hexParam.halfWidth = Grid.hexParam.radius * Math.cos(Math.PI / 6);
        Grid.hexParam.halfHeight = Grid.hexParam.radius * Math.sin(Math.PI / 6);
        Grid.hexParam.width = Grid.hexParam.halfWidth * 2;
        Grid.hexParam.height = Grid.hexParam.halfHeight * 2;
        Grid.hexParam.coordFontSize = Grid.hexParam.radius * 0.15;
    };
};