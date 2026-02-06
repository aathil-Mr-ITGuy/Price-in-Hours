/**
 * noon.com Price Detection Script
 */

(async function() {
  // Wait for settings to load
  const settings = await PriceInHours.loadSettings();
  if (!settings || !settings.hourlyRate) return;

  // Selectors for noon.com
  // Note: These might change, so we try multiple strategies
  const SELECTORS = [
    '[data-qa="div-price-now"]', // Product page main price
    '.amount',                   // Listing pages (common class)
    '.priceNow',                 // Alternative
    '[class*="priceWrapper"]'     // Flexible match
  ];

  function processPrices() {
    SELECTORS.forEach(selector => {
      const elements = document.querySelectorAll(selector);
      elements.forEach(el => processElement(el));
    });
  }

  function processElement(el) {
    // Avoid double tagging
    if (el.dataset.pihProcessed) return;
    
    // Check if it looks like a price (contains currency or digits)
    const text = el.textContent.trim();
    if (!text.match(/\d/)) return;

    // Extract price value (remove currency, commas)
    // noon.com example: "AED 123.45" or "123.45 AED"
    const priceMatch = text.match(/[\d,]+\.?\d*/);
    if (!priceMatch) return;

    const priceVal = parseFloat(priceMatch[0].replace(/,/g, ''));
    if (isNaN(priceVal)) return;

    // Create badge
    const badge = PriceInHours.createBadge(priceVal);
    if (badge) {
      // Find a good spot to insert - preferably after the price element
      // specific logic per selector type could go here if needed
      el.appendChild(badge);
      el.dataset.pihProcessed = 'true';
    }
  }

  // Initial Scan
  processPrices();

  // Observer for dynamic content (scrolling, navigation)
  let timeout;
  const observer = new MutationObserver(() => {
    // Debounce to improve performance
    clearTimeout(timeout);
    timeout = setTimeout(processPrices, 500);
  });

  observer.observe(document.body, {
    childList: true,
    subtree: true
  });

  console.log('Price in Hours: Active on noon.com');

})();
