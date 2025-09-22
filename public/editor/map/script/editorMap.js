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

        this.lastPaletteIndexRegionCreateNew = -1;
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
            this.regionCreateNewUI.colorPicker.setSelectedColor(
                { lastPaletteIndex: this.lastPaletteIndexRegionCreateNew, }
            );
            const btnColor = document.getElementById('btnColorPickerRegionCreateNew');
            btnColor.style.backgroundColor = this.regionCreateNewUI.colorPicker.selectedColor;
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

    createRegionUIBase(input) {
        const {
            parent, lastPaletteIndex, onChange,
            divContainerId, btnColorId,
        } = input;

        const { component: divRegionUI } = Shared.createHTMLComponent({
            id: divContainerId,
            class: 'base_editor-map_region-ui-base',
            parent,
        });

        // Name Row
        const { component: divRow1 } = Shared.createHTMLComponent({
            class: 'base_editor-map_region-ui-base__row-1',
            parent: divRegionUI,
        });

        const { component: lblName } = Shared.createHTMLComponent({
            tag: 'label',
            class: 'base_common_label_standard',
            parent: divRow1,
        });
        lblName.textContent = taggedString.editorMapRegionNameLabel();

        const { component: txtName } = Shared.createHTMLComponent({
            tag: 'input',
            class: 'base_common_input_standard',
            parent: divRow1,
        });
        txtName.type = 'text';
        txtName.placeholder = taggedString.editorMapRegionNamePlaceholder();

        // Color button
        const { component: btnColor } = Shared.createHTMLComponent({
            id: btnColorId,
            tag: 'button',
            class: 'base_common_button_standard color-picker',
            parent: divRow1,
        });
        btnColor.title = taggedString.editorMapBtnTitleColorRegionCreateNew();

        const { component: divColorPickerContainer } = Shared.createHTMLComponent({
            class: 'base_common_color-picker-container',
            parent: divRegionUI,
        });
        divColorPickerContainer.style.gridRow = '2/3';

        // On color button click, toggle the color picker visibility
        btnColor.onclick = () => {
            divColorPickerContainer.classList.toggle('active');
        };

        // Instantiate the custom color picker inside this container
        const colorPicker = new OPRSClasses.ColorPickerCustom({
            parent: divColorPickerContainer,
            lastPaletteIndex,
            onChange,
        });
        btnColor.style.backgroundColor = colorPicker.selectedColor;

        // Area list 
        const { component: divAreaList } = Shared.createHTMLComponent({
            class: 'base_editor-map_area-list',
            parent: divRegionUI,
        });
        divAreaList.style.gridRow = '3/4';

        const { component: labelArea, } = Shared.createHTMLComponent({
            tag: 'label',
            class: 'base_common_label_standard',
            parent: divAreaList,
        });
        labelArea.textContent = taggedString.editorMapAreaListLabel();

        // Include list 
        const { component: divIncludeList } = Shared.createHTMLComponent({
            class: 'base_editor-map_include-list',
            parent: divRegionUI,
        });
        divIncludeList.style.gridRow = '4/5';
        const { component: labelIncludeList, } = Shared.createHTMLComponent({
            tag: 'label',
            class: 'base_common_label_standard',
            parent: divIncludeList,
        });
        labelIncludeList.textContent = taggedString.editorMapIncludeRegionListLabel();

        // Exclude list 
        const { component: divExcludeList } = Shared.createHTMLComponent({
            class: 'base_editor-map_exclude-list',
            parent: divRegionUI,
        });
        divExcludeList.style.gridRow = '5/6';
        const { component: labelExcludeList, } = Shared.createHTMLComponent({
            tag: 'label',
            class: 'base_common_label_standard',
            parent: divExcludeList,
        });
        labelExcludeList.textContent = taggedString.editorMapExcludeRegionListLabel();

        return {
            divRegionUI, divRow1, txtName, colorPicker,
            divAreaList, divIncludeList, divExcludeList
        };
    }

    addRegionCreateNewElement(input) {
        const { parentDiv, onAdd, onReset } = input;

        const { component: btnAdd } = Shared.createHTMLComponent({
            tag: 'button',
            class: 'base_common_button_standard',
            parent: parentDiv,
        });
        btnAdd.textContent = taggedString.editorMapBtnAddRegionCreateNew();
        btnAdd.title = taggedString.editorMapBtnTitleAddRegionCreateNew();
        btnAdd.onclick = onAdd;

        const { component: btnReset } = Shared.createHTMLComponent({
            tag: 'button',
            class: 'base_common_button_standard',
            parent: parentDiv,
        });
        btnReset.textContent = taggedString.editorMapBtnResetRegionCreateNew();
        btnReset.onclick = onReset;

        return { btnAdd, btnReset };
    }

    createDivRegionCreateNew(input) {
        const { parent } = input;

        const baseUI = this.createRegionUIBase({
            parent,
            divContainerId: 'divRegionCreateNew',
            btnColorId: 'btnColorPickerRegionCreateNew',
            lastPaletteIndex: this.lastPaletteIndexRegionCreateNew,
            onChange: ({ selectedColor, paletteIndex, }) => {
                const btnColor = document.getElementById('btnColorPickerRegionCreateNew');
                btnColor.style.backgroundColor = selectedColor;
                if (paletteIndex >= 0) {
                    this.lastPaletteIndexRegionCreateNew = paletteIndex;
                }
            }
        });

        const { btnAdd, btnReset } = this.addRegionCreateNewElement({
            parentDiv: baseUI.divRow1,
            //onAdd: () => this.handleAddRegion(baseUI),
            //onReset: () => this.handleResetRegion(baseUI),
        });
        this.regionCreateNewUI = { ...baseUI, btnAdd, btnReset };
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
