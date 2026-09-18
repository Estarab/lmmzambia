const mongoose = require('mongoose');

const saleSchema = new mongoose.Schema(
  {
    items: [
      {
        name: String,
        quantityKg: Number,
        pricePerKg: Number,
      },
    ],
    total: Number,
    paymentMethod: String,
    amountReceived: Number,
    changeDue: Number,
    cashier: String,
  },
  { timestamps: true }
);

module.exports = mongoose.model('Sale', saleSchema);
// module.exports = (dbConnection) => dbConnection.model('Sale', saleSchema);
