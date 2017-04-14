const main = (argc, argv, envp, print) => {
    const article = [
        '\\033[32m> 简介\\033[0m',
        '    Rex.sh 是一个适用于浏览器的伪终端，可以用来做一些有趣的事情。',
        '\\033[32m> 功能\\033[0m',
        '    中文、颜色显示，自动补全，文件系统，变量引用。',
        '\\033[32m> 开发指南\\033[0m',
        '    使用方法: 引入 rexsh.js，然后使用如下方法创建一个 Shell。',
        '        const sh = new Rexsh();',
        '        sh.attachTo(document.getElementById(id));',
        '    全部接口:',
        '        添加命令: sh.addCommand(\'cmd\', func)',
        '        环境变量: sh.setEnvs([\'name1=value1\', \'name2=value2\'])',
        '        显示文字: sh.pushLines([\'line1\', \'line2\'])',
        '        执行命令: sh.execute(\'cmd\')',
        '    扩展命令:',
        '        1. 本地执行 npm install；',
        '        2. 编写命令的 .js 文件，并置于 src/commands 目录下；',
        '        3. 在 src/rexsh.js 中 import 对应的模块；',
        '        4. 在 src/rexsh.js 最下面的 addCommands 处添加命令，或直接对实例使用 sh.addCommand；',
        '        5. 直接输入 webpack 即可在 dist 目录下查看编译结果。',
        '\\033[1m如果接下来不知道要敲什么命令，可以敲一下 Tab 键哦！\\033[0m',
    ];
    for (const line of article) {
        print(line, envp);
    }
    return 0;
};

main.completions = [
    'help',
];

export default main;
