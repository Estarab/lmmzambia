// models/Transaction.js
const mongoose = require('mongoose');
const glytransactionSchema = new mongoose.Schema({
  items: [{
    productId: mongoose.Schema.Types.ObjectId,
    name: String,
    qty: Number,
    unitPrice: Number,
    total: Number
  }],
  total: Number,
  amountReceived: Number,
  change: Number,
  paymentMethod: String,
  username: { type: String, required: true },
  date: { type: Date, default: Date.now }
});
module.exports = mongoose.model('GlyTransaction', glytransactionSchema);