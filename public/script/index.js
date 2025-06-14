window.onload = function () {
    window.gameManager = new GameManager();
};

window.addEventListener('resize', function () {
    window.gameManager.calculateAllSizes();
});

class GameManager {
    constructor() {
        this.screen = new Screen();
        this.camera = new Camera(this.screen);
        this.grid = new Grid(this.screen, this.camera);

        this.camera.canvas.addEventListener('click', function (event) {
            const clientX = event.clientX;
            const clientY = event.clientY;
            const pageX = event.pageX;
            const pageY = event.pageY;
            const offsetX = event.offsetX;
            const offsetY = event.offsetY;
            let hexCoord = Hex.pixelToHexCoord(offsetX, offsetY);
            console.log(`offset X: ${offsetX}, offset Y: ${offsetY}, (${hexCoord.q}, ${hexCoord.r}, ${hexCoord.s})`);
        });
    };

    calculateAllSizes() {
        this.screen.setup();
        this.camera.setup(this.screen);
    };
};


