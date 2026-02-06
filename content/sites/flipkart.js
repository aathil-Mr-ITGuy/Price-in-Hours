/**
 * flipkart.com Price Detection Script
 */

(async function() {
  const settings = await PriceInHours.loadSettings();
  if (!settings || !settings.hourlyRate) return;

  // Selectors for Flipkart (updated Feb 2026)
  const SELECTORS = [
    // Product listing & detail pages - current price
    '.hZ3P6w',                     // Main sale price (both listing & PDP)
    'div[class*="Nx9bqj"]',        // Alternate price class
    // Legacy selectors (keeping for older pages)
    '._30jeq3',                    // Legacy price class
    '._30jeq3._16Jk6d'             // Legacy PDP price
  ];
  
  // Skip these (strikethrough/original prices)
  const SKIP_SELECTORS = [
    '.kRYCnD',                     // Current strike price class
    '._3I9_wc',                    // Legacy strike price
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
