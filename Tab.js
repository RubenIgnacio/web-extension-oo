function Tab(tabInfo) {
  if (!(this instanceof Tab)) {
    return new Tab(tabInfo);
  }

  this.browserTabs = Tab.browserTabs;

  if (tabInfo.url) {
    tabInfo.url = new URL(tabInfo.url);
  }

  Object.assign(this, tabInfo);
}

Tab.browserTabs = WebExtension.getAPI('tabs');

Tab.MutedInfoReason = Tab.browserTabs.MutedInfoReason;

Tab.TabStatus = Tab.browserTabs.TabStatus;

Tab.WindowType = Tab.browserTabs.WindowType;

Tab.ZoomSettingsMode = Tab.browserTabs.ZoomSettingsMode;

Tab.ZoomSettingsScope = Tab.browserTabs.ZoomSettingsScope;

Tab.TAB_ID_NONE = Tab.browserTabs.TAB_ID_NONE;

Tab.getTabMethod = function(name) {
  const tabMethod = Tab.browserTabs[name];

  if (!tabMethod) {
    throw new Error(`Your browser does not support 'Tabs.${name}()'.`);
  } else if (typeof(tabMethod) !== 'function') {
    throw new TypeError(`'Tabs.${name}' is not a function`);
  }
  return WebExtension.apiMethodAsPromise(tabMethod);
};

Tab.open = function(createProperties) {
  return Tab.getTabMethod('create')(createProperties).then(
    (tabInfo) => new Tab(tabInfo)
  );
};

Tab.get = function(tabId) {
  return Tab.getTabMethod('get')(tabId).then((tabInfo) => new Tab(tabInfo));
};

Tab.getCurrent = function() {
  return Tab.getTabMethod('getCurrent')().then((tabInfo) => new Tab(tabInfo));
};

Tab.query = function(queryInfo = {}) {
  return Tab.getTabMethod('query')(queryInfo).then(
    (tabs) => tabs.map((tab) => new Tab(tab))
  );
};

Tab.close = function(tabIds) {
  return Tab.getTabMethod('remove')(tabIds);
};

Tab.addEventListener = function(type, listener) {
  const event = WebExtension.getAPIEvent(Tab.browserTabs, type);

  event.addListener(listener);
};

Tab.prototype.getTabMethod = Tab.getTabMethod;

['executeScript', 'insertCSS', 'removeCSS'].forEach(function(methodName) {
  Tab.prototype[methodName] = function(details) {
    return this.getTabMethod(methodName)(this.id, details);
  };
});

Tab.prototype.close = function() {
  return Tab.close(this.id);
};

Tab.prototype.update = function(updateProperties) {
  return this.getTabMethod('update')(this.id, updateProperties).then(
    (tabInfo) => Object.assign(this, tabInfo)
  );
};

Tab.prototype.getWindow = function(getInfo) {
  const windowId = this.windowId;

  if (self.WindowManager) return WindowManager.get(windowId, getInfo);

  const windowMethod = WebExtension.getAPI('windows').get;

  return WebExtension.apiMethodAsPromise(windowMethod)(windowId, getInfo);
};
