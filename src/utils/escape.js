const calcType = x => {
    if (30 <= x && x <= 37) return 30;
    if (40 <= x && x <= 47) return 40;
    else return x;
};

export default (str, envp) => {
    if (envp) {
        str = str.replace(/\$([a-z_][\w_]*|[0-9#@\*\$!]|{[^\s]+})/gi, function (m) {
            return envp[m.substr(1, 255)] || '';
        });
        str = str.replace(/[<&]/g, function (m) {
            return m == '<' ? '&lt;' : '&amp;'
        });
        const stack = [];
        str = str.replace(/\\033\[([\d;]+)m/g, function (m) {
            let result = '';
            const props = m.replace(/(^\\033\[|m$)/g, '').split(';');
            const validProps = {};
            for (const prop of props) {
                validProps[calcType(prop)] = prop;
            }
            // 如果有 0，则全部属性出栈
            if (validProps[0]) {
                while (stack.length > 0) {
                    stack.pop();
                    result += '</span>';
                }
            } else {
                // 如果有与栈中某一元素相同类型的属性，则用其覆盖
                // 这里必须倒着扫，因为需要先闭合最近的标签
                for (let i = stack.length - 1; i >= 0; i--) {
                    let tp = calcType(stack[i]);
                    if (validProps[tp]) {
                        stack[stack.length - 1] = validProps[tp];
                        delete validProps[tp];
                        result += `</span><span class="sh-033-${validProps[tp]}">`;
                    }
                }
                // 如果 validProps 有剩余，则全部入栈
                for (const tp in validProps) {
                    stack.push(validProps[tp]);
                    result += `<span class="sh-033-${validProps[tp]}">`;
                }
            }
            return result;
        });
    }
    return str;
};
