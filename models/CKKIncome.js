




const mongoose = require('mongoose');

const ckkincomeSchema = new mongoose.Schema({
  title: { type: String, required: true },
  amount: { type: Number, required: true },
  category: { type: String, default: 'General' },
  username: { type: String, required: true },
  date: { type: Date, default: Date.now },
  notes: { type: String },
  business: { type: String, required: true },
});

const CKKIncome = mongoose.model('CKKIncome', ckkincomeSchema);
// const Income = (dbConnection) => dbConnection.model('CKKIncome', ckkincomeSchema);

module.exports = CKKIncome;
