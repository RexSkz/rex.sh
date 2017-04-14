import normalizePath from '../utils/normalizePath';
import locateFolder from '../utils/locateFolder';
import leftPad from '../utils/leftPad';
import rightPad from '../utils/rightPad';

function detail(name, file, flags) {
    if (name == '.' || name == '..') {
        file = {
            type: 'dr--r--r--',
            user: 'root',
            size: 0,
            name: name,
        };
    }
    if (file.type[0] == 'd') {
        name = `\\033[1;34m${name}\\033[0m`;
        if (file.type[3] == 'x' || file.type[6] == 'x' || file.type[9] == 'x') {
            name = `\\033[34;42m${name}\\033[0m`;
        }
    } else if (file.type[0] == 'l') {
        if (flags['l']) {
            name = rightPad(name, 10);
            name = `\\033[1;36m${name}\\033[0m -> \\033[1;36m${file.alias}\\033[0m`;
        } else {
            name = `\\033[1;36m${name}\\033[0m`;
        }
    } else if (file.type[0] == 'b' || file.type[0] == 'c') {
        name = `\\033[1;33m${name}\\033[0m`;
    }
    if (flags['l']) {
        const size = leftPad(file.size, 4);
        return `${file.type} ${file.user} ${size} ${name}`;
    } else {
        return name;
    }
}

function list(cwd, flags) {
    console.log(cwd);
    const result = [];
    if (flags['a']) {
        result.push(detail('.', null, flags));
        result.push(detail('..', null, flags));
    }
    for (const index in cwd) {
        result.push(detail(index, cwd[index], flags));
    }
    return result;
}

const main = (argc, argv, envp, print, sh) => {
    const fs = sh.filesystem;
    const flags = {
        'l': false,
        'a': false,
    };
    switch (argv[0]) {
        case 'll': flags['l'] = true; break;
        case 'la': flags['a'] = true; break;
    }
    argv.shift();
    const dirs = [];
    for (const arg of argv) {
        if (arg[0] == '-') {
            for (let i = 1; i < arg.length; i++) {
                flags[arg[i].toLowerCase()] = true;
            }
        } else {
            if (arg[0] == '\\') {
                arg[0] = arg[0].substr(1, 255);
            }
            dirs.push(normalizePath(arg, envp['PWD']));
        }
    }
    if (dirs.length == 0) {
        dirs.push(envp['PWD']);
    }
    for (const dir of dirs) {
        const cwd = locateFolder(fs.tree, dir.split('/'));
        if (!cwd) {
            print(`ls: cannot access '${dir}': No such file or directory`, envp);
        } else {
            if (dirs.length > 1) {
                print(`${dir}:`, envp);
            }
            if (flags['l']) {
                print(`total ${Object.keys(cwd).length} file(s)`, envp);
            }
            const l = list(cwd, flags);
            print(l, envp);
            if (dirs.length > 1) {
                print('', envp);
            }
        }
    }
    return 0;
};

main.completions = [
    'ls',
    'll',
    'la',
];

export default main;
