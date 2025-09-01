window.onload = function () {
    window.gameManager = new GameManager();
};

window.addEventListener('resize', function () {
    window.gameManager.setup();
});

class GameManager {
    constructor() {
        this.screen = new Screen();
        this.camera = new Camera(this.screen);
        this.table = new Table(this.screen, this.camera, mapTest);
    };

    setup() {
        this.screen.setup();
        this.camera.setup(this.screen);
        this.table.setup(this.screen, this.camera);
    };
};


