import puppeteer from 'puppeteer';

const browser = await puppeteer.launch({
  headless: true,
  executablePath: '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
});
const page = await browser.newPage();
await page.setUserAgent('Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36');

console.log('Visiting Bursley menu page...');
await page.goto('https://dining.umich.edu/menus-locations/dining-halls/bursley/', { waitUntil: 'networkidle2', timeout: 30000 });

// Check for API calls made by the page
const requests = [];
page.on('request', req => {
  const url = req.url();
  if (url.includes('api') || url.includes('menu') || url.includes('json')) {
    requests.push(url);
  }
});

// Re-navigate to capture network requests
await page.goto('https://dining.umich.edu/menus-locations/dining-halls/bursley/', { waitUntil: 'networkidle2', timeout: 30000 });
await new Promise(r => setTimeout(r, 3000));

console.log('API requests found:', requests);
console.log('\nPage title:', await page.title());
console.log('\nPage HTML snippet:');
const html = await page.content();
console.log(html.substring(0, 3000));

await browser.close();
