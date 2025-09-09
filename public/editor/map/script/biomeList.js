export default {
    modData: [
        {
            dataType: 'biome',
            name: 'training ground',
            payload: {
                description: 'A simple biome used for testing map generation.',
                defaultTile: 'dirt',
                regionList: {
                    'obstacleZone': { include: ['entireBiome',], exclude: ['deployLeft', 'deployRight',], },
                    'river': { shapeList: [{ x: 0.4, y: 0, width: 0.2, height: 1, },], }
                },
                tileSet: [
                    'sand',
                    'shallow water',
                    // 'boulder',
                    // 'sandbag',
                    // 'target',
                    // 'mud'
                ],
                patches: {
                    'sand': {
                        'deployRight, deployLeft': [
                            {
                                quantity: 4,
                                quantityDeviation: 2,
                                size: { type: 'region', value: 0.02, deviation: 0.1 },
                                shape: "random",
                                allowOutsideRegion: 0.1,
                                //overwrite: ['mud'],
                                //overwritten: ['boulder'],
                            },
                            // {
                            //     quantity: 1,
                            //     size: { type: 'map', value: 0.08 },
                            //     width: { type: 'map', value: 0.2, force: true },
                            //     shape: "random",
                            //     //overwrite: ['mud'],
                            //     //overwritten: ['boulder', 'sandbag'],
                            // },
                            // {
                            //     quantity: 2,
                            //     quantityDeviation: 1,
                            //     size: { type: 'region', value: 0.05, deviation: 0.01, force: true },
                            //     width: { type: 'map', value: 0.1, deviation: 0.02 },
                            //     height: { type: 'region', value: 0.2, deviation: 0.05 },
                            //     shape: "random",
                            //     allowOutsideRegion: 0.1,
                            //     //overwrite: ['mud', 'dirt'],
                            //     //overwritten: ['boulder', 'sandbag'],
                            // },
                        ],
                        'obstacleZone': [
                            {
                                quantity: 3,
                                quantityDeviation: 1,
                                size: { type: 'region', value: 0.01, deviation: 0.2 },
                                shape: "random",
                                //overwrite: [],
                                //overwritten: ['boulder'],
                            },
                        ],
                    },
                    'shallow water': {
                        'river': [
                            {
                                quantity: 1,
                                size: { type: 'region', value: 0.3 },
                                width: { type: 'region', value: 0.2 },
                                height: { type: 'region', value: 1, force: true },
                                shape: "random",
                                //overwrite: [],
                                // overwritten: [],
                            },
                        ],
                    },
                    /*
                    'boulder': {
                        'obstacleZone': [
                            {
                                quantity: 8,
                                size: { type: 'region', value: 0.01 },
                                shape: "random",
                                overwrite: [],
                                overwritten: [],
                            },
                            {
                                quantity: 2,
                                size: { type: 'region', value: 0.03 },
                                width: { type: 'region', value: 0.1, force: true },
                                shape: "rectangular",
                                overwrite: ['grass', 'mud'],
                                overwritten: [],
                                mustBeNextTo: ['mud'],
                            },
                        ],
                        'openField': [
                            {
                                quantity: 3,
                                size: { type: 'region', value: 0.01 },
                                shape: "random",
                                overwrite: ['grass'],
                                overwritten: [],
                            },
                        ],
                    },

                    'sandbag': {
                        'obstacleZone': [
                            {
                                quantity: 10,
                                size: { type: 'hex', value: 1 },
                                shape: "rectangular",
                                overwrite: ['grass'],
                                overwritten: ['boulder'],
                            },
                        ],
                    },

                    'target': {
                        'targetArea': [
                            {
                                quantity: 5,
                                size: { type: 'hex', value: 1 },
                                shape: "random",
                                overwrite: [],
                                overwritten: [],
                            },
                        ],
                    },

                    'mud': {
                        'river': [
                            {
                                quantity: 3,
                                size: { type: 'region', value: 0.01 },
                                shape: "random",
                                overwrite: [],
                                overwritten: ['grass', 'boulder'],
                            },
                        ],
                    },
                    */
                },
            },
        },
        {
            dataType: 'biome',
            name: 'grassland',
            payload: {
                description: 'A test biome.',
                defaultTile: 'grass',
                tileSet: [
                    'dirt',
                    'shallow water',
                ],
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
                    'region14': { include: ['entireBiome',], exclude: ['region7',] },
                    'region15': { exclude: ['region7',] },
                },
            },
        }
    ],
}

/*
=========
BIOME DOC
=========
Biome Object Documentation

name: string
  - Human-readable name of the biome
  - Example: 'training ground'

description: string
  - Description of the biome, for documentation or editor UI
  - Example: 'A simple biome used for testing map generation.'

defaultTile: string
  - Default tile name to fill the biome before applying patches
  - Example: 'dirt'

regionList: object
  - Named regions within the biome
  - Each region can have:
      shapeList: array of shapes {x, y, width, height} (0–1 normalized)
      include: array of strings (regions/zones to include, e.g., 'entireBiome').
        Some regions are pre-defined and can be used freely anywhere (entireBiome, deployLeft, deployRight, etc...)
      exclude: array of strings (regions/zones to exclude). Pre-defined regions can be used here as well.
  - Example:
      'river': { shapeList: [{ x: 0.4, y: 0, width: 0.2, height: 1 }] }
      'obstacleZone': { include: ['entireBiome'], exclude: ['deployLeft', 'deployRight'] }
  - NOTE: Regions without include/exclude should be declared first.
  - NOTE: When using include/exclude, keep order in mind to avoid unresolvable region names.  

tileSet: array of strings
  - Tiles that can appear as patches in this biome
  - Example: ['sand', 'shallow water']

patches: object
  - Defines patches for each tile in specific regions
  - Structure:
      tileName (must match tileSet) => regionName(s) => array of patch definitions
  - regionName(s) can be a single string or a comma-separated string representing multiple regions.

Patch Property Definitions:
  - quantity
      Type: number
      Description: Number of patch instances to place for this tile in the specified region(s).
      Optional: Yes
      Default: 1
      Example: 3

  - quantityDeviation
      Type: number
      Description: Random variation in quantity. Actual quantity = quantity ± quantityDeviation.
      Optional: Yes
      Default: 0
      Example: 1

  - size
      Description: Determines the total area of the patch. Required.
      Fields:
        - type: "region" | "map" | "hex"
            "region": size relative to the region.
            "map": size relative to the entire map.
            "hex": size in number of hexes.
            Optional. Default: "region".
            Example: "map"
        - value: number. Required.
            Fraction of region/map to occupy or number of hexes if type="hex".
            Example: 0.05
        - deviation: number.
            Random variation in size.
            Optional. Default: 0.
            Example: 0.01
        - force: boolean
            If true, forces this size even if other rules might override
            Optional. Default: false. If multiple force detected, only the last entry is accepted.
            Example: true

  - width
      Description: Desired width of the patch. Optional.
      Fields:
          - type: "region" | "map" | "hex"
              "region": width relative to the region.
              "map": width relative to the entire map.
              "hex": width in number of hexes.
              Optional. Default: "region".
          - value: number. Required.
              Fraction of region/map to occupy or number of hexes if type="hex".
          - deviation: number.
              Random variation in width.
              Optional. Default: 0.
          - force: boolean
              If true, forces this width even if other rules might override.
              Optional. Default: false. If multiple force detected, only the last entry is accepted.

  - height
      Description: Desired height of the patch. Optional.
      Fields:
          - type: "region" | "map" | "hex"
              "region": height relative to the region.
              "map": height relative to the entire map.
              "hex": height in number of hexes.
              Optional. Default: "region".
          - value: number. Required.
              Fraction of region/map to occupy or number of hexes if type="hex".
          - deviation: number.
              Random variation in height.
              Optional. Default: 0.
          - force: boolean
              If true, forces this height even if other rules might override.
              Optional. Default: false. If multiple force detected, only the last entry is accepted.

  - shape
      Type: string
      Description: Geometric shape of the patch.
      Options: "random" (default), "blob", "line".
      Optional: Yes
      Default: "random"
      Example: "blob"

  - allowOutsideRegion
      Type: number (0–1)
      Description: Probability that a hex may be placed outside the intended region.
      Optional: Yes
      Default: 0
      Example: 0.1

  - mustBeNextTo
      Type: array of strings
      Description: Names of other regions or patches this patch must be adjacent to.
      Optional: Yes
      Default: []
      Example: ['river', 'obstacleZone']

  - overwrite
      Type: array of strings
      Description: Names of tiles this patch is allowed to overwrite.
      Optional: Yes
      Default: []
      Example: ['mud']

  - overwritten
      Type: array of strings
      Description: Names of tiles allowed to overwrite this patch.
      Optional: Yes
      Default: []
      Example: ['boulder', 'sandbag']


      
Example Patches Object:

patches: {
  // Patches for "sand" tile
  'sand': {
    // Applied to deployRight and deployLeft regions
    'deployRight, deployLeft': [
      {
        quantity: 5,
        size: { type: 'region', value: 0.02, deviation: 0.01 },
        shape: "random",
      },
      {
        quantity: 1,
        size: { type: 'map', value: 0.08 },
        width: { type: 'map', value: 0.2, force: true },
        shape: "random",
      },
      {
        quantity: 2,
        quantityDeviation: 1,
        size: { type: 'region', value: 0.05, deviation: 0.01, force: true },
        width: { type: 'map', value: 0.1, deviation: 0.02 },
        height: { type: 'region', value: 0.2, deviation: 0.05 },
        shape: "random",
        allowOutsideRegion: 0.1,
      }
    ],
    // Applied to obstacleZone region
    'obstacleZone': [
      {
        quantity: 3,
        size: { type: 'region', value: 0.03 },
        shape: "random",
      }
    ],
  },

  // Patches for "shallow water" tile
  'shallow water': {
    'river': [
      {
        quantity: 1,
        size: { type: 'region', value: 0.1 },
        height: { type: 'region', value: 1, force: true },
        shape: "random",
      },
      {
        quantity: 2,
        size: { type: 'region', value: 0.5 },
        shape: "random",
      }
    ]
  }
}

Notes:
- Keys at the top level must match the tiles listed in tileSet.
- Each key at the second level is a region or multiple regions (comma-separated) where the patch can appear.
- Each array entry represents a single patch definition with its quantity, size, shape, and optional modifiers.
- Optional fields (width, height, allowOutsideRegion, mustBeNextTo, overwrite, overwritten) can be included as needed.
*/
