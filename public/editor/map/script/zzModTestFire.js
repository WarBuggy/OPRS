function mod({ register }) {
    // Test before hook
    register({
        className: "Player",
        methodName: "fire",
        mode: Shared.MOD_STRING.HOOKS.BEFORE,
        handler(input) {
            console.log(`${this.name} aims carefully at the target.`);
        },
    });

    // Test after hook
    register({
        className: "Player",
        methodName: "heal",
        mode: Shared.MOD_STRING.HOOKS.AFTER,
        handler() {
            console.log(`Player feels much better.`);
        },
    });
};

mod.registrationType = Shared.MOD_STRING.REGISTRATION_TYPE.METHOD;
export default mod;
