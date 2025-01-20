import { ClassExtensionBase } from './extension-api';

export default class Alarm extends ClassExtensionBase {
  static metadata = {
    clear: {
      minArgs: 0,
      maxArgs: 1
    },
    clearAll: {
      minArgs: 0,
      maxArgs: 0
    },
    get: {
      minArgs: 0,
      maxArgs: 1
    },
    getAll: {
      minArgs: 0,
      maxArgs: 0
    }
  };
  static apiName = 'alarms';
  static fields = ['name', 'delayInMinutes', 'periodInMinutes', 'when'];

  constructor(alarmInfo) {
    super();
    this.assignFields(alarmInfo);
  }

  static create(name, alarmInfo) {
    return this.getAPIMethod('create')(name, alarmInfo);
  }

  static getAll() {
    const apiMethod = this.getAPIMethod('getAll');

    return apiMethod().then((alarmsArray) => {
      return alarmsArray.map((alarm) => new this(alarm));
    });
  }

  static get(name) {
    const apiMethod = this.getAPIMethod('get');

    return apiMethod(name).then((alarmInfo) => {
      if (typeof alarmInfo !== 'object') return;

      return new this(alarmInfo);
    });
  }

  static clearAll() {
    return this.getAPIMethod('clearAll')();
  }

  clear() {
    return this.getAPIMethod('clear')(this.name);
  }

  addEventListener(type, listener) {
    this.constructor.addEventListener(type, (alarm) => {
      if (alarm.name !== this.name) return;

      listener(this);
    });
  }
}
