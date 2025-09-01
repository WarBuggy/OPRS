export default {
    modData: [
        {
            dataType: Shared.MOD_STRING.MOD_DATA_TYPE.REGION,
            name: 'deployLeft',
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
            name: 'deployRight',
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