function Alarm(alarmInfo) {
  if (!(this instanceof Alarm))
    return new Alarm(alarmInfo);

  this.browserAlarm = Alarm.browserAlarm;

  if (!this.browserAlarm)
    throw new Error("Your browser does not support alarms.");

  var alarmProps = [
    "name",
    "scheduledTime",
    "periodInMinutes"
  ];
  alarmProps.forEach(function(prop) {
    if (alarmInfo[prop] !== undefined)
      this[prop] = alarmInfo[prop];
  }, this);
}

Alarm.browserAlarm = (window.browser || window.chrome).alarms;

Alarm.getAlarmMethod = function(name, useCallback = true) {
  var alarmMethod = Alarm.browserAlarm[name];
  
  if (!alarmMethod)
    throw new Error("Your browser does not support 'Alarms." + name + "()'.");
  else if (typeof(alarmMethod) !== "function")
    throw new Error("'Alarms." + name + "' is not a function");
  
  return function() {
    if (window.browser || !useCallback)
      return alarmMethod.apply(null, arguments);
    else {
      var args = Array.from(arguments);
      return new Promise(function(resolve, reject) {
        args.push(function() {
          var runtimeError = chrome.runtime.lastError;
          if (runtimeError)
            reject(runtimeError);
          else
            resolve.apply(null, arguments);
        });
        alarmMethod.apply(null, args);
      });
    }
  };
};

Alarm.create = Alarm.getAlarmMethod("create", false);

Alarm.getAll = function() {
  return Alarm.getAlarmMethod("getAll")().then(function(alarmsArray) {
    return alarmsArray.map((alarm) => new Alarm(alarm));
  });
};

Alarm.get = function(name) {
  return Alarm.getAlarmMethod("get")(name).then(function(alarmInfo) {
    if (typeof(alarmInfo) === "object") return new Alarm(alarmInfo);
  });
};

Alarm.clearAll = Alarm.getAlarmMethod("clearAll");

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