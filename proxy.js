/**
 * Crude proxy to allow for some client side fu
 * Intercepting client side calls to hosts registered with HttpInterceptor.registerInterceptor()
 */
var http = Npm.require('http');
var url = Npm.require('url');

HttpInterceptor.registerInterceptor('http://res.cloudinary.com', Meteor.absoluteUrl('fake.res.cloudinary.com'));
Meteor._debug(HttpInterceptor.getInterceptors());

http.createServer(function(request, response) {
    var interceptors = HttpInterceptor.getInterceptors();
    var oldUrl = request.url;
    var newUrl = oldUrl;
    var oldHost = request.headers['host'];
    var host = oldHost;

    _.each(interceptors, function (newHost, originalHost) {
        if (newUrl.indexOf(originalHost) > -1) {
            Meteor._debug(newUrl, originalHost);
            newUrl = newUrl.replace(originalHost, newHost);
            Meteor._debug('REROUTING', oldUrl, '->', newUrl);
            host = url.parse(newHost).hostname;
            Meteor._debug(host);
        }
    });



    var proxy = http.createClient(80, host);
    Meteor._debug('Just created a client for: ' + host);
    var proxy_request = proxy.request(request.method, newUrl, request.headers);
    Meteor._debug('Using method: ' + request.method);
    Meteor._debug('Accessing URL: ' + newUrl);
    proxy_request.addListener('response', function (proxy_response) {
        proxy_response.addListener('data', function(chunk) {
            response.write(chunk, 'binary');
        });
        proxy_response.addListener('end', function() {
            response.end();
        });
        response.writeHead(proxy_response.statusCode, proxy_response.headers);
    });
    request.addListener('data', function(chunk) {
        proxy_request.write(chunk, 'binary');
    });
    request.addListener('end', function() {
        proxy_request.end();
    });
}).listen(8080);
