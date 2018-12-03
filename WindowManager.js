function WindowManager(windowInfo) {
  if (!(this instanceof WindowManager))
    return new WindowManager(windowInfo);

  Object.defineProperty(this, "browserWindows", {
    enumerable: true,
    value: WindowManager.browserWindows
  });
  var windowProps = [
    "alwaysOnTop",
    "focused",
    "height",
    "id",
    "incognito",
    "left",
    "sessionId",
    "state",
    "tabs",
    "title",
    "top",
    "type",
    "width"
  ];
  windowProps.forEach(function(prop) {
    if (windowInfo[prop] !== undefined)
      this[prop] = windowInfo[prop];
  }, this);
}

Object.defineProperty(WindowManager, "browserWindows", {
  enumerable: true,
  value: (window.browser || window.chrome).windows
});

WindowManager.WindowType = WindowManager.browserWindows.WindowType;

WindowManager.WindowState = WindowManager.browserWindows.WindowState;

WindowManager.CreateType = WindowManager.browserWindows.CreateType;

WindowManager.getWindowMethod = function(name) {
  var windowMethod = WindowManager.browserWindows[name];
  if (!windowMethod)
    throw new Error("Your browser does not support 'Windows." + name + "()'.");
  else if (typeof(windowMethod) !== "function")
    throw new Error("'Windows." + name + "' is not a function");
  return function() {
    if (window.browser)
      return windowMethod.apply(null, arguments);
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
        windowMethod.apply(null, args);
      });
    }
  };
};

WindowManager.open = function(createData) {
  return new Promise(function(resolve, reject) {
    WindowManager.getWindowMethod("create")(createData).then(function(windowInfo) {
      resolve(new WindowManager(windowInfo));
    }, reject);
  });
};

WindowManager.getAll = function(getInfo) {
  return new Promise(function(resolve, reject) {
    WindowManager.getWindowMethod("getAll")(getInfo).then(function(windowInfoArray) {
      for (let i = 0; i < windowInfoArray.length; i++)
        windowInfoArray[i] = new WindowManager(windowInfoArray[i]);

      resolve(windowInfoArray);
    }, reject);
  });
};

WindowManager.get = function(windowId, getInfo) {
  return new Promise(function(resolve, reject) {
    WindowManager.getWindowMethod("get")(windowId, getInfo).then(function(windowInfo) {
      resolve(new WindowManager(windowInfo));
    }, reject);
  });
};

["getCurrent", "getLastFocused"].forEach(function(methodName) {
  WindowManager[methodName] = function(getInfo) {
    return new Promise(function(resolve, reject) {
      WindowManager.getWindowMethod(methodName)(getInfo).then(function(windowInfo) {
        resolve(new WindowManager(windowInfo));
      }, reject);
    });
  };
});

WindowManager.prototype.getWindowMethod = WindowManager.getWindowMethod;

WindowManager.prototype.update = function(updateInfo) {
  var thisWindow = this;
  return new Promise(function(resolve, reject) {
    thisWindow.getWindowMethod("update")(thisWindow.id, updateInfo).then(function(windowInfo) {
      for (let key in updateInfo) {
        if (key !== "drawAttention" && key !== "titlePreface")
          thisWindow[key] = updateInfo[key];
      }
      resolve(thisWindow);
    }, reject);
  });
};

WindowManager.prototype.close = function() {
  return this.getWindowMethod("remove")(this.id);
};