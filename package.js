Package.describe({
  name: "xolvio:http-interceptor",
  summary: "Intercepts HTTP calls and allows fake implementations to take over domains. Used for testing.",
  version: "0.4.0",
  debugOnly: true
});

Npm.depends({
  'body-parser': '1.10.1'
});

Package.on_use(function (api) {
  api.use([
    'templating@1.0.10',
    'mongo@1.0.11',
    'underscore@1.0.2',
    'momentjs:moment@2.9.0'
  ], ['server', 'client']);

  api.use(['iron:router@1.0.6'], ['server']);

  api.add_files('client.css', 'client');
  api.add_files('client.html', 'client');

  api.add_files('collection.js', ['server', 'client']);
  api.add_files('server.js', 'server');
  api.add_files('client.js', 'client');

  api.export('HttpInterceptor', ['server', 'client']);
});