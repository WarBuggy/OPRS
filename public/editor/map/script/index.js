window.addEventListener('load', function () {
    window.editorMap = new EditorMap();
});

class EditorMap {
    constructor() {
        this.managerMap = new ManagerMap({
            parchment: {
                canvasId: 'canvasParchment',
                storageKeyZoomLevel: Shared.STORAGE_KEYS.ZOOM_LEVEL_MAP_EDITOR_PARCHMENT,
            },
            miniMap: {
                canvasId: 'canvasMiniMap',
                storageKeyZoomLevel: Shared.STORAGE_KEYS.ZOOM_LEVEL_MAP_EDITOR_MINI_MAP,
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