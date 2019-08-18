function Tab(tabInfo) {
  if (!(this instanceof Tab))
    return new Tab(tabInfo);

  this.browserTabs = Tab.browserTabs;
  if (!this.browserTabs)
    throw new Error("Your browser does not support tabs.");

  if (tabInfo.url)
    tabInfo.url = new URL(tabInfo.url);

  Object.assign(this, tabInfo);
}

Tab.browserTabs = (window.browser || window.chrome).tabs;

Tab.MutedInfoReason = Tab.browserTabs.MutedInfoReason;

Tab.MutedInfo = Tab.browserTabs.MutedInfo;

Tab.TabStatus = Tab.browserTabs.TabStatus;

Tab.WindowType = Tab.browserTabs.WindowType;

Tab.ZoomSettingsMode = Tab.browserTabs.ZoomSettingsMode;

Tab.ZoomSettingsScope = Tab.browserTabs.ZoomSettingsScope;

Tab.ZoomSettings = Tab.browserTabs.ZoomSettings;

Tab.TAB_ID_NONE = Tab.browserTabs.TAB_ID_NONE;

Tab.getTabMethod = function(name) {
  var tabMethod = Tab.browserTabs[name];

  if (!tabMethod)
    throw new Error("Your browser does not support 'Tabs." + name + "()'.");
  else if (typeof(tabMethod) !== "function")
    throw new TypeError("'Tabs." + name + "' is not a function");

  if (window.browser)
    return tabMethod;
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
        tabMethod.apply(null, args);
      });
    };
  }
};

Tab.open = function(createProperties) {
  return Tab.getTabMethod("create")(createProperties).then((tabInfo) => new Tab(tabInfo));
};

Tab.get = function(tabId) {
  return Tab.getTabMethod("get")(tabId).then((tabInfo) => new Tab(tabInfo));
};

Tab.getCurrent = function() {
  return Tab.getTabMethod("getCurrent")().then((tabInfo) => new Tab(tabInfo));
};

Tab.close = function(tabIds) {
  return this.getTabMethod("remove")(tabIds);
};

Tab.addEventListener = function(type, listener) {
  type = "on" + type[0].toUpperCase() + type.substring(1);
  var event = Tab.browserTabs[type];
  if (!event)
    throw new Error("Your browser does not support '" + type + "' event.");
  event.addListener(listener);
};

Tab.prototype.getTabMethod = Tab.getTabMethod;

["executeScript", "insertCSS"].forEach(function(methodName) {
  Tab.prototype[methodName] = function(details) {
    return this.getTabMethod(methodName)(this.id, details);
  };
});

Tab.prototype.close = function() {
  return this.getTabMethod("remove")(this.id);
};

Tab.prototype.update = function(updateProperties) {
  var thisTab = this;
  return this.getTabMethod("update")(this.id, updateProperties).then((tabInfo) => Object.assign(thisTab, tabInfo));
};

Tab.prototype.getWindow = function(getInfo) {
  var windowId = this.windowId;

  if (window.WindowManager)
    return WindowManager.get(windowId, getInfo);
  else if (window.browser)
    return browser.windows.get(windowId, getInfo);
  else {
    return new Promise(function(resolve, reject) {
      chrome.windows.get(windowId, getInfo, function(windowInfo) {
        var runtimeError = chrome.runtime.lastError;
        if (runtimeError)
          reject(runtimeError);
        else
          resolve(windowInfo);
      });
    });
  }
};
