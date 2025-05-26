const mongoose = require('mongoose');

const budgetSchema = new mongoose.Schema({
    projectId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Project',
        required: [true, 'Le projet associé est requis'],
        index: true
    },
    type: {
        type: String,
        required: [true, 'Le type de budget est requis'],
        enum: ['Opérationnel', 'Investissement', 'Marketing', 'RH', 'Technique', 'HSE', 'Autre'],
        trim: true
    },
    description: {
        type: String,
        required: [true, 'La description du budget est requise'],
        trim: true
    },
    amount: {
        type: Number,
        required: [true, 'Le montant du budget est requis'],
        min: [0, 'Le montant du budget doit être positif']
    },
    currency: {
        type: String,
        required: [true, 'La devise du budget est requise'],
        enum: ['EUR', 'USD', 'GBP', 'MAD', 'DZD', 'TND'],
        default: 'EUR'
    },
    createdBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: [true, 'L\'utilisateur qui a créé le budget est requis']
    },
    updatedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    },
    isDeleted: {
        type: Boolean,
        default: false
    }
}, {
    timestamps: true
});

// Indexes for faster queries
budgetSchema.index({ projectId: 1, type: 1 });
budgetSchema.index({ projectId: 1, currency: 1 });

// Virtual for converting to different currencies (for future implementation)
budgetSchema.virtual('convertedAmount').get(function () {
    // Placeholder for future currency conversion functionality
    return this.amount;
});

module.exports = mongoose.model('Budget', budgetSchema);