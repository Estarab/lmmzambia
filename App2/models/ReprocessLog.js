// models/ReprocessLog.js
const mongoose = require('mongoose');

const ReprocessLogSchema = new mongoose.Schema({
  fromCode: { type: String, required: true },
  toCode: { type: String, required: true },
  amount: { type: Number, required: true },
  processedAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model('ReprocessLog', ReprocessLogSchema);
