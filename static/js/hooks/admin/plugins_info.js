define([], function () {
  return {
    documentReadyAdmin:  function (hook, args, cb) {
      $('.menu ul').append("<li><a href='/admin/plugins/info'>Troubleshooting information</a></li>");
      cb();
    },
  };
});
