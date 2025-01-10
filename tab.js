import { wrapAPI, ClassExtensionBase } from './extension-api';

export default class Tab extends ClassExtensionBase {
  static metadata = {
    captureVisibleTab: {
      minArgs: 0,
      maxArgs: 2
    },
    create: {
      minArgs: 1,
      maxArgs: 1
    },
    detectLanguage: {
      minArgs: 0,
      maxArgs: 1
    },
    discard: {
      minArgs: 0,
      maxArgs: 1
    },
    duplicate: {
      minArgs: 1,
      maxArgs: 1
    },
    executeScript: {
      minArgs: 1,
      maxArgs: 2
    },
    get: {
      minArgs: 1,
      maxArgs: 1
    },
    getCurrent: {
      minArgs: 0,
      maxArgs: 0
    },
    getZoom: {
      minArgs: 0,
      maxArgs: 1
    },
    getZoomSettings: {
      minArgs: 0,
      maxArgs: 1
    },
    goBack: {
      minArgs: 0,
      maxArgs: 1
    },
    goForward: {
      minArgs: 0,
      maxArgs: 1
    },
    highlight: {
      minArgs: 1,
      maxArgs: 1
    },
    insertCSS: {
      minArgs: 1,
      maxArgs: 2
    },
    move: {
      minArgs: 2,
      maxArgs: 2
    },
    query: {
      minArgs: 1,
      maxArgs: 1
    },
    reload: {
      minArgs: 0,
      maxArgs: 2
    },
    remove: {
      minArgs: 1,
      maxArgs: 1
    },
    removeCSS: {
      minArgs: 1,
      maxArgs: 2
    },
    sendMessage: {
      minArgs: 2,
      maxArgs: 3
    },
    setZoom: {
      minArgs: 1,
      maxArgs: 2
    },
    setZoomSettings: {
      minArgs: 1,
      maxArgs: 2
    },
    update: {
      minArgs: 1,
      maxArgs: 2
    }
  };
  static apiName = 'tabs';
  static fields = [
    'active',
    'audible',
    'autoDiscardable',
    'discarded',
    'favIconUrl',
    'frozen',
    'groupId',
    'height',
    'highlighted',
    'id',
    'incognito',
    'index',
    'lastAccessed',
    'mutedInfo',
    'openerTabId',
    'pendingUrl',
    'pinned',
    'sessionId',
    'status',
    'title',
    'url',
    'width',
    'windowId'
  ];

  static MutedInfoReason = this.api.MutedInfoReason;
  static TabStatus = this.api.TabStatus;
  static WindowType = this.api.WindowType;
  static ZoomSettingsMode = this.api.ZoomSettingsMode;
  static ZoomSettingsScope = this.api.ZoomSettingsScope;
  static TAB_ID_NONE = this.api.TAB_ID_NONE;

  constructor(tabInfo) {
    super();

    if (tabInfo.url) {
      tabInfo.url = new URL(tabInfo.url);
    }

    this.assignFields(tabInfo);
  }

  static open(createProperties) {
    const apiMethod = this.getAPIMethod('create');

    return apiMethod(createProperties).then((tabInfo) => new this(tabInfo));
  }

  static get(tabId) {
    const apiMethod = this.getAPIMethod('get');

    return apiMethod(tabId).then((tabInfo) => new this(tabInfo));
  }

  static getCurrent() {
    const apiMethod = this.getAPIMethod('getCurrent');

    return apiMethod().then((tabInfo) => new this(tabInfo));
  }

  static query(queryInfo = {}) {
    const apiMethod = this.getAPIMethod('query');

    return apiMethod(queryInfo).then((tabs) =>
      tabs.map((tab) => new this(tab))
    );
  }

  static close(tabIds) {
    return this.getAPIMethod('remove')(tabIds);
  }

  executeScript(details) {
    return this.getAPIMethod('executeScript')(this.id, details);
  }

  insertCSS(details) {
    return this.getAPIMethod('insertCSS')(this.id, details);
  }

  removeCSS(details) {
    return this.getAPIMethod('removeCSS')(this.id, details);
  }

  close() {
    return this.constructor.close(this.id);
  }

  update(updateProperties) {
    const apiMethod = this.getAPIMethod('update');

    return apiMethod(this.id, updateProperties).then(
      (tabInfo) => Object.assign(this, tabInfo)
    );
  }

  getWindow(getInfo) {
    return wrapAPI('windows').get(this.windowId, getInfo);
  }
}
