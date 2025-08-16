export class EditorMap {
    constructor(input) {
    };

    async init(input) {
        // allow mods, if needed, to modify any existing static property of a class.
        this.modifyStaticProperty();

        await this.loadModData({ importModModule: input.importModModule, });

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
    };


    setup() {
        this.managerMap.setup();
    };

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
    };

    modifyStaticProperty(input) {
        // for modders
        // intentionally left empty 
    };

    async loadModData(input) {
        let { importModModule } = input;
        let remainingModules = {};
        this.data = {};
        const typeList = [
            Shared.MOD_STRING.REGISTRATION_TYPE.SETTING,
            Shared.MOD_STRING.REGISTRATION_TYPE.BIOME,
            Shared.MOD_STRING.REGISTRATION_TYPE.TILE_TEXTURE,
        ];
        for (let i = 0; i < typeList.length; i++) {
            const type = typeList[i];
            this.data[type] = new window.OPRSClasses.ObjectLoader({
                targetRegistrationType: type,
            });
            remainingModules = (await this.data[type].loadMod({ importModModule, })).remainingModules;
            importModModule = remainingModules;
        }
    };
};