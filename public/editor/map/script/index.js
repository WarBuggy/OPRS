window.addEventListener('load', function () {
    window.editorMap = new EditorMap();
});

class EditorMap {
    constructor() {
        this.miniMap = new MiniMap();
        this.parchment = new Parchment({
            canvasId: 'canvasParchment',
            storageKeyZoomLevel: Shared.STORAGE_KEYS.ZOOM_LEVEL_MAP_EDITOR,
        });

        let parent = this;

        window.addEventListener('resize', function () {
            parent.setup();
        });
    };

    setup() {
        this.miniMap.setup();
        this.parchment.setup();
    };
};