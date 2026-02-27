// Smart Expense Splitter - Pure JavaScript Implementation
// No frameworks, no libraries, just vanilla JS

// Data Structure
let people = [];
let expenses = [];

// DOM Elements
const personNameInput = document.getElementById('personNameInput');
const addPersonBtn = document.getElementById('addPersonBtn');
const peopleList = document.getElementById('peopleList');
const expenseNameInput = document.getElementById('expenseNameInput');
const expenseAmountInput = document.getElementById('expenseAmountInput');
const paidBySelect = document.getElementById('paidBySelect');
const participantsList = document.getElementById('participantsList');
const addExpenseBtn = document.getElementById('addExpenseBtn');
const expensesList = document.getElementById('expensesList');
const settlementList = document.getElementById('settlementList');
const clearAllBtn = document.getElementById('clearAllBtn');

// Initialize app on load
window.addEventListener('DOMContentLoaded', () => {
    loadDataFromLocalStorage();
    renderPeople();
    renderExpenses();
    calculateAndRenderSettlement();
});

// ========== LOCAL STORAGE FUNCTIONS ==========

function saveToLocalStorage() {
    localStorage.setItem('expenseSplitterPeople', JSON.stringify(people));
    localStorage.setItem('expenseSplitterExpenses', JSON.stringify(expenses));
}

function loadDataFromLocalStorage() {
    const savedPeople = localStorage.getItem('expenseSplitterPeople');
    const savedExpenses = localStorage.getItem('expenseSplitterExpenses');
    
    if (savedPeople) {
        people = JSON.parse(savedPeople);
    }
    
    if (savedExpenses) {
        expenses = JSON.parse(savedExpenses);
    }
}

// ========== PEOPLE MANAGEMENT ==========

addPersonBtn.addEventListener('click', addPerson);
personNameInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') addPerson();
});

function addPerson() {
    const name = personNameInput.value.trim();
    
    if (!name) {
        alert('Please enter a person\'s name');
        return;
    }
    
    if (people.some(p => p.name.toLowerCase() === name.toLowerCase())) {
        alert('This person already exists');
        return;
    }
    
    people.push({
        id: Date.now(),
        name: name,
        joinedAt: Date.now()
    });
    
    personNameInput.value = '';
    saveToLocalStorage();
    renderPeople();
    updatePaidByDropdown();
    updateParticipantsCheckboxes();
    calculateAndRenderSettlement();
}

function removePerson(personId) {
    const person = people.find(p => p.id === personId);
    
    if (!person) return;
    
    // Check if person is involved in any expenses
    const involvedInExpenses = expenses.some(exp => 
        exp.paidBy === personId || exp.participants.includes(personId)
    );
    
    if (involvedInExpenses) {
        if (!confirm(`${person.name} is involved in existing expenses. Remove anyway?`)) {
            return;
        }
    }
    
    people = people.filter(p => p.id !== personId);
    saveToLocalStorage();
    renderPeople();
    updatePaidByDropdown();
    updateParticipantsCheckboxes();
    calculateAndRenderSettlement();
}

function renderPeople() {
    if (people.length === 0) {
        peopleList.innerHTML = '<p class="empty-state">No people added yet</p>';
        return;
    }
    
    peopleList.innerHTML = people.map(person => `
        <div class="person-tag" data-testid="person-tag-${person.id}">
            <span>${person.name}</span>
            <button class="remove-btn" onclick="removePerson(${person.id})" data-testid="remove-person-${person.id}">×</button>
        </div>
    `).join('');
}

// ========== EXPENSE MANAGEMENT ==========

addExpenseBtn.addEventListener('click', addExpense);

function addExpense() {
    const expenseName = expenseNameInput.value.trim();
    const amount = parseFloat(expenseAmountInput.value);
    const paidBy = parseInt(paidBySelect.value);
    
    // Get selected participants
    const participantCheckboxes = document.querySelectorAll('.participant-checkbox input[type="checkbox"]:checked');
    const participants = Array.from(participantCheckboxes).map(cb => parseInt(cb.value));
    
    // Validation
    if (!expenseName) {
        alert('Please enter an expense name');
        return;
    }
    
    if (!amount || amount <= 0) {
        alert('Please enter a valid amount');
        return;
    }
    
    if (!paidBy) {
        alert('Please select who paid');
        return;
    }
    
    if (participants.length === 0) {
        alert('Please select at least one participant');
        return;
    }
    
    // Add expense
    expenses.push({
        id: Date.now(),
        name: expenseName,
        amount: amount,
        paidBy: paidBy,
        participants: participants,
        createdAt: Date.now()
    });
    
    // Reset form
    expenseNameInput.value = '';
    expenseAmountInput.value = '';
    paidBySelect.value = '';
    document.querySelectorAll('.participant-checkbox input[type="checkbox"]').forEach(cb => {
        cb.checked = false;
    });
    
    saveToLocalStorage();
    renderExpenses();
    calculateAndRenderSettlement();
}

function deleteExpense(expenseId) {
    if (!confirm('Are you sure you want to delete this expense?')) {
        return;
    }
    
    expenses = expenses.filter(exp => exp.id !== expenseId);
    saveToLocalStorage();
    renderExpenses();
    calculateAndRenderSettlement();
}

function renderExpenses() {
    if (expenses.length === 0) {
        expensesList.innerHTML = '<p class="empty-state">No expenses added yet</p>';
        return;
    }
    
    expensesList.innerHTML = expenses.map(expense => {
        const paidByPerson = people.find(p => p.id === expense.paidBy);
        const participantNames = expense.participants
            .map(id => people.find(p => p.id === id)?.name || 'Unknown')
            .join(', ');
        
        return `
            <div class="expense-item" data-testid="expense-item-${expense.id}">
                <div class="expense-header">
                    <div>
                        <div class="expense-title">${expense.name}</div>
                        <div class="expense-details">Paid by: ${paidByPerson?.name || 'Unknown'}</div>
                        <div class="expense-participants">Split among: ${participantNames}</div>
                    </div>
                    <div style="display: flex; flex-direction: column; align-items: flex-end; gap: 8px;">
                        <div class="expense-amount">₹${expense.amount.toFixed(2)}</div>
                        <button class="btn btn-danger" onclick="deleteExpense(${expense.id})" data-testid="delete-expense-${expense.id}">Delete</button>
                    </div>
                </div>
            </div>
        `;
    }).join('');
}

function updatePaidByDropdown() {
    paidBySelect.innerHTML = '<option value="">Select person</option>' + 
        people.map(person => `<option value="${person.id}">${person.name}</option>`).join('');
}

function updateParticipantsCheckboxes() {
    if (people.length === 0) {
        participantsList.innerHTML = '<p class="empty-state">Add people first</p>';
        return;
    }
    
    participantsList.innerHTML = people.map(person => `
        <div class="participant-checkbox" data-testid="participant-checkbox-${person.id}">
            <input type="checkbox" id="participant_${person.id}" value="${person.id}" data-testid="participant-checkbox-input-${person.id}">
            <label for="participant_${person.id}">${person.name}</label>
        </div>
    `).join('');
}

// ========== SETTLEMENT CALCULATION ==========

function calculateAndRenderSettlement() {
    if (expenses.length === 0 || people.length === 0) {
        settlementList.innerHTML = '<p class="empty-state">Add expenses to see settlement details</p>';
        return;
    }
    
    // Calculate net balance for each person
    const balances = {};
    
    // Initialize balances
    people.forEach(person => {
        balances[person.id] = 0;
    });
    
    // Calculate balances based on expenses
    expenses.forEach(expense => {
        const shareAmount = expense.amount / expense.participants.length;
        
        // Person who paid gets credited
        balances[expense.paidBy] += expense.amount;
        
        // Each participant gets debited their share
        expense.participants.forEach(participantId => {
            balances[participantId] -= shareAmount;
        });
    });
    
    // Generate optimized settlements
    const settlements = generateOptimizedSettlements(balances);
    
    if (settlements.length === 0) {
        settlementList.innerHTML = '<p class="empty-state" style="color: #81C784;">All settled! No one owes anyone.</p>';
        return;
    }
    
    settlementList.innerHTML = settlements.map((settlement, index) => `
        <div class="settlement-item" data-testid="settlement-item-${index}" style="animation-delay: ${index * 0.1}s;">
            <strong>${settlement.from}</strong> should pay <strong>${settlement.to}</strong> <strong>₹${settlement.amount.toFixed(2)}</strong>
        </div>
    `).join('');
}

// Optimized Settlement Algorithm
// Uses greedy matching to minimize number of transactions
function generateOptimizedSettlements(balances) {
    // Separate creditors (people who are owed money) and debtors (people who owe money)
    const creditors = [];
    const debtors = [];
    
    Object.keys(balances).forEach(personId => {
        const balance = balances[personId];
        const person = people.find(p => p.id === parseInt(personId));
        
        if (!person) return;
        
        if (balance > 0.01) { // Creditor (owed money)
            creditors.push({ id: parseInt(personId), name: person.name, amount: balance });
        } else if (balance < -0.01) { // Debtor (owes money)
            debtors.push({ id: parseInt(personId), name: person.name, amount: Math.abs(balance) });
        }
    });
    
    // Sort creditors and debtors by amount (descending)
    creditors.sort((a, b) => b.amount - a.amount);
    debtors.sort((a, b) => b.amount - a.amount);
    
    // Generate settlements by matching debtors with creditors
    const settlements = [];
    let i = 0; // creditor index
    let j = 0; // debtor index
    
    while (i < creditors.length && j < debtors.length) {
        const creditor = creditors[i];
        const debtor = debtors[j];
        
        // Settle the minimum of what's owed and what's due
        const settleAmount = Math.min(creditor.amount, debtor.amount);
        
        settlements.push({
            from: debtor.name,
            to: creditor.name,
            amount: settleAmount
        });
        
        // Update amounts
        creditor.amount -= settleAmount;
        debtor.amount -= settleAmount;
        
        // Move to next creditor/debtor if fully settled
        if (creditor.amount < 0.01) i++;
        if (debtor.amount < 0.01) j++;
    }
    
    return settlements;
}

// ========== CLEAR ALL ==========

clearAllBtn.addEventListener('click', () => {
    if (!confirm('Are you sure you want to clear all data? This will delete all people and expenses.')) {
        return;
    }
    
    people = [];
    expenses = [];
    localStorage.removeItem('expenseSplitterPeople');
    localStorage.removeItem('expenseSplitterExpenses');
    
    renderPeople();
    renderExpenses();
    updatePaidByDropdown();
    updateParticipantsCheckboxes();
    calculateAndRenderSettlement();
});

