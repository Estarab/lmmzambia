const mongoose = require('mongoose');

const mauritiususerSchema = new mongoose.Schema({
  username: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  role: { type: String, enum: ['admin', 'user'], required: true }
});

module.exports = mongoose.model('MauritiusUser', mauritiususerSchema);