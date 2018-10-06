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
// puede usar el metodo 'setDefaultStorageArea' para cambiar el almacenamiento por defecto.
storage.setDefaultStorageArea('sync');
// o tambien hacerlo al crear la instancia.
var storageSync = new StorageManager('sync');
```
## License

[MIT License](https://opensource.org/licenses/MIT).