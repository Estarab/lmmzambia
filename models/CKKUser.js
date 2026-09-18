const mongoose = require('mongoose');

const ckkuserSchema = new mongoose.Schema({
  username: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  role: { type: String, enum: ['admin', 'user'], required: true }
});

module.exports = mongoose.model('CKKUser', ckkuserSchema);
// module.exports = (dbConnection) => dbConnection.model('CKKUser', ckkuserSchema);

