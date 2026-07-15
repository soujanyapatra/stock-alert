import { ScrapeResult } from '../../../shared/types';

export interface ProductProvider {
  /**
   * Checks if this provider handles the given URL.
   */
  validateUrl(url: string): boolean;

  /**
   * Extracts the unique product identifier (e.g., ASIN for Amazon) from the URL.
   */
  extractAsin(url: string): string | null;

  /**
   * Scrapes the product page and returns structured data.
   */
  fetchProduct(url: string): Promise<ScrapeResult>;
}
