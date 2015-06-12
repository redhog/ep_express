var hooks = require("ep_carabiner/static/js/hooks");
var express = require('express');
var versions = require('ep_carabiner/node/utils/versions');
var fs = require('fs');
var  _ = require("underscore");
var settings_mod = require('ep_carabiner/node/utils/settings');
var settings = settings_mod.getSettings();

var server;
var serverName;


exports.start = function (hook, args, cb) {
  hooks.aCallAll("serverSettings", {}, function (err, ss) {
    ss.map(function (s) {
      for (var key in s) {
        settings[key] = s[key];
      }
    });
  });
  hooks.callAll("createServer", {});
  cb();
//  hooks.aCallAll("createServer", {}, cb);
}

exports.createServer = function () {
  console.log("Report bugs at https://github.com/redhog/ep_carabiner/issues")

  serverName = settings.name + " (ep_express version " + versions.getGitCommit() + ")";
  
  console.log("Your ep_express version is " + versions.getPackageVersion() + " (" + versions.getGitCommit() + ")");

  exports.restartServer();

  console.log("You can access your server instance at http://" + settings.ip + ":" + settings.port + "/");
  console.log("The plugin admin page is at http://" + settings.ip + ":" + settings.port + "/admin/plugins");
}

exports.restartServer = function () {

  if (server) {
    console.log("Restarting express server");
    server.close();
  }

  var app = express(); // New syntax for express v3

  if (settings.ssl) {

    console.log( "SSL -- enabled");
    console.log( "SSL -- server key file: " + settings.ssl.key );
    console.log( "SSL -- Certificate Authority's certificate file: " + settings.ssl.cert );
    
    var options = {
      key: fs.readFileSync( settings.ssl.key ),
      cert: fs.readFileSync( settings.ssl.cert )
    };
    
    var https = require('https');
    server = https.createServer(options, app);

  } else {

    var http = require('http');
    server = http.createServer(app);
  }

  app.use(function (req, res, next) {
    // res.header("X-Frame-Options", "deny"); // breaks embedded pads
    if(settings.ssl){ // if we use SSL
      res.header("Strict-Transport-Security", "max-age=31536000; includeSubDomains");
    }

    res.header("Server", serverName);
    next();
  });

  if(settings.trustProxy){
    app.enable('trust proxy');
  }

  hooks.callAll("expressConfigure", {"app": app});
  hooks.callAll("expressCreateServer", {"app": app, "server": server});

  server.listen(settings.port, settings.ip);
}
