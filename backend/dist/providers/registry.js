"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.providerRegistry = void 0;
const amazon_1 = require("./amazon");
const logger_1 = require("../utils/logger");
class ProviderRegistry {
    providers = new Map();
    constructor() {
        // Register default providers
        this.registerProvider('amazon', new amazon_1.AmazonProvider());
    }
    registerProvider(name, provider) {
        this.providers.set(name, provider);
        logger_1.logger.info(`Registered scraper provider: ${name}`);
    }
    getProviderForUrl(url) {
        for (const [name, provider] of this.providers.entries()) {
            if (provider.validateUrl(url)) {
                return provider;
            }
        }
        return null;
    }
}
exports.providerRegistry = new ProviderRegistry();
