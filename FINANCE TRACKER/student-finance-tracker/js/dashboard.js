document.addEventListener('DOMContentLoaded', function() {
  let transactions = loadTransactions();

  // DOM Elements
  const transactionForm = document.getElementById('transaction-form');
  const transactionsList = document.getElementById('transactions-list');
  const amountInput = document.getElementById('amount');
  const typeSelect = document.getElementById('transaction-type');
  const categorySelect = document.getElementById('category');
  const dateInput = document.getElementById('date');
  const descriptionInput = document.getElementById('description');

  // Check if elements exist before proceeding
  if (!transactionForm || !transactionsList || !amountInput || !typeSelect || !categorySelect || !dateInput) {
    console.error('Critical form elements not found!');
    return;
  }

  // Set default date to today
  dateInput.valueAsDate = new Date();
  
  // Load transactions with data validation
  function loadTransactions() {
    try {
      const storedData = localStorage.getItem('expenso-transactions');
      if (!storedData) return [];
      
      const parsed = JSON.parse(storedData);
      
      if (!Array.isArray(parsed)) {
        console.error('Invalid transactions data - resetting');
        return [];
      }
      
      return parsed.filter(t => {
        return t && 
               typeof t.id === 'number' &&
               ['income', 'expense'].includes(t.type) &&
               typeof t.amount === 'number' &&
               t.date && 
               t.category;
      });
      
    } catch (e) {
      console.error('Error loading transactions:', e);
      return [];
    }
  }

  function saveTransactions() {
    try {
      localStorage.setItem(
        'expenso-transactions', 
        JSON.stringify(transactions)
      );
    } catch (e) {
      console.error('Failed to save transactions:', e);
      showNotification('Failed to save data', 'error');
    }
  }

  function formatDate(dateString) {
    try {
      const options = { year: 'numeric', month: 'short', day: 'numeric' };
      return new Date(dateString).toLocaleDateString(undefined, options);
    } catch (e) {
      console.error('Error formatting date:', e);
      return 'Invalid date';
    }
  }

  function formatRupees(amount) {
    return '₹' + (isNaN(amount) ? '0.00' : amount.toFixed(2));
  }

  function getMonthlyData(year, month) {
    const monthTransactions = transactions.filter(t => {
      try {
        const date = new Date(t.date);
        return date.getFullYear() === year && date.getMonth() === month;
      } catch (e) {
        console.error('Invalid date in transaction:', t.date);
        return false;
      }
    });
    
    return {
      income: monthTransactions.filter(t => t.type === 'income').map(t => t.amount),
      expenses: monthTransactions.filter(t => t.type === 'expense').map(t => t.amount)
    };
  }

  function updateDashboard() {
    updateSummaryCards();
    updateTransactionList();
  }

  function updateSummaryCards() {
    const totals = calculateTotals();
    
    document.getElementById('current-balance').textContent = formatRupees(totals.balance);
    document.getElementById('total-spent').textContent = formatRupees(totals.totalExpenses);
    document.getElementById('total-savings').textContent = formatRupees(totals.savings);
  }

  function calculateTotals() {
    const currentDate = new Date();
    const currentMonth = currentDate.getMonth();
    const currentYear = currentDate.getFullYear();
    
    const currentMonthData = getMonthlyData(currentYear, currentMonth);
    const currentIncome = currentMonthData.income.reduce((sum, amount) => sum + amount, 0);
    const currentExpenses = currentMonthData.expenses.reduce((sum, amount) => sum + amount, 0);
    const currentBalance = currentIncome - currentExpenses;
    
    return {
      balance: currentBalance,
      totalExpenses: currentExpenses,
      savings: currentBalance
    };
  }

  function updateTransactionList() {
    const recentTransactions = [...transactions]
      .sort((a, b) => {
        try {
          return new Date(b.date) - new Date(a.date);
        } catch (e) {
          console.error('Error sorting transactions by date:', e);
          return 0;
        }
      })
      

    if (recentTransactions.length === 0) {
      transactionsList.innerHTML = '<p>No transactions yet. Add one to get started!</p>';
      return;
    }

    transactionsList.innerHTML = recentTransactions.map(transaction => `
      <div class="transaction">
        <div class="transaction-info">
          <span class="category ${transaction.category}">${transaction.category}</span>
          <span class="date">${formatDate(transaction.date)}</span>
          ${transaction.description ? `<span class="description">${transaction.description}</span>` : ''}
        </div>
        <div class="amount ${transaction.type}">
          ${transaction.type === 'income' ? '+' : '-'}${formatRupees(transaction.amount)}
        </div>
      </div>
    `).join('');
  }

  function showNotification(message, type = 'success') {
    const notification = document.createElement('div');
    notification.className = `notification ${type}`;
    notification.textContent = message;
    document.body.appendChild(notification);
    
    setTimeout(() => notification.classList.add('show'), 10);
    setTimeout(() => {
      notification.classList.remove('show');
      setTimeout(() => document.body.removeChild(notification), 300);
    }, 3000);
  }

  // Initial render
  updateDashboard();

  transactionForm.addEventListener('submit', function(e) {
    e.preventDefault();
    
    const amount = parseFloat(amountInput.value);
    if (isNaN(amount) || amount <= 0) {
      showNotification('Please enter a valid positive amount', 'error');
      return;
    }
    
    if (!categorySelect.value) {
      showNotification('Please select a category', 'error');
      return;
    }
    
    if (!dateInput.value) {
      showNotification('Please select a valid date', 'error');
      return;
    }
    
    const transaction = {
      id: Date.now(),
      type: typeSelect.value,
      amount: amount,
      category: categorySelect.value,
      date: new Date(dateInput.value).toISOString(),
      description: descriptionInput.value || '',
      timestamp: new Date().getTime()
    };
    
    transactions.push(transaction);
    saveTransactions();
    updateDashboard();
    transactionForm.reset();
    dateInput.valueAsDate = new Date();
    showNotification('Transaction added successfully!');
  });
});