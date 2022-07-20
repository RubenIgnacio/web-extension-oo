function Notification(notificationId, options) {
  if (!(this instanceof Notification)) {
    return new Notification(notificationId, options);
  }

  this.browserNotifications = Notification.browserNotifications;

  if (!notificationId && (!options || !options.title)) {
    throw new Error("You have not specified an 'id' or 'title' for the notification, you must specify at least one of them.");
  }

  const definePropertyWithDefaultValue = (prop, defaultProp) => {
    let __prop__ = "__" + prop + "__";

    Object.defineProperty(this, __prop__, {writable: true});
    Object.defineProperty(this, prop, {
      enumerable: true,
      configurable: true,
      get: function() {
        if (this[__prop__] == undefined) {
          return this[defaultProp];
        }
        return this[__prop__];
      },
      set: function(newVal) {
        this[__prop__] = newVal;
      }
    });
  };

  definePropertyWithDefaultValue('type', 'defaultType');
  definePropertyWithDefaultValue('id', 'title');
  definePropertyWithDefaultValue('iconUrl', 'defaultIconUrl');

  if (options && typeof(options) === 'object') {
    Object.assign(this, options);
  }

  if (this.defaultType == undefined) {
    this.defaultType = Notification.defaultType;
  }

  if (this.defaultIconUrl == undefined) {
    this.defaultIconUrl = Notification.defaultIconUrl;
  }

  this.id = notificationId;

  Object.defineProperty(this, 'clearedId', {writable: true});
}

Notification.browserNotifications = WebExtension.getAPI('notifications');

Notification.TemplateType = Notification.browserNotifications.TemplateType;

Notification.PermissionLevel = Notification.browserNotifications.PermissionLevel;

Notification.defaultType = Notification.TemplateType.BASIC;

Notification.getNotificationMethod = function(name) {
  const notificationMethod = Notification.browserNotifications[name];

  if (!notificationMethod) {
    throw new Error(`Your browser does not support 'Notifications.${name}()'.`);
  } else if (typeof(notificationMethod) !== 'function') {
    throw new TypeError(`'Notifications.${name}' is not a function`);
  }
  return WebExtension.apiMethodAsPromise(notificationMethod);
};

Notification.getOptionsOf = function(type) {
  const types = Object.values(Notification.TemplateType);
  let listOptions = [];

  if (types.includes(type)) {
    const templateType = Notification.TemplateType;
    listOptions = [
      'title',
      'message',
      'iconUrl',
      'contextMessage',
      'buttons'
    ];

    switch (type) {
      case templateType.IMAGE:
        listOptions.push('imageUrl');
        break;
      case templateType.LIST:
        listOptions.push('items');
        break;
      case templateType.PROGRESS:
        listOptions.push('progress');
        break;
    }
  }
  return listOptions;
};

['getAll', 'getPermissionLevel'].forEach(function(methodName) {
  Notification[methodName] = function() {
    return Notification.getNotificationMethod(methodName)();
  };
});

Notification.addEventListener = function(type, listener) {
  const event = WebExtension.getAPIEvent(Notification.browserNotifications, type);

  event.addListener(listener);
};

Notification.prototype.getNotificationMethod = function(name) {
  const notificationMethod = Notification.getNotificationMethod(name);
  const notificationId = this.id;

  return function() {
    return notificationMethod.apply(null, arguments).catch(function(error) {
      error.notificationId = notificationId;

      throw error;
    });
  };
};

Notification.prototype.display = function(options, action = 'create') {
  const allowedActions = ['create', 'update'];

  if (!allowedActions.includes(action)) {
    throw new TypeError("The expected values were 'create' or 'update'.");
  }

  const listOpts = Notification.getOptionsOf(this.type);
  const notificationOptions = {type: this.type};

  for (const opt of listOpts) {
    // cambia o agrega las propiedades que esten en 'listOpts'
    if (options && options[opt] != undefined) {
      this[opt] = options[opt];
    }

    // agrega las opciones validas para segun el tipo de notificación
    if (this[opt] != undefined) {
      notificationOptions[opt] = this[opt];
    }
  }
  return this.getNotificationMethod(action)(this.id, notificationOptions)
    .then((notifiIdOrWasUpdated) => {
      if (this.clearedId) clearTimeout(this.clearedId);

      // limpia la notificación despues de 4 segundos
      this.clearedId = setTimeout(() => {
        if (this.clearedId) this.clearedId = null;

        this.clear();
      }, 4E3);

      return notifiIdOrWasUpdated;
    });
};

Notification.prototype.clear = function() {
  return this.getNotificationMethod('clear')(this.id);
};
