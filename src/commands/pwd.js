const main = (argc, argv, envp, print) => {
    print(envp['PWD']);
};

main.completions = [
    'pwd',
];

export default main;
