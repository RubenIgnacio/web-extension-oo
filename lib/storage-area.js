import { ClassExtensionBase } from './extension-api';

export default class StorageArea extends ClassExtensionBase {
  static metadata = {
    get: {
      minArgs: 0,
      maxArgs: 1
    },
    getBytesInUse: {
      minArgs: 0,
      maxArgs: 1
    },
    set: {
      minArgs: 1,
      maxArgs: 1
    },
    remove: {
      minArgs: 1,
      maxArgs: 1
    },
    clear: {
      minArgs: 0,
      maxArgs: 0
    }
  };
  static #instances = new Map();
  static #isInternal = false;
  static apiName = 'storage';

  static StorageAreaType = {
    LOCAL: 'local',
    SYNC: 'sync',
    MANAGED: 'managed'
  };

  #storageArea;
  areaName = null;

  constructor(areaName) {
    super();

    if (!StorageArea.#isInternal) {
      throw new TypeError("You must use the 'getStorage()' method to get an instance of this class.");
    }

    if (!areaName) {
      this.areaName = StorageArea.StorageAreaType.LOCAL;
    } else {
      this.#checkStorageAreaType(areaName);

      this.areaName = areaName;
    }

    const storageArea = StorageArea.api[this.areaName];

    if (!storageArea) {
      throw new Error(`Your browser does not support '${this.areaName}' storage area.`);
    }

    this.#storageArea = storageArea;
  }

  static getStorage(areaName) {
    if (this.#instances.has(areaName)) {
      return this.#instances.get(areaName);
    }

    try {
      this.#isInternal = true;
      const storageArea = new this(areaName);

      this.#instances.set(areaName, storageArea);

      return storageArea;
    } finally {
      this.#isInternal = false;
    }
  }

  #checkStorageAreaType(areaName) {
    const names = Object.values(StorageArea.StorageAreaType);

    if (!names.includes(areaName)) {
      throw new TypeError(`Storage area '${areaName}' is invalid.`);
    }
  }

  addEventListener(type, listener) {
    StorageArea.addEventListener(type, (changes, areaName) => {
      if (areaName !== this.areaName) return;

      listener(changes);
    });
  }

  getAPIMethod(name) {
    const apiMethod = this.#storageArea[name];

    if (!apiMethod) {
      throw new Error(`Your browser does not support 'StorageArea.${this.areaName}.${name}()'.`);
    } else if (typeof apiMethod !== 'function') {
      throw new TypeError(`'StorageArea.${name}' is not a function`);
    }

    return apiMethod.bind(this.#storageArea);
  }

  get(keysItems) {
    return this.getAPIMethod('get')(keysItems);
  }

  getBytesInUse(keysItems) {
    return this.getAPIMethod('getBytesInUse')(keysItems);
  }

  set(keysItems) {
    return this.getAPIMethod('set')(keysItems);
  }

  remove(keysItems) {
    return this.getAPIMethod('remove')(keysItems);
  }

  clear() {
    return this.getAPIMethod('clear')();
  }
}
