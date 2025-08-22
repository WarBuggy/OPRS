export class ModDataTree {

    static INFO_KEY_LIST = {
        CREATOR: { key: 'creator', labelText: taggedString.modDataTreeCreator(), },
        ALL_MODIFIER_LIST: { key: 'lastModifiers', labelText: taggedString.modDataTreeLastModifiers(), },
        NODE_VALUE: { key: 'nodeValue', labelText: taggedString.modDataTreeNodeValue(), },
        NODE_PATH: { key: 'nodePath', labelText: taggedString.modDataTreeNodePath(), },
    };

    static HAS_CHILDREN_MARKER = '▸';
    static CHILDLESS_MARKER = '•';

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

    renderTree({ divParent, modHistory, modData }) {
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

    renderNode({ key, node, pathSoFar, modData }) {
        const creator = node.history?.[0] ?? 'unknown';
        const modifiers = (node.history ?? []).slice(1).reverse();
        const hasChildren = node.children && Object.keys(node.children).length > 0;

        // Create details element
        const details = Shared.createHTMLComponent({ tag: 'details' });

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
                }));
            }
        }
        if (ModDataTree.expandedNodeSet.has(pathSoFar)) {
            details.open = true;
        }
        return details;
    }

    toggleRecursive({ details, expand, }) {
        // Open/close this node
        details.open = expand;
        // Recursively apply to all child <details>
        details.querySelectorAll("details").forEach(child => {
            child.open = expand;
        });
    }

    // Recursively update the expandedNodeSet
    updateExpandedSet({ details, expand, }) {
        const path = details.querySelector('summary').dataset.fullPath;
        if (expand) ModDataTree.expandedNodeSet.add(path);
        else ModDataTree.expandedNodeSet.delete(path);

        details.querySelectorAll('details').forEach(child => {
            this.updateExpandedSet(child, expand);
        });
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