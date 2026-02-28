import { MimoToJsConverter } from './to_js.js';

export const config = {
    name: 'javascript',
    aliases: ['js', 'javascript'],
    extension: '.js',
    runtimeFile: 'mimo_runtime.js'
};

export { MimoToJsConverter as Converter };
