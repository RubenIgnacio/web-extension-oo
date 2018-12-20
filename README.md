# WebExtensionLibs

* [StorageManager](#storagemanager)
* [NotificationManager](#notificationmanager)
* [WindowManager](#windowmanager)
* [Alarm](#alarm)
* [License](#license)

## StorageManager

```javascript
var storage = new StorageManager();
// Muestra el objeto de clave/valor con todos los items almacenados.
storage.get(null).then((items) => console.log(items));
// Almacena uno o mas items en el storage.
storage.set({item1: "Hola mundo"}).then(() => console.log("Se almaceno correctamente."));
```

Por defecto *StorageManager* usa el storage 'local', si en caso quiere usar otro storage como 'sync' puede pasar como segundo parámetro el tipo de almacenamiento a usar.

```javascript
// Obtiene todos los items almacenados en 'sync'.
storage.get(null, 'sync').then((items) => console.log(items));
```

También puede establecer el almacenamiento por defecto que prefiera.

```javascript
// Puede usar el método 'setDefaultStorageArea' para cambiar el almacenamiento por defecto
storage.setDefaultStorageArea('sync');
// o también hacerlo al crear la instancia.
var storageSync = new StorageManager('sync');
```

## NotificationManager

```javascript
// Crea una instancia para la notificación.
var notification = new NotificationManager('notifiId', {
  title: 'Saludo',
  message: 'Hola mundo',
  iconUrl: 'url_de_la_imgen' // Opcional en Firefox.
});
// Muestra la notificación e imprime en consola su 'id'.
notification.display().then((notificationId) => console.log(notificationId));
// Sin pasar argumentos al crear la instancia.
notification = new NotificationManager();
notification.id = 'notifiId';
notification.title = 'Saludo';
notification.message = 'Hola mundo';
/*
También puede cambiar los atributos de la notificación
como 'title', 'message', 'iconUrl', etc, en la llamada al método 'display'.
*/
notification.display({message: 'Adiós'});
notification.message; // Regresa 'Adiós'.
```

Si no especifica el id de la notificación al crear la instancia o después de crearla, se usara el título como id de la notificación.

```javascript
notification = new NotificationManager(null, {title: 'Saludo', message: 'Hola mundo'});
notification.id // Regresa 'Saludo'.
```

## WindowManager

```javascript
var winId;
// Abre una ventana nueva.
WindowManager.open({
  url: 'https://www.google.com/',
  type: 'normal',
  state: 'maximized'
}).then((winInf) => winId = winInf.id);
// Cierra la ventana después de 3 segundos.
setTimeout(() => {
  WindowManager.get(winId).then((winInf) => winInf.close());
}, 3000);
```

## Alarm

```javascript
/*
Crea una alarma que se dispara una sola vez
despues de 5 minutos, si se omite el primer argumento
por defecto el nombre de la alarma será un string vacío("").
*/
Alarm.create("my-alarm", {delayInMinutes: 5});

// Use Alarm.getAll() para obtener todas las alarmas.
Alarm.get("my-alarm").then((alarmInfo) => {
  // Limpia la alarma.
  // Use Alarm.clearAll() para limpiar todas las alarmas.
  alarmInfo.clear();
});
```

En el ejemplo de abajo se muestra como agregar un escucha a un evento (en este caso _onAlarm_) y tiene como parámetro _alarmInfo_ pero en este caso no representa una instancia de Alarm.

```javascript
Alarm.addEventListener("alarm", (alarmInfo) => {
  /*
  Puede pasar 'alarmInfo' como parametro para volverlo instancia de Alarm.
  Ejem:
    alarmInfo = new Alarm(alarmInfo);
  */
  console.log("on alarm: " + alarmInfo.name);
});
```

## License

[MIT License](https://opensource.org/licenses/MIT).