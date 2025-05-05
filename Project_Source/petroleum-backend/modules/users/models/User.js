const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const userSchema = new Schema({
  nom: {
    type: String,
    required: [true, 'Le nom est requis'],
  },
  prenom: {
    type: String,
    required: [true, 'Le prénom est requis'],
  },
  email: {
    type: String,
    required: [true, 'L\'email est requis'],
    unique: true,
    lowercase: true,
  },
  role: {
    type: String,
    enum: [
      'Manager',
      'Chef projet',
      'Resp. RH',
      'Resp. Logistique',
      'Chef de base',
      'Resp. magasin',
      'Resp. Achat',
      'Resp. Maintenance',
      'Chef Opérateur'
    ],
    required: true
  },
  employeeId: {
    type: String,
    unique: true,
    // Will be generated on creation
  },
  telephone: {
    type: String,
  },
  country: {
    type: String,
    default: 'Tunisia',
  },
  city: {
    type: String,
  },
  state: {
    type: String,
  },
  estActif: {
    type: Boolean,
    default: false,
  },
  profilePicture: {
    url: String,
    publicId: String
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
  updatedAt: {
    type: Date,
  },
});

// Generate employee ID before saving
userSchema.pre('save', async function (next) {
  if (!this.employeeId) {
    // Get the count of existing users to generate the number
    const count = await mongoose.model('User').countDocuments();
    const number = (count + 1).toString().padStart(4, '0');
    this.employeeId = `ITAL-MAG-${number}`;
  }
  next();
});

module.exports = mongoose.model('User', userSchema);