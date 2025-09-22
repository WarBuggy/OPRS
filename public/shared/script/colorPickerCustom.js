export class ColorPickerCustom {
    constructor(input) {
        const {
            parent,
            lastPaletteIndex = -1,
            defaultColorNum = 10,
            onChange,
        } = input;

        this.onChange = onChange || (() => { });

        // Generate default palette
        const { colorList } = this.generateDefaultPalette({ n: defaultColorNum });
        this.paletteColorList = colorList;

        // Outer container
        const { component: divPicker } = Shared.createHTMLComponent({
            class: 'base_common_color-picker',
            parent,
        });

        // ---- Palette buttons ----
        const { component: divPalette } = Shared.createHTMLComponent({
            class: 'base_common_color-picker__palette',
            parent: divPicker,
        });

        this.paletteColorList.forEach(color => {
            const { component: btn } = Shared.createHTMLComponent({
                tag: 'button',
                class: 'base_common_color-picker__palette-button',
                parent: divPalette,
            });
            btn.style.backgroundColor = color;
            btn.title = color;
            btn.onclick = () => this.selectColor(color);
        });

        // ---- Standard color input ----
        const { component: inputColor } = Shared.createHTMLComponent({
            tag: 'input',
            class: 'base_common_color-picker__input',
            parent: divPicker,
        });
        inputColor.type = 'color';
        inputColor.title = taggedString.editorMapBtnTitleColorPickerRegionCreateNew();
        inputColor.oninput = (e) => this.selectColor(e.target.value);

        this.divPicker = divPicker;
        this.inputColor = inputColor;
        this.selectedColor = null;
        this.setSelectedColor({ lastPaletteIndex, });
    }

    selectColor(color) {
        this.selectedColor = color;
        this.inputColor.value = color;
        // Determine palette index, -1 if not in palette
        const paletteIndex = this.paletteColorList.findIndex(c => c.toLowerCase() === color.toLowerCase());
        this.onChange({ selectedColor: color, paletteIndex, });
    }

    setSelectedColor(input) {
        const { lastPaletteIndex, } = input;
        let paletteIndex = lastPaletteIndex + 1;
        if (paletteIndex < 0 || paletteIndex >= this.paletteColorList.length) {
            paletteIndex = 0;
        }
        this.selectedColor = this.paletteColorList[paletteIndex];
        this.inputColor.value = this.selectedColor;
    }

    generateDefaultPalette(input) {
        const { n, } = input;
        const colorList = [];
        for (let i = 0; i < n; i++) {
            const hue = Math.round((i * 360) / n);
            const { hex, } = this.hslToHex({ h: hue, s: 80, l: 50, });
            colorList.push(hex);
        }
        return { colorList, };
    }

    hslToHex(input) {
        let { h, s, l, } = input;
        s /= 100;
        l /= 100;
        const k = n => (n + h / 30) % 12;
        const a = s * Math.min(l, 1 - l);
        const f = n => {
            const val = l - a * Math.max(-1, Math.min(k(n) - 3, Math.min(9 - k(n), 1)));
            return Math.round(255 * val);
        };
        const hex = `#${((1 << 24) + (f(0) << 16) + (f(8) << 8) + f(4)).toString(16).slice(1)}`;
        return { hex, };
    }
}
