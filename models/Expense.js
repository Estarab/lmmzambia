const mongoose = require('mongoose');

const expenseSchema = new mongoose.Schema({
  title: { type: String, required: true },
  amount: { type: Number, required: true },
  category: { type: String, default: 'General' },
  username: { type: String, required: true },
  date: { type: Date, default: Date.now },
  notes: { type: String },
});

const Expense = mongoose.model('Expense', expenseSchema);
// const Expense = (dbConnection) => dbConnection.model('Expense', expenseSchema);

module.exports = Expense;
