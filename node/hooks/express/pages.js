var eejs = require("eejs")
var hooks = require("ep_carabiner/static/js/hooks.js");

exports.expressCreateServer = function (hook, args, cb) {
  eejs.blockMangler = function(name, args) {
    hooks.callAll("eejsBlock_" + name, args);
  }
}