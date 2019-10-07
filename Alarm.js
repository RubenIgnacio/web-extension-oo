function Alarm(alarmInfo) {
  if (!(this instanceof Alarm))
    return new Alarm(alarmInfo);

  this.browserAlarm = Alarm.browserAlarm;

  if (!this.browserAlarm)
    throw new Error("Your browser does not support alarms.");

  Object.assign(this, alarmInfo);
}

Alarm.browserAlarm = (window.browser || window.chrome).alarms;

Alarm.getAlarmMethod = function(name, useCallback = true) {
  var alarmMethod = Alarm.browserAlarm[name];
  
  if (!alarmMethod)
    throw new Error("Your browser does not support 'Alarms." + name + "()'.");
  else if (typeof(alarmMethod) !== "function")
    throw new TypeError("'Alarms." + name + "' is not a function");
  
  if (window.browser || !useCallback)
    return alarmMethod;
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
        alarmMethod.apply(null, args);
      });
    };
  }
};

Alarm.create = function(name, alarmInfo) {
  return Alarm.getAlarmMethod("create", false)(name, alarmInfo);
};

Alarm.getAll = function() {
  return Alarm.getAlarmMethod("getAll")().then((alarmsArray) => {
    return alarmsArray.map((alarm) => new Alarm(alarm));
  });
};

Alarm.get = function(name) {
  return Alarm.getAlarmMethod("get")(name).then(function(alarmInfo) {
    if (typeof(alarmInfo) === "object") return new Alarm(alarmInfo);
  });
};

Alarm.clearAll = function() {
  return Alarm.getAlarmMethod("clearAll")();
};

Alarm.addEventListener = function(type, listener) {
  type = "on" + type[0].toUpperCase() + type.substring(1);
  var event = Alarm.browserAlarm[type];
  if (!event)
    throw new Error("Your browser does not support '" + type + "' event.");;
  event.addListener(listener);
};

Alarm.prototype.getAlarmMethod = Alarm.getAlarmMethod;

Alarm.prototype.clear = function() {
  return this.getAlarmMethod("clear")(this.name);
};
