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
        let validProps = {};
        str = str.replace(/\\033\[([\d;]+)m/g, function (m) {
            let result = '';
            const props = m.replace(/(^\\033\[|m$)/g, '').split(';');
            for (const prop of props) {
                validProps[calcType(prop)] = prop;
            }
            // 如果有 0，则清空当前属性
            if (validProps[0]) {
                validProps = {};
                result = '</span><span>';
            } else {
                let str033 = '';
                for (const prop in validProps) {
                    str033 += ` sh-033-${validProps[prop]}`;
                }
                result = `</span><span class="${str033}">`;
            }
            return result;
        });
        str = `<span>${str}</span>`;
    }
    return str;
};
