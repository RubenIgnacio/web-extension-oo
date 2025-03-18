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

  static baseFields = [
    'type',
    'title',
    'message',
    'iconUrl',
    'contextMessage',
    'buttons'
  ];
  static fieldsByType = new Map([
    [this.TemplateType.IMAGE, ['imageUrl']],
    [this.TemplateType.LIST, ['items']],
    [this.TemplateType.PROGRESS, ['progress']]
  ]);

  constructor(id, options = {}) {
    super();

    if (!id && !options.title) {
      throw new Error("Either 'id' or 'title' is required for notification creation");
    }

    const defaults = {
      type: this.constructor.defaultType,
      iconUrl: this.constructor.defaultIconUrl
    };

    this.assignFields({ ...defaults, ...options });

    this.id = id?.toString() || this.title;
  }

  static getValidFieldsForType(type) {
    if (!Object.values(this.TemplateType).includes(type)) {
      throw new TypeError(`Invalid notification type: ${type}`);
    }

    const fields = [...this.baseFields];

    if (this.fieldsByType.has(type)) {
      const typeFields = this.fieldsByType.get(type);

      fields.push(...typeFields);
    }

    return fields;
  }

  static getAll() {
    return this.getAPIMethod('getAll')();
  }

  static getPermissionLevel() {
    return this.getAPIMethod('getPermissionLevel')();
  }

  static create(id, options = {}) {
    return new this(id, options).display();
  }

  static clearAll() {
    return this.getAll().then(notifications => {
      return Promise.all(notifications.map(notification => {
        return this.getAPIMethod('clear')(notification.id);
      }));
    });
  }

  static clear(id) {
    return this.getAPIMethod('clear')(id);
  }

  display(options, action = 'create') {
    if (!['create', 'update'].includes(action)) {
      throw new TypeError("The expected values were 'create' or 'update'.");
    }

    const typeFields = this.constructor.getValidFieldsForType(this.type);
    const fields = {};

    for (const key of typeFields) {
      fields[key] = this[key];
    }

    return this.getAPIMethod(action)(this.id, {...fields, ...options});
  }

  clear() {
    return this.constructor.clear(this.id);
  }
}
