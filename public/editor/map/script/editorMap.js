export class EditorMap extends window.OPRSClasses.AppMain {
    constructor(input) {
        super(input);
        this.createToolbarRegion();

        this.managerMap = new window.OPRSClasses.ManagerMap({
            emitter: this.emitter,
            mapMain: { canvasId: 'canvasMapMain' },
            mapMini: { canvasId: 'canvasMapMini' },
            modData: this.modData,
        });

        window.addEventListener('resize', () => { });
    }

    createPageHTMLComponent(input) {
        const { component: divMain } = Shared.createHTMLComponent({
            id: 'divMain',
            class: 'base_editor-map_main-outer',
            parent: document.body,
        });

        Shared.createHTMLComponent({
            id: 'divTopMenu',
            class: 'base_editor-map_bar-top',
            parent: divMain,
        });

        const { component: divViewport } = Shared.createHTMLComponent({
            id: 'divViewport',
            class: 'base_editor-map_viewport',
            parent: divMain,
        });

        Shared.createHTMLComponent({
            tag: 'canvas',
            id: 'canvasMapMain',
            parent: divViewport,
            class: 'base_editor-map_map-main',
        });

        const { component: divSideBar } = Shared.createHTMLComponent({
            id: 'divSideBar',
            parent: divMain,
            class: 'base_editor-map_bar-side',
        });

        const { component: divMiniMap } = Shared.createHTMLComponent({
            id: 'divMiniMap',
            parent: divSideBar,
            class: 'base_editor-map_map-mini-outer',
        });

        Shared.createHTMLComponent({
            tag: 'canvas',
            id: 'canvasMapMini',
            parent: divMiniMap,
            class: 'base_editor-map_map-mini',
        });

        const { component: divBottomBar } = Shared.createHTMLComponent({
            parent: divMain,
            class: 'base_editor-map_bar-bottom',
        });

        const { component: divPaneWorking } = Shared.createHTMLComponent({
            id: 'divPaneWorking',
            parent: divBottomBar,
            class: 'base_editor-map_pane-working',
        });

        this.createDivRegionCreateNew({ parent: divPaneWorking });
    }

    createToolbarRegion(input) {
        const { component: divToolbarRegion } = Shared.createHTMLComponent({
            id: 'divToolbarRegion',
            class: 'base_editor-map_toolbar-region-row',
            parent: document.getElementById('divSideBar'),
        });

        // Create Region Button
        const { component: btnCreateRegion } = Shared.createHTMLComponent({
            class: 'base_common_button_square',
            parent: divToolbarRegion,
            tag: 'button',
        });
        btnCreateRegion.style.backgroundColor = '#4CAF50';
        btnCreateRegion.title = taggedString.editorMapBtnTitleCreateRegion();
        btnCreateRegion.onclick = () => {
            this.showWorkingDiv({ divToShowId: 'divRegionCreateNew' });
        };

        // Fold All Button
        const { component: btnFoldAll } = Shared.createHTMLComponent({
            class: 'base_common_button_square',
            parent: divToolbarRegion,
            tag: 'button',
        });
        btnFoldAll.style.backgroundColor = '#FFC107';
        btnFoldAll.title = taggedString.editorMapBtnTitleFoldAllRegion();

        // Unfold All Button
        const { component: btnUnfoldAll } = Shared.createHTMLComponent({
            class: 'base_common_button_square',
            parent: divToolbarRegion,
            tag: 'button',
        });
        btnUnfoldAll.style.backgroundColor = '#2196F3';
        btnUnfoldAll.title = taggedString.editorMapBtnTitleUnFoldAllRegion();
    }

    createDivRegionCreateNew(input) {
        const { parent } = input;

        const { component: divRegionCreateNew } = Shared.createHTMLComponent({
            id: 'divRegionCreateNew',
            class: 'base_editor-map_region-create-new',
            parent,
        });

        // ---- Row 1: Name + Save/Reset ----
        const { component: divNameRow } = Shared.createHTMLComponent({
            class: 'base_editor-map_region-create-new__row1',
            parent: divRegionCreateNew,
        });

        // Name label
        const { component: lblName } = Shared.createHTMLComponent({
            tag: 'label',
            class: 'base_common_label_standard',
            parent: divNameRow,
        });
        lblName.textContent = taggedString.editorMapRegionNameLabel();

        // Name input
        const { component: txtName } = Shared.createHTMLComponent({
            tag: 'input',
            class: 'base_common_input_standard',
            parent: divNameRow,
        });
        txtName.type = 'text';
        txtName.placeholder = taggedString.editorMapRegionNamePlaceholder();

        // Save button
        const { component: btnSave } = Shared.createHTMLComponent({
            tag: 'button',
            class: 'base_common_button_standard',
            parent: divNameRow,
        });
        btnSave.textContent = taggedString.editorMapBtnSaveRegionCreateNew();

        // Reset button
        const { component: btnReset } = Shared.createHTMLComponent({
            tag: 'button',
            class: 'base_common_button_standard',
            parent: divNameRow,
        });
        btnReset.textContent = taggedString.editorMapBtnResetRegionCreateNew();

        // RegionDefs Section
        const { component: divRegionDefList } = Shared.createHTMLComponent({
            parent: divRegionCreateNew,
        });

        const { component: lblRegionDefList } = Shared.createHTMLComponent({
            tag: 'div',
            class: 'base_common_label_standard',
            parent: divRegionDefList,
        });
        lblRegionDefList.textContent = taggedString.editorMapRegionDefListLabel();

        // Include Regions Section
        const { component: divIncludeRegionList } = Shared.createHTMLComponent({
            class: 'base_editor-map_region-create-new__section include-region-section',
            parent: divRegionCreateNew,
        });

        const { component: lblIncludeRegionList } = Shared.createHTMLComponent({
            tag: 'div',
            class: 'base_common_label_standard',
            parent: divIncludeRegionList,
        });
        lblIncludeRegionList.textContent = taggedString.editorMapIncludeRegionListLabel();

        // Exclude Regions Section
        const { component: divExcludeRegionList } = Shared.createHTMLComponent({
            class: 'base_editor-map_region-create-new__section exclude-region-section',
            parent: divRegionCreateNew,
        });

        const { component: lblExcludeRegionList } = Shared.createHTMLComponent({
            tag: 'div',
            class: 'base_common_label_standard',
            parent: divExcludeRegionList,
        });
        lblExcludeRegionList.textContent = taggedString.editorMapExcludeRegionListLabel();
    }

    showWorkingDiv(input) {
        const { divToShowId } = input;
        const divToShow = document.getElementById(divToShowId);
        const divPaneWorking = document.getElementById('divPaneWorking');

        // Hide all child elements
        for (const child of divPaneWorking.children) {
            child.style.display = 'none';
        }

        // Show the selected div
        divToShow.style.display = 'grid';

        divPaneWorking.scrollTop = 0;
        divPaneWorking.scrollLeft = 0;

        return { divPaneWorking, divToShow };
    }
}
