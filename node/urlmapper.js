var plugins = require('ep_carabiner/static/js/plugins');

/* Plugins can define a a property 'urlmap' in ep.json that contains a
 * mapping from URL patterns to view names: "urlmap": {"pattern1":
 * "view1", "pattern2": "view2", ...}
 *
 * Patterns are regular expression strings, suitable for giving to new
 * RegExp(), with one extension:
 *
 *   (name:expression)
 *      Named group. Matches expression and remembers it, similar to
 *      (expression), but stores the match under the name 'name'.
 *      'name' must consist of the letters a-z, A-Z and 0-9 only.
 *
 * View names come in two flavors:
 *
 *   module/submodule/.../submodule:functionname
 *     Refers to a function(args, req, res, next) in a javascript
 *     module. Args is an object with match values from the request
 *     url for any named groups in the pattern.
 *
 *   module/submodule/.../submodule
 *     Refers to an EJS template. The ejs template will have access to
 *     args and req with the same semantics as described above.
 *
 */

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


/* Takes an url and returns a list of matching view. Each match has
 * the properties view and args. */
exports.lookup = function (url) {
  var res = [];
  plugins.parts.forEach(function (part) {
    if (part.urlmap != undefined) {
      for (var pattern in part.urlmap) {
        var match = exports.matchPattern(pattern, url);
        if (match != undefined) {
          res.push({'view': part.urlmap[pattern], 'args': match});
        }
      }
    }
  });
  return res;
}

/* Takes a view name and an argument object and returns an URL. */
exports.reverse = function (name, args) {
  for (var i = 0; i < plugins.parts.length; i++) {
    var part = plugins.parts[i];
    if (part.urlmap != undefined) {
      for (var pattern in part.urlmap) {
        if (name == part.urlmap[pattern]) {
          return exports.reversePattern(pattern, args);
        }
      }
    }
  }
}
