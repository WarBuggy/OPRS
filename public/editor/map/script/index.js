window.addEventListener('load', async function () {
    window.scriptLoader = new ScriptLoader();
    const modList = await window.scriptLoader.getModList();
    const { savedModData } = await scriptLoader.loadScriptMod(modList);
    //console.log(savedModData);
    //window.editorMap = new window.OPRSClasses.EditorMap();
    //await window.editorMap.init({ importModModule, });
});
