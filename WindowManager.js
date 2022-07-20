function WindowManager(windowInfo) {
  if (!(this instanceof WindowManager)) {
    return new WindowManager(windowInfo);
  }

  this.browserWindows = WindowManager.browserWindows;

  if (windowInfo.tabs && self.Tab) {
    windowInfo.tabs = windowInfo.tabs.map((tab) => new Tab(tab));
  }
  Object.assign(this, windowInfo);
}

WindowManager.browserWindows = WebExtension.getAPI('windows');

WindowManager.WindowType = WindowManager.browserWindows.WindowType;

WindowManager.WindowState = WindowManager.browserWindows.WindowState;

WindowManager.CreateType = WindowManager.browserWindows.CreateType;

WindowManager.WINDOW_ID_NONE = WindowManager.browserWindows.WINDOW_ID_NONE;

WindowManager.WINDOW_ID_CURRENT = WindowManager.browserWindows.WINDOW_ID_CURRENT;

WindowManager.getWindowMethod = function(name) {
  const windowMethod = WindowManager.browserWindows[name];

  if (!windowMethod) {
    throw new Error(`Your browser does not support 'Windows.${name}()'.`);
  } else if (typeof(windowMethod) !== 'function') {
    throw new TypeError(`'Windows.${name}' is not a function`);
  }
  return WebExtension.apiMethodAsPromise(windowMethod);
};

WindowManager.open = function(createData) {
  return WindowManager.getWindowMethod('create')(createData).then(
    (windowInfo) => new WindowManager(windowInfo)
  );
};

WindowManager.getAll = function(getInfo) {
  return WindowManager.getWindowMethod('getAll')(getInfo).then(function(windowInfoArray) {
    return windowInfoArray.map((windowInfo) => new WindowManager(windowInfo));
  });
};

WindowManager.get = function(windowId, getInfo) {
  return WindowManager.getWindowMethod('get')(windowId, getInfo).then(
    (windowInfo) => new WindowManager(windowInfo)
  );
};

['getCurrent', 'getLastFocused'].forEach(function(methodName) {
  WindowManager[methodName] = function(getInfo) {
    return WindowManager.getWindowMethod(methodName)(getInfo).then(
      (windowInfo) => new WindowManager(windowInfo)
    );
  };
});

WindowManager.addEventListener = function(type, listener) {
  const event = WebExtension.getAPIEvent(WindowManager.browserWindows, type);

  event.addListener(listener);
};

WindowManager.prototype.getWindowMethod = WindowManager.getWindowMethod;

WindowManager.prototype.update = function(updateInfo) {
  return this.getWindowMethod('update')(this.id, updateInfo).then(() => {
    for (const key in updateInfo) {
      if (key !== 'drawAttention' && key !== 'titlePreface') {
        this[key] = updateInfo[key];
      }
    }
    return this;
  });
};

WindowManager.prototype.close = function() {
  return this.getWindowMethod('remove')(this.id);
};

WindowManager.prototype.openTab = function(createProperties = {}) {
  createProperties.windowId = this.id;

  if (self.Tab) return Tab.open(createProperties);

  const tabMethod = WebExtension.getAPI('tabs').create;

  return WebExtension.apiMethodAsPromise(tabMethod)(createProperties);
};
