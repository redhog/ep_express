var hooks = require('ep_carabiner/static/js/hooks');

exports.hookResultMangle = function (cb) {
  return function (err, data) {
    return cb(!err && data.length && data[0]);
  }
}

exports.authorize = function (args, cb) {
  return cb(true);

  if (args.req.session && args.req.session.user && args.req.session.user.is_admin) return cb(true);

  hooks.aCallFirst("authorize", args, exports.hookResultMangle(cb));
}

exports.authenticate = function (args, cb) {
  // If auth headers are present use them to authenticate...
  if (args.req.headers.authorization && args.req.headers.authorization.search('Basic ') === 0) {
    var userpass = new Buffer(args.req.headers.authorization.split(' ')[1], 'base64').toString().split(":")
    args.username = userpass.shift();
    args.password = userpass.join(':');
  }
  hooks.aCallFirst("authenticate", args, exports.hookResultMangle(cb));
}
