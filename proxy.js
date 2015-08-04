/**
 * Crude proxy to allow for some client side fu
 * Intercepting client side calls to hosts registered with HttpInterceptor.registerInterceptor()
 */
var http = Npm.require('http');
var URL = Npm.require('url');

HttpInterceptor.registerInterceptor('http://res.cloudinary.com', Meteor.absoluteUrl('fake.res.cloudinary.com'));
Meteor._debug(HttpInterceptor.getInterceptors());

http.createServer(function(request, response) {
    var interceptors = HttpInterceptor.getInterceptors();
    var oldUrl = request.url;
    var url = oldUrl;
    var host = request.headers['host'];
    var proxy, proxy_request;

    _.each(interceptors, function(newHost, originalHost) {
        if (url.indexOf(originalHost) > -1) {
            Meteor._debug(url, originalHost);
            url = url.replace(originalHost, newHost);
            Meteor._debug('CAPTURING', oldUrl, '->', url);
            host = URL.parse(newHost).hostname;
            Meteor._debug(host);
        }
    });

    proxy = http.createClient(80, host);
    Meteor._debug('Just created a client for: ' + host);
    proxy_request = proxy.request(request.method, url, request.headers);
    Meteor._debug('Using method: ' + request.method);
    Meteor._debug('Accessing URL: ' + url);
    proxy_request.addListener('response', function(proxy_response) {
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
