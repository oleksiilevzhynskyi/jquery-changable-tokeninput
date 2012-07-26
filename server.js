var http = require('http'),
    fs = require('fs'),
    path = require('path'),
    requestListener;

requestListener = (function () {
    var listener,
        logger,
        detectContentType,
        settings = {
            dir: "./",
            root: "index.html",
            defaultExt: '.html',
            defaultContentType: 'text/plain',
            encoding: 'utf-8'
        };

    logger = function (url, status) {
        console.log('[ serving: ' + url + ' - ' + status + ' ]');
    };

    detectContentType = function (ext) {
        var contentType = {
            'js'    : 'text/javascript',
            'css'   : 'text/css',
            'html'  : 'text/html',
            'htm'   : 'text/html',
            'ico'   : 'image/vnd.microsoft.icon',
            'png'   : 'image/png',
            'jpg'   : 'image/jpeg',
            'jpeg'  : 'image/jpeg',
            'gif'   : 'image/gif'
        };
        return contentType[ext.slice(1)] || settings.defaultContentType;
    };

    listener = function (request, response) {
        var url = request.url.trim().toLowerCase().replace(/\?.*$/,''),
            file = settings.dir + url,
            ext;
        // root
        if (url === '/') {
            file += settings.root;
        }
        ext = path.extname(file);
        // url without extension
        if (ext === '') {
            file = file.replace(/\/$/, '');
            ext = settings.defaultExt;
            file += ext;
        }
        // serving requested file
        path.exists(file, function (exist) {
            var status = 'async is evel!';
            if (exist) {
                fs.readFile(file, function (err, content) {
                    if (err) {
                        logger(url, 500);
                        response.writeHead(500);
                        response.end();
                    } else {
                        logger(url, 200);
                        response.writeHead(200, { 'Content-Type': detectContentType(ext) });
                        response.end(content, settings.encoding);
                    }
                });
            } else {
                logger(url, 404);
                response.writeHead(404);
                response.end();
            }
        });
    };

    return listener;
}());

http.createServer(requestListener).listen(8080, function () {
    console.log('Server running at http://127.0.0.1:8080');
});