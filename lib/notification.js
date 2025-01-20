import { ClassExtensionBase } from './extension-api';

export default class Notification extends ClassExtensionBase {
  static metadata =  {
    clear: {
      minArgs: 1,
      maxArgs: 1
    },
    create: {
      minArgs: 1,
      maxArgs: 2
    },
    getAll: {
      minArgs: 0,
      maxArgs: 0
    },
    getPermissionLevel: {
      minArgs: 0,
      maxArgs: 0
    },
    update: {
      minArgs: 2,
      maxArgs: 2
    }
  };
  static apiName = 'notifications';
  static fields = [
    'buttons',
    'contextMessage',
    'eventTime',
    'iconUrl',
    'imageUrl',
    'items',
    'message',
    'priority',
    'progress',
    'requireInteraction',
    'silent',
    'title',
    'type'
  ];

  static TemplateType = this.api.TemplateType;
  static PermissionLevel = this.api.PermissionLevel;
  static defaultType = this.TemplateType.BASIC;

  constructor(notificationId, options) {
    super();

    if (!notificationId && !options?.title) {
      throw new Error("You have not specified an 'id' or 'title' for the notification, you must specify at least one of them.");
    }

    if (this.defaultType == undefined) {
      this.defaultType = this.constructor.defaultType;
    }

    if (this.defaultIconUrl == undefined) {
      this.defaultIconUrl = this.constructor.defaultIconUrl;
    }

    this.iconUrl = this.defaultIconUrl;
    this.type = this.defaultType;

    this.assignFields(options);

    this.id = notificationId.toString() || this.title;
  }

  static getOptionsOf(type) {
    const types = Object.values(this.TemplateType);
    let listOptions = [];

    if (types.includes(type)) {
      const templateType = this.TemplateType;
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
  }

  static getAll() {
    return this.getAPIMethod('getAll')();
  }

  static getPermissionLevel() {
    return this.getAPIMethod('getPermissionLevel')();
  }

  display(options, action = 'create') {
    const allowedActions = ['create', 'update'];

    if (!allowedActions.includes(action)) {
      throw new TypeError("The expected values were 'create' or 'update'.");
    }

    const listOpts = this.constructor.getOptionsOf(this.type);
    const notificationOptions = {type: this.type};

    for (const optKey of listOpts) {
      // cambia o agrega las propiedades que esten en 'listOpts'
      if (options && options[optKey] != undefined) {
        this[optKey] = options[optKey];
      }

      // agrega las opciones validas para segun el tipo de notificación
      if (this[optKey] != undefined) {
        notificationOptions[optKey] = this[optKey];
      }
    }

    return this.getAPIMethod(action)(this.id, notificationOptions);
  }

  clear() {
    return this.getAPIMethod('clear')(this.id);
  }
}
