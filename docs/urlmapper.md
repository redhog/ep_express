# The URL mapper

Plugins can define properties in ep.json that contains a mapping from
URL patterns to view names: "urlmap": {"pattern1": "view1",
"pattern2": "view2", ...}. These mappings are used to register view
functions and templates with the express webserver, and rpc functions
with the socketio rpc server.

## Patterns
Patterns are regular expression strings, suitable for giving to new
RegExp(), with one extension:

  (name:expression)
     Named group. Matches expression and remembers it, similar to
     (expression), but stores the match under the name 'name'.
     'name' must consist of the letters a-z, A-Z and 0-9 only.


## Maps
Two mapping properties for ep.json are supported by default, urlmap
and iomap.

### urlmap
Defines a URL mapping for the express webserver.
Patterns match against the path portion of the request url.

View names come in two flavors:

  module/submodule/.../submodule:functionname
    Refers to a function(args, req, res, next) in a javascript
    module. Args is an object with match values from the request
    url for any named groups in the pattern.

  module/submodule/.../submodule
    Refers to an EJS template. The ejs template will have access to
    args and req with the same semantics as described above.

### iomap
Defines a channel/function map for the socketio. Patterns match
against channel_path:function_name. View names are
module/submodule/.../submodule:functionname refering to a function
(room, connection, ...)

## API

urlmapper.lookup(url, mapname='urlmap')
    Takes an url and returns a list of matching views. Each match has
    the properties view and args.

urlmapper.reverse(name, args, , mapname='urlmap')
    Takes a view name and an argument object and returns an URL.

By specifying a value for the urlmap parameter, another attribute
value in ep.json than "urlmap" can be used for the lookup.
