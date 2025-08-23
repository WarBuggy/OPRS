export class ModDataTree {

    static HAS_CHILDREN_MARKER = '▸';
    static CHILDLESS_MARKER = '•';

    static CRITERIA_LABEL = {
        CB_CRITERIA_PREFIX: 'cbCriteria',
        SORT_CRITERIA_PREFIX: 'sort',
        ALL: {
            key: `All`,
            labelText: taggedString.modDataTreeLabelAll(),
        },
        PATH: {
            key: 'Path',
            labelText: taggedString.modDataTreeLabelPath(),
        },
        CREATOR: {
            key: 'Creator',
            labelText: taggedString.modDataTreeLabelCreator(),
        },
        MODIFIER_LIST: {
            key: 'Modifier',
            labelText: taggedString.modDataTreeLabelModifier(),
        },
        VALUE: {
            key: 'Value',
            labelText: taggedString.modDataTreeLabelValue(),
        },
        MOD_COUNT: {
            key: 'ModCount',
            labelText: taggedString.modDataTreeLabelModCount(),
        },
        ORDER_DESC: '↓',
        ORDER_ASC: '↑'
    };
    static INFO_KEY_LIST = [
        ModDataTree.CRITERIA_LABEL.CREATOR,
        ModDataTree.CRITERIA_LABEL.MODIFIER_LIST,
        ModDataTree.CRITERIA_LABEL.VALUE,
        ModDataTree.CRITERIA_LABEL.PATH,
    ];
    static CRITERIA_SINGLE = [
        ModDataTree.CRITERIA_LABEL.PATH,
        ModDataTree.CRITERIA_LABEL.CREATOR,
        ModDataTree.CRITERIA_LABEL.MODIFIER_LIST,
        ModDataTree.CRITERIA_LABEL.VALUE,
    ];
    static SORT_CRITERIA = [
        ModDataTree.CRITERIA_LABEL.PATH,
        ModDataTree.CRITERIA_LABEL.CREATOR,
        ModDataTree.CRITERIA_LABEL.MODIFIER_LIST,
        ModDataTree.CRITERIA_LABEL.VALUE,
        ModDataTree.CRITERIA_LABEL.MOD_COUNT,
    ];
    static SORT_ORDER = [
        ModDataTree.CRITERIA_LABEL.ORDER_DESC,
        ModDataTree.CRITERIA_LABEL.ORDER_ASC,
    ];

    constructor(input) {
        this.divOuter = Shared.createHTMLComponent({ class: 'base-mod-data-tree-outer', });
        const divInner = Shared.createHTMLComponent({ class: 'base-mod-data-tree-inner', parent: this.divOuter, });

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
        this.infoRowList = this.addInfoRow({ parent: divInfoPanel, });

        // --- Search UI ---
        this.createSearchUI({ parent: divInfoPanelOuter, });

        // Create a button container
        const buttonContainer = Shared.createHTMLComponent({
            class: 'base-mod-data-tree-bottom-button-container',
            parent: this.divOuter,
        });
        // Create close button
        const closeBtn = Shared.createHTMLComponent({ tag: 'button', class: 'base-mod-data-tree-close', parent: buttonContainer, });
        closeBtn.textContent = taggedString.modDataTreeLabelCloseButton();

        // Closing logic
        closeBtn.addEventListener('click', () => {
            input.overlay.hide();
        });

        // Render the modHistory tree
        if (input.modHistory) {
            this.renderTree({ modHistory: input.modHistory, divParent: divInner, modData: input.modData, });
        }
    }

    addInfoRow(input) {
        const infoRowList = {};
        ModDataTree.INFO_KEY_LIST.forEach(item => {
            const { key, labelText } = item;
            const infoRow = Shared.createHTMLComponent({ class: 'info-row', parent: input.parent });

            const infoLabel = Shared.createHTMLComponent({ class: 'info-label', parent: infoRow });
            infoLabel.innerText = labelText;
            if (key == ModDataTree.CRITERIA_LABEL.MODIFIER_LIST.key) {
                infoLabel.innerText = taggedString.modDataTreeLabelLastModifiers();
            }

            const infoValue = Shared.createHTMLComponent({ class: 'info-value', parent: infoRow });
            infoValue.innerHTML = input[key] || '';

            // Save reference for later update
            infoRowList[key] = infoValue;
        });
        return infoRowList;
    }

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
        const creator = node.history?.[0] ?? '';
        const modifiers = (node.history ?? []).slice(1).reverse();
        const hasChildren = node.children && Object.keys(node.children).length > 0;

        // Create details element
        const details = Shared.createHTMLComponent({ tag: 'details' });
        // Add depth-based background class
        const depthClass = `depth-bg-${depth % 4}`;
        details.classList.add(depthClass);

        // Create summary
        const summary = Shared.createHTMLComponent({ tag: 'summary', parent: details });
        summary.dataset[ModDataTree.CRITERIA_LABEL.PATH.key] = pathSoFar;
        summary.dataset[ModDataTree.CRITERIA_LABEL.CREATOR.key] = creator;
        summary.dataset[ModDataTree.CRITERIA_LABEL.MODIFIER_LIST.key] = modifiers.length ? modifiers.join(', ') : '';
        summary.dataset[ModDataTree.CRITERIA_LABEL.VALUE.key] = '';
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
            summary.dataset[ModDataTree.CRITERIA_LABEL.VALUE.key] = displayText;
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

                for (let i = 0; i < ModDataTree.INFO_KEY_LIST.length; i++) {
                    let key = ModDataTree.INFO_KEY_LIST[i].key;
                    this.infoRowList[key].innerText = summary.dataset[key];
                    if (key == ModDataTree.CRITERIA_LABEL.MODIFIER_LIST.key) {
                        const modifiers = summary.dataset[key].split(',');
                        if (summary.dataset[key] == '' || modifiers.length < 1) {
                            this.infoRowList[key].innerText = taggedString.modDataTreeLabelNoModifier();
                        }
                    }
                }
            }, 200);
        });
        summary.addEventListener("dblclick", (e) => {
            e.stopPropagation();
            clearTimeout(clickTimer);
            clickTimer = null;

            const expand = !details.open;
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

    createSearchUI(input) {
        const parent = input.parent;
        this.createSearchInput({ parent });
        this.createSearchCriteria({ parent });
        this.createSortUI({ parent });
        this.createSearchResultContainer({ parent });
        this.setupSearchListeners();
    }

    createSearchInput(input) {
        const parent = input.parent;
        const div = Shared.createHTMLComponent({
            class: 'base-mod-data-tree-search-outer',
            parent,
        });
        this.inputSearch = Shared.createHTMLComponent({
            tag: 'input',
            class: 'base-mod-data-tree-search-input',
            id: 'inputSearch',
            parent: div,
        });
        this.inputSearch.placeholder = taggedString.modDataTreeLabelSearchPlaceholder();
        return div;
    }

    createSearchCriteria(input) {
        this.cbSearchCriteria = {};
        const parent = input.parent;
        const div = Shared.createHTMLComponent({
            class: 'base-mod-data-tree-criteria-outer',
            parent,
        });

        const rowAll = Shared.createHTMLComponent({ class: 'base-mod-data-tree-criteria-item-all', parent: div });
        const cbAllId = this.createCbSearchCriteriaId({ key: ModDataTree.CRITERIA_LABEL.ALL.key, });
        this.cbSearchCriteria[cbAllId] = Shared.createHTMLComponent({
            tag: 'input',
            type: 'checkbox',
            id: cbAllId,
            parent: rowAll
        });
        const allLabel = Shared.createHTMLComponent({ tag: 'label', parent: rowAll });
        allLabel.textContent = ModDataTree.CRITERIA_LABEL.ALL.labelText;
        allLabel.setAttribute('for', cbAllId);

        const cbSingleList = [];

        ModDataTree.CRITERIA_SINGLE.forEach(item => {
            const { key, labelText, } = item;
            const className = `base-mod-data-tree-criteria-item-${key.toLowerCase()}`;
            const id = this.createCbSearchCriteriaId({ key, })
            const rowGrid = Shared.createHTMLComponent({ class: className, parent: div });
            const checkbox = Shared.createHTMLComponent({ tag: 'input', type: 'checkbox', id, parent: rowGrid });
            this.cbSearchCriteria[id] = checkbox;
            cbSingleList.push(checkbox);
            const label = Shared.createHTMLComponent({ tag: 'label', parent: rowGrid });
            label.textContent = labelText;
            label.setAttribute('for', id);
        });
        this.setupSearchCheckboxes({ cbAll: this.cbSearchCriteria[cbAllId], cbSingleList, });
        return div;
    }

    setupSearchCheckboxes(input) {
        const initState = true;
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
            cb.checked = initState;
            cb.addEventListener('change', () => {
                if (isUpdating) return; // skip if programmatic
                cbAll.checked = cbSingleList.every(cb => cb.checked);
            });
        });
        cbAll.checked = initState;
    }

    createSearchResultContainer(input) {
        const parent = input.parent;
        const divOuter = Shared.createHTMLComponent({
            class: 'base-mod-data-tree-result-outer',
            parent,
        });
        this.divResultInner = Shared.createHTMLComponent({
            class: 'base-mod-data-tree-result-inner',
            parent: divOuter,
        });
    }

    createSortUI(input) {
        const parent = input.parent;
        const divSortOuter = Shared.createHTMLComponent({
            class: 'base-mod-data-tree-sort-outer',
            parent,
        });

        const labelSortBy = Shared.createHTMLComponent({
            tag: 'label',
            class: 'base-mod-data-tree-sort-label',
            parent: divSortOuter,
        });
        labelSortBy.textContent = taggedString.modDataTreeLabelSortBy();

        this.selectSortCriteria = Shared.createHTMLComponent({
            tag: 'select',
            class: 'base-mod-data-tree-sort-select',
            parent: divSortOuter,
        });

        ModDataTree.SORT_CRITERIA.forEach(item => {
            const { key, labelText, } = item;
            const option = document.createElement('option');
            option.value = `${ModDataTree.CRITERIA_LABEL.SORT_CRITERIA_PREFIX}${key}`;
            option.textContent = labelText;
            this.selectSortCriteria.appendChild(option);
        });
        this.selectSortCriteria.value = `${ModDataTree.CRITERIA_LABEL.SORT_CRITERIA_PREFIX}${ModDataTree.SORT_CRITERIA[0].key}`;

        const labelOrder = Shared.createHTMLComponent({
            tag: 'label',
            class: 'base-mod-data-tree-sort-label',
            parent: divSortOuter,
        });
        labelOrder.textContent = taggedString.modDataTreeLabelOrder();

        this.selectSortOrder = Shared.createHTMLComponent({
            tag: 'select',
            class: 'base-mod-data-tree-sort-select',
            parent: divSortOuter,
        });
        ModDataTree.SORT_ORDER.forEach(optText => {
            const option = document.createElement('option');
            option.value = optText.toLowerCase();
            option.textContent = optText;
            this.selectSortOrder.appendChild(option);
        });
        this.selectSortOrder.value = ModDataTree.SORT_ORDER[0];
    }

    createSearchResultRow(input) {
        const { parent, result, } = input;
        const divResult = Shared.createHTMLComponent({
            class: 'base-mod-data-tree-info-panel',
            parent,
        });
        const infoRowInput = { ...result, parent: divResult, };
        this.addInfoRow(infoRowInput);
        return divResult;
    }

    populateDivResult(input) {
        const { parent, resultList, searchTerm } = input;
        for (let i = 0; i < resultList.length; i++) {
            this.createSearchResultRow({ parent, result: resultList[i], searchTerm });
        }
    }

    highlightText(input) {
        const { text, searchTerm, } = input;
        if (!searchTerm) return text;
        const escapeRegexTerm = searchTerm.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
        const regex = new RegExp(`(${escapeRegexTerm})`, 'gi');
        return text.replace(regex, '<span class="base-mod-data-tree-highlight-search">$1</span>');
    }

    highlightText(input) {
        const { text, matchingTermList } = input;

        // Escape regex special characters for each term
        const escapedTermList = matchingTermList.map(term => term.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'));

        // Combine into a single regex pattern, match any term (OR)
        const regex = new RegExp(`(${escapedTermList.join('|')})`, 'gi');

        // Replace all matches with highlight span
        return text.replace(regex, '<span class="base-mod-data-tree-highlight-search">$1</span>');
    }

    searchSummaryForTerm(input) {
        const { summary, searchTerm, searchCriteria, } = input;
        const terms = searchTerm.split(/\s+/);
        const highlighted = {};
        for (let i = 0; i < ModDataTree.INFO_KEY_LIST.length; i++) {
            const key = ModDataTree.INFO_KEY_LIST[i].key;
            highlighted[key] = summary.dataset[key];
        }
        let hasMatch = false;
        for (const [key, text] of Object.entries(highlighted)) {
            if (!searchCriteria[key]) continue;

            const matchingTermList = terms.filter(term => text.toLowerCase().includes(term));
            if (matchingTermList.length > 0) {
                highlighted[key] = this.highlightText({ text, matchingTermList, });
                hasMatch = true;
            }
        }
        return { hasMatch, highlighted }; // no summary included
    }

    searchNodes(input) {
        let searchTerm = input.searchTerm.toLowerCase();

        const searchCriteria = {};
        for (let i = 0; i < ModDataTree.CRITERIA_SINGLE.length; i++) {
            const key = ModDataTree.CRITERIA_SINGLE[i].key;
            const id = this.createCbSearchCriteriaId({ key, });
            searchCriteria[key] = this.cbSearchCriteria[id].checked;
        }
        const results = [];
        const summaries = this.divOuter.querySelectorAll('.base-mod-data-tree-inner summary');
        summaries.forEach(summary => {
            const searchSummaryResult = this.searchSummaryForTerm({ summary, searchTerm, searchCriteria });
            if (searchSummaryResult.hasMatch) {
                results.push(searchSummaryResult.highlighted);
            }
        });
        return results;
    }

    // Handle search input (works for text input or checkboxes)
    handleSearchInput(input) {
        const searchTerm = this.inputSearch.value.trim();
        if (!searchTerm || searchTerm.length < 3) return;

        this.divResultInner.innerHTML = '';
        const resultList = this.searchNodes({ searchTerm });
        if (resultList.length === 0) {
            const noResultDiv = Shared.createHTMLComponent({
                class: 'base-mod-data-tree-no-result',
                parent: this.divResultInner,
            });
            noResultDiv.textContent = taggedString.modDataTreeLabelNoResult();
            return;
        }

        this.populateDivResult({
            parent: this.divResultInner,
            resultList,
            searchTerm,
        });
    }

    setupSearchListeners(input) {
        const debounce = (func, wait) => {
            let timeout;
            return (...args) => {
                clearTimeout(timeout);
                timeout = setTimeout(() => func.apply(this, args), wait);
            };
        };

        // Attach debounced handler to search input
        const debouncedHandler = debounce(this.handleSearchInput.bind(this), 300);
        this.inputSearch.addEventListener('input', debouncedHandler);

        // Attach to all search criteria checkboxes
        ModDataTree.CRITERIA_SINGLE.forEach(item => {
            const id = this.createCbSearchCriteriaId({ key: item.key, });
            const checkbox = this.cbSearchCriteria[id];
            if (checkbox) {
                checkbox.addEventListener('change', () => this.handleSearchInput());
            }

        });
        const allId = this.createCbSearchCriteriaId({ key: ModDataTree.CRITERIA_LABEL.ALL.key, });
        this.cbSearchCriteria[allId].addEventListener('change', () => this.handleSearchInput());
    }

    createCbSearchCriteriaId(input) {
        return `${ModDataTree.CRITERIA_LABEL.CB_CRITERIA_PREFIX}${input.key}`;
    };

    onVisible(input) {
        this.inputSearch.focus();
    };
}

/*

Esc to close. Bind on visible. Unbind on close. Where to put this? Overlay or the popup itself?

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