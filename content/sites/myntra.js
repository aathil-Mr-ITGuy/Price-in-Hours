/**
 * myntra.com Price Detection Script
 */

(async function() {
  const settings = await PriceInHours.loadSettings();
  if (!settings || !settings.hourlyRate) return;

  // Selectors for Myntra
  const SELECTORS = [
    // Product listing pages
    '.product-price span',
    '.product-discountedPrice',
    '[class*="product-price"]',
    // Product detail pages  
    '.pdp-price strong',
    '.pdp-discount-container .pdp-price',
    '[class*="pdp-price"]'
  ];
  
  // Skip strikethrough prices
  const SKIP_SELECTORS = [
    '.product-strike',
    '.pdp-mrp',
    '[class*="strike"]'
  ];

  function processPrices() {
    SELECTORS.forEach(selector => {
      const elements = document.querySelectorAll(selector);
      elements.forEach(el => processElement(el));
    });
  }

  function processElement(el) {
    if (el.dataset.pihProcessed) return;
    
    for (const skipSel of SKIP_SELECTORS) {
      if (el.matches(skipSel) || el.closest(skipSel)) return;
    }
    
    const text = el.textContent.trim();
    if (!text.match(/\d/)) return;

    // Myntra format: "Rs. 1,234" or "₹1234"
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

  console.log('Price in Hours: Active on myntra.com');
})();
