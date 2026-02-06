/**
 * amazon.in Price Detection Script
 * Reuses same structure as amazon.ae since Amazon sites share similar markup
 */

(async function() {
  const settings = await PriceInHours.loadSettings();
  if (!settings || !settings.hourlyRate) return;

  // Selectors for Amazon India - same as Amazon AE
  const SELECTORS = [
    '.a-price .a-offscreen',
    '.a-price-whole',
    '#corePriceDisplay_desktop_feature_div .a-price .a-offscreen',
    '#corePrice_desktop .a-price .a-offscreen',
    '.priceToPay .a-offscreen',
    '#priceblock_ourprice',
    '#priceblock_dealprice',
    '#priceblock_saleprice'
  ];
  
  const SKIP_SELECTORS = [
    '.a-text-price',
    '[data-a-strike="true"]',
    '.basisPrice'
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

    const priceMatch = text.match(/[\d,]+\.?\d*/);
    if (!priceMatch) return;

    const priceVal = parseFloat(priceMatch[0].replace(/,/g, ''));
    if (isNaN(priceVal) || priceVal === 0) return;

    const badge = PriceInHours.createBadge(priceVal, 'INR');
    if (badge) {
      const priceContainer = el.closest('.a-price') || el.parentElement;
      if (priceContainer && !priceContainer.querySelector('.pih-badge')) {
        priceContainer.appendChild(badge);
      }
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

  console.log('Price in Hours: Active on amazon.in');
})();
