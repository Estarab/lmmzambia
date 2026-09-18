const mongoose = require('mongoose');

const stockTransactionSchema = new mongoose.Schema({
  productId: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true },
  type: { 
    type: String, 
    enum: ['Products-Received', 'Products-Returned', 'Returned-Products-Received'], 
    required: true 
  },
  quantity: { type: Number, required: true },
  pricePerKg: { type: Number },  // optional, for valuation
  date: { type: Date, default: Date.now },
  note: {type: String, default: ''}
});

module.exports = mongoose.model('StockTransaction', stockTransactionSchema);


