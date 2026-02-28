import { MimoToPyConverter } from './to_py.js';

export const config = {
    name: 'python',
    aliases: ['py', 'python'],
    extension: '.py',
    runtimeFile: 'mimo_runtime.py'
};

export { MimoToPyConverter as Converter };
