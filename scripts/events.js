var exec = require("child_process").exec;
hexo.on("new", function(data) {
  console.log(data);
  exec("open -a Typora " + data.path);
});
