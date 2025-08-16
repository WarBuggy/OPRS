window.addEventListener('load', async function () {
    window.scriptLoader = new ScriptLoader();
    const modList = await window.scriptLoader.getModList();
    const { importModModule } = await scriptLoader.loadScriptMod(modList);

    window.editorMap = new window.OPRSClasses.EditorMap();
    await window.editorMap.init({ importModModule, });
});
