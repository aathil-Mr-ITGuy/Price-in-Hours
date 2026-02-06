/**
 * flipkart.com Price Detection Script
 * Uses content-based detection since Flipkart uses dynamic/hashed class names
 */

(async function() {
  const settings = await PriceInHours.loadSettings();
  if (!settings || !settings.hourlyRate) return;

  // Price regex: matches ₹ followed by digits with optional commas
  const PRICE_REGEX = /^₹[\d,]+$/;
  
  // Strikethrough price indicators
  const STRIKE_INDICATORS = ['text-decoration: line-through', 'off', '%'];

  function isStrikePrice(el) {
    // Check if element has line-through style
    const style = window.getComputedStyle(el);
    if (style.textDecoration.includes('line-through')) return true;
    
    // Check if parent has line-through
    if (el.parentElement) {
      const parentStyle = window.getComputedStyle(el.parentElement);
      if (parentStyle.textDecoration.includes('line-through')) return true;
    }
    
    // Check if next sibling contains "off" (indicating this is original price)
    const nextSibling = el.nextElementSibling;
    if (nextSibling && nextSibling.textContent.toLowerCase().includes('off')) {
      return true;
    }
    
    return false;
  }

  function processPrices() {
    // Find all elements that contain rupee symbol
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
      
      // Skip if already has a badge inside
      if (el.querySelector('.pih-badge')) return;
      if (el.closest('[data-pih-processed]')) return;
      
      // Skip strikethrough prices
      if (isStrikePrice(el)) return;
      
      const text = textNode.textContent.trim();
      const priceMatch = text.match(/[\d,]+/);
      if (!priceMatch) return;

      const priceVal = parseFloat(priceMatch[0].replace(/,/g, ''));
      if (isNaN(priceVal) || priceVal === 0) return;

      const badge = PriceInHours.createBadge(priceVal);
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

  console.log('Price in Hours: Active on flipkart.com (content-based detection)');
})();
