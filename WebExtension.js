var WebExtension = {
  browser: self.browser || self.chrome,
  supportPromises: () => {
    if (self.browser) return /Firefox/.test(navigator.userAgent);

    return false;
  },
  getAPI: (apiName, silent) => {
    const api = WebExtension.browser[apiName];

    if (!api) {
      if (silent) return null;

      throw new Error(`Your browser does not support ${apiName}.`);
    }
    return api;
  },
  apiMethodAsPromise: (apiMethod) => {
    if (WebExtension.supportPromises()) return apiMethod;

    return function() {
      const args = Array.from(arguments);

      return new Promise((resolve, reject) => {
        args.push(function(value) {
          const runtimeError = WebExtension.getAPI('runtime').lastError;

          runtimeError ? reject(runtimeError) : resolve(value);
        });

        apiMethod.apply(null, args);
      });
    };
  },
  getAPIEvent: (api, type) => {
    const eventName = `on${type[0].toUpperCase()}${type.substring(1)}`;
    const event = api[eventName];

    if (!event) {
      throw new Error(`Your browser does not support ${type} event.`);
    }
    return event;
  }
};
