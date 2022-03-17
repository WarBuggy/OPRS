class Table {
    constructor(screen, camera) {
        this.canvas = document.getElementById('canvasTable');

        this.setup(screen, camera);

        this.canvas.style.position = 'absolute';
        this.canvas.style.border = '1px solid blue';
        this.canvasContext = this.canvas.getContext('2d');
    };

    setupCanvas(screen, camera) {
        this.canvas.width = camera.viewportWidth;
        this.canvas.height = camera.viewportHeight;
        this.canvas.style.width = camera.viewportWidth + 'px';
        this.canvas.style.height = camera.viewportHeight + 'px';
        this.canvas.style.left = ((screen.width + - camera.viewportWidth) / 2) + 'px';
        this.canvas.style.top = ((screen.height - camera.viewportHeight) / 2) + 'px';
    };

    setupTable(camera) {
        this.width = camera.viewportWidth * camera.cameraZoomLevel;
        this.height = camera.viewportHeight * camera.cameraZoomLevel;
    };

    setup(screen, camera) {
        this.setupCanvas(screen, camera);
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