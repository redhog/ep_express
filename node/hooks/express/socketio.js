var settings = require('ep_carabiner/node/utils/settings').getSettings();
var socketio = require('socket.io');
var hooks = require("ep_carabiner/static/js/hooks");
var webaccess = require("ep_express/node/hooks/express/webaccess");

var cookieParser = require('cookie-parser');
var sessionModule = require('express-session');
 
exports.expressCreateServer = function (hook_name, args, cb) {
  //init socket.io and redirect all requests to the MessageHandler
  // there shouldn't be a browser that isn't compatible to all
  // transports in this list at once
  // e.g. XHR is disabled in IE by default, so in IE it should use jsonp-polling
  var io = socketio({
    transports: settings.socketTransportProtocols || ['xhr-polling', 'jsonp-polling', 'htmlfile']
  }).listen(args.server);

  /* Require an express session cookie to be present, and load the
   * session. See http://www.danielbaulig.de/socket-ioexpress for more
   * info */
  var cookieParserFn = cookieParser(webaccess.secret, {});

  io.use(function(socket, accept) {
    var data = socket.request;
    // Use a setting if we want to allow load Testing
    if(!data.headers.cookie && settings.loadTest){
      accept(null, true);
    }else{
      if (!data.headers.cookie) return accept('No session cookie transmitted.', false);
    }
    cookieParserFn(data, {}, function(err){
      if(err) {
        console.error(err);
        accept("Couldn't parse request cookies. ", false);
        return;
      }

      data.sessionID = data.signedCookies.express_sid;
      args.app.sessionStore.get(data.sessionID, function (err, session) {
        if (err || !session) return accept('Bad session / session has expired', false);
        data.session = new sessionModule.Session(data, session);
        accept(null, true);
      });
    });
  });

  hooks.callAll("socketio", {"app": args.app, "io": io, "server": args.server});
}
