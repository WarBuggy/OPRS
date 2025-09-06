window.addEventListener('load', async function () {
    window.scriptLoader = new ScriptLoader();
    const modList = await window.scriptLoader.getModList({
        modDirLocation: Shared.MOD_STRING.MOD_DIR_LOCATION.EDITOR_MAP,
    });
    const { savedModData } = await scriptLoader.loadScriptMod({
        modList,
        modDirLocation: Shared.MOD_STRING.MOD_DIR_LOCATION.EDITOR_MAP,
    });
    window.OPRSClasses.MainApp.modifyClassProperty();
    window.editorMap = new window.OPRSClasses.EditorMap({ savedModData });

    await window.editorMap.managerMap.generateRandomMap({ seed: 2222244, });
    window.editorMap.managerMap.requestAnimationFrame({});
});
