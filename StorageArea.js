function StorageArea(defaultStorageAreaType) {
  if (!(this instanceof StorageArea)) {
    return new StorageArea(defaultStorageAreaType);
  }

  this.browserStorage = StorageArea.browserStorage;

  this.setDefaultStorageAreaType(defaultStorageAreaType);
}

StorageArea.browserStorage = WebExtension.getAPI('storage');

StorageArea.StorageAreaType = {
  LOCAL: 'local',
  SYNC: 'sync',
  MANAGED: 'managed'
};

StorageArea.addEventListener = function(type, listener) {
  const event = WebExtension.getAPIEvent(StorageArea.browserStorage, type);

  event.addListener(listener);
};

StorageArea.prototype.addEventListener = StorageArea.addEventListener;

StorageArea.prototype.setDefaultStorageAreaType = function(newDefaultStorageAreaType) {
  if (newDefaultStorageAreaType == null) {
    newDefaultStorageAreaType = StorageArea.StorageAreaType.LOCAL;
  }

  this.getStorage(newDefaultStorageAreaType);

  this.defaultStorageAreaType = newDefaultStorageAreaType;
};

StorageArea.prototype.getStorage = function(storageAreaType) {
  if (storageAreaType == null) {
    storageAreaType = this.defaultStorageAreaType;
  }

  const storageAreaTypes = Object.values(StorageArea.StorageAreaType);

  if (!storageAreaTypes.includes(storageAreaType)) {
    throw new TypeError(`Storage area '${storageAreaType}' is invalid.`);
  }

  const storage = this.browserStorage[storageAreaType];

  if (!storage) {
    throw new Error('Your browser does not support 'Storage.${storageAreaType}'.');
  }
  return storage;
};

StorageArea.prototype.getStorageMethod = function(name, storageAreaType) {
  const storage = this.getStorage(storageAreaType);
  const storageMethod = storage[name].bind(storage);

  if (!storageMethod) {
    throw new Error(`Your browser does not support 'Storage.${storageAreaType}.${name}()'.`);
  } else if (typeof(storageMethod) !== 'function') {
    throw new TypeError(`'Storage.${name}' is not a function`);
  }
  return WebExtension.apiMethodAsPromise(storageMethod);
};

['get', 'getBytesInUse', 'set', 'remove'].forEach(function(methodName) {
  StorageArea.prototype[methodName] = function(keysItems, storageAreaType) {
    return this.getStorageMethod(methodName, storageAreaType)(keysItems);
  };
});

StorageArea.prototype.clear = function(storageAreaType) {
  return this.getStorageMethod('clear', storageAreaType)();
};
