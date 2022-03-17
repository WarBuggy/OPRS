class Table {
    constructor() {
        this.canvas = document.getElementById('canvasTable');
        this.setupTable();
    };

    setupTable() {
        this.canvas.style.width = window.dimension.viewportTableWidth + 'px';
        this.canvas.style.height = window.dimension.viewportTableHeight + 'px';
        this.canvas.style.position = 'absolute';
        this.canvas.style.left = ((window.dimension.viewportUIWidth - window.dimension.viewportTableWidth) / 2) + 'px';
        this.canvas.style.top = ((window.dimension.viewportUIHeight - window.dimension.viewportTableHeight) / 2) + 'px';

        this.canvas.style.backgroundColor = 'red';
    };
};