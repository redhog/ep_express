var eejs = require("eejs")
var hooks = require("ep_carabiner/static/js/hooks.js");
var urlmapper = require("ep_express/node/urlmapper");
var async = require('async');
var plugins = require('ep_carabiner/static/js/plugins');
var webaccess = require('ep_express/node/webaccess');

function extractSocketIoRegistrationList() {
  var registrations = [];
  plugins.parts.forEach(function (part) {
    if (part.iomap != undefined) {
      for (var message in part.iomap) {
        var handler = part.iomap[message].split(":");
        var namespace = '/';
        if (message.indexOf(":") != -1) {
          message = message.split(":");
          namespace = message[0];
          message = message[1];
        }
        registrations.push({namespace: namespace, message: message, handler_mod: handler[0], handler_fn: handler[1]});
      }
    }
  });
  return registrations;
}

function loadSocketIoRegistrationList(cb) {
  var registrations = extractSocketIoRegistrationList();
  async.each(
    registrations,
    function (registration, cb) {
      plugins.loadModule(registration.handler_mod, function (mod) {
        registration.handler = mod[registration.handler_fn];
        cb();
      });
    },
    function () {
      cb(registrations);
    }
  );
}

function loadSocketIoRegistrations(cb) {
  loadSocketIoRegistrationList(function (registrations) {
    var namespaces = {};
    registrations.map(function (registration) {
      if (namespaces[registration.namespace] == undefined) {
        namespaces[registration.namespace] = {};
      }
      namespaces[registration.namespace][registration.message] = registration.handler;
    });

      console.log(["socket.io", namespaces]);
    cb(namespaces);
  });
}

function registerSocketIoNamespace(io, namespaces) {
  Object.keys(namespaces).map(function (namespace) {
    var registrations = namespaces[namespace];

    var channel = io.of(namespace);
    channel.on('connection', function (socket) {

      Object.keys(registrations).map(function (message) {
        var handler = registrations[message];
        socket.on(message, function () {
          var handler_args = [channel, socket].concat(Array.prototype.slice.call(arguments));
          webaccess.authorize({req: socket.conn.request, resource: namespace + ":" + message}, function (authorized) {
            if (!authorized) {
              console.warn("Unauthorized socket io request: " + namespace + ":" + message);
            } else {
              handler.apply(this, handler_args);
            }
          });
        });
      });

    });
  });
}

exports.socketio = function (hook_name, args, cb) {
  loadSocketIoRegistrations(function (namespaces) {
    registerSocketIoNamespace(args.io, namespaces);
    cb();
  });
}

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