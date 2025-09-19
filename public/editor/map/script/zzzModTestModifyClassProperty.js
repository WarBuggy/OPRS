export default function ({ register }) {
    // Test before hook
    register({
        className: "AppMain",
        methodName: "modifyClassProperty",
        mode: Shared.MOD_STRING.REGISTRATION_MODE.AFTER,
        handler(input) {
            window.OPRSClasses.Player =
                ScriptLoader.addDefaultProperty({
                    ClassRef: window.OPRSClasses.Player,
                    propName: "location",
                    defaultValue: "Unknown",
                });
        },
    });
    register({
        className: "AppMain",
        methodName: "modifyClassProperty",
        mode: Shared.MOD_STRING.REGISTRATION_MODE.AFTER,
        handler(input) {
            window.OPRSClasses.Player = ScriptLoader.addDefaultProperty({
                ClassRef: window.OPRSClasses.Player,
                propName: "blackMagic",
                defaultValue: false
            });
        },
    });
}
