var _interceptors          = {},
    _originalCallFunction  = {};

_init();

HttpInterceptor = {
  registerInterceptor: function (originalHost, newHost) {
    _interceptors[originalHost] = newHost;
  },
  restore: function () {
    Package.http.HTTP.call = _originalCallFunction;
  }
};

function _init () {
  _originalCallFunction = Package.http.HTTP.call;
  Package.http.HTTP.call = function (method, url, options, callback) {
    _.each(_interceptors, function (newHost, originalHost) {
      url = url.replace(originalHost, newHost);
    });
    return _originalCallFunction.call(this, method, url, options, callback);
  };
}