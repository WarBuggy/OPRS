class Table {
    constructor(screen, camera, map) {
        this.map = map;
        this.grid = new Grid(screen, camera, map);
    };

    setup(screen, camera) {
        this.grid.setup(screen, camera, this.map);
    };
};