window.addEventListener('load', function () {
    window.editorMap = new EditorMap();
});

class EditorMap {
    constructor() {
        this.miniMap = new MiniMap();
        this.parchment = new Parchment();

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