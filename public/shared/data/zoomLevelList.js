export default {
    modData: [
        {
            dataType: Shared.MOD_STRING.MOD_DATA_TYPE.ZOOM_DATA,
            name: 'default',
            payload: {
                landscape: {
                    levelList: [
                        [0.5, 32],
                        [1, 48],
                        [2, 64],
                    ],
                    default: 2,
                },
                portrait: {
                    levelList: [
                        [0.5, 16],
                        [1, 32],
                        [2, 48],
                    ],
                    default: 1,
                },
            },
        },
    ],
}
