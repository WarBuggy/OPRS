export default {
    modData: [
        {
            dataType: Shared.MOD_STRING.MOD_DATA_TYPE.REGION,
            name: Shared.MOD_STRING.PREMADE_REGION_NAME.ENTIRE_BIOME,
            payload: {
                shapeList: [
                    {
                        x: 0,
                        y: 0,
                        width: 1,
                        height: 1,

                    },
                ],
            },
        },
        {
            dataType: Shared.MOD_STRING.MOD_DATA_TYPE.REGION,
            name: 'topLeftQuadrant',
            payload: {
                shapeList: [
                    {
                        x: 0,
                        y: 0,
                        width: 0.5,
                        height: 0.5,
                    },
                ],
            },
        },
        {
            dataType: Shared.MOD_STRING.MOD_DATA_TYPE.REGION,
            name: 'topRightQuadrant',
            payload: {
                shapeList: [
                    {
                        x: 0.5,
                        y: 0,
                        width: 0.5,
                        height: 0.5,
                    },
                ],
            },
        },
        {
            dataType: Shared.MOD_STRING.MOD_DATA_TYPE.REGION,
            name: 'bottomLeftQuadrant',
            payload: {
                shapeList: [
                    {
                        x: 0,
                        y: 0.5,
                        width: 0.5,
                        height: 0.5,
                    },
                ],
            },
        },
        {
            dataType: Shared.MOD_STRING.MOD_DATA_TYPE.REGION,
            name: 'bottomRightQuadrant',
            payload: {
                shapeList: [
                    {
                        x: 0.5,
                        y: 0.5,
                        width: 0.5,
                        height: 0.5,
                    },
                ],
            },
        },
    ],
}