/**
 * flipkart.com Price Detection Script
 */

(async function() {
  const settings = await PriceInHours.loadSettings();
  if (!settings || !settings.hourlyRate) return;

  // Selectors for Flipkart
  const SELECTORS = [
    // Product listing pages
    '._30jeq3',                    // Main price on product cards
    'div[class*="Nx9bqj"]',        // Alternate price class
    // Product detail pages
    '._30jeq3._16Jk6d',            // PDP price
    'div[class*="CEmiEU"]',        // PDP price container
    '._25b18c ._30jeq3'            // Price in buy box
  ];
  
  // Skip these (strikethrough prices)
  const SKIP_SELECTORS = [
    '._3I9_wc',                    // Strike price
    'div[class*="yRaY8j"]'         // Original price
  ];

  function processPrices() {
    SELECTORS.forEach(selector => {
      const elements = document.querySelectorAll(selector);
      elements.forEach(el => processElement(el));
    });
  }

  function processElement(el) {
    if (el.dataset.pihProcessed) return;
    
    // Skip strikethrough prices
    for (const skipSel of SKIP_SELECTORS) {
      if (el.matches(skipSel) || el.closest(skipSel)) return;
    }
    
    const text = el.textContent.trim();
    if (!text.match(/\d/)) return;

    // Flipkart format: "₹1,234" or "₹1,234.00"
    const priceMatch = text.match(/[\d,]+\.?\d*/);
    if (!priceMatch) return;

    const priceVal = parseFloat(priceMatch[0].replace(/,/g, ''));
    if (isNaN(priceVal) || priceVal === 0) return;

    const badge = PriceInHours.createBadge(priceVal);
    if (badge) {
      el.appendChild(badge);
      el.dataset.pihProcessed = 'true';
    }
  }

  setTimeout(processPrices, 1000);

  let timeout;
  const observer = new MutationObserver(() => {
    clearTimeout(timeout);
    timeout = setTimeout(processPrices, 500);
  });

  observer.observe(document.body, { childList: true, subtree: true });

  console.log('Price in Hours: Active on flipkart.com');
})();
