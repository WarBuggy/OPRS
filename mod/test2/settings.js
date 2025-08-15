function mod({ register }) {
    // Single numeric setting
    register({
        name: "testSetting",
        type: "number",
        data: {
            default: 5,   // default value
            min: 0,       // minimum value
            max: 10,      // maximum value
            step: 1       // step increment for UI
        },
        description: "A test numeric setting for demonstration purposes.",
        tooltip: "Adjust this value to test the numeric setting functionality."
    });

    // Optional: another setting can be registered as an array
    register([
        {
            name: "enableFeatureX",
            type: "boolean",
            data: {
                default: true
            },
            description: "Enable or disable feature X.",
            tooltip: "Toggle feature X on or off."
        },
        {
            key: "username",
            type: "string",
            data: {
                default: "Player"
            },
            description: "The name of the player.",
            tooltip: "Enter a custom player name."
        }
    ]);
}

// Specify that this module is a setting module
mod.registrationType = Shared.MOD_STRING.REGISTRATION_TYPE.SETTING;

export default mod;