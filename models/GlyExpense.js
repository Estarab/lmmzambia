const mongoose = require('mongoose');

const glyexpenseSchema = new mongoose.Schema({
  title: { type: String, required: true },
  amount: { type: Number, required: true },
  category: { type: String, default: 'General' },
  username: { type: String, required: true },
  date: { type: Date, default: Date.now },
  notes: { type: String },
});

const GlyExpense = mongoose.model('GlyExpense', glyexpenseSchema);
// const Expense = (dbConnection) => dbConnection.model('Expense', expenseSchema);

module.exports = GlyExpense;