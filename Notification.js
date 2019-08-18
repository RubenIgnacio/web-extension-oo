function Notification(notificationId, options) {
  if (!(this instanceof Notification))
    return new Notification(notificationId, options);

  this.browserNotifications = Notification.browserNotifications;
  if (!this.browserNotifications)
    throw new Error("Your browser does not support notifications.");

  if (!notificationId && (!options || !options.title))
    throw new Error("You have not specified an 'id' or 'title' for the notification, you must specify at least one of them.");

  function definePropertyWithDefaultValue(obj, prop, defaultProp) {
    var __prop__ = "__" + prop + "__";

    Object.defineProperty(obj, __prop__, {writable: true});
    Object.defineProperty(obj, prop, {
      enumerable: true,
      configurable: true,
      get: function() {
        if (this[__prop__] == undefined)
          return this[defaultProp];
        return this[__prop__];
      },
      set: function(newVal) {
        this[__prop__] = newVal;
      }
    });
  }

  definePropertyWithDefaultValue(this, "type", "defaultType");
  definePropertyWithDefaultValue(this, "id", "title");
  definePropertyWithDefaultValue(this, "iconUrl", "defaultIconUrl");

  if (options && typeof(options) === "object")
    Object.assign(this, options);

  if (this.defaultType == undefined)
    this.defaultType = Notification.defaultType;

  if (this.defaultIconUrl == undefined)
    this.defaultIconUrl = Notification.defaultIconUrl;

  this.id = notificationId;
  Object.defineProperty(this, "clearedId", {writable: true});
}

Notification.browserNotifications = (window.browser || window.chrome).notifications;

Notification.TemplateType = Notification.browserNotifications.TemplateType;

Notification.PermissionLevel = Notification.browserNotifications.PermissionLevel;

Notification.defaultType = Notification.TemplateType.BASIC;

Notification.getNotificationMethod = function(name) {
  var notificationMethod = Notification.browserNotifications[name];

  if (!notificationMethod)
    throw new Error("Your browser does not support 'Notifications." + name + "()'.");
  else if (typeof(notificationMethod) !== "function")
    throw new TypeError("'Notifications." + name + "' is not a function");

  if (window.browser)
    return notificationMethod;
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
        notificationMethod.apply(null, args);
      });
    };
  }
};

Notification.getOptionsOf = function(type) {
  var listOptions = [];
  var types = Object.values(Notification.TemplateType);

  if (types.includes(type)) {
    var templateType = Notification.TemplateType;
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
  Notification[methodName] = function() {
    return Notification.getNotificationMethod(methodName)();
  };
});

Notification.addEventListener = function(type, listener) {
  type = "on" + type[0].toUpperCase() + type.substring(1);
  var event = Notification.browserNotifications[type];
  if (!event)
    throw new Error("Your browser does not support '" + type + "' event.");
  event.addListener(listener);
};

Notification.prototype.getNotificationMethod = function(name) {
  var notificationMethod = Notification.getNotificationMethod(name);
  var notificationId = this.id;
  return function() {
    return notificationMethod.apply(null, arguments).catch(function(error) {
      error.notificationId = notificationId;
      throw error;
    });
  };
};

Notification.prototype.display = function(options, action = "create") {
  if (action !== "create" && action !== "update")
    throw new TypeError("The expected values were 'create' or 'update'.");

  var listOpts = Notification.getOptionsOf(this.type);
  var notificationOptions = {type: this.type};
  var thisNotifi = this;

  for (let opt of listOpts) {
    // cambia o agrega las propiedades que esten en 'listOpts'
    if (options && options[opt] != undefined)
      this[opt] = options[opt];

    // agrega las opciones validas para segun el tipo de notificación
    if (this[opt] != undefined)
      notificationOptions[opt] = this[opt];
  }
  return this.getNotificationMethod(action)(this.id, notificationOptions)
    .then(function(notifiIdOrWasUpdated) {
      if (thisNotifi.clearedId) window.clearTimeout(thisNotifi.clearedId);
      // limpia la notificación despues de 4 segundos
      thisNotifi.clearedId = window.setTimeout(function() {
        if (thisNotifi.clearedId) thisNotifi.clearedId = null;
        thisNotifi.clear();
      }, 4E3);
      return notifiIdOrWasUpdated;
    });
};

Notification.prototype.clear = function() {
  return this.getNotificationMethod("clear")(this.id);
};
