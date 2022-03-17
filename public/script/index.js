window.onload = function () {
    calculateAllSizes();
};

window.addEventListener('resize', function () {
    calculateAllSizes();
});

function calculateAllSizes() {
    window.dimension = new Dimension();
    console.log(window.dimension);
    window.table = new Table();
};

