export class ObjectLoader {
    constructor(input) {
        this.targetRegistrationType = input.targetRegistrationType;
        this.registry = {};
    };

    async loadMod(input) {
        const { importModModule } = input;
        const remainingModules = {};

        for (const [modName, modModule] of Object.entries(importModModule)) {
            const registrationType = modModule.default.registrationType;
            // If it is not of type setting, pass it on
            if (registrationType !== this.targetRegistrationType) {
                remainingModules[modName] = modModule;
                continue;
            }
            // Initialize mod namespace if not exist
            if (!this.registry[modName]) {
                this.registry[modName] = {};
            } else {
                console.warn(`[ObjectLoader] ${taggedString.registerModExists(modName, registrationType)}`);
            }
            let allOk = true;
            try {
                await modModule.default({
                    register: (objectOrArray) => {
                        allOk = this.registryHandler({ objectOrArray, modName, registrationType, }) && allOk;
                    },
                });
                if (allOk) {
                    console.log(`[ObjectLoader] ${taggedString.registerModSuccess(modName, registrationType)}`);
                } else {
                    console.warn(`[ObjectLoader] ${taggedString.registerModPartialSuccess(modName, registrationType)}`);
                }
            } catch (e) {
                console.error(`[ObjectLoader] ${taggedString.registerModFailed(modName, registrationType, e)}`);
            }
        }
        return { remainingModules }; // Pass remaining modules to AssetLoader
    };

    registryHandler(input) {
        const { objectOrArray, modName, registrationType } = input;
        let allOk = true;
        let objectArray = Array.isArray(objectOrArray) ? objectOrArray : [objectOrArray];
        for (let i = 0; i < objectArray.length; i++) {
            try {

                const obj = objectArray[i];
                if (typeof obj !== 'object' || obj === null) {
                    console.error(`[ObjectLoader] ${taggedString.registerModInvalidFormat(modName, registrationType)}`);
                    allOk = false;
                    continue;
                }
                const name = obj.name;
                if (!name) {
                    console.error(`[ObjectLoader] ${taggedString.registerModNoName(i, modName, registrationType)}`);
                    allOk = false;
                    continue;
                }
                if (this.registry[modName][name]) {
                    console.warn(`[ObjectLoader] ${taggedString.registerModSameName(name, modName, registrationType)}`);
                    allOk = false;
                }
                this.registry[modName][name] = obj;
            } catch (e) {
                // stop registering any further settings for this mod
                console.error(`[ObjectLoader] ${taggedString.registerModUnexpectedError(modName, registrationType, e)}`);
                allOk = false;
            }
        }
        return allOk;
    };
};