import normalizePath from '../utils/normalizePath';
import locateFolder from '../utils/locateFolder';

const main = (argc, argv, envp, print, sh) => {
    if (argc == 1) {
        argv.push(envp['HOME']);
    }
    const path = normalizePath(argv[1], envp['PWD']);
    const cwd = locateFolder(sh.filesystem.tree, path.split('/'));
    if (!cwd) {
        print(`bash: cd: ${argv[1]}: No such file or directory`);
    }
    sh.env['PWD'] = path;
};

main.completions = [
    'cd',
];

export default main;
