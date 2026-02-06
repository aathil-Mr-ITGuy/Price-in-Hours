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

  // State to store separate values for each mode
  const state = {
    monthly: '',
    daily: '',
    hourly: ''
  };

  // Load saved settings
  chrome.storage.local.get(
    ['currency', 'salaryType', 'salaries', 'daysPerMonth', 'hoursPerDay'],
    (data) => {
      if (data.currency) currencySelect.value = data.currency;
      
      // Load saved salaries into state
      if (data.salaries) {
        Object.assign(state, data.salaries);
      }
      
      if (data.daysPerMonth) daysPerMonthInput.value = data.daysPerMonth;
      if (data.hoursPerDay) hoursPerDayInput.value = data.hoursPerDay;
      
      // Set active type and populate input
      if (data.salaryType) {
        setSalaryType(data.salaryType);
      } else {
        setSalaryType('monthly'); // default
      }
      
      updateUI(); // Set visibility
      calculateRate(); // Initial calc
    }
  );

  // Event Listeners
  toggleBtns.forEach(btn => {
    btn.addEventListener('click', (e) => {
      const newType = e.target.dataset.value;
      const oldType = salaryTypeInput.value;
      
      // Save current input to state before switching
      state[oldType] = salaryInput.value;
      
      setSalaryType(newType);
      updateUI();
      calculateRate();
    });
  });

  salaryInput.addEventListener('input', (e) => {
    // Update state as user types
    state[salaryTypeInput.value] = e.target.value;
    calculateRate();
  });

  [daysPerMonthInput, hoursPerDayInput, currencySelect].forEach(el => {
    el.addEventListener('input', () => {
      calculateRate();
      updateUI();
    });
  });

  saveBtn.addEventListener('click', saveSettings);

  // Functions
  function setSalaryType(type) {
    salaryTypeInput.value = type;
    
    // Update buttons
    toggleBtns.forEach(btn => {
      if (btn.dataset.value === type) btn.classList.add('active');
      else btn.classList.remove('active');
    });

    // Restore value for this type
    salaryInput.value = state[type] || '';
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

    // Format to 2 decimals
    hourlyRateDisplay.textContent = hourlyRate.toFixed(2) + ' ' + currencySelect.value + '/hr';
    return hourlyRate;
  }

  function saveSettings() {
    // Ensure current input is saved to state
    state[salaryTypeInput.value] = salaryInput.value;

    const settings = {
      currency: currencySelect.value,
      salaryType: salaryTypeInput.value,
      salaries: state, // Save all 3 states
      daysPerMonth: parseFloat(daysPerMonthInput.value),
      hoursPerDay: parseFloat(hoursPerDayInput.value),
      hourlyRate: calculateRate() // Cache the calculated rate
    };

    chrome.storage.local.set(settings, () => {
      status.textContent = 'Settings saved!';
      setTimeout(() => {
        status.textContent = '';
      }, 2000);
    });
  }
});
