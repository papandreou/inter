var fs = require('fs'),
    Path = require('path'),
    constants = process.ENOENT ? process : require('constants'),
    passError = require('passerror'),
    fsTools = module.exports = {};

fsTools.mkpath = function mkpath(dir, permissions, cb) {
    if (typeof permissions === 'function') {
        cb = permissions;
        permissions = parseInt('0777', 8); // Stupid JSLint
    }
    fs.mkdir(dir, permissions, function (err) {
        if (err && (err.code === 'EEXIST' || err.errno === constants.EEXIST)) {
            // Success!
            return cb();
        }
        if (err && (err.code === 'ENOENT' || err.errno === constants.ENOENT)) {
            var parentDir = Path.normalize(dir + "/..");
            if (parentDir !== '/' && parentDir !== '') {
                fsTools.mkpath(parentDir, permissions, passError(cb, function () {
                    fs.mkdir(dir, permissions, function (err) {
                        if (!err || err.code === 'EEXIST' || err.errno === constants.EEXIST) {
                            // Success!
                            return cb();
                        }
                        cb(err);
                    });
                }));
                return;
            }
        }
        cb(err);
    });
};

fsTools.mkpathAndWriteFile = function mkpathAndWriteFile(fileName, contents, encoding, cb) {
    fs.writeFile(fileName, contents, encoding, function (err) {
        if (err && (err.code === 'ENOENT' || err.errno === constants.ENOENT)) {
            fsTools.mkpath(Path.dirname(fileName), passError(cb, function () {
                fs.writeFile(fileName, contents, encoding, cb);
            }));
        } else {
            cb(err);
        }
    });
};
