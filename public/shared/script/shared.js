class Shared {
  static STORAGE_KEY_LIST = {
    LANGUAGE: 'language',
    ZOOM_LEVEL_MAP_EDITOR_MAP: 'zoomLevelMapMainEditorMap',
  };

  static EMITTER_SIGNAL = {
    MAP_MAIN_PANNED: 'parchment_panned',
    MAP_MAIN_ZOOMED: 'parchment_zoomed',
    MAP_MINI_CLICKED: 'miniMap_clicked',
    OVERLAY_VISIBLE: 'overlay_visible',
    OVERLAY_CLOSED: 'overlay_closed',
  };

  // Short identifier
  // Full string unnecessary because the constant name is descriptive
  static FLIPMODE_STANDARD = 's';
  static FLIPMODE_REVERSED = 'r';

  static TILE_DIRECTION = {
    LEFT: {
      SYMBOL: 'l',
      COORD_MOD: {
        [Shared.FLIPMODE_STANDARD]: [{ xMod: -1, yMod: 0, },],
        [Shared.FLIPMODE_REVERSED]: [{ xMod: 1, yMod: 0, },],
      },
      PERPENDICULAR: ['DOWN', 'TOP',],
    },
    RIGHT: {
      SYMBOL: 'r',
      COORD_MOD: {
        [Shared.FLIPMODE_STANDARD]: [{ xMod: 1, yMod: 0, },],
        [Shared.FLIPMODE_REVERSED]: [{ xMod: -1, yMod: 0, },],
      },
      PERPENDICULAR: ['TOP', 'DOWN',],
    },
    TOP: {
      SYMBOL: 't',
      COORD_MOD: {
        [Shared.FLIPMODE_STANDARD]: [{ xMod: 0, yMod: -1, },],
        [Shared.FLIPMODE_REVERSED]: [{ xMod: 0, yMod: -1, },],
      },
      PERPENDICULAR: ['LEFT', 'RIGHT',],
    },
    BOTTOM: 'b',
    COORD_MOD: {
      [Shared.FLIPMODE_STANDARD]: [{ xMod: 0, yMod: 1, },],
      [Shared.FLIPMODE_REVERSED]: [{ xMod: 0, yMod: 1, },],
    },
    PERPENDICULAR: ['RIGHT', 'LEFT',],
  };

  static MOD_STRING = {
    REGISTRATION_MODE: {
      BEFORE: 'before',
      AFTER: 'after',
      REPLACE: 'replace',
      NEW_METHOD: 'newMethod',
    },
    RESERVED_MOD_NAME_LIST: ['base'],
    MOD_DIR_LOCATION: {
      EDITOR_MAP: '../../../mod/',
    },
    BASE_TAG_NAME: 'mod',
    ABOUT_XML: {
      FILE_NAME: 'about.xml',
      NAME: 'name',
      VERSION: 'version',
      AUTHOR: 'author',
      HOOKS: 'hooks',
      HOOK: 'hook',
    },
    SETTING_XML: {
      FILE_NAME: 'setting.xml',
      LIST: 'list',
      LIST_ENTRY: 'listEntry',
      MOD_NAME: 'modName',
      DIR_NAME: 'dirName',
    },
    MOD_DATA_TYPE: {
      ZOOM_DATA: 'zoomData',
      REGION: 'region',
      TEMPLATE_MAP: 'templateMap',
      TILE: 'tile',
      FEATURE: 'feature',
    },
    PREMADE_REGION_NAME: {
      ENTIRE_BIOME: 'entireBiome',
      DEPLOY_LEFT: 'deployLeft',
      DEPLOY_RIGHT: 'deployRight',
    },
    PATCH_SHAPE: {
      RANDOM: 'random',
      BLOB: 'blob',
      RECTILINEAR: 'rectilinear',
      RECTANGLE: 'rectangle',
    },
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
    const clampedValue = Math.min(input.max, Math.max(input.min, input.value));
    return { clampedValue, };
  }

  /**
   * Creates an HTML element with optional id, class, and parent attachment.
   * Defaults to a <div> if no tag is provided.
   *
   * @param {string} [input.tag='div'] - The tag name of the element to create (e.g., 'div', 'span').
   * @param {string} [input.id] - Optional ID to assign to the element.
   * @param {HTMLElement} [input.parent] - Optional parent element to append the new element to.
   * @param {string} [input.class] - Optional CSS class(es) to assign to the element.
   * @returns {HTMLElement} The newly created HTML element.
   */
  static createHTMLComponent(input) {
    if (!input.tag) {
      input.tag = 'div';
    }
    const component = document.createElement(input.tag);
    if (input.id) {
      component.id = input.id;
    }
    if (input.parent) {
      input.parent.appendChild(component);
    }
    if (input.class) {
      component.className = input.class;
    }
    if (input.type) {
      component.type = input.type;
    }
    return { component, };
  }
}