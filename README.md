
# WebExtensionLibs

## StorageManager

```javascript
var storage = new StorageManager();
// muestra el objeto de clave/valor con todos los items almacenados.
storage.get(null).then((items) => console.log(items));
// almacena uno o mas items en el storage.
storage.set({item1: "Hola mundo"}).then(() => console.log("Se almaceno correctamente."));
```

Por defecto StorageManager usa el storage 'local', si en caso quiere usar otro storage como 'sync' puede pasar como segundo parámetro el tipo de almacenamiento a usar.

```javascript
// obtiene todos los items almacenados en 'sync'.
storage.get(null, 'sync').then((items) => console.log(items));
```

También puede establecer el almacenamiento por defecto que prefiera.

```javascript
// puede usar el método 'setDefaultStorageArea' para cambiar el almacenamiento por defecto.
storage.setDefaultStorageArea('sync');
// o también hacerlo al crear la instancia.
var storageSync = new StorageManager('sync');
```

## NotificationManager

```javascript
// crea una instancia para la notificación.
var notification = new NotificationManager('notifiId', {
  title: 'Saludo',
  message: 'Hola mundo',
  iconUrl: 'url_de_la_imgen' // Opcional en Firefox.
});
// Muestra la notificación e imprime en consola su 'id'.
notification.display().then((notificationId) => console.log(notificationId));
// sin pasar argumentos al crear la instancia.
notification = new NotificationManager();
notification.id = 'notifiId';
notification.title = 'Saludo';
notification.message = 'Hola mundo';
// también puede cambiar los atributos de la notificación
// como 'title', 'message', 'iconUrl', etc, en la llamada al método 'display'.
notification.display({message: 'Adiós'});
notification.message; // regresa 'Adiós'.
```

Si no especifica el id de la notificación al crear la instancia o después de crearla, se usara el título como id de la notificación.

```javascript
notification = new NotificationManager(null, {title: 'Saludo', message: 'Hola mundo'});
notification.id // regresa 'Saludo'.
```

## WindowManager
```javascript
var winId;
// abre una ventana nueva
WindowManager.open({
  url: 'https://www.google.com/',
  type: 'normal',
  state: 'maximized'
}).then((winInf) => winId = winInf.id);
// cierra la ventana después de 3 segundos
setTimeout(() => {
  WindowManager.get(winId).then((winInf) => winInf.close());
}, 3000);
```
## License

[MIT License](https://opensource.org/licenses/MIT).