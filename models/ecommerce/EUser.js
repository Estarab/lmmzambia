const mongoose = require("mongoose");

const eUserSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  phone: String,
  address: String,
  dateCreated: { type: Date, default: Date.now }
});

module.exports = mongoose.model("EUser", eUserSchema);
