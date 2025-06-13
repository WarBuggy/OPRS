class Table {
    static RATIO_FRAME_TO_VIEWPORT_MIN = 0.01;

    constructor(screen, camera) {
        this.setup(screen, camera);
    };

    setupFrame(camera) {

    };

    setupTable(camera) {
        this.width = camera.viewportWidth * camera.cameraZoomLevel;
        this.height = camera.viewportHeight * camera.cameraZoomLevel;
    };

    setup(screen, camera) {
        this.setupTable(camera);
    };

    drawSurface(camera) {
        let x = camera.viewportWidthHalf - (camera.cameraLocationX * this.width);
        let y = camera.viewportHeightHalf - (camera.cameraLocationY * this.height);

        this.canvasContext.clearRect(0, 0, camera.viewportWidth, camera.viewportHeight);

        this.canvasContext.beginPath();
        this.canvasContext.fillStyle = 'green';
        this.canvasContext.rect(x, y, this.width, this.height);
        this.canvasContext.fill();
    };
};