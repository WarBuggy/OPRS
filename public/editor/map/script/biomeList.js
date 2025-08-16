function mod({ register }) {
    register([
        {
            name: 'grassland',
            description: 'A test biome.',
        }
    ]);
};

mod.registrationType = Shared.MOD_STRING.REGISTRATION_TYPE.BIOME;
export default mod;