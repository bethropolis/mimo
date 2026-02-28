import path from 'node:path';

export function parseArgs(args) {
    const options = {};
    if (args.length === 2 && !args[0].startsWith('--')) {
        options.in = args[0];
        options.out = args[1];
        options.to = 'js';
        return options;
    }
    for (let i = 0; i < args.length; i += 2) {
        const flag = args[i];
        const value = args[i + 1];
        if (flag && flag.startsWith('--')) {
            options[flag.substring(2)] = value;
        }
    }
    return options;
}

/**
 * Determine the target language and converter to use
 */
export function determineTarget(options, registry) {
    let targetLanguage = options.to;

    if (!targetLanguage && options.out) {
        targetLanguage = registry.detectLanguageFromExtension(options.out);
    }

    if (!targetLanguage) {
        targetLanguage = 'js';
    }

    const converterInfo = registry.get(targetLanguage);
    if (!converterInfo) {
        const availableLanguages = registry.getLanguages().join(', ');
        throw new Error(`Unsupported target language: ${targetLanguage}. Available: ${availableLanguages}`);
    }

    return {
        language: targetLanguage,
        converterInfo,
        targetExtension: converterInfo.extension
    };
}
