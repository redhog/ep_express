/* Proviedes a require'able version of jQuery without leaking $ and jQuery;
 * works around wierdnesses in jquerys own packaging that makes dummy be undefined in the call below
 */
// This only works with requirejs... define.amd.jQuery = true;
define(["ep_express/static/js/jquery"], function (dummy) {
  return window.$;
  // Loading jQuery extensions won't work if you use noConflict :/
  // return window.$.noConflict(true);
});
