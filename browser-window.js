import { wrapAPI, ClassExtensionBase } from './extension-api';

export default class BrowserWindow extends ClassExtensionBase {
  static metadata = {
    create: {
      minArgs: 0,
      maxArgs: 1
    },
    getAll: {
      minArgs: 0,
      maxArgs: 1
    },
    get: {
      minArgs: 1,
      maxArgs: 2
    },
    getCurrent: {
      minArgs: 0,
      maxArgs: 1
    },
    getLastFocused: {
      minArgs: 0,
      maxArgs: 1
    },
    update: {
      minArgs: 2,
      maxArgs: 2
    },
    remove: {
      minArgs: 1,
      maxArgs: 1
    }
  };
  static apiName = 'windows';
  static fields = [
    'alwaysOnTop',
    'focused',
    'height',
    'id',
    'incognito',
    'left',
    'sessionId',
    'state',
    'tabs',
    'top',
    'type',
    'width'
  ];

  static WindowType = this.api.WindowType;
  static WindowState = this.api.WindowState;
  static CreateType = this.api.CreateType;
  static WINDOW_ID_NONE = this.api.WINDOW_ID_NONE;
  static WINDOW_ID_CURRENT = this.api.WINDOW_ID_CURRENT;

  constructor(windowInfo) {
    super();
    this.assignFields(windowInfo);
  }

  static open(createInfo) {
    const apiMethod = this.getAPIMethod('create');

    return apiMethod(createInfo).then(
      (windowInfo) => new this(windowInfo)
    );
  }

  static getAll(getInfo) {
    const apiMethod = this.getAPIMethod('getAll');

    return apiMethod(getInfo).then((windowInfoArray) => {
      return windowInfoArray.map((windowInfo) => new this(windowInfo));
    });
  }

  static get(windowId, getInfo) {
    const apiMethod = this.getAPIMethod('get');

    return apiMethod(windowId, getInfo).then(
      (windowInfo) => new this(windowInfo)
    );
  }

  static getCurrent(getInfo) {
    const apiMethod = this.getAPIMethod('getCurrent');

    return apiMethod(getInfo).then((windowInfo) => new this(windowInfo));
  }

  static getLastFocused(getInfo) {
    const apiMethod = this.getAPIMethod('getLastFocused');

    return apiMethod(getInfo).then((windowInfo) => new this(windowInfo));
  }

  getAPIMethod(name) {
    return this.constructor.getAPIMethod(name);
  }

  update(updateInfo) {
    const apiMethod = this.getAPIMethod('update');

    return apiMethod(this.id, updateInfo).then(() => {
      for (const key in updateInfo) {
        if (key !== 'drawAttention' && key !== 'titlePreface') {
          this[key] = updateInfo[key];
        }
      }

      return this;
    });
  }

  close() {
    return this.getAPIMethod('remove')(this.id);
  }

  openTab(createProperties = {}) {
    createProperties.windowId = this.id;

    return wrapAPI('tabs').create(createProperties);
  }
}
