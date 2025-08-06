class Terrain {
    constructor(input) {
        this.open = true;
        this.impassable = false;
        this.blocking = false;
        this.cover = false;
        this.difficult = false;
        this.dangerous = false;
        this.elevationValue = 0;
        this.rule = {};

        this.name = input.name;
        this.baseColor = input.baseColor;
    };
};