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
        hexHeightPerInch: 0,
    };

    static gridParam = {
        width: 0,
        height: 0,
    };

    constructor() {
        this.canvas = document.getElementById('canvasParchment');
        this.setup();
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
        this.setupHexList({
            hexWidthPerInch: 1,
            hexWidth: Parchment.hexParam.width,
            mapWidthInInch: 72,
            mapHeightInInch: 48,
        });
    };

    setupHexList(input) {
        const pixelPerInch = input.hexWidthPerInch * input.hexWidth;
        const expectedMapWidthInPixel = input.mapWidthInInch * pixelPerInch;
        const expectedMapHeightInPixel = input.mapHeightInInch * pixelPerInch;

        let verticalHexNum = 0;
        let yCoord = Parchment.hexParam.side;
        let q = 0;
        let r = 0;
        let s = 0;
        let xCoord = Parchment.hexParam.halfWidth;
        while (verticalHexNum < Parchment.mapParam.hexHeight) {
            let horizontalHexNum = 0;
            let maxHorizontalHexNum = Parchment.mapParam.hexWidth;
            xCoord = x.hexParam.halfWidth;
            if (r % 2 != 0) {
                maxHorizontalHexNum = maxHorizontalHexNum - 1;
                xCoord = xCoord + Parchment.hexParam.halfWidth;
            }
            q = - Math.floor(r / 2);
            s = - (q + r);
            while (horizontalHexNum < maxHorizontalHexNum) {
                let aHex = new Hex(xCoord, yCoord, q, r, s);
                let listKey = Hex.createListKey(q, r, s);
                this.hexList[listKey] = aHex;

                xCoord = xCoord + Parchment.hexParam.width;
                q = q + 1;
                s = s - 1;

                horizontalHexNum++;
            }
            yCoord = yCoord + Parchment.hexParam.side + Parchment.hexParam.halfHeight;
            r = r + 1;
            verticalHexNum++;
        }
        Parchment.gridParam.width = xCoord + Parchment.hexParam.width;
        Parchment.gridParam.height = yCoord + Parchment.hexParam.side;
    };
};