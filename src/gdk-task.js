const { utils } = require("./utils");

function runTask(task, cmd) {
    utils.log("开始 '" + cmd.cyan + "' ...");
    return new Promise((resolve, reject) => {
        let flag = false;
        task((...args) => {
        flag = true;
        utils.log("完成 '" + cmd.cyan + "' 之后...");
        if (args) {
            resolve(args);
        }
        else {
            resolve(flag);
        }
        });
        if (!flag) {
        reject(false);
        }
    });
}

function execSeqTask(result, cmd) {
    const promiseArr = [];
    for (const func of result) {
        promiseArr.push(runTask(func, func.name).then((val) => {
            if (typeof val !== 'boolean') {
                execSeqTask(val, cmd);
            }
        }).catch((err) => {
            if (err) {
                utils.log(err.error);
                return;
            }
            utils.log('以下任务未完成:'.error, cmd.cyan);
            utils.log('缺少任务完成的回调？'.error);
            process.exit();
        }));
    }
    Promise.all(promiseArr).then(() => {
        utils.log(`任务 '${cmd}' 运行成功...`.success);
        process.exit();
    });
}
  
async function execGdkfileTask(task, cmd) {
    const result = await runTask(task, cmd).catch((err) => {
        if (err) {
            utils.log(err.error);
            return;
        }
        utils.log('以下任务未完成:'.error, cmd.cyan);
        utils.log('缺少任务完成的回调？'.error);
        process.exit();
    });
    if (result) {
        if (typeof result !== 'boolean') {
            execSeqTask(result, cmd);
        }
        else {
            process.exit();
        }
    }
}

function gdk_task(cmd) {
    if (utils.isFile('E:\\test\\gdkfile.js')) {
        const task = require('E:\\test\\gdkfile.js');
        if (typeof task[cmd] === 'function') {
            utils.log('执行 gdkfile...');
            execGdkfileTask(task[cmd], cmd);
        }
    }
}

module.exports.gdk_task = gdk_task;