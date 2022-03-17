class Camera {

    static LANDSCAPE_PARAM = {
        RATIO_VIEWPORT_TO_SCREEN_MIN: 0.9,
    };

    static PORTRAIT_PARAM = {
        RATIO_VIEWPORT_TO_SCREEN_MIN: 0.9,
    };

    constructor(screen) {
        this.cameraLocationX = 0.5;
        this.cameraLocationY = 0.5;
        this.cameraZoomLevel = 1;

        this.setup(screen);
    };

    setup(screen) {
        if (screen.orientation == Screen.ORIENTATION_LANDSCAPE) {
            this.viewportWidth = screen.smallDimension * Camera.LANDSCAPE_PARAM.RATIO_VIEWPORT_TO_SCREEN_MIN;
            this.viewportHeight = this.viewportWidth;
        } else {
            this.viewportWidth = screen.smallDimension * Camera.PORTRAIT_PARAM.RATIO_VIEWPORT_TO_SCREEN_MIN;
            this.viewportHeight = this.viewportWidth;
        }

        this.viewportWidthHalf = this.viewportWidth / 2;
        this.viewportHeightHalf = this.viewportHeight / 2;
    };

    checkCameraPosition(table) {
        this.checkADimension(this.cameraLocationX, table.width, this.viewportWidthHalf);
        this.checkADimension(this.cameraLocationY, table.height, this.viewportHeightHalf);
    };

    checkADimension(cameraLocation, tableMaxLength, minLength) {
        let firstLength = cameraLocation * tableMaxLength;
        if (firstLength < minLength) {
            cameraLocation = minLength / tableMaxLength;
            return;
        }

        let secondLength = (1 - cameraLocation) * tableMaxLength;
        if (secondLength < minLength) {
            cameraLocation = (tableMaxLength - minLength) / tableMaxLength;
        }
    };
};