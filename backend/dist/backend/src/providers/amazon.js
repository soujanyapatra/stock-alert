"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AmazonProvider = void 0;
const playwright_1 = require("playwright");
const logger_1 = require("../utils/logger");
class AmazonProvider {
    validateUrl(url) {
        try {
            const parsed = new URL(url);
            return parsed.hostname.includes('amazon.');
        }
        catch {
            return false;
        }
    }
    extractAsin(url) {
        try {
            const parsed = new URL(url);
            // Remove query parameters
            const cleanPath = parsed.pathname;
            // Match standard patterns:
            // /dp/ASIN
            // /gp/product/ASIN
            // /d/ASIN
            const dpMatch = cleanPath.match(/\/dp\/([A-Z0-9]{10})/i);
            if (dpMatch)
                return dpMatch[1].toUpperCase();
            const gpMatch = cleanPath.match(/\/gp\/product\/([A-Z0-9]{10})/i);
            if (gpMatch)
                return gpMatch[1].toUpperCase();
            const dMatch = cleanPath.match(/\/d\/([A-Z0-9]{10})/i);
            if (dMatch)
                return dMatch[1].toUpperCase();
            return null;
        }
        catch (err) {
            logger_1.logger.error('Failed to extract ASIN from URL:', url, err);
            return null;
        }
    }
    async fetchProduct(url) {
        const asin = this.extractAsin(url);
        if (!asin) {
            throw new Error('Could not extract ASIN from URL: ' + url);
        }
        // Construct a canonical Amazon URL to avoid tracking parameters and localization clutter
        const parsedUrl = new URL(url);
        const domain = parsedUrl.hostname; // keep the local domain (amazon.com, amazon.in, etc)
        const canonicalUrl = `https://${domain}/dp/${asin}`;
        logger_1.logger.info(`Launching Playwright to scrape Amazon ASIN: ${asin} via URL: ${canonicalUrl}`);
        // Launch browser
        const browser = await playwright_1.chromium.launch({
            headless: true,
            args: [
                '--disable-blink-features=AutomationControlled',
                '--no-sandbox',
                '--disable-setuid-sandbox'
            ]
        });
        const context = await browser.newContext({
            userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
            viewport: { width: 1280, height: 800 },
            locale: 'en-US'
        });
        const page = await context.newPage();
        try {
            // Set extra headers
            await page.setExtraHTTPHeaders({
                'accept-language': 'en-US,en;q=0.9',
                'accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8'
            });
            // Navigate to URL
            await page.goto(canonicalUrl, {
                waitUntil: 'domcontentloaded',
                timeout: 30000
            });
            // Check for Amazon Captcha
            const isCaptcha = await page.evaluate(() => {
                const captchaForm = document.querySelector('form[action="/errors/validateCaptcha"]');
                const captchaTitle = document.title.toLowerCase().includes('captcha') ||
                    document.body.innerText.toLowerCase().includes('enter the characters you see below');
                return !!captchaForm || captchaTitle;
            });
            if (isCaptcha) {
                throw new Error('Amazon CAPTCHA page detected. Rate limit or anti-bot triggered.');
            }
            // Wait a moment for dynamic elements to load
            await page.waitForTimeout(2000);
            // Extract details
            const productDetails = await page.evaluate(() => {
                // 1. Get Title
                const titleEl = document.querySelector('#productTitle');
                const name = titleEl ? titleEl.textContent?.trim() || '' : '';
                // 2. Get Image
                let image = '';
                const imageSelectors = [
                    '#landingImage',
                    '#imgBlkFront',
                    '#ebooksImgBlk',
                    '#imgTagWrapperId img',
                    '#main-image'
                ];
                for (const selector of imageSelectors) {
                    const imgEl = document.querySelector(selector);
                    if (imgEl) {
                        // Check for dynamic image JSON
                        const dynImgAttr = imgEl.getAttribute('data-a-dynamic-image');
                        if (dynImgAttr) {
                            try {
                                const keys = Object.keys(JSON.parse(dynImgAttr));
                                if (keys.length > 0) {
                                    image = keys[0];
                                    break;
                                }
                            }
                            catch (e) {
                                // Ignore parsing errors and check standard attributes
                            }
                        }
                        const src = imgEl.src || imgEl.getAttribute('data-old-hires') || imgEl.getAttribute('src');
                        if (src && !src.startsWith('data:')) {
                            image = src;
                            break;
                        }
                    }
                }
                // 3. Get Price
                let priceStr = '';
                // Restrict search to the main product display containers to avoid accessory/recommendation prices
                const priceContainer = document.querySelector('#apex_desktop') ||
                    document.querySelector('#centerCol') ||
                    document.querySelector('#ppd') ||
                    document.querySelector('#booksHeaderSection') ||
                    document;
                // Target the active price container to avoid EMI installments, list prices, and shipping fees
                const activePriceContainer = priceContainer.querySelector('.priceToPay') ||
                    priceContainer.querySelector('.apexPriceToPay') ||
                    priceContainer.querySelector('#price_inside_buybox') ||
                    priceContainer;
                // Try getting the whole and fraction parts of the active price first
                const wholeEl = activePriceContainer.querySelector('.a-price-whole');
                const fracEl = activePriceContainer.querySelector('.a-price-fraction');
                if (wholeEl) {
                    const wholeText = wholeEl.textContent?.trim() || '';
                    if (wholeText && !wholeText.toLowerCase().includes('emi')) {
                        // Clean non-digit characters from the whole part
                        priceStr = wholeText.replace(/[^0-9]/g, '');
                        if (fracEl) {
                            const fracText = fracEl.textContent?.trim().replace(/[^0-9]/g, '') || '';
                            if (fracText) {
                                priceStr += '.' + fracText;
                            }
                        }
                    }
                }
                // Fallbacks if whole/fraction parts of the main active price were not resolved
                if (!priceStr) {
                    const priceSelectors = [
                        '#price_inside_buybox',
                        '#priceblock_ourprice',
                        '#priceblock_dealprice',
                        '#priceblock_saleprice',
                        '#corePriceDisplay_desktop_feature_div .a-offscreen',
                        '#corePrice_feature_div .a-offscreen',
                        '.a-price:not(.a-text-price) .a-offscreen',
                        '.a-color-price',
                        '#kindle-price'
                    ];
                    for (const selector of priceSelectors) {
                        const els = priceContainer.querySelectorAll(selector);
                        for (let i = 0; i < els.length; i++) {
                            const txt = els[i].textContent?.trim();
                            if (txt && (txt.includes('$') || txt.includes('₹') || txt.includes('£') || txt.match(/\d/))) {
                                // Ignore EMI prices (common on Amazon India)
                                if (txt.toLowerCase().includes('emi')) {
                                    continue;
                                }
                                priceStr = txt;
                                break;
                            }
                        }
                        if (priceStr)
                            break;
                    }
                }
                // Parse price to float
                let currentPrice = 0;
                if (priceStr) {
                    // Remove currency symbols, commas, and other non-digit/non-dot characters
                    const cleaned = priceStr.replace(/,/g, '').replace(/[^0-9.]/g, '');
                    const parsedPrice = parseFloat(cleaned);
                    if (!isNaN(parsedPrice)) {
                        currentPrice = parsedPrice;
                    }
                }
                // 4. Get Stock Status
                let stockStatus = 'unknown';
                const availabilityEl = document.querySelector('#availability');
                const availabilityText = availabilityEl ? availabilityEl.textContent?.toLowerCase() || '' : '';
                const outOfStockKeywords = [
                    'currently unavailable',
                    'temporarily out of stock',
                    'out of stock',
                    'unavailable'
                ];
                const inStockKeywords = [
                    'in stock',
                    'only',
                    'left in stock',
                    'available from these sellers',
                    'ships from and sold by'
                ];
                const hasAddToCart = !!document.querySelector('#add-to-cart-button');
                const hasBuyNow = !!document.querySelector('#buy-now-button');
                if (outOfStockKeywords.some(keyword => availabilityText.includes(keyword))) {
                    stockStatus = 'out_of_stock';
                }
                else if (inStockKeywords.some(keyword => availabilityText.includes(keyword)) || hasAddToCart || hasBuyNow) {
                    stockStatus = 'in_stock';
                }
                else if (availabilityText.length > 0) {
                    // If availability text is present but didn't match keywords, search for buybox
                    if (document.querySelector('#outOfStock')) {
                        stockStatus = 'out_of_stock';
                    }
                    else {
                        stockStatus = 'in_stock';
                    }
                }
                else {
                    // Check DOM structures
                    if (document.querySelector('#outOfStock')) {
                        stockStatus = 'out_of_stock';
                    }
                    else if (hasAddToCart || hasBuyNow) {
                        stockStatus = 'in_stock';
                    }
                }
                return {
                    name,
                    image,
                    currentPrice,
                    stockStatus
                };
            });
            if (!productDetails.name) {
                throw new Error('Product name could not be parsed (empty page or layout change).');
            }
            // Final sanitization of scraper results
            const finalResult = {
                asin,
                name: productDetails.name,
                image: productDetails.image || 'https://via.placeholder.com/150?text=No+Image',
                currentPrice: productDetails.currentPrice,
                stockStatus: productDetails.stockStatus,
                url: canonicalUrl
            };
            logger_1.logger.info(`Scrape success! ASIN: ${asin}, Name: ${finalResult.name}, Status: ${finalResult.stockStatus}, Price: ${finalResult.currentPrice}`);
            return finalResult;
        }
        catch (error) {
            logger_1.logger.error(`Error scraping Amazon URL ${url}:`, error.message || error);
            throw error;
        }
        finally {
            await browser.close();
        }
    }
}
exports.AmazonProvider = AmazonProvider;
