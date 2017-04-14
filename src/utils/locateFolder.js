export default (root, path) => {
    if (path[0] == '' && path[1] == '') {
        return root[''].children;
    }
    let cwd = root;
    for (const item of path) {
        if (cwd[item] && cwd[item].type[0] == 'd') {
            cwd = cwd[item].children;
        } else {
            console.error(`No such directory '${item}'.`);
            return false;
        }
    }
    return cwd;
};
