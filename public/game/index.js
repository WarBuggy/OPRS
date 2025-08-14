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


// TEST: hex to pixel and pixel to hex
// this.camera.canvas.addEventListener('click', function (event) {
//     const clientX = event.clientX;
//     const clientY = event.clientY;
//     const pageX = event.pageX;
//     const pageY = event.pageY;
//     const offsetX = event.offsetX;
//     const offsetY = event.offsetY;
//     let hexCoord = = window.OPRSClasses.Hex.pixelToHexCoord(offsetX, offsetY);
//     let listKey = window.OPRSClasses.Hex.createListKey(hexCoord.q, hexCoord.r, hexCoord.s);
//     let aHex = Grid.hexParam.list[listKey];
//     console.log(`offset X: ${offsetX}, offset Y: ${offsetY}, (${hexCoord.q}, ${hexCoord.r}, ${hexCoord.s}), centerX: ${aHex.centerX}, centerY: ${aHex.centerY}`);
// });


