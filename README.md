upload-suite
============
* It's available to upload multiple files.
* Display transmission progress.
* Upload files in the background.
* No Flash, Silverlight, or Java Applet.

Installation
============
```
cd {YOUR_DOCUMENT_ROOT}
git clone git@github.com:virus-warnning/upload-suite.git

edit nginx.conf
in http section
include "{YOUR_DOCUMENT_ROOT}/upload-suite/nginx-http.conf";
in server section
include "{YOUR_DOCUMENT_ROOT}/upload-suite/nginx-server.conf";
reload nginx
```

Requirements
============
* nginx 1.6.2
* nginx upload module
* nginx upload progress module
* PHP FastCGI, with PDO-SQLite
* IE 10+, and other HTML5 browsers. See: [Can I use](http://caniuse.com/#feat=xhr2)
