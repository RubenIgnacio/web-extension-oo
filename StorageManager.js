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

StorageManager.addEventListener = function(type, listener) {
  type = "on" + type[0].toUpperCase() + type.substring(1);
  var event = StorageManager.browserStorage[type];
  if (!event)
    throw new Error("Your browser does not support '" + type + "' event.");
  event.addListener(listener);
};

StorageManager.prototype.addEventListener = StorageManager.addEventListener;

StorageManager.prototype.setDefaultStorageArea = function(newDefaultStorageArea = StorageManager.StorageArea.LOCAL) {
  this.getStorage(newDefaultStorageArea);
  this.defaultStorageArea = newDefaultStorageArea;
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
  var storage = this.getStorage(storageArea);
  var storageMethod = storage[name].bind(storage);

  if (!storageMethod)
    throw new Error("Your browser does not support 'Storage." + storageArea + "." + name + "()'.");
  else if (typeof(storageMethod) !== "function")
    throw new Error("'Storage." + name + "' is not a function");

  if (window.browser)
    return storageMethod;
  else {
    return function() {
      var args = Array.from(arguments);
      return new Promise(function(resolve, reject) {
        args.push(function(value) {
          var runtimeError = chrome.runtime.lastError;
          if (runtimeError)
            reject(runtimeError);
          else
            resolve(value);
        });
        storageMethod.apply(null, args);
      });
    };
  }
};

for (let methodName of ["get", "getBytesInUse", "set", "remove"]) {
  StorageManager.prototype[methodName] = function(keysItems, storageArea) {
    return this.getStorageMethod(methodName, storageArea)(keysItems);
  };
}

StorageManager.prototype.clear = function(storageArea) {
  return this.getStorageMethod("clear", storageArea)();
};