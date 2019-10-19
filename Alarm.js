function Alarm(alarmInfo) {
  if (!(this instanceof Alarm))
    return new Alarm(alarmInfo);

  this.browserAlarm = Alarm.browserAlarm;
  Object.assign(this, alarmInfo);
}

Alarm.browserAlarm = WebExtension.getAPI('alarms');

Alarm.getAlarmMethod = function(name, useCallback = true) {
  let alarmMethod = Alarm.browserAlarm[name];
  
  if (!alarmMethod)
    throw new Error("Your browser does not support 'Alarms." + name + "()'.");
  else if (typeof(alarmMethod) !== "function")
    throw new TypeError("'Alarms." + name + "' is not a function");
  
  if (!useCallback) return alarmMethod;
  return WebExtension.getAPIMethodAsPromise(alarmMethod);
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
  let event = WebExtension.getAPIEvent(Alarm.browserAlarm, type);
  event.addListener(listener);
};

Alarm.prototype.getAlarmMethod = Alarm.getAlarmMethod;

Alarm.prototype.clear = function() {
  return this.getAlarmMethod("clear")(this.name);
};
