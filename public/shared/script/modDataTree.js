export class ModDataTree {

    static INFO_KEY_LIST = {
        CREATOR: { key: 'creator', labelText: taggedString.modDataTreeCreator(), },
        ALL_MODIFIER_LIST: { key: 'lastModifiers', labelText: taggedString.modDataTreeLastModifiers(), },
        NODE_VALUE: { key: 'nodeValue', labelText: taggedString.modDataTreeNodeValue(), },
        NODE_PATH: { key: 'nodePath', labelText: taggedString.modDataTreeNodePath(), },
    };

    static HAS_CHILDREN_MARKER = '▸';
    static CHILDLESS_MARKER = '•';

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

        if (!hasChildren) {
            node.cachedValue =
                window.OPRSClasses.DataLoader.getModDataValue({ modData, pathString: pathSoFar, });
        }

        // Create details element
        const details = Shared.createHTMLComponent({ tag: 'details' });
        details.dataset.fullPath = pathSoFar;

        // Create summary
        const summary = Shared.createHTMLComponent({ tag: 'summary', parent: details });
        summary.addEventListener('click', () => {
            this.infoRowList[ModDataTree.INFO_KEY_LIST.CREATOR.key].innerText = creator;

            this.infoRowList[ModDataTree.INFO_KEY_LIST.ALL_MODIFIER_LIST.key].innerText =
                modifiers.length ? modifiers.join(', ') : taggedString.modDataTreeNoModifier();

            const value = node.cachedValue;
            let displayText;
            if (hasChildren || value === null || value === undefined) {
                displayText = '';
            } else if (Array.isArray(value)) {
                displayText = `[${value.join(', ')}]`;
            } else if (typeof value === 'object') {
                displayText = '';
            } else {
                displayText = String(value); // converts numbers, booleans, etc. to string
            }
            this.infoRowList[ModDataTree.INFO_KEY_LIST.NODE_VALUE.key].innerText = displayText;
            this.infoRowList[ModDataTree.INFO_KEY_LIST.NODE_PATH.key].innerText = pathSoFar;
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

        return details;
    }
}

/*
1. Search & Filter

Add a search bar to filter nodes by key, creator, or modifier.

Highlight matching nodes and collapse non-matching branches.

Optionally, allow regex search for advanced filtering.

2. Expand/Collapse Controls

Buttons to expand all or collapse all nodes.

Keyboard shortcuts for faster navigation.

Option to remember last expanded nodes between sessions.

3. Sorting Options

Sort child nodes alphabetically or by creator/modifier.

Option to group nodes by creator, last modifier, or type of data.

4. Path Display

Show the full path of the selected node (e.g., setting.biome.nextNode) somewhere in the info panel.

Allow copying the path to the clipboard.

5. Node Value Visualization

For numeric or boolean values, use small visual indicators (like progress bars, color coding, or toggles).

For arrays, show a collapsible sub-list instead of just “An object.”

For objects, optionally show a JSON preview in a small panel on demand.

6. Modifier History

Display full modifier history in the info panel, optionally collapsible.

Highlight the last modifier separately for quick reference.

Show timestamps if available for each modifier.

7. Color Coding & Styling

Differentiate leaf nodes vs. parent nodes more clearly (e.g., subtle background colors).

Highlight nodes modified by specific mods using a configurable color scheme.

Option to theme the tree (light/dark or custom).

8. Node Actions

Allow copying node key, value, or full path.

Context menu on right-click for:

Copy path/value

Expand/Collapse branch

Show only this branch

Filter by creator/modifier

9. Performance Features

Lazy loading for large mod trees to avoid rendering everything at once.

Virtualized scrolling for huge datasets.

Option to collapse branches by default to reduce clutter.

10. Export / Import

Export the mod history snapshot as JSON for debugging.

Option to import a mod history snapshot to test offline or compare.

11. Integration with Editor

Clicking a node could highlight or focus the corresponding element in the map/unit editor.

Ability to jump from a node to its corresponding mod in your editor UI.
*/