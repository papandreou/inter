module.exports = function leftPad(str, length, padChar) {
    padChar = padChar || ' ';
    str = String(str);
    while (str.length < length) {
        str = padChar + str;
    }
    return str;
};
