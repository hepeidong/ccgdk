const Excel = require('exceljs');
const Fs = require('fs');
require('colors');
const { utils } = require('./utils');


function isNote(value) {
    let note = false; //是否是注释，如果开头有#符号，则默认是注释
    if (typeof value === 'string') {
        if (value[0] === '#') {
            note = true;
        }
    }
    return note;
}

function parseValue(type, value) {
    switch (type) {
        case 'int':
        case 'float':
            return Number(value);

        case 'string':
            return String(value);

        case 'bool':
            if (typeof value === 'boolean') {
                return value;
            }
            else {
                if (value === 'false') {
                    return false;
                }
                else if (value === 'true') {
                    return true;
                }
            }
            
        default:
            break;
    }
    return null;
}

function isArray(value) {
    if (typeof value === 'string') {
        if (value[0] === '[' && value[value.length - 1] === ']') {
            return true;
        }
    }
    return false;
}

function parseArray(type, value) {
    value = value.replace(/\s*/g,'');
    if (isArray(value)) {
        const arr = [];
        const str = value.substring(1, value.length - 1);
        const content = str.split(',');
        for (let i = 0; i < content.length; ++i) {
            arr.push(parseValue(type, content[i]));
        }
        return arr;
    }
    return null;
}

function parseTwoDimensionalArray(type, value) {
    value = value.replace(/\s*/g,'');
    if (isArray(value)) {
        const arr = [];
        let str = '';
        for (let i = 1; i < value.length - 1; ++i) {
            if (value[i] === ']') {
                str += value[i];
                arr.push(parseArray(type, str));
                str = '';
                i++;
            }
            else {
                str += value[i];
            }
        }
        return arr;
    }
    return null;
}

function parseType(type, value) {
    switch(type) {
        case 'int':
        case 'float':
        case 'string':
        case 'bool':
           return parseValue(type, value);

        case 'int[]':
        case 'float[]':
            return parseArray('int', value);

        case 'int[][]':
        case 'float[][]':
            return parseTwoDimensionalArray('int', value);

        case 'string[]':
            return parseArray('string', value);

        case 'string[][]':
            return parseTwoDimensionalArray('string', value);

        case 'bool[]':
            return parseArray('bool', value);

        case 'bool[][]':
            return parseTwoDimensionalArray('bool', value);

        default:
            break;
    }
    return null;
}

function getType(type) {
    switch(type) {
        case 'int':
        case 'float':
            return 'number';
    
        case 'bool':
           return 'boolean';

        case 'int[]':
        case 'float[]':
            return 'number[]';

        case 'int[][]':
        case 'float[][]':
            return 'number[][]';

        case 'bool[]':
            return 'boolean[]';

        case 'bool[][]':
            return 'boolean[][]';

        default:
            break;
    }
    return type;
}

function parseExcel(keys, type, notes, row, rowIndex, fileObj, obj, worksheet, rowNumber) {
    let colIndex = 0;
    row.eachCell((cell, colNumber) => {
        // utils.log('row, col', rowNumber, colNumber, cell.value);
        colIndex++;
        const value = cell.value;
        //表格的第一行内容是配置表的各个字段
        if (rowIndex === 1) {
            let key = value.replace(/^\s*|\s*$/g,''); 
            keys[colNumber - 1] = key;
        }
        else if (rowIndex === 2) {
            notes[colNumber - 1] = value;
        }
        //表格的第三行内容是字段的数据类型
        else if (rowIndex === 3) {
            let t = value.replace(/^\s*|\s*$/g,''); 
            type[colNumber - 1] = t;
        }
        else if (rowIndex >= 4) {
            const t = type[colIndex - 1];
            const key = keys[colIndex - 1];
            if (!t) {
                utils.log(`配置表 ${worksheet.name} 第 ${rowNumber} 行，第 ${colNumber} 列的数据缺少指定数据类型，请检查`.error);
                process.exit();
            }
            if (!key) {
                utils.log(`配置表 ${worksheet.name} 第 ${rowNumber} 行，第 ${colNumber} 列的数据缺少指定的关键字段名，请检查`.error);
                process.exit();
            }
            
            const result = parseType(t, value);
            if (result !== null) {
                obj[key] = result
                if (colIndex === 1) {
                    fileObj[worksheet.name][value] = obj;
                }
            }
            else {
                utils.log(`配置表 ${worksheet.name} 第 ${rowNumber} 行，第 ${colNumber} 列数据无法转换，请检查`.error);
                process.exit();
            }
        }
    });
}

function readFile(worksheet, fileObj) {
    const keys = [];   //配置表关键字段
    const type = [];   //配置表字段表示的数值的数据类型
    const notes = [];  //配置表第二行字段的注释
    utils.log('转换配置表 =>', worksheet.name);
    _config_d_ts += '\texport class ' + worksheet.name + '{\n';
    fileObj[worksheet.name] = {};
    let rowIndex = 0; //表示第几行内容，这里的第几行不一定是rowNumber，因为可能存在空行，或者注释
    worksheet.eachRow((row, rowNumber) => {
        let obj = {};
        let hasNote = false;
        row.eachCell((cell) => {
            const value = cell.value;
            if (isNote(value)) {
                hasNote = true;
            }
        });
        //没有注释
        if (!hasNote) {
            rowIndex++;
            parseExcel(keys, type, notes, row, rowIndex, fileObj, obj, worksheet, rowNumber);
        }
    });
    //生成.d.ts内容
    for (let i = 0; i < keys.length; ++i) {
        const key = keys[i];
        const t = type[i];
        const note = notes[i];
        _config_d_ts += '\t\t/**' + note + ' */\n';
        _config_d_ts += '\t\tpublic readonly ' + key + ': ' + getType(t) + ';\n';
    }
    _config_d_ts += '\t}\n\n';
}

var _config_d_ts = '';

module.exports = {
    async excel_reader(src, dst) {
        // utils.log('Call fileReader', src, dst);
        //获取xlsx表格对象
        const workbook = new Excel.Workbook();
        //读取xlsx表格数据
        // await workbook.xlsx.readFile('E:\\test\\TeamConfigure.xlsm');
        await workbook.xlsx.readFile('E:\\test\\Temp.xlsx');//SkillLabel Temp
        _config_d_ts = 'declare namespace config {\n';
        const fileObj = {};
        //读取表格中的每一个子表
        for (const worksheet of workbook.worksheets) {
            readFile(worksheet, fileObj);
        }
        _config_d_ts += '}\n';
        _config_d_ts += 'interface IFileData {\n';
        for (const worksheet of workbook.worksheets) {
            _config_d_ts += `\t${worksheet.name}?: IContainer<config.${worksheet.name}>;\n`;
        }
        _config_d_ts += "}\n";
        _config_d_ts += 'type gdk_file_data = {\n';
        _config_d_ts += '\t[K in keyof IFileData]: Readonly<IFileData[K]>;\n}';
        utils.log(_config_d_ts);
        Fs.writeFileSync('E:\\test\\config.d.ts', _config_d_ts);
        // utils.log('Json file result', fileObj);
        Fs.writeFileSync('E:\\test\\game_config.json', JSON.stringify(fileObj));
        // utils.log(JSON.stringify(fileObj, null, 4));
        process.exit();
    }
}