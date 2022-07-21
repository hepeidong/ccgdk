require('colors');
const Fs = require('fs');

module.exports.utils = {
    getFiles(path) {
        return Fs.readdirSync(path);
    },
    
    isFile(path) {
        const stat = Fs.statSync(path);
        return stat.isFile();
    },

    isDir(path) {
        const stat = Fs.statSync(path);
        return stat.isDirectory();
    },

    log(...args) {
        console.log('[ccgdk]'.gray, ...args);
    },

    cwd(filename) {
        const platform = process.platform;
        var path = process.cwd();
        if (platform === 'win32') {
            path += '\\' + filename;
        }
        else if (platform === 'darwin') {
            path += '/' + filename;
        }
        return path;
    },

    rawUrl(path, filename) {
        let slash = '';
        if (process.platform === 'win32') {
            slash = '\\';
        }
        else if (process.platform === 'darwin') {
            slash = '/';
        }
        return path + slash + filename;
    },

    isChinese(str) {
        let patrn = /[\u4E00-\u9FA5]|[\uFE30-\uFFA0]/gi;
        if (!patrn.exec(str)) {
            return false;
        } else {
            return true;
        }
    }

}