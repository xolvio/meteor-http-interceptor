Package.describe({
  name: "xolvio:http-interceptor",
  summary: "Intercepts HTTP calls and allows fake implementations to take over entire domains. Used for testing.",
  version: "0.2.2",
  git: "https://github.com/xolvio/meteor-http-interceptor",
  debugOnly: true
});

Package.on_use(function (api) {
  api.use('underscore@1.0.2', 'server');
  api.add_files('http-interceptor-server.js', 'server');
  api.export('HttpInterceptor', 'server');
});