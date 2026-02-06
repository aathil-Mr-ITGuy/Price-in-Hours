document.addEventListener('DOMContentLoaded', () => {
  // Elements
  const currencySelect = document.getElementById('currency');
  const salaryTypeInput = document.getElementById('salaryType');
  const salaryInput = document.getElementById('salaryInput');
  const daysPerMonthInput = document.getElementById('daysPerMonth');
  const hoursPerDayInput = document.getElementById('hoursPerDay');
  const toggleBtns = document.querySelectorAll('.toggle-btn');
  const monthlyFields = document.getElementById('monthlyFields');
  const dailyFields = document.getElementById('dailyFields');
  const hourlyRateDisplay = document.getElementById('hourlyRateDisplay');
  const currencyDisplay = document.getElementById('currencyDisplay');
  const saveBtn = document.getElementById('saveBtn');
  const status = document.getElementById('status');
  const enableToggle = document.getElementById('enableToggle');
  const baseCurrencyLabel = document.getElementById('baseCurrencyLabel');
  const exchangeRatesContainer = document.getElementById('exchangeRatesContainer');

  // All supported currencies with default exchange rates (relative to USD)
  const ALL_CURRENCIES = ['AED', 'INR', 'LKR', 'USD'];
  const DEFAULT_RATES = {
    // How many units = 1 USD (approximate rates)
    'AED': 3.67,
    'INR': 83,
    'LKR': 320,
    'USD': 1
  };

  // State to store separate values for each mode
  const state = {
    monthly: '',
    daily: '',
    hourly: ''
  };

  // Exchange rates state (stored as: how many units of X = 1 base currency)
  let exchangeRates = {};

  // Load saved settings
  chrome.storage.local.get(
    ['currency', 'salaryType', 'salaries', 'daysPerMonth', 'hoursPerDay', 'enabled', 'exchangeRates'],
    (data) => {
      if (data.currency) currencySelect.value = data.currency;
      
      // Load enabled state (default to true)
      enableToggle.checked = data.enabled !== false;
      
      // Load saved salaries into state
      if (data.salaries) {
        Object.assign(state, data.salaries);
      }
      
      // Load exchange rates
      if (data.exchangeRates) {
        exchangeRates = data.exchangeRates;
      } else {
        // Initialize with defaults
        exchangeRates = calculateDefaultRates(currencySelect.value);
      }
      
      if (data.daysPerMonth) daysPerMonthInput.value = data.daysPerMonth;
      if (data.hoursPerDay) hoursPerDayInput.value = data.hoursPerDay;
      
      // Set active type and populate input
      if (data.salaryType) {
        setSalaryType(data.salaryType);
        salaryInput.value = state[data.salaryType] || '';
      } else {
        setSalaryType('monthly'); 
        salaryInput.value = state['monthly'] || '';
      }
      
      updateUI();
      updateExchangeRatesUI();
      calculateRate();
    }
  );

  // Calculate default rates relative to a base currency
  function calculateDefaultRates(baseCurrency) {
    const rates = {};
    const baseToUSD = 1 / DEFAULT_RATES[baseCurrency];
    
    ALL_CURRENCIES.forEach(cur => {
      if (cur !== baseCurrency) {
        // How many of this currency = 1 base currency
        rates[cur] = (DEFAULT_RATES[cur] * baseToUSD).toFixed(2);
      }
    });
    
    return rates;
  }

  // Update exchange rates UI
  function updateExchangeRatesUI() {
    const baseCurrency = currencySelect.value;
    baseCurrencyLabel.textContent = baseCurrency;
    
    exchangeRatesContainer.innerHTML = '';
    
    ALL_CURRENCIES.forEach(cur => {
      if (cur === baseCurrency) return; // Skip base currency
      
      const row = document.createElement('div');
      row.className = 'exchange-rate-row';
      
      const rate = exchangeRates[cur] || calculateDefaultRates(baseCurrency)[cur] || 1;
      
      row.innerHTML = `
        <label>${cur}</label>
        <input type="number" step="0.01" id="rate_${cur}" value="${rate}" data-currency="${cur}">
        <span class="equals">= 1 ${baseCurrency}</span>
      `;
      
      exchangeRatesContainer.appendChild(row);
      
      // Add event listener
      row.querySelector('input').addEventListener('input', (e) => {
        exchangeRates[e.target.dataset.currency] = parseFloat(e.target.value) || 0;
      });
    });
  }

  // Enable/Disable Toggle
  enableToggle.addEventListener('change', () => {
    chrome.storage.local.set({ enabled: enableToggle.checked }, () => {
      status.textContent = enableToggle.checked ? 'Extension enabled!' : 'Extension disabled';
      setTimeout(() => { status.textContent = ''; }, 2000);
    });
  });

  // Currency change handler
  currencySelect.addEventListener('change', () => {
    // Recalculate exchange rates for new base currency
    exchangeRates = calculateDefaultRates(currencySelect.value);
    updateExchangeRatesUI();
    calculateRate();
    updateUI();
  });

  // Event Listeners
  toggleBtns.forEach(btn => {
    btn.addEventListener('click', (e) => {
      const newType = e.target.dataset.value;
      const currentRate = calculateRate();

      // Update state for current type before switching
      state[salaryTypeInput.value] = salaryInput.value;
      
      setSalaryType(newType);
      
      // Smart Conversion: If we have a valid rate, auto-fill the new mode
      if (currentRate > 0) {
        let convertedValue = 0;
        const days = parseFloat(daysPerMonthInput.value) || 22;
        const hours = parseFloat(hoursPerDayInput.value) || 8;

        if (newType === 'monthly') {
          convertedValue = currentRate * hours * days;
        } else if (newType === 'daily') {
          convertedValue = currentRate * hours;
        } else { // hourly
          convertedValue = currentRate;
        }

        const cleanValue = Number.isInteger(convertedValue) ? convertedValue : convertedValue.toFixed(2);
        
        salaryInput.value = cleanValue;
        state[newType] = cleanValue;
      }
      
      updateUI();
      calculateRate();
    });
  });

  salaryInput.addEventListener('input', (e) => {
    state[salaryTypeInput.value] = e.target.value;
    calculateRate();
  });

  [daysPerMonthInput, hoursPerDayInput].forEach(el => {
    el.addEventListener('input', () => {
      calculateRate();
      updateUI();
    });
  });

  saveBtn.addEventListener('click', saveSettings);

  // Functions
  function setSalaryType(type) {
    salaryTypeInput.value = type;
    
    toggleBtns.forEach(btn => {
      if (btn.dataset.value === type) btn.classList.add('active');
      else btn.classList.remove('active');
    });
  }

  function updateUI() {
    const type = salaryTypeInput.value;
    const cur = currencySelect.value;
    currencyDisplay.textContent = cur;

    if (type === 'monthly') {
      monthlyFields.style.display = 'block';
      dailyFields.style.display = 'block';
    } else if (type === 'daily') {
      monthlyFields.style.display = 'none';
      dailyFields.style.display = 'block';
    } else {
      monthlyFields.style.display = 'none';
      dailyFields.style.display = 'none';
    }
  }

  function calculateRate() {
    const type = salaryTypeInput.value;
    const salary = parseFloat(salaryInput.value) || 0;
    const days = parseFloat(daysPerMonthInput.value) || 22;
    const hours = parseFloat(hoursPerDayInput.value) || 8;
    
    let hourlyRate = 0;

    if (type === 'monthly') {
      if (days > 0 && hours > 0) {
        hourlyRate = salary / (days * hours);
      }
    } else if (type === 'daily') {
      if (hours > 0) {
        hourlyRate = salary / hours;
      }
    } else { // hourly
      hourlyRate = salary;
    }

    hourlyRateDisplay.textContent = hourlyRate.toFixed(2) + ' ' + currencySelect.value + '/hr';
    return hourlyRate;
  }

  function saveSettings() {
    // Ensure current input is saved to state
    state[salaryTypeInput.value] = salaryInput.value;

    // Collect exchange rates from inputs
    const rateInputs = exchangeRatesContainer.querySelectorAll('input');
    rateInputs.forEach(input => {
      exchangeRates[input.dataset.currency] = parseFloat(input.value) || 0;
    });

    const settings = {
      currency: currencySelect.value,
      salaryType: salaryTypeInput.value,
      salaries: state,
      daysPerMonth: parseFloat(daysPerMonthInput.value),
      hoursPerDay: parseFloat(hoursPerDayInput.value),
      hourlyRate: calculateRate(),
      exchangeRates: exchangeRates
    };

    chrome.storage.local.set(settings, () => {
      status.textContent = 'Settings saved!';
      setTimeout(() => {
        status.textContent = '';
      }, 2000);
    });
  }
});
