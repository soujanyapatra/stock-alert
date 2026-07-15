"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const playwright_1 = require("playwright");
const logger_1 = require("./utils/logger");
async function debugScrape() {
    const url = 'https://www.amazon.in/dp/B0DXQH1DBS';
    logger_1.logger.info(`Debugging scraper for URL: ${url}`);
    const browser = await playwright_1.chromium.launch({ headless: true });
    const context = await browser.newContext({
        userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        locale: 'en-US'
    });
    const page = await context.newPage();
    try {
        await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 30000 });
        await page.waitForTimeout(2000);
        const data = await page.evaluate(() => {
            const priceSelectors = [
                '#price_inside_buybox',
                '#priceblock_ourprice',
                '#priceblock_dealprice',
                '#priceblock_saleprice',
                '#corePriceDisplay_desktop_feature_div .a-offscreen',
                '#corePrice_feature_div .a-offscreen',
                '.a-price .a-offscreen',
                '.a-color-price',
                '#kindle-price',
                '.a-price-whole'
            ];
            const priceContainer = document.querySelector('#apex_desktop') ||
                document.querySelector('#centerCol') ||
                document.querySelector('#ppd') ||
                document.querySelector('#booksHeaderSection') ||
                document;
            const results = {};
            priceSelectors.forEach(selector => {
                const els = priceContainer.querySelectorAll(selector);
                results[selector] = Array.from(els).map(el => {
                    let parentInfo = '';
                    let p = el.parentElement;
                    for (let i = 0; i < 3 && p; i++) {
                        parentInfo += `${p.tagName.toLowerCase()}${p.id ? '#' + p.id : ''}${p.className ? '.' + p.className.split(' ').join('.') : ''} > `;
                        p = p.parentElement;
                    }
                    return {
                        text: el.textContent?.trim(),
                        parentInfo
                    };
                });
            });
            return {
                title: document.title,
                priceContainerFound: priceContainer !== document,
                priceContainerTag: priceContainer.tagName + (priceContainer.id ? '#' + priceContainer.id : ''),
                results
            };
        });
        console.log('Scraper Debug Details:');
        console.log(JSON.stringify(data, null, 2));
    }
    catch (err) {
        console.error('Debug Scrape Failed:', err);
    }
    finally {
        await browser.close();
    }
}
debugScrape();
