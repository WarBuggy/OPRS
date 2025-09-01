export default {
    modData: [
        {
            dataType: Shared.MOD_STRING.MOD_DATA_TYPE.REGION,
            name: 'entireBiome',
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
        {
            dataType: Shared.MOD_STRING.MOD_DATA_TYPE.REGION,
            name: 'entireBiome',
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

/*

const regions = [
    // 1. Regions without include/exclude
    { name: 'region1', shapeList: [{ x: 0, y: 0, width: 0.2, height: 0.2 }] },
    { name: 'region2', shapeList: [{ x: 0.3, y: 0, width: 0.2, height: 0.2 }] },

    // 2. Regions with only include
    { name: 'region3', shapeList: [{ x: 0.5, y: 0, width: 0.2, height: 0.2 }], include: ['region1'] },
    { name: 'region4', shapeList: [{ x: 0.7, y: 0, width: 0.2, height: 0.2 }], include: ['region2'] },

    // 3. Regions with only exclude
    { name: 'region5', shapeList: [{ x: 0, y: 0.3, width: 0.2, height: 0.2 }], exclude: ['region1'] },
    { name: 'region6', shapeList: [{ x: 0.3, y: 0.3, width: 0.2, height: 0.2 }], exclude: ['region2'] },

    // 4. Regions with both include and exclude
    { name: 'region7', shapeList: [{ x: 0.5, y: 0.3, width: 0.2, height: 0.2 }], include: ['region3'], exclude: ['region5'] },
    { name: 'region8', shapeList: [{ x: 0.7, y: 0.3, width: 0.2, height: 0.2 }], include: ['region4'], exclude: ['region6'] },

    // 5. Region that includes entireBiome and excludes some regions
    { name: 'region9', shapeList: [{ x: 0, y: 0.6, width: 1.0, height: 0.4 }], include: ['entireBiome'], exclude: ['region1', 'region2'] },

    // 6. Un-define-able regions
    { name: 'region10', shapeList: [{ x: 0.1, y: 0.1, width: 0.1, height: 0.1 }], include: ['region11'] },
    { name: 'region11', shapeList: [{ x: 0.2, y: 0.2, width: 0.1, height: 0.1 }], exclude: ['region10'] },

    // 7. Another un-define-able region referencing fully defined regions
    { name: 'region12', shapeList: [{ x: 0.4, y: 0.4, width: 0.1, height: 0.1 }], include: ['region1', 'region3'], exclude: ['region7'] },
    { name: 'region13', shapeList: [{ x: 0.5, y: 0.5, width: 0.1, height: 0.1 }], include: ['region2'], exclude: ['region8'] },
];


*/