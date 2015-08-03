var plugins = require("ep_carabiner/static/js/plugins");
var urlmapper = require("ep_express/node/urlmapper");
var _ = require("underscore");
var url = require('url');
var path = require("path");
var fs = require("fs");
var mime = require('mime');


exports.static = function (args, req, res, cb) {
  if (args.plugin_name) {
    args.plugin_path = plugins.plugins[args.plugin_name].package.path;
  }
  var fs_path = path.normalize(urlmapper.reversePattern(args.src, args));

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
}

exports.authorize = function (hook_name, args, cb) {
  if (args.resource.match(/^\/(static|javascripts|pluginfw|api)/)) {
    return cb(null, [true]);
  } else {
    return cb(null, []);
  }
}

exports.expressCreateServer = function (hook_name, args, cb) {
  // serve plugin definitions
  args.app.get('/plugin-definitions.json', function (req, res, next) {

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
