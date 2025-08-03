window.addEventListener('load', function () {
    window.editorMap = new EditorMap();
});

class EditorMap {
    constructor() {
        this.managerMap = new ManagerMap({
            parchment: {
                canvasId: 'canvasParchment',
            },
            miniMap: {
                canvasId: 'canvasMiniMap',
            },
        });
        let parent = this;

        window.addEventListener('resize', function () {
            parent.setup();
        });
    };

    setup() {
    };
};