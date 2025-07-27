class Hex {

    constructor(centerX, centerY, q, r, s) {
        this.centerX = centerX;
        this.centerY = centerY;
        this.point0 = centerX - Grid.hexParam.radius;

        this.topX = centerX;
        this.topY = centerY - Grid.hexParam.radius;

        this.bottomX = centerX;
        this.bottomY = centerY + Grid.hexParam.radius;

        this.topLeftX = centerX - Grid.hexParam.halfWidth;
        this.topLeftY = centerY - Grid.hexParam.halfHeight;

        this.topRightX = centerX + Grid.hexParam.halfWidth;
        this.topRightY = centerY - Grid.hexParam.halfHeight;

        this.bottomLeftX = centerX - Grid.hexParam.halfWidth;
        this.bottomLeftY = centerY + Grid.hexParam.halfHeight;

        this.bottomRightX = centerX + Grid.hexParam.halfWidth;
        this.bottomRightY = centerY + Grid.hexParam.halfHeight;

        this.q = q;
        this.r = r;
        this.s = s;

        this.qX = centerX - Grid.hexParam.halfWidth * 0.4;
        this.qY = centerY - Grid.hexParam.halfHeight * 0.9;
        this.rX = centerX + Grid.hexParam.halfWidth * 0.6;
        this.rY = centerY;
        this.sX = centerX - Grid.hexParam.halfWidth * 0.4;
        this.sY = centerY + Grid.hexParam.halfHeight * 0.9;
    };

    createPath(canvasCtx) {
        canvasCtx.moveTo(this.topX, this.topY);
        canvasCtx.lineTo(this.topRightX, this.topRightY);
        canvasCtx.lineTo(this.bottomRightX, this.bottomRightY);
        canvasCtx.lineTo(this.bottomX, this.bottomY);
        canvasCtx.lineTo(this.bottomLeftX, this.bottomLeftY);
        canvasCtx.lineTo(this.topLeftX, this.topLeftY);
        canvasCtx.lineTo(this.topX, this.topY);
    };

    drawCoord(canvasCtx) {
        canvasCtx.fillText(this.q, this.qX, this.qY);
        canvasCtx.fillText(this.r, this.rX, this.rY);
        canvasCtx.fillText(this.s, this.sX, this.sY);
    };

    static cubeRound(fracQ, fracR, fracS) {
        let q = Math.round(fracQ);
        let r = Math.round(fracR);
        let s = Math.round(fracS);

        let qDiff = Math.abs(q - fracQ)
        let rDiff = Math.abs(r - fracR)
        let sDiff = Math.abs(s - fracS)

        if (qDiff > rDiff && qDiff > sDiff) {
            q = -r - s;
        } else if (rDiff > sDiff) {
            r = -q - s
        } else {
            s = -q - r;
        }
        return { q, r, s };
    };

    static pixelToHexCoord(pointX, pointY) {
        // invert the scaling
        let x = (pointX - Grid.hexParam.halfWidth) / Grid.hexParam.radius;
        let y = (pointY - Grid.hexParam.radius) / Grid.hexParam.radius;
        // cartesian to hex
        let q = (Math.sqrt(3) / 3 * x - 1.0 / 3 * y);
        let r = 2.0 / 3 * y;
        let s = 0 - (q + r);
        return Hex.cubeRound(q, r, s);
    };

    static createListKey(q, r, s) {
        return `${q},${r},${s}`;
    };
};