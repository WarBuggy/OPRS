export default {
    modData: [
        {
            name: 'sand',
            dataType: 'tile',
            payload: {
                textureList: [
                    {
                        description: 'A texture for sandy tiles.',
                        location: '../../asset/tileTexture/sand_001.svg',
                        x: 0, // x location on spritesheet. Default 0.
                        y: 0, // y location on spritesheet. Default 0.
                    },
                    {
                        description: 'A texture for sandy tiles.',
                        location: '../../asset/tileTexture/sand_002.svg',
                    },
                ],
            },
        },
        {
            name: 'shallow water',
            dataType: 'tile',
            payload: {
                textureList: [
                    {
                        description: 'A texture for shallow water tiles.',
                        location: '../../asset/tileTexture/shallow_water_001.svg',
                    },
                    {
                        description: 'A texture for shallow water tiles.',
                        location: '../../asset/tileTexture/shallow_water_002.svg',
                    },
                ],
            },
        },
        {
            name: 'dirt',
            dataType: 'tile',
            payload: {
                textureList: [
                    {
                        description: 'A texture for dirt tiles.',
                        location: '../../asset/tileTexture/dirt_001.svg',
                    },
                    {
                        description: 'A texture for dirt tiles.',
                        location: '../../asset/tileTexture/dirt_002.svg',
                    },
                ],
            },
        }
    ],
}
