import normalizePath from './normalizePath';
import locateFolder from './locateFolder';

export default class FileSystem {
    constructor(opt) {
        this.tree = {
            '': {
                name: '',
                type: 'dr--r--r--',
                size: 0,
                children: {},
            },
        };
    }
    addFiles(files) {
        for (const file of files) {
            const path = normalizePath(file.name).split('/');
            const filename = path.pop();
            let cwd = locateFolder(this.tree, path);
            if (cwd[filename]) {
                console.error(`Duplicate file '${filename}'.`);
                return false;
            }
            file.children = {};
            delete file.name;
            cwd[filename] = file;
        }
    }
}
