window.PriceInHours = {
  settings: null,

  /**
   * Load settings from local storage
   * @returns {Promise<Object|null>} Returns null if extension is disabled
   */
  loadSettings: function() {
    return new Promise((resolve) => {
      chrome.storage.local.get(['hourlyRate', 'currency', 'enabled', 'exchangeRates'], (data) => {
        // Check if extension is disabled
        if (data.enabled === false) {
          console.log('Price in Hours: Extension is disabled');
          this.settings = null;
          resolve(null);
          return;
        }
        
        this.settings = data;
        console.log('Price in Hours: Settings loaded', this.settings);
        resolve(data);
      });
    });
  },

  /**
   * Convert price from site currency to user's base currency
   * @param {number} price - Price in site currency
   * @param {string} siteCurrency - Currency code of the site (e.g., 'INR', 'LKR')
   * @returns {number} - Price in user's base currency
   */
  convertCurrency: function(price, siteCurrency) {
    if (!this.settings) return price;
    
    const baseCurrency = this.settings.currency;
    
    // No conversion needed if same currency
    if (siteCurrency === baseCurrency) {
      return price;
    }
    
    // Get exchange rate (how many site currency units = 1 base currency)
    const rates = this.settings.exchangeRates || {};
    const rate = rates[siteCurrency];
    
    if (rate && rate > 0) {
      // Convert: price in site currency / rate = price in base currency
      return price / rate;
    }
    
    // No rate configured, return original price (will show inaccurate hours)
    console.warn(`Price in Hours: No exchange rate for ${siteCurrency} -> ${baseCurrency}`);
    return price;
  },

  /**
   * Calculate work hours needed for a price
   * @param {number} price - Product price (in user's base currency)
   * @returns {number|null} - Hours needed, or null if rate not set
   */
  calculate: function(price) {
    if (!this.settings || !this.settings.hourlyRate) {
      return null;
    }
    return price / this.settings.hourlyRate;
  },

  /**
   * Format hours for display
   * @param {number} hours 
   * @returns {string}
   */
  format: function(hours) {
    if (hours < 0.01) return '0 hrs';
    if (hours < 0.1) return '< 0.1 hrs';
    
    // Show days if hours > 24
    if (hours >= 24) {
      const days = Math.floor(hours / 8); // work days (8 hours)
      return days + ' days';
    }
    
    return hours.toFixed(1) + ' hrs';
  },

  /**
   * Create the visual badge element
   * @param {number} price - Original price in site currency
   * @param {string} siteCurrency - Currency code of the site (optional, defaults to user's currency)
   * @returns {HTMLElement|null}
   */
  createBadge: function(price, siteCurrency) {
    // Convert to base currency if needed
    const baseCurrency = this.settings?.currency || 'USD';
    const currency = siteCurrency || baseCurrency;
    const convertedPrice = this.convertCurrency(price, currency);
    
    const hours = this.calculate(convertedPrice);
    if (hours === null) return null;

    const span = document.createElement('span');
    span.className = 'pih-badge';
    span.innerHTML = `<span class="pih-icon">⏱️</span>${this.format(hours)}`;
    
    // Show conversion info in tooltip if currencies differ
    if (currency !== baseCurrency) {
      span.title = `${price.toLocaleString()} ${currency} ≈ ${convertedPrice.toFixed(2)} ${baseCurrency} at ${this.settings.hourlyRate.toFixed(2)} ${baseCurrency}/hr`;
    } else {
      span.title = `At ${this.settings.hourlyRate.toFixed(2)} ${baseCurrency}/hr`;
    }
    
    return span;
  }
};
