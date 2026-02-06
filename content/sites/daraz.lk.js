/**
 * daraz.lk Price Detection Script
 * Daraz Sri Lanka - part of Alibaba group
 * Uses content-based detection for resilience
 */

(async function() {
  const settings = await PriceInHours.loadSettings();
  if (!settings || !settings.hourlyRate) return;

  // Price regex: matches Rs. or රු. followed by digits with commas
  const PRICE_REGEX = /^(Rs\.?|රු\.?)\s*[\d,]+$/i;

  function isStrikePrice(el) {
    const style = window.getComputedStyle(el);
    if (style.textDecoration.includes('line-through')) return true;
    
    if (el.parentElement) {
      const parentStyle = window.getComputedStyle(el.parentElement);
      if (parentStyle.textDecoration.includes('line-through')) return true;
    }
    
    // Check for discount indicators nearby
    const nextSibling = el.nextElementSibling;
    if (nextSibling && nextSibling.textContent.match(/%\s*off/i)) {
      return true;
    }
    
    return false;
  }

  function processPrices() {
    // Common Daraz price selectors (may use dynamic classes like Flipkart)
    const priceElements = document.querySelectorAll([
      '[class*="price"]',
      '[class*="Price"]',
      'span[data-spm-anchor-id]'
    ].join(','));

    priceElements.forEach(el => {
      if (el.dataset.pihProcessed) return;
      if (el.querySelector('.pih-badge')) return;
      if (el.closest('[data-pih-processed]')) return;
      
      const text = el.textContent.trim();
      if (!PRICE_REGEX.test(text)) return;
      
      if (isStrikePrice(el)) return;
      
      const priceMatch = text.match(/[\d,]+/);
      if (!priceMatch) return;

      const priceVal = parseFloat(priceMatch[0].replace(/,/g, ''));
      if (isNaN(priceVal) || priceVal === 0) return;

      const badge = PriceInHours.createBadge(priceVal, 'LKR');
      if (badge) {
        el.appendChild(badge);
        el.dataset.pihProcessed = 'true';
      }
    });

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
      if (!el || el.dataset.pihProcessed) return;
      if (el.querySelector('.pih-badge')) return;
      if (el.closest('[data-pih-processed]')) return;
      if (isStrikePrice(el)) return;
      
      const text = textNode.textContent.trim();
      const priceMatch = text.match(/[\d,]+/);
      if (!priceMatch) return;

      const priceVal = parseFloat(priceMatch[0].replace(/,/g, ''));
      if (isNaN(priceVal) || priceVal === 0) return;

      const badge = PriceInHours.createBadge(priceVal, 'LKR');
      if (badge) {
        el.appendChild(badge);
        el.dataset.pihProcessed = 'true';
      }
    });
  }

  setTimeout(processPrices, 1000);

  let timeout;
  const observer = new MutationObserver(() => {
    clearTimeout(timeout);
    timeout = setTimeout(processPrices, 500);
  });

  observer.observe(document.body, { childList: true, subtree: true });

  console.log('Price in Hours: Active on daraz.lk');
})();
