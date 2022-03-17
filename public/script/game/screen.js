class Screen {
    static ORIENTATION_PORTRAIT = Symbol('Portrait');
    static ORIENTATION_LANDSCAPE = Symbol('Landscape');

    constructor() {
        this.setup();
    };

    setup() {
        this.width = window.innerWidth;
        this.height = window.innerHeight;

        if (this.width > this.height) {
            console.log('Landscape mode');
            this.orientation = Screen.ORIENTATION_LANDSCAPE;
            this.bigDimension = this.width;
            this.smallDimension = this.height;
        } else {
            console.log('Portrait mode');
            this.orientation = Screen.ORIENTATION_PORTRAIT;
            this.bigDimension = this.height;
            this.smallDimension = this.width;
        }
    };
};