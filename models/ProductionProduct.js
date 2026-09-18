const mongoose = require('mongoose');

const productionProductSchema = new mongoose.Schema({
  name: { type: String, required: true },
  unit: { type: String, default: 'kg' },
  recipe: [
    {
      materialId: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true },
      materialName: { type: String, required: true },
      qtyPerUnit: { type: Number, required: true },
      pricePerUnit: { type: Number, required: true }, // price of that raw material per unit
    },
  ],
}, { timestamps: true });

module.exports = mongoose.model('ProductionProduct', productionProductSchema);
// module.exports = (dbConnection) => dbConnection.model('ProductionProduct', productionProductSchema);
