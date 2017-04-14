import uuid from 'uuid';
import clone from 'clone';
import escape from './utils/escape';
import locateFolder from './utils/locateFolder';
import normalizePath from './utils/normalizePath';
import print from './utils/print';
import { tryComplete, showCompletions } from './utils/autocomplete';
import FileSystem from './utils/filesystem';
import cd from './commands/cd';
import echo from './commands/echo';
import help from './commands/help';
import ls from './commands/ls';
import pwd from './commands/pwd';

import './rexsh.css';

console.log("%cRex.sh 1.0.0 by Rex Zeng", "color:#333");

class Rexsh {
    constructor(opt) {
        this.id = uuid.v4();
        this.sh = document.createElement('div');
        this.sh.id = `sh-${this.id}`;
        this.sh.className = 'sh-outside';
        this.tpl = `
            <div class="sh-screen"></div>
            <div class="sh-input-area"><span class="sh-input-display">$PS1</span><span class="sh-input-blink">&nbsp;</span><span class="sh-input-over"></span><input type="text" class="sh-input-txt"></div>
            <div class="sh-autocomplete"></div>`;
        this.env = {
            'HOME': '',
            'PS1': '$ ',
            'PWD': '',
        };
        this.commands = {};
        this.completions = {};
        this.completionState = 0;
        this.filesystem = new FileSystem();
        this.history = [];
        this.historyIndex = 0;
    }
    addCommand(name, func) {
        if (typeof name == 'string') {
            this.commands[name] = func;
            this.addCompletions(func.completions);
        } else {
            for (const item of name) {
                this.commands[item] = func;
                this.addCompletions(func.completions);
            }
        }
    }
    setEnvs(envs) {
        for (const env of envs) {
            const pos = env.indexOf('=');
            const name = env.substr(0, pos);
            const value = env.substr(pos + 1, 255);
            this.env[name] = value;
        }
    }
    addFiles(files) {
        this.filesystem.addFiles(files);
    }
    addCompletions(completions) {
        for (const c of completions) {
            this.completions[c] = true;
        }
    }
    pushLines(lines, envp = null) {
        const screen = this.sh.querySelector('.sh-screen');
        for (const line of lines) {
            const dom = document.createElement('div');
            dom.className = 'sh-line';
            dom.innerHTML = escape(line, envp);
            screen.appendChild(dom);
        }
    }
    execute(cmd) {
        this.history.push(cmd);
        this.historyIndex = this.history.length;
        const argv = cmd.trim().split(' ');
        const envp = clone(this.env);
        // 为环境变量赋值
        while (argv.length > 0) {
            if (argv[0][0] != '.' && argv[0].indexOf('=') >= 0) {
                const pos = argv[0].indexOf('=');
                const name = argv[0].substr(0, pos);
                const value = argv[0].substr(pos + 1, 255);
                envp[name] = value;
                argv.shift();
            } else {
                break;
            }
        }
        // 这是全局环境变量
        if (argv.length == 0) {
            this.env = clone(envp);
            return;
        }
        // 执行命令所对应的程序，并将参数传入
        if (typeof this.commands[argv[0]] == 'function') {
            this.commands[argv[0]](argv.length, argv, envp, print(this, envp), this);
        } else {
            this.pushLines([`bash: ${argv[0]}: command not found`]);
        }
    }
    addListener() {
        const input = this.sh.querySelector('.sh-input-txt');
        const display = this.sh.querySelector('.sh-input-display');
        const blink = this.sh.querySelector('.sh-input-blink');
        const over = this.sh.querySelector('.sh-input-over');
        const complete = this.sh.querySelector('.sh-autocomplete');
        const syncWithInput = () => setTimeout(() => {
            const pos = input.selectionStart;
            const pre = input.value.substr(0, pos) || '';
            const cur = input.value[pos] || ' ';
            const post = input.value.substr(pos + 1, 255) || '';
            display.innerText = this.env['PS1'] + pre;
            blink.innerText = cur;
            over.innerText = post;
            over.scrollIntoView();
        }, 10);
        input.addEventListener('keydown', e => {
            // 不是 Ctrl、Meta、Alt、Shift、Tab、Caps 则取消补全状态的显示
            if (
                !e.ctrlKey && !e.metaKey && !e.altKey && !e.shiftKey &&
                e.keyCode != 9 && e.keyCode != 20
            ) {
                if (this.completionState >= 1) {
                    complete.innerHTML = '';
                    e.preventDefault();
                }
            }
            if (e.ctrlKey) {
                // Ctrl 的组合键
                switch (e.keyCode) {
                    case 65: // A
                        input.setSelectionRange(0, 0);
                        break;
                    case 67: // C
                        const cmd = input.value;
                        input.value = input.value.replace(/[<&]/g, function (m) {
                            return m == '<' ? '&lt;' : '&amp;'
                        });
                        input.value = '';
                        syncWithInput();
                        this.pushLines([this.env['PS1'] + cmd + '^C']);
                        break;
                    case 69: // E
                        input.setSelectionRange(input.value.length, input.value.length);
                        break;
                }
                e.preventDefault();
                return false;
            } else if (e.keyCode == 38 || e.keyCode == 40) {
                e.preventDefault();
                // 上下方向键
                this.historyIndex += (e.keyCode - 39);
                this.historyIndex = Math.max(this.historyIndex, 0);
                this.historyIndex = Math.min(this.historyIndex, this.history.length - 1);
                if (this.history.length == 0) {
                    return false;
                } else {
                    input.value = this.history[this.historyIndex];
                    syncWithInput();
                }
            } else if (e.keyCode == 13) {
                // Enter
                const cmd = input.value;
                input.value = input.value.replace(/[<&]/g, function (m) {
                    return m == '<' ? '&lt;' : '&amp;'
                });
                input.value = '';
                syncWithInput();
                this.pushLines([this.env['PS1'] + cmd]);
                if (cmd.length > 0) {
                    this.execute(cmd);
                }
            } else if (e.keyCode == 9) {
                // Tab
                this.completionState++;
                const pos = input.selectionStart;
                const pre = input.value.substr(0, pos) || '';
                const other = input.value.substr(pos, 255) || '';
                // 假定第一个单词一定是命令，后面的都是文件
                const isCmd = pre.split(' ').length < 2;
                let path = [];
                let filename = [];
                let files = {};
                if (!isCmd) {
                    // 只需要补全最后一个路径
                    const lastPath = pre.split(' ').pop();
                    path = normalizePath(lastPath, this.env['PWD']).split('/');
                    // 不同于普通的定位，这儿需要一个空字符串占位
                    if (lastPath[lastPath.length - 1] == '/') {
                        path.push('');
                    }
                    filename = path.pop();
                    // 将该路径下的全部文件/文件夹作为补全列表
                    files = locateFolder(this.filesystem.tree, path);
                }
                let comp = '';
                // 尽量往后补全
                if (isCmd) {
                    comp = tryComplete(pre, this.completions, true);
                } else {
                    let result = tryComplete(filename, files);
                    let pathArr = pre.split(' ');
                    if (pathArr.length > 1) {
                        let lastPath = pathArr.pop();
                        lastPath = lastPath.split('/');
                        lastPath.pop();
                        lastPath.push(result);
                        comp = pathArr.join(' ') + ' ' + lastPath.join('/');
                    } else {
                        let lastPath = pathArr.split('/');
                        lastPath.pop();
                        lastPath.push(result);
                        comp = pathArr.join(' ') + ' ' + lastPath.join('/');
                    }
                    if (files && files[result]) {
                        if (files[result].type[0] == 'd') {
                            comp += '/';
                        } else {
                            comp += ' ';
                        }
                    }
                }
                input.value = comp + other;
                input.setSelectionRange(comp.length, comp.length);
                syncWithInput();
                // 显示补全选项
                if (this.completionState >= 2) {
                    if (isCmd) {
                        comp = showCompletions(pre, this.completions);
                    } else {
                        comp = showCompletions(filename, files);
                    }
                    let s = '';
                    if (comp.preMatch.length > 0) {
                        s = '<div class="sh-line"><span class="sh-033-30 sh-033-47">补全列表</span></div><div class="sh-line">';
                        for (const item of comp.preMatch) {
                            s += `<span class="sh-autocomplete-item">${item}</span>`;
                        }
                        s += '</div>';
                    }
                    if (comp.lcsMatch.length > 0) {
                        s += '<div class="sh-line"><span class="sh-033-30 sh-033-47">可能的输入</span></div><div class="sh-line">';
                        for (const item of comp.lcsMatch) {
                            s += `<span class="sh-autocomplete-item">${item}</span>`;
                        }
                        s += '</div>';
                    }
                    if (s != '') {
                        complete.innerHTML = s;
                    }
                }
                e.preventDefault();
                return false;
            } else {
                if (this.completionState >= 1) {
                    this.completionState = 0;
                    const pos = input.selectionStart;
                    const pre = (input.value.substr(0, pos) || '') + (e.key.length > 1 ? '' : e.key);
                    const other = input.value.substr(pos, 255) || '';
                    input.value = pre + other;
                    input.setSelectionRange(pre.length, pre.length);
                }
                input.focus();
                syncWithInput();
            }
        });
        input.addEventListener('keydown', syncWithInput);
        let origStart = 0;
        input.addEventListener('blur', e => {
            origStart = e.srcElement.selectionStart;
        });
        document.addEventListener('mouseup', e => {
            if (window.getSelection().toString().length == 0) {
                if (input != document.activeElement) {
                    input.focus();
                    input.setSelectionRange(origStart, origStart);
                }
            }
        });
        input.focus();
    }
    attachTo(dom) {
        this.sh.innerHTML = this.tpl.replace('$PS1', this.env['PS1']);
        dom.appendChild(this.sh);
        this.addListener();
        const addCommands = () => {
            this.addCommand('cd', cd);
            this.addCommand('echo', echo);
            this.addCommand('help', help);
            this.addCommand(['ls', 'll', 'la'], ls);
            this.addCommand('pwd', pwd);
        };
        addCommands();
        console.log(`Shell '${this.id}' attached.`)
    }
}

module.exports = Rexsh;
