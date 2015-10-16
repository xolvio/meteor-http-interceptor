Package.describe({
  name: "xolvio:http-interceptor",
  summary: "Intercepts HTTP calls and allows fake implementations to take over domains. Used for testing.",
  version: "0.5.1",
  git: "https://github.com/xolvio/meteor-http-interceptor.git",
  debugOnly: true
});

Npm.depends({
  'body-parser': '1.10.1'
});

Package.on_use(function (api) {
  api.use([
    'http',
    'templating@1.1.1',
    'mongo@1.1.0',
    'underscore@1.0.3',
    'momentjs:moment@2.10.3',
    'practicalmeteor:loglevel@1.2.0_1'
  ], ['server', 'client']);

  api.use(['iron:router@1.0.9'], ['server']);

  api.add_files('client.css', 'client');
  api.add_files('client.html', 'client');

  api.add_files('collection.js', ['server', 'client']);
  api.add_files('server.js', 'server');
  api.add_files('client.js', 'client');

  api.export('HttpInterceptor', ['server', 'client']);
});
