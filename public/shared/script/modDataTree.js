export class ModDataTree {

    static INFO_KEY_LIST = {
        CREATOR: { key: 'creator', labelText: taggedString.modDataTreeCreator(), },
        ALL_MODIFIER_LIST: { key: 'lastModifiers', labelText: taggedString.modDataTreeLastModifiers(), },
        NODE_VALUE: { key: 'nodeValue', labelText: taggedString.modDataTreeNodeValue(), },
        NODE_PATH: { key: 'nodePath', labelText: taggedString.modDataTreeNodePath(), },
    };

    static HAS_CHILDREN_MARKER = '▸';
    static CHILDLESS_MARKER = '•';

    static CRITERIA_LABEL = {
        CB_CRITERIA_PREFIX: 'cbCriteria',
        ALL: 'All',
        NAME: 'Name',
        CREATOR: 'Creator',
        MODIFIER: 'Modifier',
        PATH: 'Path',
    };
    static CRITERIA_SINGLE = [
        ModDataTree.CRITERIA_LABEL.NAME,
        ModDataTree.CRITERIA_LABEL.CREATOR,
        ModDataTree.CRITERIA_LABEL.MODIFIER,
        ModDataTree.CRITERIA_LABEL.PATH,
    ];

    static expandedNodeSet = new Set();

    constructor(input) {
        this.divOuter = Shared.createHTMLComponent({ class: 'base-mod-data-tree-outer', });
        this.divInner = Shared.createHTMLComponent({ class: 'base-mod-data-tree-inner', parent: this.divOuter, });

        // Add an outer div to solve the row expanding to grid height issue
        const divInfoPanelOuter = Shared.createHTMLComponent({
            class: 'base-mod-data-tree-info-panel-outer',
            parent: this.divOuter,
        });

        // this will be the grid contain rows to display node values
        const divInfoPanel = Shared.createHTMLComponent({
            class: 'base-mod-data-tree-info-panel',
            parent: divInfoPanelOuter,
        });

        // --- Search UI ---
        this.createSearchUI({ parent: divInfoPanelOuter, });

        this.infoRowList = {};
        this.addInfoRow({ parent: divInfoPanel, });

        // Create a button container
        const buttonContainer = Shared.createHTMLComponent({
            class: 'base-mod-data-tree-bottom-button-container',
            parent: this.divOuter,
        });
        // Create close button
        const closeBtn = Shared.createHTMLComponent({ tag: 'button', class: 'base-mod-data-tree-close', parent: buttonContainer, });
        closeBtn.textContent = taggedString.modDataTreeCloseButtonText();

        // Closing logic
        closeBtn.addEventListener('click', () => {
            input.overlay.hide();
        });

        // Render the modHistory tree
        if (input.modHistory) {
            this.renderTree({ modHistory: input.modHistory, divParent: this.divInner, modData: input.modData, });
        }
    }

    addInfoRow(input) {
        let infoKeyList = Object.keys(ModDataTree.INFO_KEY_LIST);
        infoKeyList.forEach(item => {
            const { key, labelText } = ModDataTree.INFO_KEY_LIST[item];
            const infoRow = Shared.createHTMLComponent({ class: 'info-row', parent: input.parent });

            const infoLabel = Shared.createHTMLComponent({ class: 'info-label', parent: infoRow });
            infoLabel.innerText = labelText;

            const infoValue = Shared.createHTMLComponent({ class: 'info-value', parent: infoRow });
            infoValue.innerText = ''; // empty initially

            // Save reference for later update
            this.infoRowList[key] = infoValue;
        });
    };

    renderTree(input) {
        const { divParent, modHistory, modData } = input;
        for (const rootKey of Object.keys(modHistory)) {
            const nodeEl = this.renderNode({
                key: rootKey,
                node: modHistory[rootKey],
                pathSoFar: rootKey,
                modData
            });
            divParent.appendChild(nodeEl);
        }
    }

    renderNode(input) {
        const { key, node, pathSoFar, modData, depth = 0, } = input;
        const creator = node.history?.[0] ?? 'unknown';
        const modifiers = (node.history ?? []).slice(1).reverse();
        const hasChildren = node.children && Object.keys(node.children).length > 0;

        // Create details element
        const details = Shared.createHTMLComponent({ tag: 'details' });
        // Add depth-based background class
        const depthClass = `depth-bg-${depth % 4}`;
        details.classList.add(depthClass);

        // Create summary
        const summary = Shared.createHTMLComponent({ tag: 'summary', parent: details });
        summary.dataset.fullPath = pathSoFar;
        summary.dataset.creator = creator;
        summary.dataset.modifiers = modifiers.length ? modifiers.join(', ') : '';
        summary.dataset.value = '';
        if (!hasChildren) {
            const value =
                window.OPRSClasses.DataLoader.getModDataValue({ modData, pathString: pathSoFar, });
            let displayText;
            if (value === null || value === undefined) {
                displayText = '';
            } else if (Array.isArray(value)) {
                displayText = `[${value.join(', ')}]`;
            } else if (typeof value === 'object') {
                displayText = '';
            } else {
                displayText = String(value); // converts numbers, booleans, etc. to string
            }
            summary.dataset.value = displayText;
        }

        // --- Add expand/collapse all by double-click ---
        let clickTimer = null;
        summary.addEventListener('click', (e) => {
            e.stopPropagation();
            e.preventDefault(); // stop native open/close
            // Delay single click so it won't conflict with dblclick
            if (clickTimer) return; // already waiting for dblclick
            clickTimer = setTimeout(() => {
                clickTimer = null;
                details.open = !details.open;
                this.infoRowList[ModDataTree.INFO_KEY_LIST.CREATOR.key].innerText = summary.dataset.creator;
                this.infoRowList[ModDataTree.INFO_KEY_LIST.ALL_MODIFIER_LIST.key].innerText =
                    modifiers.length ? summary.dataset.modifiers : taggedString.modDataTreeNoModifier();
                this.infoRowList[ModDataTree.INFO_KEY_LIST.NODE_VALUE.key].innerText = summary.dataset.value;
                this.infoRowList[ModDataTree.INFO_KEY_LIST.NODE_PATH.key].innerText = summary.dataset.fullPath;

                if (details.open) ModDataTree.expandedNodeSet.add(summary.dataset.fullPath);
                else ModDataTree.expandedNodeSet.delete(summary.dataset.fullPath);
            }, 200);
        });
        summary.addEventListener("dblclick", (e) => {
            e.stopPropagation();
            clearTimeout(clickTimer);
            clickTimer = null;

            const expand = !details.open;
            this.updateExpandedSet({ details, expand, });
            this.toggleRecursive({ details, expand, });
        });


        // Marker span (arrow for parent, bullet for leaf)
        const markerSpan = Shared.createHTMLComponent({
            tag: 'span',
            parent: summary,
            class: hasChildren ? 'node-marker-parent' : 'node-marker-leaf'
        });
        markerSpan.textContent = hasChildren ? ModDataTree.HAS_CHILDREN_MARKER : ModDataTree.CHILDLESS_MARKER;
        markerSpan.style.marginRight = '6px';
        markerSpan.style.display = 'inline-block'; // required for rotate

        // Label span
        const labelSpan = Shared.createHTMLComponent({ tag: 'span', parent: summary, class: 'label' });
        labelSpan.textContent = key;

        // Recursively add children
        if (hasChildren) {
            const ul = Shared.createHTMLComponent({ tag: 'ul', parent: details });
            for (const childKey of Object.keys(node.children)) {
                const li = Shared.createHTMLComponent({ tag: 'li', parent: ul });
                const childPath = `${pathSoFar}.${childKey}`;
                li.appendChild(this.renderNode({
                    key: childKey,
                    node: node.children[childKey],
                    pathSoFar: childPath,
                    modData,
                    depth: depth + 1,
                }));
            }
        }

        // Restore expanded state
        if (ModDataTree.expandedNodeSet.has(pathSoFar)) details.open = true;

        return details;
    }

    toggleRecursive(input) {
        const { details, expand, } = input;
        // Open/close this node
        details.open = expand;
        // Recursively apply to all child <details>
        details.querySelectorAll("details").forEach(child => {
            child.open = expand;
        });
    }

    // Recursively update the expandedNodeSet
    updateExpandedSet(input) {
        const { details, expand, } = input;
        const path = details.querySelector('summary').dataset.fullPath;
        if (expand) ModDataTree.expandedNodeSet.add(path);
        else ModDataTree.expandedNodeSet.delete(path);

        details.querySelectorAll('details').forEach(child => {
            this.updateExpandedSet({ details: child, expand, });
        });
    }

    createSearchUI(input) {
        const parent = input.parent;
        this.divSearchOuter = this.createSearchInput({ parent });
        this.divCriteriaOuter = this.createSearchCriteria({ parent });
        this.divResultOuter = this.createSearchResultContainer({ parent });
    }

    createSearchInput(input) {
        const parent = input.parent;
        const div = Shared.createHTMLComponent({
            class: 'base-mod-data-tree-search-outer',
            parent,
        });
        Shared.createHTMLComponent({
            tag: 'input',
            class: 'base-mod-data-tree-search-input',
            parent: div,
            placeholder: 'Search...',
        });
        return div;
    }

    createSearchCriteria(input) {
        const parent = input.parent;
        const div = Shared.createHTMLComponent({
            class: 'base-mod-data-tree-criteria-outer',
            parent,
        });

        const rowAll = Shared.createHTMLComponent({ class: 'base-mod-data-tree-criteria-item-all', parent: div });
        const cbAllId = `${ModDataTree.CRITERIA_LABEL.CB_CRITERIA_PREFIX}${ModDataTree.CRITERIA_LABEL.ALL}`;
        this[cbAllId] = Shared.createHTMLComponent({
            tag: 'input',
            type: 'checkbox',
            id: cbAllId,
            parent: rowAll
        });
        const allLabel = Shared.createHTMLComponent({ tag: 'label', parent: rowAll });
        allLabel.textContent = ModDataTree.CRITERIA_LABEL.ALL;
        allLabel.setAttribute('for', cbAllId);

        const cbSingleList = [];
        ModDataTree.CRITERIA_SINGLE.forEach(name => {
            const className = `base-mod-data-tree-criteria-item-${name.toLowerCase()}`;
            const id = `${ModDataTree.CRITERIA_LABEL.CB_CRITERIA_PREFIX}${name}`;
            const rowGrid = Shared.createHTMLComponent({ class: className, parent: div });
            this[id] = Shared.createHTMLComponent({ tag: 'input', type: 'checkbox', id, parent: rowGrid });
            cbSingleList.push(this[id]);
            const label = Shared.createHTMLComponent({ tag: 'label', parent: rowGrid });
            label.textContent = name;
            label.setAttribute('for', id);
        });
        this.setupSearchCheckboxes({ cbAll: this[cbAllId], cbSingleList, });
        return div;
    }

    setupSearchCheckboxes(input) {
        const { cbAll, cbSingleList } = input;
        let isUpdating = false; // <-- flag

        // When "All" is clicked
        cbAll.addEventListener('change', () => {
            isUpdating = true; // mark programmatic update
            const checked = cbAll.checked;
            cbSingleList.forEach(cb => cb.checked = checked);
            isUpdating = false; // reset flag
        });

        // When any single checkbox changes, update "All"
        cbSingleList.forEach(cb => {
            cb.addEventListener('change', () => {
                if (isUpdating) return; // skip if programmatic
                cbAll.checked = cbSingleList.every(cb => cb.checked);
            });
        });
    }

    createSearchResultContainer(input) {
        const parent = input.parent;
        const div = Shared.createHTMLComponent({
            class: 'base-mod-data-tree-result-outer',
            parent,
        });
        // Empty for now; results will be added dynamically
        return div;
    }
}

/*
1. Search & Filter

Add a search bar to filter nodes by key, creator, or modifier.

Highlight matching nodes and collapse non-matching branches.

Optionally, allow regex search for advanced filtering.

3. Sorting Options

Sort child nodes alphabetically or by creator/modifier.

Option to group nodes by creator, last modifier, or type of data.


7. Color Coding & Styling

Differentiate leaf nodes vs. parent nodes more clearly (e.g., subtle background colors).

Highlight nodes modified by specific mods using a configurable color scheme.

Option to theme the tree (light/dark or custom).

8. Node Actions

Context menu on right-click for:

Show only this branch

Filter by creator/modifier

9. Performance Features

Lazy loading for large mod trees to avoid rendering everything at once.

Virtualized scrolling for huge datasets.

Option to collapse branches by default to reduce clutter.

10. Export / Import

Export the mod history snapshot as JSON for debugging.

Option to import a mod history snapshot to test offline or compare.

*/