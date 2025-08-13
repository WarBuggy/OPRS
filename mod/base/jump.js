export default function ({ registerMethodMod }) {
    // Test fail to load case
    registerMethodMod({
        className: "Player",
        methodName: "jump",
        mode: Shared.MOD_STRING.HOOKS.AFTER,
        handler(input, result) {
            console.log(`${this.namse} feels much better.`);
            console.log(input);
            console.log(result);
        },
    });

    // Test replace hook
    registerMethodMod({
        className: "Player",
        methodName: "toBeReplace1",
        mode: "replace",
        handler: function () {
            console.log('This line should show up.');
        },
    });

    // Test replace hook
    registerMethodMod({
        className: "Player",
        methodName: "toBeReplace2",
        mode: "replace",
        handler: function () {
            console.log('This line should not show up because it will be replaced.');
        },
    });
};
