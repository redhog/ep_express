var express = require('express');
var log4js = require('log4js');
var httpLogger = log4js.getLogger("http");
var settings = require('ep_carabiner/node/utils/settings').getSettings();
var hooks = require('ep_carabiner/static/js/hooks');
var expressSession = require('express-session');
var randomString = require("ep_express/node/utils/randomstring");
var webaccess = require("ep_express/node/webaccess");

/* Authentication OR authorization failed. */
exports.failure = function (args) {
  return hooks.aCallFirst("authFailure", args, webaccess.hookResultMangle(function (ok) {
    if (ok) return;

    /* No plugin handler for invalid auth. Return Auth required
     * Headers, delayed for 1 second, if authentication failed
     * before. */
    args.res.header('WWW-Authenticate', 'Basic realm="Protected Area"');
    if (args.req.headers.authorization) {
      setTimeout(function () {
        args.res.status(401).send('Authentication required');
      }, 1000);
    } else {
      args.res.status(401).send('Authentication required');
    }
  }));
}


//checks for basic http auth
exports.basicAuth = function (req, res, next) {
  /* This is the actual authentication/authorization hoop. It is done in four steps:

     1) Try to just access the thing
     2) If not allowed using whatever creds are in the current session already, try to authenticate
     3) If authentication using already supplied credentials succeeds, try to access the thing again
     4) If all els fails, give the user a 401 to request new credentials

     Note that the process could stop already in step 3 with a redirect to login page.

  */
  var args = {req: req, res:res, next:next, resource: req.path};

  webaccess.authorize(args, function (ok) {
    if (ok) return next();
    webaccess.authenticate(args, function (ok) {
      if (!ok) return failure();
      webaccess.authorize(args, function (ok) {
        if (ok) return next();
        exports.failure(args);
      });
    });
  });
}

exports.secret = null;

exports.expressConfigure = function (hook_name, args, cb) {
  // Measure response time
  args.app.use(function(req, res, next) {
    var sendFn = res.send
    res.send = function() {
      sendFn.apply(res, arguments)
    }
    next()
  })

  // If the log level specified in the config file is WARN or ERROR the application server never starts listening to requests as reported in issue #158.
  // Not installing the log4js connect logger when the log level has a higher severity than INFO since it would not log at that level anyway.
  if (!(settings.loglevel === "WARN" || settings.loglevel == "ERROR"))
    args.app.use(log4js.connectLogger(httpLogger, { level: log4js.levels.DEBUG, format: ':status, :method :url'}));

  /* Do not let express create the session, so that we can retain a
   * reference to it for socket.io to use. Also, set the key (cookie
   * name) to a javascript identifier compatible string. Makes code
   * handling it cleaner :) */

  if (!exports.sessionStore) {
    exports.sessionStore = new expressSession.MemoryStore();
    exports.secret = randomString(32);
  }

  args.app.sessionStore = exports.sessionStore;
  args.app.use(expressSession({secret: exports.secret, store: args.app.sessionStore, resave: true, saveUninitialized: true, name: 'express_sid' }));

  args.app.use(exports.basicAuth);
}

