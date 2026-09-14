const STORAGE_KEY = "expense_tracker_transactions";

let transactions = [];
let editingId = null;
let currentFilter = "all";

const form = document.getElementById("transactionForm");
const dateInput = document.getElementById("date");
const descInput = document.getElementById("description");
const categorySelect = document.getElementById("category");
const amountInput = document.getElementById("amount");
const typeSelect = document.getElementById("type");

const submitBtnText = document.getElementById("submitBtnText");
const formTitle = document.getElementById("formTitle");
const cancelEditBtn = document.getElementById("cancelEditBtn");

const filterCategorySelect = document.getElementById("filterCategory");
const filterBadge = document.getElementById("filterBadge");

const transactionsList = document.getElementById("transactionsList");

const totalIncomeEl = document.getElementById("totalIncome");
const totalExpenseEl = document.getElementById("totalExpense");
const totalBalanceEl = document.getElementById("totalBalance");

const clearAllBtn = document.getElementById("clearAllBtn");

function formatCurrency(value) {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }).format(value);
}

function formatDate(date) {
  if (!date) return "";

  const parts = date.split("-");

  if (parts.length !== 3) {
    return date;
  }

  return `${parts[2]}/${parts[1]}/${parts[0]}`;
}

function generateId() {
  return `${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
}

function getToday() {
  const now = new Date();

  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

function loadTransactions() {
  try {
    const storedData = localStorage.getItem(STORAGE_KEY);

    if (!storedData) {
      transactions = [];
      return;
    }

    const parsedData = JSON.parse(storedData);

    if (!Array.isArray(parsedData)) {
      transactions = [];
      return;
    }

    transactions = parsedData.map(transaction => ({
      id: transaction.id || generateId(),
      date: transaction.date || "",
      description: transaction.description || "",
      category: transaction.category || "Other",
      amount: Number(transaction.amount) || 0,
      type: transaction.type === "income" ? "income" : "expense"
    }));

  } catch (error) {
    transactions = [];
    localStorage.removeItem(STORAGE_KEY);
  }
}

function saveTransactions() {
  localStorage.setItem(
    STORAGE_KEY,
    JSON.stringify(transactions)
  );
}

function calculateTotals() {
  let income = 0;
  let expense = 0;

  transactions.forEach(transaction => {
    const amount = Number(transaction.amount) || 0;

    if (transaction.type === "income") {
      income += amount;
    } else {
      expense += amount;
    }
  });

  return {
    income,
    expense,
    balance: income - expense
  };
}

function updateSummary() {
  const totals = calculateTotals();

  totalIncomeEl.textContent = formatCurrency(totals.income);
  totalExpenseEl.textContent = formatCurrency(totals.expense);
  totalBalanceEl.textContent = formatCurrency(totals.balance);
}

function escapeHTML(value) {
  const div = document.createElement("div");
  div.textContent = value;
  return div.innerHTML;
}

function renderTransactions() {
  let filteredTransactions = transactions;

  if (currentFilter !== "all") {
    filteredTransactions = transactions.filter(
      transaction => transaction.category === currentFilter
    );
  }

  const sortedTransactions = [...filteredTransactions].sort(
    (a, b) => new Date(b.date) - new Date(a.date)
  );

  filterBadge.textContent =
    currentFilter === "all" ? "All" : currentFilter;

  if (sortedTransactions.length === 0) {
    transactionsList.innerHTML = `
      <div class="empty-state">
        <i class="fas fa-receipt"></i>
        <p>No transactions found</p>
        <span>Add a new transaction or change the filter</span>
      </div>
    `;

    return;
  }

  transactionsList.innerHTML = sortedTransactions
    .map(transaction => {
      const amountClass =
        transaction.type === "income" ? "income" : "expense";

      const sign =
        transaction.type === "income" ? "+" : "-";

      return `
        <div class="transaction-item">

          <div class="transaction-date">
            ${formatDate(transaction.date)}
          </div>

          <div
            class="transaction-desc"
            title="${escapeHTML(transaction.description)}"
          >
            ${escapeHTML(transaction.description)}
          </div>

          <div class="transaction-category">
            ${escapeHTML(transaction.category)}
          </div>

          <div class="transaction-amount ${amountClass}">
            ${sign} ${formatCurrency(transaction.amount)}
          </div>

          <div class="transaction-type">
            ${transaction.type}
          </div>

          <div class="transaction-actions">

            <button
              class="btn-icon edit"
              type="button"
              data-id="${transaction.id}"
              title="Edit"
            >
              <i class="fas fa-edit"></i>
            </button>

            <button
              class="btn-icon delete"
              type="button"
              data-id="${transaction.id}"
              title="Delete"
            >
              <i class="fas fa-trash-alt"></i>
            </button>

          </div>

        </div>
      `;
    })
    .join("");
}

function render() {
  updateSummary();
  renderTransactions();
}

function resetForm() {
  editingId = null;

  form.reset();

  dateInput.value = getToday();
  typeSelect.value = "expense";

  submitBtnText.textContent = "Add";
  formTitle.textContent = "Add transaction";

  cancelEditBtn.style.display = "none";
}

function startEdit(id) {
  const transaction = transactions.find(
    item => String(item.id) === String(id)
  );

  if (!transaction) {
    return;
  }

  editingId = transaction.id;

  dateInput.value = transaction.date;
  descInput.value = transaction.description;
  categorySelect.value = transaction.category;
  amountInput.value = transaction.amount;
  typeSelect.value = transaction.type;

  submitBtnText.textContent = "Update";
  formTitle.textContent = "Edit transaction";

  cancelEditBtn.style.display = "inline-flex";

  document
    .querySelector(".form-section")
    .scrollIntoView({
      behavior: "smooth",
      block: "center"
    });
}

function deleteTransaction(id) {
  const transaction = transactions.find(
    item => String(item.id) === String(id)
  );

  if (!transaction) {
    return;
  }

  const confirmed = confirm(
    `Delete "${transaction.description}"?`
  );

  if (!confirmed) {
    return;
  }

  transactions = transactions.filter(
    item => String(item.id) !== String(id)
  );

  saveTransactions();

  if (String(editingId) === String(id)) {
    resetForm();
  }

  render();
}

function clearAllTransactions() {
  if (transactions.length === 0) {
    alert("There are no transactions to clear.");
    return;
  }

  const confirmed = confirm(
    "Delete all transactions? This cannot be undone."
  );

  if (!confirmed) {
    return;
  }

  transactions = [];

  saveTransactions();

  resetForm();

  render();
}

function handleSubmit(event) {
  event.preventDefault();

  const date = dateInput.value;
  const description = descInput.value.trim();
  const category = categorySelect.value;
  const amount = Number(amountInput.value);
  const type = typeSelect.value;

  if (!date) {
    alert("Please select a date.");
    dateInput.focus();
    return;
  }

  if (!description) {
    alert("Please enter a description.");
    descInput.focus();
    return;
  }

  if (!category) {
    alert("Please select a category.");
    categorySelect.focus();
    return;
  }

  if (!Number.isFinite(amount) || amount <= 0) {
    alert("Please enter a valid amount.");
    amountInput.focus();
    return;
  }

  if (type !== "income" && type !== "expense") {
    alert("Please select a valid transaction type.");
    typeSelect.focus();
    return;
  }

  const transactionData = {
    date,
    description,
    category,
    amount,
    type
  };

  if (editingId !== null) {
    const index = transactions.findIndex(
      transaction =>
        String(transaction.id) === String(editingId)
    );

    if (index !== -1) {
      transactions[index] = {
        ...transactions[index],
        ...transactionData
      };
    }
  } else {
    transactions.push({
      id: generateId(),
      ...transactionData
    });
  }

  saveTransactions();

  resetForm();

  render();
}

form.addEventListener("submit", handleSubmit);

cancelEditBtn.addEventListener("click", resetForm);

clearAllBtn.addEventListener(
  "click",
  clearAllTransactions
);

filterCategorySelect.addEventListener(
  "change",
  event => {
    currentFilter = event.target.value;
    renderTransactions();
  }
);

transactionsList.addEventListener(
  "click",
  event => {
    const editButton = event.target.closest(".edit");
    const deleteButton = event.target.closest(".delete");

    if (editButton) {
      startEdit(editButton.dataset.id);
      return;
    }

    if (deleteButton) {
      deleteTransaction(deleteButton.dataset.id);
    }
  }
);

dateInput.value = getToday();

loadTransactions();

render();