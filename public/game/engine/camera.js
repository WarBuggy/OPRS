class Camera {

    static LANDSCAPE_PARAM = {
        RATIO_VIEWPORT_MIN__TO_SCREEN_MIN: 0.9,
        RATIO_VIEWPORT_MAX__TO_SCREEN_MAX: 0.7,
    };

    static PORTRAIT_PARAM = {
        RATIO_VIEWPORT_MIN_TO_SCREEN_MIN: 0.9,
        RATIO_VIEWPORT_MAX__TO_SCREEN_MAX: 0.7,
    };

    constructor(screen) {
        this.canvas = document.getElementById('canvasTable');
        this.canvas.style.position = 'absolute';
        this.canvas.style.border = '1px solid blue';
        this.canvasCtx = this.canvas.getContext('2d');

        this.zoom = new Zoom();

        this.setup(screen);
    };

    setup(screen) {
        if (screen.orientation == Screen.ORIENTATION_LANDSCAPE) {
            this.viewportWidth = screen.bigDimension * Camera.LANDSCAPE_PARAM.RATIO_VIEWPORT_MAX__TO_SCREEN_MAX;
            this.viewportHeight = screen.smallDimension * Camera.LANDSCAPE_PARAM.RATIO_VIEWPORT_MIN__TO_SCREEN_MIN;
        } else {
            this.viewportWidth = screen.smallDimension * Camera.LANDSCAPE_PARAM.RATIO_VIEWPORT_MIN__TO_SCREEN_MIN;
            this.viewportHeight = screen.bigDimension * Camera.LANDSCAPE_PARAM.RATIO_VIEWPORT_MAX__TO_SCREEN_MAX;
        }

        this.viewportHalfWidth = this.viewportWidth / 2;
        this.viewportHalfHeight = this.viewportHeight / 2;

        this.canvas.width = this.viewportWidth;
        this.canvas.height = this.viewportHeight;
        this.canvas.style.width = this.viewportWidth + 'px';
        this.canvas.style.height = this.viewportHeight + 'px';
        this.canvas.style.left = ((screen.width - this.viewportWidth) / 2) + 'px';
        this.canvas.style.top = ((screen.height - this.viewportHeight) / 2) + 'px';
    };

    // checkCameraPosition(table) {
    //     this.checkADimension(this.cameraLocationX, table.width, this.viewportWidthHalf);
    //     this.checkADimension(this.cameraLocationY, table.height, this.viewportHeightHalf);
    // };

    // checkADimension(cameraLocation, tableMaxLength, minLength) {
    //     let firstLength = cameraLocation * tableMaxLength;
    //     if (firstLength < minLength) {
    //         cameraLocation = minLength / tableMaxLength;
    //         return;
    //     }

    //     let secondLength = (1 - cameraLocation) * tableMaxLength;
    //     if (secondLength < minLength) {
    //         cameraLocation = (tableMaxLength - minLength) / tableMaxLength;
    //     }
    // };
};