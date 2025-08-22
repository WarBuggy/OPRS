export class Overlay {

    static DIV_OUTER_OVERLAY_ID = 'divOuterOverlay';

    constructor(input) {
        input = input || {};
        if (!input.id) {
            input.id = Overlay.DIV_OUTER_OVERLAY_ID;
        }
        this.outerOverlayId = input.id;
        if (!input.parent) {
            input.parent = document.body;
        }
        this.outerOverlayParent = input.parent;
        this.divOuter = Shared.createHTMLComponent({
            tag: 'div',
            id: input.id,
            parent: input.parent,
            class: 'base-common-outer-overlay',
        });
    }

    hide(input) {
        this.divOuter.style.display = 'none';
        this.divOuter.innerHTML = '';
    }

    show(input) {
        if (input.divChild) {
            this.divOuter.appendChild(input.divChild);
        }
        this.divOuter.style.display = 'grid';
    }
}