const mongoose = require("mongoose");

const eAdminSchema = new mongoose.Schema({
  username: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  role: { type: String, default: "admin" },
  dateCreated: { type: Date, default: Date.now }
});

module.exports = mongoose.model("EAdmin", eAdminSchema);
