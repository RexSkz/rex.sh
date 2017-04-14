const toArray = (obj, preStr = '') => {
    let result = [];
    for (let index in obj) {
        if (index.indexOf(preStr) == 0) {
            result.push(index.trim());
        }
    }
    return result;
};

// 尽可能往后无歧义地补全
export function tryComplete(str, completions, cmd = false) {
    // 只需要补全最后一个空格到光标处的文字
    let t = str.replace(/\ +/, ' ').split(' ');
    const last = t.pop();
    // 整理出一个可能的列表
    const options = toArray(completions, last);
    if (last.length == 0) {
        return options.length == 1 ? options[0] : last;
    }
    if (!options[0]) {
        return str;
    }
    // 计算列表所有项的最长公共前缀
    // 枚举长度
    for (let i = last.length; i <= options[0].length; i++) {
        // 枚举串
        for (let j = 0; j < options.length; j++) {
            // 有一个串刚好完整匹配
            if (options[j].length == i) {
                t.push(options[j]);
                return t.join(' ') + ((cmd && options.length == 1) ? ' ' : '');
            }
            // 在第 i 位有了区别，说明前 i - 1 位是好的
            if (j > 0 && options[j][i] != options[j - 1][i]) {
                t.push(options[j].substr(0, i));
                return t.join(' ');
            }
        }
    }
    return str;
};

// 输出一个可能的补全列表
export function showCompletions(str, completions) {
    // 只需要补全最后一个空格到光标处的文字
    let t = str.replace(/\ +/, ' ').split(' ');
    const last = t.pop();
    const options = toArray(completions).sort();
    const nonPre = options.filter(item => item.indexOf(last) != 0);
    const preResult = options.filter(item => item.indexOf(last) == 0);
    let lcsResult = [];
    for (const item of nonPre) {
        // 计算 item 和 last 的最长公共子串
        let f = [];
        for (var i = 0; i < item.length; i++) {
            f[i] = [];
            for (var j = 0; j < last.length; j++) {
                if (i == 0 || j == 0) {
                    f[i][j] = 0;
                } else if (item[i] == last[j]) {
                    f[i][j] = f[i - 1][j - 1] + 1;
                } else {
                    f[i][j] = Math.max(f[i - 1][j], f[i][j - 1]);
                }
            }
        }
        const word = item;
        const ans = f[item.length - 1][last.length - 1];
        // 足够匹配，或者原串为空，这个解才可以被采纳
        if (ans >= last.length / 2 || str == '') {
            lcsResult.push({ word, ans });
        }
    }
    lcsResult = lcsResult.sort((x, y) => y.ans - x.ans).map(item => item.word);
    return {
        preMatch: preResult,
        lcsMatch: lcsResult,
    };
};
