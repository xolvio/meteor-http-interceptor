/**
 * Simplistic proxy to allow for some client side interception fu
 *
 * Intercepting client side calls to hosts registered with HttpInterceptor.registerInterceptor()
 *
 * =NOTE= HTTP only.
 */
var HTTP = Npm.require('http');
var URL = Npm.require('url');

var _PORT_OFFSET = 42;
var _port = Number(URL.parse(process.env.ROOT_URL).port);
var _proxyPort = _port + _PORT_OFFSET;

log.info('Starting a proxy server to intercept client side calls on port: ' + _proxyPort);

HTTP.createServer(function(request, response) {
    var interceptors = HttpInterceptor.getInterceptors();
    var oldUrl = request.url;
    var url = oldUrl;
    var host = request.headers['host'];
    var port = 80;
    var proxyRequest, requestOptions;

    // Catch and strip port from localhost calls
    if (/localhost:/.test(host)) {
        port = URL.parse('http://' + host).port;
        host = 'localhost';
    }

    _.each(interceptors, function(newHost, originalHost) {
        if (url.indexOf(originalHost) > -1) {
            url = url.replace(originalHost, newHost);
            log.debug('CAPTURING', oldUrl, '->', url);
            host = URL.parse(newHost).hostname;
        }
    });

    requestOptions = {
        host: host,
        port: port,
        path: url,
        method: request.method
    };
    log.debug('Just created a proxy request for: ' + host);
    log.debug('Accessing URL: ' + url);
    log.debug('On port : ' + port);

    proxyRequest = HTTP.request(requestOptions, function(proxyResponse) {
        proxyResponse.pipe(response);
        //proxyResponse.on('data', function(chunk) {});
        response.writeHead(proxyResponse.statusCode, proxyResponse.headers)
    });
    request.pipe(proxyRequest);

    request.on('error', function(e) {
        log.error('problem with request: ' + e.message);
    });

}).listen(_proxyPort);
