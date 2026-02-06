/**
 * ikman.lk Price Detection Script
 * Sri Lanka's largest classifieds/marketplace
 * Uses content-based detection for resilience
 */

(async function() {
  const settings = await PriceInHours.loadSettings();
  if (!settings || !settings.hourlyRate) return;

  // Price regex: matches "Rs" followed by digits with commas
  // Also handles salary ranges like "Rs 50,000 - 100,000"
  const PRICE_REGEX = /^Rs\.?\s*[\d,]+(\s*-\s*[\d,]+)?$/i;

  function isStrikePrice(el) {
    const style = window.getComputedStyle(el);
    if (style.textDecoration.includes('line-through')) return true;
    
    if (el.parentElement) {
      const parentStyle = window.getComputedStyle(el.parentElement);
      if (parentStyle.textDecoration.includes('line-through')) return true;
    }
    
    return false;
  }

  function processPrices() {
    // ikman.lk price selectors
    const priceElements = document.querySelectorAll([
      '[class*="price"]',
      '[class*="Price"]',
      '[class*="amount"]',
      '[class*="Amount"]',
      '[data-testid*="price"]'
    ].join(','));

    priceElements.forEach(el => processElement(el));

    // Also scan text nodes for prices
    const walker = document.createTreeWalker(
      document.body,
      NodeFilter.SHOW_TEXT,
      {
        acceptNode: function(node) {
          const text = node.textContent.trim();
          if (PRICE_REGEX.test(text)) {
            return NodeFilter.FILTER_ACCEPT;
          }
          return NodeFilter.FILTER_SKIP;
        }
      }
    );

    const priceNodes = [];
    while (walker.nextNode()) {
      priceNodes.push(walker.currentNode);
    }

    priceNodes.forEach(textNode => {
      const el = textNode.parentElement;
      processElement(el, textNode.textContent.trim());
    });
  }

  function processElement(el, textOverride) {
    if (!el || el.dataset.pihProcessed) return;
    if (el.querySelector('.pih-badge')) return;
    if (el.closest('[data-pih-processed]')) return;
    
    const text = textOverride || el.textContent.trim();
    if (!PRICE_REGEX.test(text)) return;
    
    if (isStrikePrice(el)) return;
    
    // Extract first price from possible range
    const priceMatch = text.match(/[\d,]+/);
    if (!priceMatch) return;

    const priceVal = parseFloat(priceMatch[0].replace(/,/g, ''));
    if (isNaN(priceVal) || priceVal === 0) return;

    const badge = PriceInHours.createBadge(priceVal, 'LKR');
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

  console.log('Price in Hours: Active on ikman.lk');
})();
