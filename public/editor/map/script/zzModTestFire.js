export default function ({ registerMethodMod }) {
    // Test before hook
    registerMethodMod({
        className: "Player",
        methodName: "fire",
        mode: Shared.MOD_STRING.HOOKS.BEFORE,
        handler(input) {
            console.log(`${this.name} aims carefully at the target.`);
        },
    });

    // Test after hook
    registerMethodMod({
        className: "Player",
        methodName: "heal",
        mode: Shared.MOD_STRING.HOOKS.AFTER,
        handler() {
            console.log(`Player feels much better.`);
        },
    });
};
