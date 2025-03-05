const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const userSchema = new Schema({
  nom: {
    type: String,
    required: [true, 'Le nom est requis'],
  },
  email: {
    type: String,
    required: [true, 'L\'email est requis'],
    unique: true,
    lowercase: true,
  },
  role: {
    type: String,
    enum: ['User', 'Manager'],
    default: 'User',
  },
  telephone: {
    type: String,
  },
  departement: {
    type: String,
  },
  niveauAcces: {
    type: String,
    enum: ['user', 'admin'],
    default: 'user',
  },
  estActif: {
    type: Boolean,
    default: false,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
  updatedAt: {
    type: Date,
  },
});

module.exports = mongoose.model('User', userSchema);