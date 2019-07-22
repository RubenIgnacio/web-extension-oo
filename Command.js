function Command(options) {
  if (!(this instanceof Command))
    return new Command(options);

  this.browserCommand = Command.browserCommand;
  if (!this.browserCommand)
    throw new Error("Your browser does not support commands.");

  this.name = options.name;
  this.description = options.description;
  this.shortcut = options.shortcut;
}

Command.browserCommand = (window.browser || window.chrome).commands;

Command.getCommandMethod = function(name) {
  var commandMethod = Command.browserCommand[name];
  
  if (!commandMethod)
    throw new Error("Your browser does not support 'Commands." + name + "()'.");
  else if (typeof(commandMethod) !== "function")
    throw new TypeError("'Commands." + name + "' is not a function");
  
  if (window.browser)
    return commandMethod;
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
        commandMethod.apply(null, args);
      });
    };
  }
};

Command.getAll = function() {
  return Command.getCommandMethod("getAll")().then(function(commands) {
    return commands.map((command) => new Command(command));
  });
};

Command.get = function(name) {
  return Command.getAll().then(function(commands) {
    return commands.find((command) => command.name === name);
  });
};

Command.reset = function(name) {
  return Command.getCommandMethod("reset")(name);
};

Command.update = function(details) {
  return Command.getCommandMethod("update")(details);
};

Command.addEventListener = function(type, listener) {
  type = "on" + type[0].toUpperCase() + type.substring(1);
  var event = Command.browserCommand[type];
  if (!event)
    throw new Error("Your browser does not support '" + type + "' event.");;
  event.addListener(listener);
};

Command.prototype.reset = function() {
  var thisCommand = this;
  var commandName = this.name;
  return Command.reset(commandName).then(function() {
    Command.getCommandMethod("getAll")().then(function(commands) {
      var commandProps = ['description', 'shortcut'];
      var resetCommand = commands.find((command) => command.name == commandName);
      for (let commandProp of commandProps) {
        thisCommand[commandProp] = resetCommand[commandProp];
      }
    });
  });
};

Command.prototype.update = function(details) {
  details.name = this.name;
  var thisCommand = this;
  return Command.update(details).then(function() {
    var commandProps = ['description', 'shortcut'];
    for (let commandProp of commandProps) {
      thisCommand[commandProp] = details[commandProp];
    }
  });
};
