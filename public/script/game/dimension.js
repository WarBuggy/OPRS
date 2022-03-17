class Dimension {
    static VIEWPORT_PORTRAIT = Symbol('Portrait');
    static VIEWPORT_LANDSCAPE = Symbol('Landscape');

    static LANDSCAPE_PARAM = {
        RATIO_TABLE_TO_MIN_DIMENSION: 0.9,
    };

    static PORTRAIT_PARAM = {
        RATIO_TABLE_TO_MIN_DIMENSION: 0.9,
    };

    constructor() {
        this.viewportUIWidth = window.innerWidth;
        this.viewportUIHeight = window.innerHeight;

        if (this.viewportUIWidth > this.viewportUIHeight) {
            console.log('Landscape mode');
            this.viewportOrientation = Dimension.VIEWPORT_LANDSCAPE;
            this.viewportBigDimension = this.viewportUIWidth;
            this.viewportSmallDimension = this.viewportUIHeight;
            this.orientationParam = Dimension.LANDSCAPE_PARAM;
        } else {
            console.log('Portrait mode');
            this.viewportOrientation = Dimension.VIEWPORT_PORTRAIT;
            this.viewportMaxDimension = this.viewportUIHeight;
            this.viewportSmallDimension = this.viewportUIWidth;
            this.orientationParam = Dimension.PORTRAIT_PARAM;
        }

        this.viewportTableWidth = this.viewportSmallDimension * this.orientationParam.RATIO_TABLE_TO_MIN_DIMENSION;
        this.viewportTableHeight = this.viewportTableWidth;
    };
};