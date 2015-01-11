Meteor HTTP Interceptor
=======================

Intercepts HTTP calls and allows fake implementations to take over entire domains.

See [this repo](https://github.com/xolvio/meteor-github-fake) for an example of OAuth stubbing for 
GitHub. Your app can work offline even if it has a dependency on OAuth! 

This package is for testing (deterministic responses from 3rd parties) and developing (on planes!) 

##Usage:

```javascript

// You must do this as this package is a debugOnly package and it's weakly referenced
HttpInterceptor = Package['xolvio:http-interceptor'].HttpInterceptor;

// Set the domain you wish to overtake and where you wish to redirect the requests to
HttpInterceptor.registerInterceptor('https://github.com', Meteor.absoluteUrl('fake.github.com'));

// You can then define some server side routes to stub out responses from the domain you overtook
Router.route('fake.api.github.com/user', function () {
  var cannedResponse = {
    'login': 'gh_fake',
    'id': 1234567,
    'name': 'Github Fake',
    'email': 'github-fake@example.com'
  };
  this.response.writeHead(200, {
    'Content-Type': 'application/json; charset=utf-8'
  });
  this.response.end(JSON.stringify(cannedResponse));
}, {where: 'server'});
```

NOTE :This package is a `debugOnly` package, which means it will not be deployed to production and
will only work in `development` mode.

##Future Work
* [ ] Record and playback of responses (Like VCR for rails)
