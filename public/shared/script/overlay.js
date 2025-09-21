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
            class: 'base_common_overlay_outer',
        }).component;
        this.visible = false;
        this.emitter = input.emitter;

        this._escListener = (e) => {
            if (e.key === 'Escape') {
                this.hide();
            }
        };
    }

    hide(input) {
        this.divOuter.style.display = 'none';
        this.divOuter.innerHTML = '';
        this.visible = false;
        document.removeEventListener('keydown', this._escListener);
        this.emitter.emit({
            event: Shared.EMITTER_SIGNAL.OVERLAY_CLOSED,
        });
    }

    show(input) {
        if (input.divChild) {
            this.divOuter.appendChild(input.divChild);
        }
        this.divOuter.style.display = 'grid';
        this.visible = true;
        document.addEventListener('keydown', this._escListener);
        this.emitter.emit({
            event: Shared.EMITTER_SIGNAL.OVERLAY_VISIBLE,
        });
    }
}