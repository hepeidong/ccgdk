const Fs = require('fs');
require('colors');
const readline = require('readline');
const { utils } = require('./utils');
const rl = readline.createInterface({input: process.stdin,output: process.stdout});

const path = utils.cwd('config_templete.json');
const tempCfgStr = Fs.readFileSync(path).toString();
const tempCfg = JSON.parse(tempCfgStr);

/**
 * 
 * @param {String} query 
 * @param {(answer: string) => void} callback 
 */
function question(query, callback) {
    rl.question(query, (answer) =>{
        callback(answer);
    });
}

function inputName() {
    question('游戏项目名称（必须是英文名）：', (name) => {
        if (name.length > 0) {
            if (!utils.isChinese(name)) {
                tempCfg.name = name;
                inputPath();
            }
            else {
                utils.log('游戏项目名称必须是英文字符'.error);
                inputName();
            }
        }
    });
}

function inputPath() {
    question('项目根目录地址：', (path) => {
        if (path.length > 0) {
            if (utils.isDir(path)) {
                tempCfg.path = path;
                inputMain();
            }
            else {
                console.log('输入的路径不存在'.error);
                inputPath();
            }
        }
        else {
            utils.log('请设置项目根目录地址'.error);
            inputPath();
        }
        
    });
}

function inputMain() {
    let projName = tempCfg.name[0].toUpperCase();
    projName += tempCfg.name.substring(1, tempCfg.name.length) + '.ts';
    question(`程序入口（默认 ${projName}）：`, (main) => {
        if (main.length > 0) {
            if (!utils.isChinese(main)) {
                tempCfg.main = main;
            }
            else {
                utils.log('程序入口脚本名必须是英文字符'.error);
                inputMain();
            }
        }
        else {
            tempCfg.main = projName;
        }
        inputAuthor();
    });
}



function inputAuthor() {
    question('作者：', (author) => {
        tempCfg.author = author;
        const fileUrl = utils.rawUrl(tempCfg.path, 'gdkproj.json');
        Fs.writeFileSync(fileUrl, JSON.stringify(tempCfg, null, 4));
        rl.close;
        process.exit();
    });
}

function proj_init() {
    inputName();
}

module.exports.proj_init = proj_init;
