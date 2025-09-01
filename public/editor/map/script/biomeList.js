export default {
    modData: [
        {
            dataType: 'biome',
            name: 'grassland',
            payload: {
                description: 'A test biome.',
                regionList: {
                    // Test sorting
                    'region13': { shapeList: [{ x: 0.5, y: 0.5, width: 0.1, height: 0.1 }], include: ['region2'], exclude: ['region8'] },

                    'region1': { shapeList: [{ x: 0, y: 0, width: 0.2, height: 0.2 }] },
                    'region2': { shapeList: [{ x: 0.3, y: 0, width: 0.2, height: 0.2 }] },

                    // 2. Regions with only include
                    'region3': { shapeList: [{ x: 0.5, y: 0, width: 0.2, height: 0.2 }], include: ['region1'] },
                    'region4': { shapeList: [{ x: 0.7, y: 0, width: 0.2, height: 0.2 }], include: ['region2'] },

                    // 3. Regions with only exclude
                    'region5': { shapeList: [{ x: 0, y: 0.3, width: 0.2, height: 0.2 }], exclude: ['region1'] },
                    'region6': { shapeList: [{ x: 0.3, y: 0.3, width: 0.2, height: 0.2 }], exclude: ['region2'] },

                    // 4. Regions with both include and exclude
                    'region7': { shapeList: [{ x: 0.5, y: 0.3, width: 0.2, height: 0.2 }], include: ['region3'], exclude: ['region5'] },
                    'region8': { shapeList: [{ x: 0.7, y: 0.3, width: 0.2, height: 0.2 }], include: ['region4'], exclude: ['region6'] },

                    // 5. Region that includes entireBiome and excludes some regions
                    'region9': { shapeList: [{ x: 0, y: 0.6, width: 1.0, height: 0.4 }], include: ['entireBiome'], exclude: ['region1', 'region2'] },
                    // 6. Un-define-able regions
                    'region10': { shapeList: [{ x: 0.1, y: 0.1, width: 0.1, height: 0.1 }], include: ['region11'] },
                    'region11': { shapeList: [{ x: 0.2, y: 0.2, width: 0.1, height: 0.1 }], exclude: ['region10'] },

                    // 7. Another un-define-able region referencing fully defined regions
                    'region12': { shapeList: [{ x: 0.4, y: 0.4, width: 0.1, height: 0.1 }], include: ['region1', 'region3'], exclude: ['region7', 'regionX'] },

                },
            },
        }
    ],
}
