function mod({ register }) {
    // test after hook
    // test multiple before hook on a method
    // test input is passed to before hook
    // test mod error doesn't stop the app
    register({
        className: "Player",
        methodName: "fire",
        mode: Shared.MOD_STRING.HOOKS.BEFORE,
        handler(input) {
            kill(); // unknown command to cause error
            console.log(`Damage will be ${input.dmg}.`);
        },
    });

    // test replace hook
    register({
        className: "Player",
        methodName: "toBeReplace2",
        mode: Shared.MOD_STRING.HOOKS.REPLACE,
        handler(input) {
            console.log('This line should show up because it is the last.');
        },
    });
};

mod.registrationType = Shared.MOD_STRING.REGISTRATION_TYPE.METHOD;
export default mod;