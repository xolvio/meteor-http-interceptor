var Fiber                 = Npm.require('fibers'),
    stream                = Npm.require('stream'),
    bodyParser            = Npm.require('body-parser'),
    URL                   = Npm.require('url'),
    _interceptors         = {},
    _originalCallFunction = {},
    _ignores              = [];


_init();

var rawConnectHandlers = Package['webapp'].WebApp.rawConnectHandlers;
rawConnectHandlers.use(bodyParser.text());
rawConnectHandlers.use(Meteor.bindEnvironment(function (req, res, next) {

  var responseBody = '';

  var write = res.write;
  res.write = Meteor.bindEnvironment(function (chunk, encoding) {
    res.write = write;
    responseBody += chunk;
    res.write(chunk, encoding);
  });

  var end = res.end;
  res.end = Meteor.bindEnvironment(function (chunk, encoding) {
    res.end = end;
    if (chunk) {
      responseBody += chunk;
    }
    // ignore any fields the user is not interested in
    if (!_shouldIgnore(req.url)) {


      var url = URL.parse(URL.resolve(Meteor.absoluteUrl(), req.url));

      HttpInterceptor.Calls.insert({
        timestamp: new Date().getTime(),
        direction: 'IN',
        request: {
          method: req.method.toUpperCase(),
          url: url,
          headers: req.headers,
          remoteAddress: req.connection.remoteAddress,
          remotePort: req.connection.remotePort,
          body: req.body
        },
        response: responseBody.toString()
      });
    }

    res.end(chunk, encoding);
  });


  next();

}));

HttpInterceptor = HttpInterceptor || {};

_.extend(HttpInterceptor, {

  registerInterceptor: function (originalHost, newHost) {
    console.log('[http-interceptor] Intercepting all calls to', originalHost, 'and redirecting to', newHost);
    _interceptors[originalHost] = newHost;
  },

  ignore: function (urls) {
    if (urls instanceof Array) {
      _ignores = _ignores.concat(urls);
    } else {
      _ignores.push(urls);
    }
  },

  reset: function () {
    HttpInterceptor.Calls.remove({});
  },

  restore: function () {
    Package.http.HTTP.call = _originalCallFunction;
  }

});

Meteor.methods({
  '/HttpInterceptor/reset': HttpInterceptor.reset
});

HttpInterceptor.reset();

function _init () {

  _originalCallFunction = Package.http.HTTP.call;

  Package.http.HTTP.call = function (method, url, options, callback) {

    // apply any interceptors that have been registered for this call
    _.each(_interceptors, function (newHost, originalHost) {
      url = url.replace(originalHost, newHost);
    });

    // do the HTTP call and get the response
    var response = _originalCallFunction.apply(this, [method, url, options, callback]);

    if (_shouldIgnore(url)) {
      return response;
    }

    // track the HTTP call
    HttpInterceptor.Calls.insert({
      timestamp: new Date().getTime(),
      direction: 'OUT',
      request: {
        options: options,
        method: method.toUpperCase(),
        url: URL.parse(url)
      },
      response: response
    });

    return response;
  };
}

function _shouldIgnore (url) {
  var matches = false;
  _.each(_ignores, function (ignore) {
    if (url.match(ignore)) {
      matches = true;
    }
  });
  return matches;
}