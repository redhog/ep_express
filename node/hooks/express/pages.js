var eejs = require("eejs")
var hooks = require("ep_carabiner/static/js/hooks.js");
var urlmapper = require("ep_express/node/urlmapper");
var async = require('async');


exports.render = function (req, res, next) {
  async.eachSeries(urlmapper.lookup(req.url), function (match, cb) {
    if (match.view.indexOf(':') == -1) {
      res.send(eejs.require(match.view, {args:match.args, req:req, urlmapper:urlmapper}));
    } else {
      var view = match.view.split(':');
      plugins.loadModule(view[0], function (err, mod) {
        mod[view[1]](match.args, req, res, cb);
      });
    }

  }, function (err) {
    if (err) console.erro(err);
    next();
  });
}


exports.expressCreateServer = function (hook, args, cb) {
  eejs.blockMangler = function(name, args) {
    hooks.callAll("eejsBlock_" + name, args);
  };

  args.app.all(/.*/, exports.render);
}