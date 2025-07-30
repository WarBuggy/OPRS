// Keep the mini map zoom independent — it’s easier for users to orient themselves.

// Let the mini map represent a scaled viewport of the main map, showing which part is visible in the main map viewport.

// The main map zoom and pan remain controlled by direct user input on the main map.

// The mini map zoom acts like a zoom on the overview itself, letting users get a more granular or broader view of the entire map on the mini map.


class MiniMapParchment extends BaseMiniMap {
    constructor(input) {
        super(input);
    };
};