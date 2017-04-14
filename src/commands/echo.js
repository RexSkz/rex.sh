const main = (argc, argv, envp, print) => {
    argv.shift();
    let doEscape = false;
    if (argv[0] == '-e') {
        argv.shift();
        doEscape = true;
    }
    print((argv || []).join(' ') || '', doEscape ? envp : null);
    return 0;
};

main.completions = [
    'echo',
];

export default main;
