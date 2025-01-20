# Web Extension OO (Object-Oriented)

## Table of Contents
* [Installation](#installation)
* [Usage](#usage)
  - [Alarm](#alarm)
  - [BrowserWindow](#browserwindow)
  - [Command](#command)
  - [Notification](#notification)
  - [StorageArea](#storagearea)
  - [Tab](#tab)
  - [extension-api](#extension-api)

## Installation

Install from npm:

```bash
npm install web-extension-oo
```

## Usage

### Alarm

```javascript
import { Alarm } from 'web-extension-oo';

// Create an alarm named 'my-alarm' that goes off after 5 minutes.
Alarm.create("my-alarm", {delayInMinutes: 5});

// Retrieve the alarm named 'my-alarm' and clear it.
Alarm.get("my-alarm").then((alarmInfo) => {
  alarmInfo.clear(); // Clear the alarm.
});
```

The example below shows how to add an event listener (in this case _onAlarm_) with the parameter _alarmInfo_, which in this case does not represent an instance of Alarm.

```javascript
Alarm.addEventListener("alarm", (alarmInfo) => {
  console.log("on alarm: " + alarmInfo.name);
});
```

### BrowserWindow

```javascript
import { BrowserWindow } from 'web-extension-oo';

// Open a new browser window with the specified URL, type, and state.
BrowserWindow.open({
  url: 'http://example.com/', // URL to open in the new window.
  type: 'normal', // Type of the window (e.g., 'normal', 'popup').
  state: 'maximized' // Initial state of the window (e.g., 'maximized', 'minimized').
}).then((winInf) => winId = winInf.id); // Store the window ID for later use.

// Close the window after 3 seconds.
setTimeout(() => {
  // Retrieve the window information using the stored window ID and close it.
  BrowserWindow.get(winId).then((winInf) => winInf.close());
}, 3000);
```

### Command

```javascript
import { Command } from 'web-extension-oo';

// Retrieve all commands and log their names and descriptions.
Command.getAll().then((commands) => {
  for (command of commands) {
    console.log(command.name + ": " + command.description);
  }
});

// Add an event listener for the "command" event and log the command details.
Command.addEventListener("command", (command) => {
  console.log("Command: " + command);
});
```

### Notification

If you do not specify the _id_ of the notification when creating the instance or after creating it, _title_ will be used as the _id_ of the notification.

```javascript
import { Notification } from 'web-extension-oo';

// Create a new notification with the specified id, title, message, and icon URL.
let notification = new Notification('notifiId', {
  title: 'Greeting',
  message: 'Hello world',
  iconUrl: '[image_url]' // URL of the icon to display in the notification.
});

// Display the notification and log the notification ID.
notification.display().then((notificationId) => console.log(notificationId));

// Create a new notification instance by passing only the notification id.
notification = new Notification('notifiId');

// Set the title and message of the notification.
notification.title = 'Greeting';
notification.message = 'Hello world';

// You can change the attributes of the notification when calling the display method.
notification.display({message: 'Goodbye'});

notification.message; // Returns 'Goodbye'.
```

If you do not specify the _id_ when creating the instance, the _title_ will be used as the _id_ of the notification.

```javascript
notification = new Notification(null, {title: 'Greeting', message: 'Hello world'});
notification.id // Returns 'Greeting'.
```

If you do not specify the _id_ or _title_ when creating the instance, an error will be thrown.

```javascript
notification = new Notification(null, {message: 'Hello world'}); // Throws an error.
```

### StorageArea

To get the storage area, you can use the _getStorage_ method.

```javascript
import { StorageArea } from 'web-extension-oo';

const storageLocal = StorageArea.getStorage(); // Get instance of StorageArea for 'local'

// Display the key/value object with all stored items
storageLocal.get().then((items) => console.log(items));

// Store one or more items
storageLocal.set({ item1: "Hello world" }).then(() => console.log("Stored successfully."));
```

By default, the _getStorage_ method returns the _local_ storage area. You can also specify the storage area you want to use by passing the name of the storage area as an argument.

```javascript
// Get instance of StorageArea for 'sync'
const storageSync = StorageArea.getStorage('sync');

// Display the key/value object with all stored items
storageSync.get().then((items) => console.log(items));
```

### Tab

```javascript
import { Tab } from 'web-extension-oo';

let tabId;
// Open a new tab with the specified URL.
Tab.open({url: 'http://example.com/'}).then((tabInfo) => tabId = tabInfo.id);

// Close the tab after 3 seconds.
setTimeout(() => {
  Tab.get(tabId).then((tabInfo) => tabInfo.close()); // Or using the tab ID directly: Tab.close(tabId);
}, 3000);
```

You can also open a tab in a specific window by passing the _windowId_ parameter.

```javascript
Tab.open({
  url: 'http://example.com/',
  windowId: id_de_la_ventana
});

// Or open a tab from a specific BrowserWindow instance.
browserWindow.openTab({url: 'http://example.com/'});
```

### extension-api

The _extension-api_ module provides a set of functions that allow you to interact with the extension API.

```javascript
// Can import the extension-api module directly.
import { webBrowser } from 'web-extension-oo/extension-api';

// Or import the extension-api module's functions from the main module.
import { webBrowser } from 'web-extension-oo';
```

The _extension-api_ module provides the following constants and functions:

* __webBrowser__: Represents the browser object. It is the same as the _browser_ or _chrome_ object in the extension API.
* __wrapAPI__: Wraps the extension API object to allow you to use promises instead of callbacks. If the extension API already supports promises, the object is returned as is.
* __getAPIEvent__: Returns the event for the specified API object and event name.

The _extension-api_ also provides the class _ClassExtensionBase_ that you can use to create your own extension API class.

```javascript
import { ClassExtensionBase } from 'web-extension-oo/extension-api';

class MyExtensionAPI extends ClassExtensionBase {
  static apiName = 'alarms';
  static fields = ['name', 'delayInMinutes'];

  constructor(fields) {
    super();
    this.assignFields(fields);
  }

  myMethod() {
    const apiMethod = this.getAPIMethod('create');
    return apiMethod({ name: this.name, delayInMinutes: this.delayInMinutes });
  }
}

// Usage example
const myAPIInstance = new MyExtensionAPI({ name: 'Example Alarm', delayInMinutes: 5 });
myAPIInstance.myMethod().then((result) => {
  console.log(result);
});
```

The _ClassExtensionBase_ class provides the following methods and properties:

* __static metadata__: An object to store metadata for the extension API object. It uses to allow conversion of the API object callback functions to promises.
* __static fields__: An array of field names for the extension API object.
* __static get api()__: Retrieves the extension API object. If the extension API does not support promises, it wraps the API object to allow you to use promises instead of callbacks.
* __static getAPIMethod(name)__: Retrieves the specified API method. Can be overridden in the subclass to provide custom behavior.
* __static addEventListener(type, listener)__: Adds an event listener for the specified event type.
* __assignFields(fields)__: Assigns field values from the provided fields object. This method retrieves the field values specified in the _fields_ array and assigns them to the instance.
* __getAPIMethod(name)__: Same as the static method. Can be overridden in the subclass to provide custom behavior for the instance.
