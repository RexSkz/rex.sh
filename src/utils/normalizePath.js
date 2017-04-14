export default (path, cwd = '') => {
    path = path.split('/');
    while (path.length > 1 && path[path.length - 1] == '') {
        path.pop();
    }
    // 若为相对路径，则转换为绝对路径
    if (path[0] != '') {
        path = cwd.split('/').concat(path);
    }
    let result = [];
    for (const item of path) {
        if (item == '.') {
            // Nop
        } else if (item == '..') {
            if (result.length > 1) {
                result.pop();
            }
        } else {
            result.push(item);
        }
    }
    result = result.join('/');
    if (result == '') {
        result = '/';
    }
    return result;
};
