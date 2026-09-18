



const mongoose = require('mongoose');

const ckkexpenseSchema = new mongoose.Schema({
  title: { type: String, required: true },
  amount: { type: Number, required: true },
  category: { type: String, default: 'General' },
  username: { type: String, required: true },
  date: { type: Date, default: Date.now },
  notes: { type: String },
  business: { type: String, required: true },
});

const CKKExpense = mongoose.model('CKKExpense', ckkexpenseSchema);
// const CKKExpense = (dbConnection) => dbConnection.model('CKKExpense', ckkexpenseSchema);

module.exports = CKKExpense;
