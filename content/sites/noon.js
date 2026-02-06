/**
 * noon.com Price Detection Script
 */

(async function() {
  // Wait for settings to load
  const settings = await PriceInHours.loadSettings();
  if (!settings || !settings.hourlyRate) return;

  // Selectors for noon.com - target the actual price TEXT elements, not containers
  // This avoids grabbing both current and old price text together
  const SELECTORS = [
    // PDP: Product Details Page - the span with the actual price number
    '[class*="priceNowText"]',
    // PLP: Product Listing Page - the strong with class containing "amount"
    'strong[class*="amount"]'
  ];
  
  // Elements to skip (old/strikethrough prices)
  const SKIP_SELECTORS = ['[class*="oldPrice"]', '[class*="priceWas"]'];

  function processPrices() {
    SELECTORS.forEach(selector => {
      const elements = document.querySelectorAll(selector);
      elements.forEach(el => processElement(el));
    });
  }

  function processElement(el) {
    // Avoid double tagging
    if (el.dataset.pihProcessed) return;
    
    // Skip old/strikethrough prices
    for (const skipSel of SKIP_SELECTORS) {
      if (el.matches(skipSel) || el.closest(skipSel)) return;
    }
    
    // Check if it contains digits
    const text = el.textContent.trim();
    if (!text.match(/\d/)) return;

    // Extract price value (remove currency, commas)
    const priceMatch = text.match(/[\d,]+\.?\d*/);
    if (!priceMatch) return;

    const priceVal = parseFloat(priceMatch[0].replace(/,/g, ''));
    if (isNaN(priceVal)) return;

    // Create badge
    const badge = PriceInHours.createBadge(priceVal);
    if (badge) {
      el.appendChild(badge);
      el.dataset.pihProcessed = 'true';
    }
  }

  // Initial Scan
  processPrices();

  // Observer for dynamic content (scrolling, navigation)
  let timeout;
  const observer = new MutationObserver(() => {
    clearTimeout(timeout);
    timeout = setTimeout(processPrices, 500);
  });

  observer.observe(document.body, {
    childList: true,
    subtree: true
  });

  console.log('Price in Hours: Active on noon.com');

})();

