class Scroll {
    constructor(viewportWidth, viewportHeight) {
        this.viewportWidth = viewportWidth;
        this.viewportHeight = viewportHeight;
        this.verticalScrollSpeed = 1; // TODO: read from config
        this.horizontalScrollSpeed = 1; // TODO: read from config
        this.verticalScrollDistance = this.verticalScrollSpeed * Grid.hexParam.radius;
        this.horizontalScrollDistance = this.horizontalScrollSpeed * Grid.hexParam.radius;
        this.xPosition = 0;
        this.yPosition = 0;
    };

    setup(viewportWidth, viewportHeight) {
        this.viewportWidth = viewportWidth;
        this.viewportHeight = viewportHeight;

    };

    scrollLeft() {
        newXPosition = this.xPosition + this.horizontalScrollDistance;
        this.xPosition = Math.min(this.viewportWidth, newYPosition);
    };

    scrollRight() {
        newXPosition = this.xPosition - this.horizontalScrollDistance;
        this.xPosition = Math.max(0, newXPosition);
    };

    scrollUp() {
        let newYPosition = this.yPosition - this.verticalScrollDistance;
        this.yPosition = Math.max(0, newYPosition);
    };

    scrollDown() {
        let newYPosition = this.yPosition + this.verticalScrollDistance;
        this.yPosition = Math.min(this.viewportHeight);
    };
};