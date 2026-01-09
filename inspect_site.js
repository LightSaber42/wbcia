const puppeteer = require('puppeteer');

(async () => {
  try {
    const browser = await puppeteer.launch({
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    });
    const page = await browser.newPage();
    
    console.log("Navigating to https://plotme.up.railway.app/ ...");
    await page.goto('https://plotme.up.railway.app/', { waitUntil: 'networkidle0', timeout: 60000 });

    const title = await page.title();
    console.log(`Page Title: ${title}`);

    // Wait for a key element to ensure React has hydrated
    await page.waitForSelector('h1', { timeout: 10000 });

    const content = await page.evaluate(() => {
      const bodyText = document.body.innerText;
      const controls = document.querySelectorAll('input, select, button');
      
      const searchInput = document.querySelector('input[placeholder*="Search"]');
      const dateInputs = document.querySelectorAll('input[type="number"]');

      return {
        text: bodyText.split('\n').filter(line => line.trim() !== '').slice(0, 20),
        controlCount: controls.length,
        hasChart: !!document.querySelector('.recharts-responsive-container'),
        searchPlaceholder: searchInput ? searchInput.placeholder : 'Not Found',
        dateRangeInputs: dateInputs.length
      };
    });

    console.log("\n--- Page Content Snippet ---");
    console.log(content.text.join('\n'));
    console.log("\n--- Analysis ---");
    console.log(`Interactable Elements Found: ${content.controlCount}`);
    console.log(`Chart Component Present: ${content.hasChart ? 'Yes' : 'No'}`);
    console.log(`Search Input Placeholder: "${content.searchPlaceholder}"`);
    console.log(`Date Range Inputs Found: ${content.dateRangeInputs}`);

    await browser.close();
  } catch (error) {
    console.error("Error inspecting site:", error.message);
    process.exit(1);
  }
})();
