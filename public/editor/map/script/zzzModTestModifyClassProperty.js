export default function ({ register }) {
    // Test before hook
    register({
        className: "MainApp",
        methodName: "modifyClassProperty",
        mode: Shared.MOD_STRING.REGISTRATION_MODE.AFTER,
        handler(input) {
            window.OPRSClasses.Player = ScriptLoader.addDefaultProperty(window.OPRSClasses.Player, "location", "Unknown");
        },
    });
    register({
        className: "MainApp",
        methodName: "modifyClassProperty",
        mode: Shared.MOD_STRING.REGISTRATION_MODE.AFTER,
        handler(input) {
            window.OPRSClasses.Player = ScriptLoader.addDefaultProperty(window.OPRSClasses.Player, "blackMagic", false);
        },
    });
}
