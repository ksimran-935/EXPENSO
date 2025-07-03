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

  function calculateTotals() {
    let balance = 0;
    let totalExpenses = 0;
    let savings = 0;

    // Process all transactions
    transactions.forEach(t => {
      if (t.type === 'income') {
        if (t.category === 'savings') {
          savings += t.amount;
        } else {
          balance += t.amount;
        }
      } else if (t.type === 'expense') {
        if (t.category === 'savings') {
          savings -= t.amount;
        } else {
          balance -= t.amount;
          totalExpenses += t.amount;
        }
      }
    });

    return {
      balance,
      totalExpenses,
      savings
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

  function updateTransactionList() {
  const recentTransactions = [...transactions]
    .sort((a, b) => {
      
      try {
        const dateA = new Date(a.date).getTime();
        const dateB = new Date(b.date).getTime();
        
        
        if (dateA !== dateB) {
          return dateB - dateA;
        }
        
        const timestampA = a.timestamp ;
        const timestampB = b.timestamp ;
        return timestampB - timestampA;
      } catch (e) {
        console.error('Error sorting transactions:', e);
        return 0;
      }
    });

  if (recentTransactions.length === 0) {
    transactionsList.innerHTML = '<p>No transactions yet. Add one to get started!</p>';
    return;
  }

  transactionsList.innerHTML = recentTransactions.map(transaction => `
    <div class="transaction ${transaction.category === 'savings' ? 'savings-transaction' : ''}">
      <div class="transaction-info">
        <span class="category ${transaction.category}">
          ${transaction.category}
        </span>
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
    
    const transactionDate = new Date(dateInput.value);
    // If transaction date is today, use current time, otherwise use start of day
    const now = new Date();
    if (transactionDate.toDateString() === now.toDateString()) {
      transactionDate.setHours(now.getHours(), now.getMinutes(), now.getSeconds(), now.getMilliseconds());
    } else {
      transactionDate.setHours(12, 0, 0, 0); // Set to noon for consistent sorting
    }
    
    const transaction = {
      id: Date.now(),
      type: typeSelect.value,
      amount: amount,
      category: categorySelect.value,
      date: transactionDate.toISOString(),
      timestamp: new Date().getTime(), 
      description: descriptionInput.value || ''
    };
    
    // Add new transaction to beginning of array
    transactions.unshift(transaction);
    saveTransactions();
    updateDashboard();
    transactionForm.reset();
    dateInput.valueAsDate = new Date();
    showNotification('Transaction added successfully!');
  });
});