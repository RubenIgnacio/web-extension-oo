function NotificationManager(id, notifiOptions) {
  if (!(this instanceof NotificationManager))
    return new NotificationManager(id, notifiOptions);

  this.browserNotifications = NotificationManager.browserNotifications;
  if (!this.browserNotifications)
    throw new Error("Your browser does not support notifications.");

  var definePropertyWithDefaultValue = (function(propName, defaultPropName, objDefault) {
    var __propName__ = "__" + propName + "__";
    if (!objDefault) objDefault = this;

    Object.defineProperty(this, __propName__, {writable: true});
    this.accessorProperty(propName, {
      configurable: false,
      get: function() {
        return this[__propName__] || objDefault[defaultPropName];
      },
      set: function(newVal) {
        this[__propName__] = newVal || objDefault[defaultPropName];
      }
    });
  }).bind(this);

  definePropertyWithDefaultValue("id", "title");
  definePropertyWithDefaultValue("iconUrl", "defaultIconUrl");
  definePropertyWithDefaultValue("type", "defaultType", NotificationManager);
  definePropertyWithDefaultValue("defaultIconUrl", "defaultIconUrl", NotificationManager);

  if (typeof(notifiOptions) !== "object") notifiOptions = {};

  for (let opt in notifiOptions)
    this[opt] = notifiOptions[opt];

  this.id = id;
}

NotificationManager.browserNotifications = (window.browser || window.chrome).notifications;

NotificationManager.TemplateType = NotificationManager.browserNotifications.TemplateType;

NotificationManager.PermissionLevel = NotificationManager.browserNotifications.PermissionLevel;

NotificationManager.defaultType = NotificationManager.TemplateType.BASIC;

NotificationManager.getNotificationMethod = function(name) {
  var notificationMethod = NotificationManager.browserNotifications[name];
  if (!notificationMethod)
    throw new Error("Your browser does not support 'Notifications." + name + "()'.");
  else if (typeof(notificationMethod) !== "function")
    throw new Error("'Notifications." + name + "' is not a function");

  return function() {
    if (window.browser)
      return notificationMethod.apply(null, arguments);
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
        notificationMethod.apply(null, args);
      });
    }
  };
};

NotificationManager.getOptionsOf = function(type) {
  var listOptions = [];
  var types = Object.values(NotificationManager.TemplateType);

  if (types.includes(type)) {
    var templateType = NotificationManager.TemplateType;
    listOptions = ["title", "message", "iconUrl", "contextMessage", "buttons"];

    switch (type) {
      case templateType.IMAGE:
        listOptions.push("imageUrl");
        break;
      case templateType.LIST:
        listOptions.push("items");
        break;
      case templateType.PROGRESS:
        listOptions.push("progress");
        break;
    }
  }
  return listOptions;
};

["getAll", "getPermissionLevel"].forEach(function(methodName) {
  NotificationManager[methodName] = NotificationManager.getNotificationMethod(methodName);
});

NotificationManager.addEventListener = function(type, listener) {
  type = "on" + type[0].toUpperCase() + type.substring(1);
  var event = NotificationManager.browserNotifications[type];
  if (!event)
    throw new Error("Your browser does not support '" + type + "' event.");
  event.addListener(listener);
};

NotificationManager.prototype.accessorProperty = function(propName, descriptor) {
  if (!descriptor) descriptor = {writable: true};

  if (descriptor.enumerable == undefined)
    descriptor.enumerable = true;

  if (descriptor.configurable == undefined)
    descriptor.configurable = true;

  Object.defineProperty(this, propName, descriptor);
};

NotificationManager.prototype.getNotificationMethod = function(name) {
  var notificationMethod = NotificationManager.getNotificationMethod(name);
  var notificationId = this.id;
  return function() {
    return notificationMethod.apply(null, arguments).catch(function(error) {
      error.notificationId = notificationId;
      throw error;
    });
  };
};

NotificationManager.prototype.display = function(options, action = "create") {
  if (action !== "create" && action !== "update")
    throw new Error("The expected values were 'create' or 'update'.");

  var listOpts = NotificationManager.getOptionsOf(this.type);
  var notifiOptions = {type: this.type};
  var thisNotifi = this;

  // cambia o agrega las propiedades que esten en 'listOpts'
  for (let opt in options) {
    if (listOpts.includes(opt))
      this[opt] = options[opt];
  }
  // agrega las opciones validas para la notificación
  listOpts.forEach(function(opt) {
    if (thisNotifi[opt] != undefined)
      notifiOptions[opt] = thisNotifi[opt];
  });
  // verifica si hay una notificación anterior que aun no haya sido limpiada
  if (this.clearedId) window.clearTimeout(this.clearedId);
  return new Promise(function(resolve, reject) {
    thisNotifi.getNotificationMethod(action)(thisNotifi.id, notifiOptions).then(function(notifiIdOrWasUpdated) {
      resolve(notifiIdOrWasUpdated);
      // limpia la notificación despues de 4 segundos
      thisNotifi.clearedId = window.setTimeout(function() {
        thisNotifi.clear();
      }, 4E3);
    }, reject);
  });
};

NotificationManager.prototype.clear = function() {
  var thisNotifi = this;
  this.getNotificationMethod("clear")(this.id).then(function(wasCleared) {
    thisNotifi.clearedId = null;
    return wasCleared;
  });
};