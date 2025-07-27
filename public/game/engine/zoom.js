class Zoom {
    static def = {
        one: {
            default: true,
            hexPerCanvasHeightInLandscape: 20,
            hexPerCanvasWidthInPotrait: 30,
        },
    };

    static level = [Zoom.def.one];

    constructor() {
        this.currentIndex = null; // TODO: get from save file
    };

    getCurrentLevel() {
        if (this.currentIndex != null) {
            return Zoom.level[this.currentIndex];
        }
        for (let i = 0; i < Zoom.level.length; i++) {
            let level = Zoom.level[i];
            if (level.default) {
                this.currentIndex = i;
                return level;
            }
        }
        this.currentIndex = 0;
        return Zoom.level[this.currentIndex];
    };
};