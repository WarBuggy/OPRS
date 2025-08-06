class Rule {
    static DEFAULT = {
        MAX_ELEVATION_NO_MOVE_COST: 1,
        MAX_ELEVATION_PASSABLE: 3,
        MAX_DANGEROUS_ROLL: 1,
        MAX_DIFFICULT_NOVE: 6,
        MIN_COVER_UNIT_PERCENTAGE: 0.5,
        MOD_COVER_DEFENSE_ROLL: 1,
        MIN_IMPASSABLE_GAP_WIDTH: 1,
    };

    constructor(input) {
        this.name = input.name;
        this.creator = input.creator;
        this.version = input.version;
        this.isAdvance = input.isAdvance;

        this.declareTerrainRules();
    };

    declareTerrainRule() {
        this.maxElevationNoMoveCost = Rule.DEFAULT.MAX_ELEVATION_NO_MOVE_COST;
        this.maxElevationPassable = Rule.DEFAULT.MAX_ELEVATION_PASSABLE;
        this.maxDangerousRoll = Rule.DEFAULT.MAX_DANGEROUS_ROLL;
        this.maxDifficultMove = Rule.DEFAULT.MAX_DIFFICULT_NOVE;
        this.minCoverUnitPercentage = Rule.DEFAULT.MIN_COVER_UNIT_PERCENTAGE;
        this.modCoverDefenseRoll = Rule.DEFAULT.MOD_COVER_DEFENSE_ROLL;
        this.minImpassableGapWidth = Rule.DEFAULT.MIN_IMPASSABLE_GAP_WIDTH;
    };
};