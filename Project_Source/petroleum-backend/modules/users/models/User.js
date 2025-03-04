const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const userSchema = new Schema({
  nom: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  role: { type: String, required: true },
  niveauAcces: { type: String, required: true },
  estActif: { type: Boolean, default: false },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model('User', userSchema);