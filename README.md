upload-suite
============

Make HTML upload easily to use

Installation
============
cd {YOUR_DOCUMENT_ROOT}
git clone git@github.com:virus-warnning/upload-suite.git

edit nginx.conf
in http section
include "{YOUR_DOCUMENT_ROOT}/upload-suite/nginx-http.conf";
in server section
include "{YOUR_DOCUMENT_ROOT}/upload-suite/nginx-server.conf";
reload nginx

Requirements
============
* nginx 1.6.2
* nginx upload module
* nginx upload progress module
* PHP FastCGI, with PDO-SQLite
* IE 10+
