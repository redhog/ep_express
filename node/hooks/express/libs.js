var plugins = require("ep_carabiner/static/js/plugins");
var _ = require("underscore");
var url = require('url');
var path = require("path");
var fs = require("fs");
var mime = require('mime');
var npm = require("npm/lib/npm.js");

exports.expressCreateServer = function (hook_name, args, cb) {
  args.app.all(/\/static\/plugins\/(requirejs)|(underscore)|(async)\/static\/(.*)/, function (req, res, next) {
    var url_path = url.parse(req.url).pathname.substring('/static/plugins/'.length);
    var idx = url_path.indexOf("/");
    var lib_name = url_path.substring(0, idx);

    url_path = url_path.substring(idx + 1);

    // remove 'static'
    var idx = url_path.indexOf("/");
    url_path = url_path.substring(idx + 1);

    var fs_path = path.normalize(path.join(plugins.plugins.ep_express.package.path, "node_modules", lib_name, url_path));

    fs.readFile(fs_path, function (error, content) {
      if (error) {
        console.error(error);
        res.writeHead(500, {});
        res.end();
        return
      }
      res.header("Content-Type", mime.lookup(fs_path));
      res.writeHead(200, {});
      res.write(content);
      res.end();
    });
  });
}
