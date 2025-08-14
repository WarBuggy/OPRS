export class AssetRegistry {
    constructor(input) {
        this.name = input.name;
        this.modName = input.modName;
        this.assets = new Map();
    };

    /**
     * Add or replace an asset.
     * If an asset with the same name exists, it will be replaced.
     * @param {string} name - Unique name of the asset
     * @param {object} asset - The asset object (e.g., Biome instance)
     */
    add(name, asset) {
        if (this.assets.has(name)) {
            console.warn(`[AssetRegistry] Asset "${name}" is being replaced by the new one.`);
        }
        this.assets.set(name, asset);
    };

    /**
     * Retrieve an asset by name
     * @param {string} name
     * @returns {object|undefined} - The asset object, or undefined if not found
     */
    get(name) {
        return this.assets.get(name);
    };

    /**
     * Remove an asset by name
     * @param {string} name
     */
    remove(name) {
        this.assets.delete(name);
    };

    /**
     * Get all assets in insertion order
     * @returns {Array} - Array of asset objects
     */
    getAll() {
        return Array.from(this.assets.values());
    };

    /**
     * Clear all assets
     */
    clear() {
        this.assets.clear();
    };
};