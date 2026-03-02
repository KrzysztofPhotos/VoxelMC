const puppeteer = require('puppeteer');
const http = require('http');
const handler = require('serve-handler');

const server = http.createServer((request, response) => {
    return handler(request, response, { public: __dirname });
});

server.listen(8080, async () => {
    const browser = await puppeteer.launch({headless: true});
    const page = await browser.newPage();
    page.on('console', msg => console.log('PAGE LOG:', msg.text()));
    page.on('pageerror', error => console.log('PAGE ERROR:', error.stack));
    page.on('requestfailed', request => console.log('REQUEST FAILED:', request.url(), request.failure()?.errorText));
    page.on('response', response => {
        if (!response.ok()) {
            console.log('RESPONSE FAILED:', response.url(), response.status());
        }
    });
    
    await page.goto('http://localhost:8080');
    await new Promise(r => setTimeout(r, 2000));
    await browser.close();
    server.close();
    process.exit(0);
});