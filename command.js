import { ClassExtensionBase } from './extension-api';

export default class Command extends ClassExtensionBase {
  static metadata =  {
    getAll: {
      minArgs: 0,
      maxArgs: 0
    }
  };
  static apiName = 'commands';
  static fields = [ 'description', 'name', 'shortcut' ];

  constructor(options) {
    this.assignFields(options);
  }

  static getAll() {
    const apiMethod = this.getAPIMethod('getAll');

    return apiMethod().then((commands) => {
      return commands.map((command) => new this(command));
    });
  }

  static get(name) {
    const apiMethod = this.getAPIMethod('getAll');

    return apiMethod().then((commands) => {
      const command = commands.find((command) => command.name === name);

      return command ? new this(command) : null;
    });
  }

  reload() {
    const apiMethod = this.getAPIMethod('getAll');

    apiMethod().then((commands) => {
      const command = commands.find((command) => command.name === this.name);

      if (!command) {
        throw new Error(`Command '${this.name}' was not found.`);
      }

      this.assignFields(command);
    });
  }

  reset() {
    const apiMethod = this.getAPIMethod('reset');

    return apiMethod(this.name).then(() => this.reload());
  }

  update(details) {
    details.name = this.name;
    const apiMethod = this.getAPIMethod('update');

    return apiMethod(details).then(() => this.reload());
  }
}
