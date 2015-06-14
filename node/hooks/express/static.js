var plugins = require("ep_carabiner/static/js/plugins");
var _ = require("underscore");
var url = require('url');
var path = require("path");
var fs = require("fs");
var mime = require('mime');

exports.authorize = function (hook_name, args, cb) {
  if (args.resource.match(/^\/(static|javascripts|pluginfw|api)/)) {
    return cb(null, [true]);
  } else {
    return cb(null, []);
  }
}

exports.expressCreateServer = function (hook_name, args, cb) {
  args.app.all(/\/static\/plugins\/([^\/]*)\/static\/(.*)/, function (req, res, next) {
    var url_path = url.parse(req.url).pathname.substring('/static/plugins/'.length);
    var idx = url_path.indexOf("/");
    var plugin_name = url_path.substring(0, idx);
    url_path = url_path.substring(idx + 1);
    var fs_path = path.normalize(path.join(plugins.plugins[plugin_name].package.path, url_path));

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

  // serve plugin definitions
  args.app.get('/pluginfw/plugin-definitions.json', function (req, res, next) {

    var clientParts = _(plugins.parts)
      .filter(function(part){ return _(part).has('client_hooks') });
      
    var clientPlugins = {};
    
    _(clientParts).chain()
      .map(function(part){ return part.plugin })
      .uniq()
      .each(function(name){
        clientPlugins[name] = _(plugins.plugins[name]).clone();
        delete clientPlugins[name]['package'];
      });
      
    res.header("Content-Type","application/json; charset=utf-8");
    res.write(JSON.stringify({"plugins": clientPlugins, "parts": clientParts}));
    res.end();
  });
}
