class Terrain {
    static COLOR_OPEN = '#00FF7F';
    static COLOR_DIFFICULT = '#FF4500';
    static COLOR_DANGEROUS = '#FFD700';
    static COLOR_IMPASSABLE = '#555';
    static OVERLAY_COVER = 'rbga(0,0,0,0.4)';

    constructor(input) {
        this.open = true;
        this.impassable = false;
        this.blocking = false;
        this.cover = false;
        this.difficult = false;
        this.dangerous = false;
        this.elevationValue = 0;

        this.name = input.name;
    }
}