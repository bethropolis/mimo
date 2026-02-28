import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export class ConverterRegistry {
    constructor() {
        this.converters = new Map();
    }

    /**
     * Register a converter for a target language
     */
    register(language, extension, ConverterClass, runtimeFile = null) {
        this.converters.set(language, {
            extension,
            ConverterClass,
            runtimeFile
        });
    }

    /**
     * Get converter info for a language
     */
    get(language) {
        return this.converters.get(language) || null;
    }

    /**
     * Get all registered languages
     */
    getLanguages() {
        return Array.from(this.converters.keys());
    }

    /**
     * Detect target language from file extension
     */
    detectLanguageFromExtension(filePath) {
        const ext = path.extname(filePath);
        for (const [lang, info] of this.converters) {
            if (info.extension === ext) {
                return lang;
            }
        }
        return null;
    }

    /**
     * Dynamically scan the plugins directory and load all plugins
     */
    async discoverConverters() {
        const pluginsDir = path.join(__dirname, 'plugins');
        if (!fs.existsSync(pluginsDir)) return;

        const entries = fs.readdirSync(pluginsDir, { withFileTypes: true });

        for (const entry of entries) {
            if (entry.isDirectory()) {
                const langDir = path.join(pluginsDir, entry.name);
                const indexPath = path.join(langDir, 'index.js');

                if (fs.existsSync(indexPath)) {
                    try {
                        const modulePath = `file://${indexPath}`;
                        const { config, Converter } = await import(modulePath);

                        if (config && Converter) {
                            const { name, aliases, extension, runtimeFile } = config;
                            const regName = name || entry.name;
                            const runtimePath = runtimeFile ? path.join(entry.name, runtimeFile) : null;

                            this.register(regName, extension, Converter, runtimePath);

                            if (aliases && Array.isArray(aliases)) {
                                for (const alias of aliases) {
                                    if (alias !== regName) {
                                        this.register(alias, extension, Converter, runtimePath);
                                    }
                                }
                            }
                        }
                    } catch (error) {
                        console.warn(`Warning: Failed to load converter in ${entry.name}: ${error.message}`);
                    }
                }
            }
        }
    }
}
