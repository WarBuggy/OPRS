export class SettingLoader {
    constructor() {
        this.settingsRegistry = {};
    };

    async loadModSetting(input) {
        const { importModModule } = input;
        const remainingModules = {};

        for (const [modName, modModule] of Object.entries(importModModule)) {
            const registrationType = modModule.default.registrationType;
            // If it is not of type setting, pass it on
            if (registrationType !== Shared.MOD_STRING.REGISTRATION_TYPE.SETTING) {
                remainingModules[modName] = modModule;
                continue;
            }

            const settingsForThisMod = {};
            try {
                await modModule.default({
                    register: (settingArrayOrObject) => {
                        try {
                            if (Array.isArray(settingArrayOrObject)) {
                                for (const setting of settingArrayOrObject) {
                                    settingsForThisMod[setting.key] = setting;
                                }
                            } else if (typeof settingArrayOrObject === "object") {
                                settingsForThisMod[settingArrayOrObject.key] = settingArrayOrObject;
                            } else {
                                console.warn(`[SettingLoader] ${taggedString.registerSettingInvalidFormat(modName)}`);
                            }
                        } catch (e) {
                            console.error(`[SettingLoader] ${taggedString.registerSettingUnexpectedError(modName, e)}`);
                            // stop registering any further settings for this mod
                            throw e;
                        }
                    }
                });

                // Save all successfully registered settings for this mod
                this.settingsRegistry[modName] = settingsForThisMod;
                console.log(`[SettingLoader] ${taggedString.registerSettingSuccess(modName)}`);
            } catch (e) {
                console.error(`[SettingLoader] ${taggedString.registerSettingFailed(modName)}`);
            }
        }
        return { remainingModules }; // Pass remaining modules to AssetLoader
    }

    getSettings(modName) {
        return this.settingsRegistry[modName] || {};
    };
};