class RuleBeginnerAoF {
    constructor(input) {
        super({
            name: 'Age of Fantasy',
            creator: 'Gaetano Ferrara',
            version: '3.4.1',
        });
    };

    declaration() {
        this.maxElevationNoMoveCost = Rule.DEFAULT.MAX_ELEVATION_NO_MOVE_COST;
        this.maxElevationPassable = Rule.DEFAULT.MAX_ELEVATION_PASSABLE;
        this.maxDangerousRoll = Rule.DEFAULT.MAX_DANGEROUS_ROLL;
        this.maxDifficultMove = Rule.DEFAULT.MAX_DIFFICULT_NOVE;
        this.minCoverUnitPercentage = Rule.DEFAULT.MIN_COVER_UNIT_PERCENTAGE;
        this.modCoverDefenseRoll = Rule.DEFAULT.MOD_COVER_DEFENSE_ROLL;
        this.minImpassableGapWidth = Rule.DEFAULT.MIN_IMPASSABLE_GAP_WIDTH;
    };
};