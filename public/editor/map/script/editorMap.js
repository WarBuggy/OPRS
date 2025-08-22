export class EditorMap {
    constructor(input) {
        this.modifyStaticProperty(input);

        // allow mods to import data, or modify other mods' data if needed.
        this.modData = {};
        this.modHistory = {};
        this.loadModData({
            savedModData: input.savedModData,
            modData: this.modData,
            modHistory: this.modHistory,
        });

        this.createPageHTMLComponent();

        this.managerMap = new window.OPRSClasses.ManagerMap({
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

        this.overlay = new window.OPRSClasses.Overlay();
    }

    modifyStaticProperty(input) {
        // for modders
        // intentionally left empty 
    }

    loadModData(input) {
        let { savedModData, modData, modHistory } = input;
        for (let i = 0; i < savedModData.length; i++) {
            const { modName, item } = savedModData[i];
            window.OPRSClasses.DataLoader.processModItem({ modName, item, modData, modHistory, });
        }
    }

    showModDataTree(input) {
        const modDataTree = new window.OPRSClasses.ModDataTree({ modData: this.modData, modHistory: this.modHistory, overlay: this.overlay, });
        this.overlay.show({ divChild: modDataTree.divOuter, });
    }
};