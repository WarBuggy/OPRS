export class Biome {
    /**
     * @param {string} name - Unique name of the biome
     * @param {string} description - Short description of the biome
     * @param {string} sourceMod - The name of the mod that provided this biome
     * @param {Object<string, any>} mapObjects - Map of objectName => objectData
     */
    constructor(name, description, sourceMod) {
        this.name = name;
        this.description = description;
        this.sourceMod = sourceMod;
        this.mapObjects = {};
    };
};