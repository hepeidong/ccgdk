const Fs = require('fs');
const colors = require('colors');
const minimist = require("minimist");
const { proj_init } = require('./src/proj-init');
const { utils } = require('./src/utils');
const { excel_reader } = require('./src/excel-reader');
const { gdk_task } = require('./src/gdk-task');

const path = utils.cwd('command.json');
const commandStr = Fs.readFileSync(path).toString();
const command = JSON.parse(commandStr);

colors.setTheme({
    error : 'red',
    success : 'green',
    info : 'yellow'
});

console.log(`运行平台${process.platform}`.info);

var argv = minimist(process.argv.slice(2), {
    alias: {
      'directory': 'd',
    },
    string: ['directory'],
    'default': {
      'directory': process.cwd(),
      'help': false
    }
});
// console.log(argv);
if (argv.help) {
  console.log('Usage:'.info);
  console.log('  ccgdk --help              //查看命令介绍'.success);
  console.log('  ccgdk list                //查看游戏框架功能模块'.success);
  console.log('  ccgdk init                //初始化项目，并对项目进行设置'.success);
  console.log('  ccgdk import-data         //转换配置表，并导入游戏项目'.success);
  process.exit();
}

// if(argv.directory && Fs.existsSync(argv.directory)) {
//     console.log('打印文件路径', argv.directory);
// }


function executeCommand() {
  if (argv._[0] && argv._[0].length > 0) {
    const cmd = argv._[0];
    if (cmd === command.init) {
      proj_init();
    }
    else if (cmd === command.importTabel) {
      excel_reader();
    }
    else {
      gdk_task(cmd);
    }
  }
  else if (!argv._[0] || argv._[0] === ' ' || argv._[0].length === 0) {
    console.log('无法识别该命令，请使用 ccgdk --help查看帮助'.error);
    process.exit();
  }
}

executeCommand();