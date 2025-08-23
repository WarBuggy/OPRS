export class EditorMap extends window.OPRSClasses.MainApp {
    constructor(input) {
        super(input);

        this.managerMap = new window.OPRSClasses.ManagerMap({
            emitter: this.emitter,
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
    }

    setup() {
        this.managerMap.setup();
    }

    createPageHTMLComponent(input) {
        const divMain = Shared.createHTMLComponent({
            id: 'divMain',
            class: 'outerMain',
            parent: document.body,
        });
        Shared.createHTMLComponent({
            id: 'divTopMenu',
            class: 'topBar',
            parent: divMain,
        });
        const divViewport = Shared.createHTMLComponent({
            id: 'divViewport',
            class: 'viewport',
            parent: divMain,
        });
        Shared.createHTMLComponent({
            tag: 'canvas',
            id: 'canvasParchment',
            parent: divViewport,
            class: 'parchment',
        });
        const divSideBar = Shared.createHTMLComponent({
            id: 'divSideBar',
            parent: divMain,
            class: 'sideBar',
        });
        const divMiniMap = Shared.createHTMLComponent({
            id: 'divMiniMap',
            parent: divSideBar,
            class: 'outerMiniMap',
        });
        Shared.createHTMLComponent({
            tag: 'canvas',
            id: 'canvasMiniMap',
            parent: divMiniMap,
            class: 'miniMap',
        });
        Shared.createHTMLComponent({
            id: 'divBottomBar',
            parent: divMain,
            class: 'bottomBar',
        });
    }
};