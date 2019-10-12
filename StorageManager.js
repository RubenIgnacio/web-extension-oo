function StorageManager(defaultStorageArea) {
  if (!(this instanceof StorageManager))
    return new StorageManager(defaultStorageArea);

  this.browserStorage = WebExtension.getAPI('storage');
  this.setDefaultStorageArea(defaultStorageArea);
}

StorageManager.browserStorage = WebExtension.getAPI('storage', true);

StorageManager.StorageArea = {LOCAL: "local", SYNC: "sync", MANAGED: "managed"};

StorageManager.addEventListener = function(type, listener) {
  let event = WebExtension.getAPIEvent(StorageManager.browserStorage, type);
  event.addListener(listener);
};

StorageManager.prototype.addEventListener = StorageManager.addEventListener;

StorageManager.prototype.setDefaultStorageArea = function(newDefaultStorageArea = StorageManager.StorageArea.LOCAL) {
  this.getStorage(newDefaultStorageArea);
  this.defaultStorageArea = newDefaultStorageArea;
};

StorageManager.prototype.getStorage = function(storageArea) {
  if (storageArea == null) storageArea = this.defaultStorageArea;

  var storageAreas = Object.values(StorageManager.StorageArea);
  if (!storageAreas.includes(storageArea))
    throw new TypeError("Storage area '" + storageArea + "' is invalid.");

  var storage = this.browserStorage[storageArea];
  if (!storage)
    throw new Error("Your browser does not support 'Storage." + storageArea + "'.");
  return storage;
};

StorageManager.prototype.getStorageMethod = function(name, storageArea) {
  var storage = this.getStorage(storageArea);
  var storageMethod = storage[name].bind(storage);

  if (!storageMethod)
    throw new Error("Your browser does not support 'Storage." + storageArea + "." + name + "()'.");
  else if (typeof(storageMethod) !== "function")
    throw new TypeError("'Storage." + name + "' is not a function");

  return WebExtension.apiMethodAsPromise(storageMethod);
};

["get", "getBytesInUse", "set", "remove"].forEach(function(methodName) {
  StorageManager.prototype[methodName] = function(keysItems, storageArea) {
    return this.getStorageMethod(methodName, storageArea)(keysItems);
  };
});

StorageManager.prototype.clear = function(storageArea) {
  return this.getStorageMethod("clear", storageArea)();
};
