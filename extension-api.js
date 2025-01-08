const webBrowser = globalThis.browser || globalThis.chrome;

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

const hasOwnProperty = Function.call.bind(Object.prototype.hasOwnProperty);

const wrapAPI = (target, metadata = {}) => {
  const cache = Object.create(null);

  return new Proxy(Object.create(target), {
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
      } else if (typeof value === "object" && value !== null && hasOwnProperty(metadata, prop)) {
        value = wrapAPI(value, metadata[prop]);
      } else if (hasOwnProperty(metadata, "*")) {
        value = wrapAPI(value, metadata["*"]);
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

const getAPI = (apiName, strict = true) => {
  const api = webBrowser[apiName];

  if (!api && strict) {
    throw new Error(`Your browser does not support the '${apiName}' API.`);
  }

  return api;
};

const getProxyAPI = (apiName, metadata) => {
  const api = getAPI(apiName);
  const manifest = getAPI('runtime').getManifest();

  if (globalThis.browser === undefined && manifest.manifest_version === 2) {
    return wrapAPI(api, metadata);
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
  static _cache = Object.create(null);
  static fields = [];

  static getAPIMethod(name) {
    if (name in this._cache) {
      return this._cache[name];
    }

    const manifest = getAPI('runtime').getManifest();
    const className = this.name;
    let apiMethod = this.api[name];

    if (!apiMethod) {
      throw new Error(`Your browser does not support '${className}.${name}()'.`);
    } else if (typeof apiMethod !== 'function') {
      throw new TypeError(`'${className}.${name}' is not a function`);
    }

    if (globalThis.browser === undefined && manifest.manifest_version === 2) {
      const metadata = this.metadata[name];
      const wrapper = wrapAsyncFunction(name, metadata);
      apiMethod = wrapMethod(this.api, apiMethod, wrapper);
      this._cache[name] = apiMethod;
    }

    return apiMethod;
  }

  static addEventListener(type, listener) {
    const event = getAPIEvent(this.api, type);

    event.addListener(listener);
  }

  static get api() {
    if (!this._api) {
      this._api = getAPI(this.apiName, this.metadata);
    }

    return this._api;
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
}

export {
  getAPI,
  getProxyAPI,
  getAPIEvent,
  makeCallback,
  wrapAsyncFunction,
  wrapMethod,
  wrapAPI,
  ClassExtensionBase
};
