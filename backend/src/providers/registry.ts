import { ProductProvider } from './base';
import { AmazonProvider } from './amazon';
import { logger } from '../utils/logger';

class ProviderRegistry {
  private providers: Map<string, ProductProvider> = new Map();

  constructor() {
    // Register default providers
    this.registerProvider('amazon', new AmazonProvider());
  }

  registerProvider(name: string, provider: ProductProvider) {
    this.providers.set(name, provider);
    logger.info(`Registered scraper provider: ${name}`);
  }

  getProviderForUrl(url: string): ProductProvider | null {
    for (const [name, provider] of this.providers.entries()) {
      if (provider.validateUrl(url)) {
        return provider;
      }
    }
    return null;
  }
}

export const providerRegistry = new ProviderRegistry();
