class MiniMap {
    constructor() {
        this.canvas = document.getElementById('canvasMiniMap');
        this.setup();
    };

    setup() {
        let divParent = this.canvas.parentElement;
        this.canvas.width = divParent.offsetWidth;
        this.canvas.height = divParent.offsetHeight;
    };
};