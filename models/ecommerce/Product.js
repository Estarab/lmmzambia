const mongoose = require('mongoose');

const productSchema = new mongoose.Schema({
  name: { type: String, required: true },
  category: { type: String, required: true },
  subcategory: { type: String, required: true },
  description: String,
  price: { type: Number, required: true },
  stock: { type: Number, required: true },
  images: [{ type: String }], // array of image URLs, max 5
  dateCreated: { type: Date, default: Date.now },
});

module.exports = mongoose.model('EProduct', productSchema);
