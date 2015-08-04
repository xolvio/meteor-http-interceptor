var Fiber                 = Npm.require('fibers'),
    stream                = Npm.require('stream'),
    bodyParser            = Npm.require('body-parser'),
    URL                   = Npm.require('url'),
    _interceptors         = {},
    _originalCallFunction = {},
    _ignores              = [],
    _routeNameCache       = {},
    _recording            = false;


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

    var url = URL.parse(URL.resolve(Meteor.absoluteUrl(), req.url));

    if (_shouldRecord(url.href)) {

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
    log.info('Intercepting all calls to', originalHost, 'and redirecting to', newHost);
    _interceptors[originalHost] = newHost;
  },

  getInterceptors: function() {
    return _interceptors;
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
  },

  record: function () {
    _recording = true;
  },

  playback: function (session) {
    var self = this;
    _.each(session, function (call) {

      if (call.direction === 'OUT') {

        // setup a route on this guy
        var route = call.request.url.hostname + call.request.url.pathname;

        // keep track of the routes we create
        if (_routeNameCache[route]) {
          // we've already got a canned response for this route
          return;
        }
        _routeNameCache[route] = true;

        log.debug('Creating server side route at', call.request.url.href);

        // create a server side route that behaved like the recording did
        Router.route(route, function () {
          log.debug('Serving request to', Meteor.absoluteUrl(route), 'and responding with');
          //log.debug('Serving request to', route, 'and responding with', JSON.stringify(call.response));
          var self = this;
          self.response.writeHead(call.response.statusCode, {'Content-Type': call.response.headers['content-type']});
          self.response.end(call.response ? call.response.content : null);
        }, {where: 'server'});

      }
    });

  }

});

Meteor.methods({
  '/HttpInterceptor/reset': HttpInterceptor.reset
});

HttpInterceptor.reset();

function _init () {

  _originalCallFunction = Package.http.HTTP.call;

  Package.http.HTTP.call = function (method, url, options, callback) {

    if (! callback && typeof options === "function") {
      callback = options;
      options = null;
    }
    options = options || {};

    log.debug('HTTP.call', method, url, JSON.stringify(options));

    var oldUrl = url;
    // apply any interceptors that have been registered for this call
    _.each(_interceptors, function (newHost, originalHost) {
      url = url.replace(originalHost, newHost);
    });

    log.debug('Rerouting', oldUrl, '->', url);

    // do the HTTP call and get the response
    var response = _originalCallFunction.call(this, method, url, options, callback);

    if (!_shouldRecord(url)) {
      return response;
    }

    // track the HTTP call
    HttpInterceptor.Calls.insert({
      timestamp: new Date().getTime(),
      direction: 'OUT',
      request: {
        options: JSON.stringify(options),
        method: method.toUpperCase(),
        url: URL.parse(url)
      },
      response: response
    });

    return response;
  };
}

function _shouldRecord (url) {
  return _recording && !_shouldIgnore(url);
}

function _shouldIgnore (url) {
  // ignore any fields the user is not interested in
  var matches = false;
  _.each(_ignores, function (ignore) {
    if (url.match(ignore)) {
      matches = true;
    }
  });
  return matches;
}
