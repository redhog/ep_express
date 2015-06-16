var clientVars = {};
(function () {
  var pathComponents = location.pathname.split('/');

  // Strip 'p' and the padname from the pathname and set as baseURL
  var baseURL = pathComponents.slice(0,pathComponents.length-2).join('/') + '/';

  requirejs.config({
      baseUrl: baseURL + "static/plugins",
      paths: {
          'underscore': baseURL + "static/plugins/underscore/static/underscore",
          'async': baseURL + "static/plugins/async/static/lib/async",
          'jquery': baseURL + "static/plugins/ep_express/static/js/rjquery"
      },
  });

  requirejs(
    [
      'ep_express/static/js/rjquery',
      'ep_carabiner/static/js/client_plugins',
      'ep_carabiner/static/js/hooks',
      'ep_express/static/js/browser'
    ], function ($, plugins, hooks, browser) {
      window.$ = $; // Expose jQuery #HACK
      window.jQuery = $;

      if ((!browser.msie) && (!(browser.mozilla && browser.version.indexOf("1.8.") == 0))) {
        document.domain = document.domain; // for comet
      }

      plugins.baseURL = baseURL;
      plugins.update(function () {
        hooks.plugins = plugins;

        // Call documentReady hook
        $(function() {

          var pageName = window.location.pathname.slice(1).replace(/_/g, "/").split("/").map(function (x) {return x.slice(0, 1).toUpperCase() + x.slice(1); }).join("");

          hooks.aCallAll('documentReady', {}, function () {
            hooks.aCallAll('documentReady' + pageName);
          });
        });
      });
    }
  );
}());
