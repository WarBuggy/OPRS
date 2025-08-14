class ModLoader {
    static OPRSClasses = window.OPRSClasses = window.OPRSClasses || {};
    static modHooksSymbol = Symbol.for('modHooks');

    async loadMod() {
        const modList = await ModLoader.parseModSettingXML({
            modDirLocation: Shared.MOD_STRING.MOD_DIR_LOCATION.EDITOR_MAP,
        });
        this.addBaseModToModList(modList.list);
        for (let h = 0; h < modList.list.length; h++) {
            const modMetaData = modList.list[h];
            const modData = await ModLoader.parseModAboutXML({
                modDirLocation: Shared.MOD_STRING.MOD_DIR_LOCATION.EDITOR_MAP,
                dirName: modMetaData.dirName,
            });
            const dirPath = `${Shared.MOD_STRING.MOD_DIR_LOCATION.EDITOR_MAP}${modMetaData.dirName}/`;
            for (let i = 0; i < modData.hooks.length; i++) {
                const modFile = modData.hooks[i];
                const modPath = `${dirPath}${modFile}`;
                await window.ml.loadAMod({
                    modPath,
                    modName: modData.name,
                    modFile,
                });
            }
        }
    };

    async loadAMod(input) {
        try {
            const modModule = await import(input.modPath);

            const parent = this;
            // Check if default export is a function — method-hook mod
            if (typeof modModule.default === "function") {
                // Provide registerMethodMod to mod code
                await modModule.default({
                    modName: input.modName,
                    registerMethodMod: function (hookInfo) {
                        try {
                            parent.registerMethodMod({ modName: input.modName, hookInfo, });
                            console.log(`[ModLoader] ${taggedString.methodHookLoaded(input.modName, input.modFile, hookInfo.className, hookInfo.methodName, hookInfo.mode)}`);
                        } catch (e) {
                            console.error(`[ModLoader] ${taggedString.methodHookFailed(input.modName, input.modFile, e)}`);
                        }
                    },
                    registerNewMethodMod: function (newInfo) {
                        try {
                            parent.registerNewMethodMod(newInfo);
                            console.log(`[ModLoader] ${taggedString.newMethodLoaded(input.modName, input.modFile, newInfo.className, newInfo.methodName)}`);
                        } catch (e) {
                            console.error(`[ModLoader] ${taggedString.newMethodFailed(input.modName, input.modFile, e)}`);
                        }
                    }
                });
                return;
            }

            // Otherwise, expect named exports which are classes — new-class mod
            const exportedClassNames = Object.entries(modModule)
                .filter(([name, val]) =>
                    typeof val === "function" && /^\s*class\s/.test(val.toString())
                )
                .map(([name]) => name);

            if (exportedClassNames.length === 0) {
                console.error(`[ModLoader] ${taggedString.newClassNoExport(input.modName, input.modPath)}.`);
            }
            // Register each exported class
            for (const className of exportedClassNames) {
                const cls = modModule[className];
                if (ModLoader.OPRSClasses[className]) {
                    console.warn(`[ModLoader] ${taggedString.newClassExists(input.modName, className)}`);
                }
                ModLoader.OPRSClasses[className] = cls;
                console.log(`[ModLoader] ${taggedString.newClassLoaded(input.modName, className)}`);
            }
        } catch (e) {
            console.error(`[ModLoader] ${taggedString.newClassFailed(input.modFile, input.modName, e)}`);
        }
    };

    registerMethodMod(input) {
        const {
            className,
            methodName,
            mode,
            handler
        } = input.hookInfo;
        const modName = input.modName;

        if (!className || !methodName || !mode || typeof handler !== "function") {
            throw new Error(taggedString.methodHookInvalidInfo());
        }

        const targetClass = ModLoader.OPRSClasses[className];
        if (!targetClass) {
            throw new Error(taggedString.methodHookNoClass(className));
        }

        // Detect static or instance method
        const isStatic = methodName in targetClass;
        const targetObject = isStatic ? targetClass : targetClass.prototype;

        if (!(methodName in targetObject)) {
            throw new Error(taggedString.methodHookNoMethod(methodName, className, isStatic));
        }

        // Initialize hook storage for this method if not exists
        targetObject[ModLoader.modHooksSymbol] = targetObject[ModLoader.modHooksSymbol] || {};
        if (!targetObject[ModLoader.modHooksSymbol][methodName]) {
            targetObject[ModLoader.modHooksSymbol][methodName] = {
                originalFunc: targetObject[methodName],
                beforeHooks: [],
                afterHooks: [],
                replaceHook: null
            };
        }

        const hookData = targetObject[ModLoader.modHooksSymbol][methodName];

        // Wrap handler to catch errors and log mod info
        const safeHandler = function (...args) {
            try {
                return handler.apply(this, args);
            } catch (e) {
                // Swallow error
                console.error(taggedString.methodHookErrorCode(modName, mode, className, methodName, e));
            }
        };

        // Register hooks by mode
        if (mode === Shared.MOD_STRING.HOOKS.BEFORE) {
            hookData.beforeHooks.unshift({ modName, handler: safeHandler });
        } else if (mode === Shared.MOD_STRING.HOOKS.AFTER) {
            hookData.afterHooks.push({ modName, handler: safeHandler });
        } else if (mode === Shared.MOD_STRING.HOOKS.REPLACE) {
            // Replace hook: discard previous replace hook
            hookData.replaceHook = { modName, handler: safeHandler };
        } else {
            throw new Error(taggedString.methodHookUnknownMode(mode));
        }

        // Rebuild the method with hooks in a separate helper
        this._rebuildHookedMethod({ targetObject, methodName, hookData, className, });
    };

    /**
     * Internal helper to rebuild the method with registered hooks.
     */
    _rebuildHookedMethod(input) {
        input.targetObject[input.methodName] = function hookedMethod(...args) {
            const parent = this;

            // Run BEFORE hooks
            for (const { modName, handler } of input.hookData.beforeHooks) {
                try {
                    handler.call(parent, ...args);
                } catch (e) {
                    console.error(taggedString.methodHookBeforeError(modName, className, methodName, e));
                }
            }

            // Call REPLACE or ORIGINAL
            let result;
            if (input.hookData.replaceHook) {
                try {
                    result = input.hookData.replaceHook.handler.call(parent, ...args);
                } catch (e) {
                    console.error(taggedString.methodHookReplaceError(input.hookData.replaceHook.modName, input.className, input.methodName, e));
                }
            } else {
                try {
                    result = input.hookData.originalFunc.apply(parent, args);
                } catch (e) {
                    console.error(taggedString.methodHookReplaceErrorOriginal(input.className, input.methodName, e));
                }
            }

            // Run AFTER hooks
            for (const { modName, handler } of input.hookData.afterHooks) {
                try {
                    handler.call(parent, ...args, result);
                } catch (e) {
                    console.error(taggedString.methodHookAfterError(modName, input.className, input.methodName, e));
                }
            }

            return result;
        };
    };

    registerNewMethodMod(input) {
        const { className, methodName, handler, isStatic = false } = input;

        // Validate required inputs
        if (!className || !methodName || typeof handler !== "function") {
            throw new Error(`[ModLoader] ${taggedString.newMethodInvalidInput()}`);
        }
        // Find the target class
        const targetClass = ModLoader.OPRSClasses[className];
        if (!targetClass) {
            throw new Error(`[ModLoader] ${taggedString.newMethodInvalidClassName(className)}`);
        }

        // Decide where to attach the method: static or instance
        const targetObject = isStatic ? targetClass : targetClass.prototype;

        // Prevent overwriting existing methods
        if (Object.prototype.hasOwnProperty.call(targetObject, methodName)) {
            throw new Error(`[ModLoader] ${taggedString.newMethodMethodExists(methodName, isStatic ? "static" : "instance", className)}`);
        }

        try {
            // Add the new method
            targetObject[methodName] = handler;
            console.log(`[ModLoader] ${taggedString.newMethodAdded(isStatic ? "static" : "instance", methodName, className)}`);
        } catch (e) {
            throw new Error(`[ModLoader] ${taggedString.newMethodError(methodName, className, e)}`);
        }
    };

    addBaseModToModList(modList) {
        const baseMod = {
            modName: 'base',
            dirName: '../public/editor/map/script',
        };
        modList.unshift(baseMod);
    };

    /**
     * Parses a mod's `about.xml` file to extract metadata such as name,
     * version, author, and hooks, etc...
     *
     * @async
     * @param {string} input.modDirLocation - Base directory path where the mod is stored.
     * @param {string} input.dirName - The specific mod's folder name.
     * @returns {Object|null} - Parsed mod metadata if all fields are valid, otherwise null:
     *   @property {string} name - The name of the mod from the XML.
     *   @property {string} version - The version string of the mod.
     *   @property {string} author - The author or creator of the mod.
     *   @property {string[]} hooks - Array of hook identifiers extracted from XML.
     */
    static async parseModAboutXML(input) {
        const filePath = `${input.modDirLocation}${input.dirName}/${Shared.MOD_STRING.ABOUT_XML.FILE_NAME}`;
        const response = await fetch(filePath);
        const text = await response.text();

        const parser = new DOMParser();
        const xmlDoc = parser.parseFromString(text, 'application/xml');

        const name = xmlDoc.querySelector(Shared.MOD_STRING.ABOUT_XML.NAME)?.textContent.trim() || null;
        const version = xmlDoc.querySelector(Shared.MOD_STRING.ABOUT_XML.VERSION)?.textContent.trim() || null;
        const author = xmlDoc.querySelector(Shared.MOD_STRING.ABOUT_XML.AUTHOR)?.textContent.trim() || null;
        const tagTransverseString = `${Shared.MOD_STRING.ABOUT_XML.HOOKS} > ${Shared.MOD_STRING.ABOUT_XML.HOOK}`;
        const hooks = [...xmlDoc.querySelectorAll(tagTransverseString)]
            .map(h => h.textContent.trim())
            .filter(h => h.length > 0); // Ignore empty hooks

        // If any field is missing or empty, return null
        if (!name || !version || !author || hooks.length === 0) {
            return null;
        }
        return { name, version, author, hooks };
    };

    /**
     * Parses the mod settings XML file to extract a list of mod entries.
     * Fetches and parses the XML, then reads each <listEntry> for mod metadata.
     *
     * @async
     * @param {string} input.modDirLocation - Base directory path for the mod settings XML.
     * @returns {Object} - Parsed mod settings object containing:
     *   @property {Array<Object>} list - Array of mod entries:
     *     Each entry contains:
     *     @property {string} modName - The mod's name from the XML entry.
     *     @property {string} dirName - The directory name of the mod.
     */
    static async parseModSettingXML(input) {
        // Fetch the XML file
        const filePath = `${input.modDirLocation}${Shared.MOD_STRING.SETTING_XML.FILE_NAME}`;
        const response = await fetch(filePath);
        const xmlText = await response.text();

        // Parse XML text into a DOM
        const parser = new DOMParser();
        const xmlDoc = parser.parseFromString(xmlText, 'application/xml');

        // CONSIDER TO REMOVE
        // Grab <setting> content (could be empty string if no text inside)
        // const setting = xmlDoc.querySelector("mod > setting")?.textContent.trim() || "";

        // Grab <listEntry> items
        const tagTransverseString = `${Shared.MOD_STRING.BASE_TAG_NAME} > ${Shared.MOD_STRING.SETTING_XML.LIST} > ${Shared.MOD_STRING.SETTING_XML.LIST_ENTRY}`;
        const entries = [];
        const listEntries = xmlDoc.querySelectorAll(tagTransverseString);

        listEntries.forEach((entry, index) => {
            const modName = entry.querySelector(Shared.MOD_STRING.SETTING_XML.MOD_NAME)?.textContent.trim() || "";
            const dirName = entry.querySelector(Shared.MOD_STRING.SETTING_XML.DIR_NAME)?.textContent.trim() || "";

            if (!modName || !dirName) {
                console.error(`[ModLoader.parseModSettingXML] ${window.taggedString.invalidModSettingListEntry(index)}`);
                return; // Skip this entry
            }

            entries.push({ modName, dirName });
        });

        // Return as JS object
        return {
            list: entries
        };
    };
};