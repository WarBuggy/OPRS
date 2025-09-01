class Shared {
  static STORAGE_KEYS = {
    LANGUAGE: 'language',
    ZOOM_LEVEL_MAP_EDITOR_PARCHMENT: 'mapEditorZoomLevel',
  };

  static EMITTER_SIGNAL = {
    PARCHMENT_PANNED: 'parchment_panned',
    PARCHMENT_ZOOMED: 'parchment_zoomed',
    MINI_MAP_CLICKED: 'miniMap_clicked',
    OVERLAY_VISIBLE: 'overlay_visible',
    OVERLAY_CLOSED: 'overlay_closed',
  };

  static HEX_DIRECTION = {
    LEFT: "l",
    RIGHT: "r",
    TOP_LEFT: "tl",
    TOP_RIGHT: "tr",
    BOTTOM_LEFT: "bl",
    BOTTOM_RIGHT: "br",
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
      REGION: 'region',
      BIOME: 'biome',
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
    return Math.min(input.max, Math.max(input.min, input.value));
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
    const comp = document.createElement(input.tag);
    if (input.id) {
      comp.id = input.id;
    }
    if (input.parent) {
      input.parent.appendChild(comp);
    }
    if (input.class) {
      comp.className = input.class;
    }
    if (input.type) {
      comp.type = input.type;
    }
    return comp;
  }
}