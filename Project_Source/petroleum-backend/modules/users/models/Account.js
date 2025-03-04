const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const accountSchema = new Schema({
  email: { type: String, required: true, unique: true },
  motDePasse: {
    iv: { type: String, required: true },
    encryptedData: { type: String, required: true }
  },
  utilisateurAssocie: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  activationToken: String,
  activationTokenExpiry: Date,
  mustChangePassword: { type: Boolean, default: true }
});

module.exports = mongoose.model('Account', accountSchema);