const webBrowser = globalThis.browser || globalThis.chrome;
const manifest = webBrowser.runtime.getManifest();
const isCallbackApproach = globalThis.browser === undefined && manifest.manifest_version === 2;

const makeCallback = (promise, metadata) => {
  return (...callbackArgs) => {
    if (webBrowser.runtime.lastError) {
      promise.reject(new Error(webBrowser.runtime.lastError.message));
    } else if (metadata.singleCallbackArg ||
                (callbackArgs.length <= 1 && metadata.singleCallbackArg !== false)) {
      promise.resolve(callbackArgs[0]);
    } else {
      promise.resolve(callbackArgs);
    }
  };
};

const pluralizeArguments = (numArgs) => numArgs == 1 ? "argument" : "arguments";

const wrapAsyncFunction = (name, metadata) => {
  return function asyncFunctionWrapper(target, ...args) {
    if (args.length < metadata.minArgs) {
      throw new Error(`Expected at least ${metadata.minArgs} ${pluralizeArguments(metadata.minArgs)} for ${name}(), got ${args.length}`);
    }

    if (args.length > metadata.maxArgs) {
      throw new Error(`Expected at most ${metadata.maxArgs} ${pluralizeArguments(metadata.maxArgs)} for ${name}(), got ${args.length}`);
    }

    return new Promise((resolve, reject) => {
      if (metadata.fallbackToNoCallback) {
        // This API method has currently no callback on Chrome, but it return a promise on Firefox,
        // and so the polyfill will try to call it with a callback first, and it will fallback
        // to not passing the callback if the first call fails.
        try {
          target[name](...args, makeCallback({resolve, reject}, metadata));
        } catch (cbError) {
          console.warn(`${name} API method doesn't seem to support the callback parameter, ` +
                        "falling back to call it without a callback: ", cbError);

          target[name](...args);

          // Update the API method metadata, so that the next API calls will not try to
          // use the unsupported callback anymore.
          metadata.fallbackToNoCallback = false;
          metadata.noCallback = true;

          resolve();
        }
      } else if (metadata.noCallback) {
        target[name](...args);
        resolve();
      } else {
        target[name](...args, makeCallback({resolve, reject}, metadata));
      }
    });
  };
};

const wrapMethod = (target, method, wrapper) => {
  return new Proxy(method, {
    apply(_targetMethod, thisObj, args) {
      return wrapper.call(thisObj, target, ...args);
    },
  });
};

const isObject = (value) => {
  return value !== null && typeof value === "object";
};

const hasOwnProperty = Function.call.bind(Object.prototype.hasOwnProperty);

const getProxyAPI = (target, metadata = {}) => {
  const cache = Object.create(null);
  const proxyTarget = Object.create(target);

  return new Proxy(proxyTarget, {
    has(_proxyTarget, prop) {
      return prop in target || prop in cache;
    },

    get(_proxyTarget, prop, _receiver) {
      if (prop in cache) {
        return cache[prop];
      }

      if (!(prop in target)) {
        return undefined;
      }

      let value = target[prop];

      if (typeof value === "function") {
        if (hasOwnProperty(metadata, prop)) {
          const  wrapper = wrapAsyncFunction(prop, metadata[prop]);

          value = wrapMethod(target, value, wrapper);
        } else {
          value = value.bind(target);
        }
      } else if (isObject(value) && hasOwnProperty(metadata, prop)) {

        value = getProxyAPI(value, metadata[prop]);
      } else if (hasOwnProperty(metadata, "*")) {

        value = getProxyAPI(value, metadata["*"]);
      } else {
        Object.defineProperty(cache, prop, {
          configurable: true,
          enumerable: true,
          get() { return target[prop]; },
          set(value) { target[prop] = value; },
        });

        return value;
      }

      cache[prop] = value;

      return value;
    },

    set(_proxyTarget, prop, value, _receiver) {
      if (prop in cache) {
        cache[prop] = value;
      } else {
        target[prop] = value;
      }

      return true;
    },

    defineProperty(_proxyTarget, prop, desc) {
      return Reflect.defineProperty(cache, prop, desc);
    },

    deleteProperty(_proxyTarget, prop) {
      return Reflect.deleteProperty(cache, prop);
    },
  });
};

const wrapAPI = (apiName, metadata) => {
  const api = webBrowser[apiName];

  if (isCallbackApproach) {
    return getProxyAPI(api, metadata);
  }

  return api;
};

const getAPIEvent = (api, type) => {
  const eventName = `on${type[0].toUpperCase()}${type.substring(1)}`;
  const event = api[eventName];

  if (!event) {
    throw new Error(`Your browser does not support '${type}' events.`);
  }

  return event;
};

class ClassExtensionBase {
  static metadata = Object.create(null);
  static fields = [];

  static get api() {
    if (!this._api) {
      this._api = wrapAPI(this.apiName, this.metadata);
    }

    return this._api;
  }

  static getAPIMethod(name) {
    const apiMethod = this.api[name];

    if (!apiMethod) {
      throw new Error(`Your browser does not support '${this.name}.${name}()'.`);
    } else if (typeof apiMethod !== 'function') {
      throw new TypeError(`'${this.name}.${name}' is not a function`);
    }

    return apiMethod;
  }

  static addEventListener(type, listener) {
    const event = getAPIEvent(this.api, type);

    event.addListener(listener);
  }

  assignFields(fields) {
    const fieldNames = this.constructor.fields;

    if (!fieldNames.length) return;

    for (const key of fieldNames) {
      if (key in fields) {
        this[key] = fields[key];
      }
    }
  }

  getAPIMethod(name) {
    return this.constructor.getAPIMethod(name);
  }
}

export {
  webBrowser,
  isCallbackApproach,
  getProxyAPI,
  getAPIEvent,
  makeCallback,
  wrapAsyncFunction,
  wrapMethod,
  wrapAPI,
  ClassExtensionBase
};
