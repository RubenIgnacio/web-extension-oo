function Notification(notificationId, options) {
  if (!(this instanceof Notification))
    return new Notification(notificationId, options);

  this.browserNotifications = Notification.browserNotifications;
  if (!this.browserNotifications)
    throw new Error("Your browser does not support notifications.");

  if (!notificationId && (!options || !options.title))
    throw new Error("You have not specified an 'id' or 'title' for the notification, you must specify at least one of them.");

  function definePropertyWithDefaultValue(propName, defaultPropName) {
    var __propName__ = "__" + propName + "__";

    Object.defineProperty(this, __propName__, {writable: true});

    this.accessorProperty(propName, {
      get: function() {
        return this[__propName__] || defaultPropName;
      },
      set: function(newVal) {
        this[__propName__] = newVal;
      }
    });
  }

  definePropertyWithDefaultValue.call(this, "type", Notification.defaultType);
  definePropertyWithDefaultValue.call(this, "defaultIconUrl", Notification.defaultIconUrl);
  if (typeof(options) === "object") {
    for (let opt in options) {
      if (opt === "id" || opt === "iconUrl")
        this["__" + opt + "__"] = options[opt];
      else
        this[opt] = options[opt];
    }
  }
  definePropertyWithDefaultValue.call(this, "id", this.title);
  definePropertyWithDefaultValue.call(this, "iconUrl", this.defaultIconUrl);
  this.id = notificationId;
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
    throw new Error("'Notifications." + name + "' is not a function");

  return function() {
    if (window.browser)
      return notificationMethod.apply(null, arguments);
    else {
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
    }
  };
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

for (let methodName of ["getAll", "getPermissionLevel"]) {
  if (Notification.browserNotifications[methodName])
    Notification[methodName] = Notification.getNotificationMethod(methodName);
}

Notification.addEventListener = function(type, listener) {
  type = "on" + type[0].toUpperCase() + type.substring(1);
  var event = Notification.browserNotifications[type];
  if (!event)
    throw new Error("Your browser does not support '" + type + "' event.");
  event.addListener(listener);
};

Notification.prototype.accessorProperty = function(propName, descriptor) {
  if (!descriptor) descriptor = {writable: true};

  if (descriptor.enumerable == undefined)
    descriptor.enumerable = true;

  if (descriptor.configurable == undefined)
    descriptor.configurable = true;

  Object.defineProperty(this, propName, descriptor);
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
    throw new Error("The expected values were 'create' or 'update'.");

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
  // verifica si hay una notificación anterior que aun no haya sido limpiada
  if (this.clearedId) window.clearTimeout(this.clearedId);
  return new Promise(function(resolve, reject) {
    thisNotifi.getNotificationMethod(action)(thisNotifi.id, notificationOptions)
      .then(function(notifiIdOrWasUpdated) {

      resolve(notifiIdOrWasUpdated);
      // limpia la notificación despues de 4 segundos
      thisNotifi.clearedId = window.setTimeout(function() {
        thisNotifi.clear();
      }, 4E3);
    }, reject);
  });
};

Notification.prototype.clear = function() {
  var thisNotifi = this;
  this.getNotificationMethod("clear")(this.id).then(function(wasCleared) {
    thisNotifi.clearedId = null;
    return wasCleared;
  });
};