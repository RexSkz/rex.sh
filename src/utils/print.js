export default (sh) => {
    return (str, envp) => {
        if (typeof str == 'string') {
            sh.pushLines([str], envp);
        } else {
            for (const s of str) {
                sh.pushLines([s], envp);
            }
        }
    };
};
