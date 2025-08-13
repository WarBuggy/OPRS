export default function ({ registerNewMethodMod }) {
    // test add new method hook, instance method
    registerNewMethodMod({
        className: "Player",
        methodName: "fire2",
        handler(input) {
            console.log(`${this.name} shoot laser out of his eyes for ${input.dmg - 2} damage.`);
        },
    });

    // test add new method hook, static method
    registerNewMethodMod({
        className: "Player",
        methodName: "fire3",
        isStatic: true,
        handler(input) {
            console.log(`The whole map explodes! Everything took ${Math.ceil(input.dmg * 0.1)} damange.`);
        },
    });
};
