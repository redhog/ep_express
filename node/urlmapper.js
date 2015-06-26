var plugins = require('ep_carabiner/static/js/plugins');

function findAll(re, str) {
  var res = [];
  while ((item = re.exec(str)) !== null) {
    res.push(item);
  }
  return res;
}

exports.matchPattern = function (pattern, str) {
  var re = "^" + pattern.replace(/\(([a-zA-Z_0-9]*:)/g, '(') + "$";
  var keys = findAll(/\(([a-zA-Z_0-9]*):/g, pattern).map(function (match) { return match[1]; });

  var values = new RegExp(re).exec(str);
  if (values == null) return undefined;

  values = values.slice(1);

  var res = {};
  for (var i = 0; i < keys.length; i++) {
    res[keys[i]] = values[i];
  }

  return res;
}

exports.reversePattern = function (pattern, args) {
  for (var key in args) {
    pattern = pattern.replace(new RegExp('\\(' +  key + ':[^)]*\\)'), args[key]);
  }
  return pattern;
}


/* Takes an url and returns a list of matching views. Each match has
 * the properties view and args. */
exports.lookup = function (url, mapname) {
  if (mapname == undefined) mapname = 'urlmap';
  var res = [];
  plugins.parts.forEach(function (part) {
    if (part[mapname] != undefined) {
      for (var pattern in part[mapname]) {
        var match = exports.matchPattern(pattern, url);
        if (match != undefined) {
          res.push({'view': part[mapname][pattern], 'args': match});
        }
      }
    }
  });
  return res;
}

/* Takes a view name and an argument object and returns an URL. */
exports.reverse = function (name, args, mapname) {
  if (mapname == undefined) mapname = 'urlmap';
  for (var i = 0; i < plugins.parts.length; i++) {
    var part = plugins.parts[i];
    if (part[mapname] != undefined) {
      for (var pattern in part[mapname]) {
        if (name == part[mapname][pattern]) {
          return exports.reversePattern(pattern, args);
        }
      }
    }
  }
}
