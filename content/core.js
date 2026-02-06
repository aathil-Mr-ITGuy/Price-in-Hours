window.PriceInHours = {
  settings: null,

  /**
   * Load settings from local storage
   * @returns {Promise<Object|null>} Returns null if extension is disabled
   */
  loadSettings: function() {
    return new Promise((resolve) => {
      chrome.storage.local.get(['hourlyRate', 'currency', 'enabled'], (data) => {
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
   * Calculate work hours needed for a price
   * @param {number} price - Product price
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
    
    // Show days if hours > 24? Maybe too complex for now.
    // Let's stick to hours.
    return hours.toFixed(1) + ' hrs';
  },

  /**
   * Create the visual badge element
   * @param {number} price - Original price
   * @returns {HTMLElement}
   */
  createBadge: function(price) {
    const hours = this.calculate(price);
    if (hours === null) return null;

    const span = document.createElement('span');
    span.className = 'pih-badge';
    span.innerHTML = `<span class="pih-icon">⏱️</span>${this.format(hours)}`;
    span.title = `At ${this.settings.hourlyRate.toFixed(2)} ${this.settings.currency}/hr`;
    
    return span;
  }
};
