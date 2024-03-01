const exec = require("child_process").exec;
const os = require('os');
hexo.on("new", function(data) {
  switch (os.type()){
    case 'Darwin':
      exec("open -a Typora " + data.path);
    case 'Windows_NT':
      exec("code" + data.path);
    case "Linux":
      exec("code" + data.path);
    default:
      break;
  }
});
