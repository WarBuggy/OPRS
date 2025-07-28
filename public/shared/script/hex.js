class Hex {
    constructor(input) {
        const halfHeight = input.side / 2;
        this.centerX = input.centerX;
        this.centerY = input.centerY;
        this.point0 = input.centerX - input.side;

        this.topX = input.centerX;
        this.topY = input.centerY - input.side;

        this.bottomX = input.centerX;
        this.bottomY = input.centerY + input.side;

        this.topLeftX = input.centerX - input.hexHalfWidth;
        this.topLeftY = input.centerY - halfHeight;

        this.topRightX = input.centerX + input.hexHalfWidth;
        this.topRightY = input.centerY - halfHeight;

        this.bottomLeftX = input.centerX - input.hexHalfWidth;
        this.bottomLeftY = input.centerY + halfHeight;

        this.bottomRightX = input.centerX + input.hexHalfWidth;
        this.bottomRightY = input.centerY + halfHeight;

        this.q = input.q;
        this.r = input.r;
        this.s = input.s;

        this.qX = input.centerX - input.hexHalfWidth * 0.4;
        this.qY = input.centerY - halfHeight * 0.9;
        this.rX = input.centerX + input.hexHalfWidth * 0.6;
        this.rY = input.centerY;
        this.sX = input.centerX - input.hexHalfWidth * 0.4;
        this.sY = input.centerY + halfHeight * 0.9;

        this.key = Hex.createListKey({
            q: this.q,
            r: this.r,
            s: this.s,
        })
    };

    createPath(input) {
        input.canvasCtx.moveTo(this.topX + input.cameraOffsetX, this.topY + input.cameraOffsetY);
        input.canvasCtx.lineTo(this.topRightX + input.cameraOffsetX, this.topRightY + input.cameraOffsetY);
        input.canvasCtx.lineTo(this.bottomRightX + input.cameraOffsetX, this.bottomRightY + input.cameraOffsetY);
        input.canvasCtx.lineTo(this.bottomX + input.cameraOffsetX, this.bottomY + input.cameraOffsetY);
        input.canvasCtx.lineTo(this.bottomLeftX + input.cameraOffsetX, this.bottomLeftY + input.cameraOffsetY);
        input.canvasCtx.lineTo(this.topLeftX + input.cameraOffsetX, this.topLeftY + input.cameraOffsetY);
        input.canvasCtx.lineTo(this.topX + input.cameraOffsetX, this.topY + input.cameraOffsetY);
    };

    drawCoord(input) {
        input.canvasCtx.fillText(this.q, this.qX + input.cameraOffsetX, this.qY + input.cameraOffsetY);
        input.canvasCtx.fillText(this.r, this.rX + input.cameraOffsetX, this.rY + input.cameraOffsetY);
        input.canvasCtx.fillText(this.s, this.sX + input.cameraOffsetX, this.sY + input.cameraOffsetY);
    };

    static cubeRound(input) {
        let q = Math.round(input.fracQ);
        let r = Math.round(input.fracR);
        let s = Math.round(input.fracS);

        let qDiff = Math.abs(q - input.fracQ)
        let rDiff = Math.abs(r - input.fracR)
        let sDiff = Math.abs(s - input.fracS)

        if (qDiff > rDiff && qDiff > sDiff) {
            q = -r - s;
        } else if (rDiff > sDiff) {
            r = -q - s
        } else {
            s = -q - r;
        }
        return { q, r, s };
    };

    static pixelToHexCoord(input) {
        // invert the scaling
        let x = (input.pointX - input.hexHalfWidth) / input.side;
        let y = (input.pointY - input.side) / input.side;
        // cartesian to hex
        let q = (Math.sqrt(3) / 3 * x - 1.0 / 3 * y);
        let r = 2.0 / 3 * y;
        let s = 0 - (q + r);
        return Hex.cubeRound({ fracQ: q, fracR: r, fracS: s, });
    };

    static createListKey(input) {
        return `${input.q},${input.r},${input.s}`;
    };

    static getHexFromCoord(input) {
        let hexCoord = Hex.pixelToHexCoord({
            pointX: input.pointX,
            pointY: input.pointY,
            side: input.side,
            hexHalfWidth: input.hexHalfWidth,
        });
        let listKey = Hex.createListKey({ q: hexCoord.q, r: hexCoord.r, s: hexCoord.s, });
        console.debug(listKey);
        return input.hexList[listKey];
    };
};