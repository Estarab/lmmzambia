const mongoose = require('mongoose');

const productSchema = new mongoose.Schema({
  name: { type: String, required: true },
  pricePerKg: { type: Number, required: true },
  stockKg: { type: Number, required: true },
  stockType: { type: String, enum: ['new', 'returned'], default: 'new' }, 
  stockreturnKg: { type: Number, default: 0 },
  code: { type: String, required: true, unique: true },
  notes: {type: String, default: ''},
});

module.exports = mongoose.model('Product', productSchema);
// module.exports = (dbConnection) => dbConnection.model('Product', productSchema);




