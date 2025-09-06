export default {
    modData: [
        {
            dataType: Shared.MOD_STRING.MOD_DATA_TYPE.REGION,
            name: Shared.MOD_STRING.PREMADE_REGION_NAME.DEPLOY_LEFT,
            payload: {
                shapeList: [
                    {
                        x: 0,
                        y: 0,
                        width: 12,
                        widthInInch: true,
                        height: 1,
                    },
                ],
            },
        },
        {
            dataType: Shared.MOD_STRING.MOD_DATA_TYPE.REGION,
            name: Shared.MOD_STRING.PREMADE_REGION_NAME.DEPLOY_RIGHT,
            payload: {
                shapeList: [
                    {
                        x: 1,
                        y: 0,
                        width: -12,
                        widthInInch: true,
                        height: 1,
                    },
                ],
            },
        },
    ],
}