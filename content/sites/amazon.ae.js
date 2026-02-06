/**
 * amazon.ae Price Detection Script
 */

(async function() {
  // Wait for settings to load
  const settings = await PriceInHours.loadSettings();
  if (!settings || !settings.hourlyRate) return;

  // Selectors for Amazon - these are standard across Amazon sites
  const SELECTORS = [
    // Product listing pages
    '.a-price .a-offscreen',           // Main price (hidden accessible text)
    '.a-price-whole',                  // Whole number part of price
    // Product detail pages
    '#corePriceDisplay_desktop_feature_div .a-price .a-offscreen',
    '#corePrice_desktop .a-price .a-offscreen',
    '.priceToPay .a-offscreen',
    '#priceblock_ourprice',
    '#priceblock_dealprice',
    '#priceblock_saleprice'
  ];
  
  // Skip these selectors (strikethrough/was prices)
  const SKIP_SELECTORS = [
    '.a-text-price',           // Strikethrough prices
    '[data-a-strike="true"]',  // Strike-through indicator
    '.basisPrice'              // "Was" price container
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
    
    // Skip strikethrough prices
    for (const skipSel of SKIP_SELECTORS) {
      if (el.matches(skipSel) || el.closest(skipSel)) return;
    }
    
    // Get text content
    const text = el.textContent.trim();
    if (!text.match(/\d/)) return;

    // Extract price - Amazon format: "AED 1,234.56" or "1,234.56"
    const priceMatch = text.match(/[\d,]+\.?\d*/);
    if (!priceMatch) return;

    const priceVal = parseFloat(priceMatch[0].replace(/,/g, ''));
    if (isNaN(priceVal) || priceVal === 0) return;

    // Create badge
    const badge = PriceInHours.createBadge(priceVal);
    if (badge) {
      // For .a-offscreen elements, append to parent .a-price instead
      const priceContainer = el.closest('.a-price') || el.parentElement;
      if (priceContainer && !priceContainer.querySelector('.pih-badge')) {
        priceContainer.appendChild(badge);
      }
      el.dataset.pihProcessed = 'true';
    }
  }

  // Initial Scan (delay slightly for Amazon's dynamic loading)
  setTimeout(processPrices, 1000);

  // Observer for dynamic content
  let timeout;
  const observer = new MutationObserver(() => {
    clearTimeout(timeout);
    timeout = setTimeout(processPrices, 500);
  });

  observer.observe(document.body, {
    childList: true,
    subtree: true
  });

  console.log('Price in Hours: Active on amazon.ae');

})();
