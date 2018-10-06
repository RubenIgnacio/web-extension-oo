function StorageManager(defaultStorageArea) {
  if (!(this instanceof StorageManager))
    return new StorageManager(defaultStorageArea);

  this.browserStorage = StorageManager.browserStorage;
  if (!this.browserStorage)
    throw new Error("Your browser does not support storage.");
  this.setDefaultStorageArea(defaultStorageArea);
}

StorageManager.browserStorage = (window.browser || window.chrome).storage;

StorageManager.StorageArea = {LOCAL: "local", SYNC: "sync", MANAGED: "managed"};

StorageManager.prototype.setDefaultStorageArea = function(newDefaultStorageArea = StorageManager.StorageArea.LOCAL) {
  var storageAreas = Object.values(StorageManager.StorageArea);
  if (!storageAreas.includes(newDefaultStorageArea))
    throw new Error("Storage area '" + newDefaultStorageArea + "' is invalid.");

  if (!this.browserStorage[newDefaultStorageArea])
    throw new Error("Your browser does not support 'Storage." + newDefaultStorageArea + "'.");
  this.defaultStorageArea = newDefaultStorageArea;
  this.getStorage();
};

StorageManager.prototype.getStorage = function(storageArea = this.defaultStorageArea) {
  var storageAreas = Object.values(StorageManager.StorageArea);
  if (!storageAreas.includes(storageArea))
    throw new Error("Storage area '" + storageArea + "' is invalid.");

  var storage = this.browserStorage[storageArea];
  if (!storage)
    throw new Error("Your browser does not support 'Storage." + storageArea + "'.");
  return storage;
};

StorageManager.prototype.getStorageMethod = function(name, storageArea = this.defaultStorageArea) {
  var storageMethod = this.getStorage(storageArea)[name];
  if (!storageMethod)
    throw new Error("Your browser does not support 'Storage." + storageArea + "." + name + "()'.");
  return function() {
    if (window.browser)
      return storageMethod.apply(null, arguments);
    else {
      var args = Array.prototype.slice.call(arguments);
      return new Promise(function(resolve, reject) {
        function callback() {
          var runtimeError = chrome.runtime.lastError;
          if (runtimeError)
            reject(runtimeError);
          else
            resolve.apply(null, arguments);
        }
        args.push(callback);
        storageMethod.apply(null, args);
      });
    }
  };
};

["get", "getBytesInUse", "set", "remove"].forEach(function(methodName) {
  StorageManager.prototype[methodName] = function(keysItems, storageArea) {
    return this.getStorageMethod(methodName, storageArea)(keysItems);
  };
});

StorageManager.prototype.clear = function(storageArea) {
  return this.getStorageMethod("clear", storageArea)();
};