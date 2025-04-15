const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const responsiblePersonSchema = new Schema({
    name: {
        type: String,
        required: [true, 'Le nom du responsable est requis']
    },
    email: {
        type: String
    },
    phone: {
        type: String
    },
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    }
});

const equipmentHistorySchema = new Schema({
    equipmentId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Equipment',
        required: [true, 'L\'ID de l\'équipement est requis'],
        index: true
    },
    type: {
        type: String,
        enum: ['placement', 'operation', 'maintenance'],
        required: [true, 'Le type d\'historique est requis'],
        index: true
    },
    description: {
        type: String,
        required: [true, 'La description est requise'],
        trim: true
    },
    fromDate: {
        type: Date,
        required: [true, 'La date de début est requise'],
        index: true
    },
    toDate: {
        type: Date,
        // Can be null for ongoing events
    },
    location: {
        type: String,
        trim: true
    },
    responsiblePerson: {
        type: responsiblePersonSchema
    },
    createdBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: [true, 'L\'ID de l\'utilisateur créateur est requis']
    }
}, {
    timestamps: true
});

// Create compound index for common queries
equipmentHistorySchema.index({ equipmentId: 1, type: 1, fromDate: -1 });

// Validate that toDate is after fromDate if provided
equipmentHistorySchema.pre('save', function (next) {
    if (this.toDate && this.fromDate > this.toDate) {
        next(new Error('La date de fin doit être postérieure à la date de début'));
    }
    next();
});

module.exports = mongoose.model('EquipmentHistory', equipmentHistorySchema); 