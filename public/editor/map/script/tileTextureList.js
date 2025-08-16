function mod({ register }) {
    register([
        {
            name: 'sand',
            description: 'A texture for sandy tiles.',
        }
    ]);
};

mod.registrationType = Shared.MOD_STRING.REGISTRATION_TYPE.TILE_TEXTURE;
export default mod;