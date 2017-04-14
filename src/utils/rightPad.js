export default (str, len, ch = ' ') => {
    str = '' + str;
    if (str.length > len) {
        return str;
    }
    for (let i = str.length; i < len; i++) {
        str += ch;
    }
    return str;
};
