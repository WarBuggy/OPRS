class Shared {
  static STORAGE_KEYS = {
    LANGUAGE: 'language',
    ZOOM_LEVEL_MAP_EDITOR_PARCHMENT: 'mapEditorZoomLevel',
  };

  static EMITTER_SIGNAL = {
    PARCHMENT_PANNED: 'parchment_panned',
    PARCHMENT_ZOOMED: 'parchment_zoomed',
    MINI_MAP_CLICKED: 'miniMap_clicked',
  };

  static HEX_DIRECTION = {
    LEFT: "l",
    RIGHT: "r",
    TOP_LEFT: "tl",
    TOP_RIGHT: "tr",
    BOTTOM_LEFT: "bl",
    BOTTOM_RIGHT: "br",
  };

  /**
   * Clamps a numeric value between a minimum and maximum bound.
   *
   * @param {number} input.value - The value to be clamped.
   * @param {number} input.min - The lower bound.
   * @param {number} input.max - The upper bound.
   *
   * @returns {number} - The clamped value, guaranteed to be between min and max.
   */
  static clamp(input) {
    return Math.min(input.max, Math.max(input.min, input.value));
  };
};

/*
function parseClass(code) {
  const result = {
    className: null,
    methods: {}
  };

  // Match class name
  const classMatch = code.match(/class\s+([A-Za-z0-9_$]+)\s*{/);
  if (!classMatch) return result;
  result.className = classMatch[1];

  const classBodyStart = code.indexOf('{', classMatch.index) + 1;
  const classBodyEnd = code.lastIndexOf('}');
  const classBody = code.slice(classBodyStart, classBodyEnd);

  let i = 0;
  while (i < classBody.length) {
    // Match method name
    const methodMatch = classBody.slice(i).match(/^([A-Za-z0-9_$]+)\s*\([^)]*\)\s*\{/m);
    if (!methodMatch) break;

    const methodName = methodMatch[1];
    const matchIndex = i + methodMatch.index;
    const braceStart = classBody.indexOf('{', matchIndex);

    // Extract full method body by tracking braces
    let depth = 1;
    let j = braceStart + 1;
    while (j < classBody.length && depth > 0) {
      if (classBody[j] === '{') depth++;
      else if (classBody[j] === '}') depth--;
      j++;
    }

    const functionBody = classBody.slice(braceStart + 1, j - 1); // exclude outer braces
    result.methods[methodName] = functionBody.trim();

    i = j;
  }

  return result;
}
*/