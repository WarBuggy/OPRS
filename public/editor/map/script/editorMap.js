export class EditorMap extends window.OPRSClasses.AppMain {
    constructor(input) {
        super(input);

        this.managerMap = new window.OPRSClasses.ManagerMap({
            emitter: this.emitter,
            mapMain: {
                canvasId: 'canvasMapEditor',
            },
            mapMini: {
                canvasId: 'canvasMiniMap',
            },
            modData: this.modData,
        });

        window.addEventListener('resize', () => {
            this.setup();
        });
    }

    createPageHTMLComponent(input) {
        const { component: divMain, } = Shared.createHTMLComponent({
            id: 'divMain',
            class: 'outerMain',
            parent: document.body,
        });
        Shared.createHTMLComponent({
            id: 'divTopMenu',
            class: 'topBar',
            parent: divMain,
        });
        const { component: divViewport, } = Shared.createHTMLComponent({
            id: 'divViewport',
            class: 'viewport',
            parent: divMain,
        });
        Shared.createHTMLComponent({
            tag: 'canvas',
            id: 'canvasMapEditor',
            parent: divViewport,
            class: 'mapEditor',
        });
        const { component: divSideBar, } = Shared.createHTMLComponent({
            id: 'divSideBar',
            parent: divMain,
            class: 'sideBar',
        });
        const { component: divMiniMap, } = Shared.createHTMLComponent({
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
}