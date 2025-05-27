const mongoose = require('mongoose');
const Schema = mongoose.Schema;
const { EQUIPMENT_STATUS, ACTIVITY_TYPE } = require('./equipment.model');

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
        type: Schema.Types.ObjectId,
        ref: 'User'
    }
});

const equipmentHistorySchema = new Schema({
    equipmentId: {
        type: Schema.Types.ObjectId,
        ref: 'Equipment',
        required: [true, 'ID d\'équipement requis'],
        index: true
    },
    type: {
        type: String,
        enum: Object.values(ACTIVITY_TYPE),
        required: [true, 'Type d\'activité requis'],
        index: true
    },
    description: {
        type: String,
        required: [true, 'Description requise']
    },
    fromDate: {
        type: Date,
        required: [true, 'Date de début requise'],
        index: true
    },
    toDate: {
        type: Date
    },
    location: {
        type: String
    },
    responsiblePerson: {
        type: responsiblePersonSchema
    },
    createdBy: {
        type: Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    // New fields for status tracking
    isStatusChange: {
        type: Boolean,
        default: false
    },
    fromStatus: {
        type: String,
        enum: [...Object.values(EQUIPMENT_STATUS), null]
    },
    toStatus: {
        type: String,
        enum: [...Object.values(EQUIPMENT_STATUS), null]
    },
    reason: {
        type: String,
        trim: true
    },
    activityId: {
        type: Schema.Types.ObjectId,
        ref: 'Equipment.activities'
    }
}, {
    timestamps: true
});

// Indexes for faster queries
equipmentHistorySchema.index({ equipmentId: 1, type: 1 });
equipmentHistorySchema.index({ equipmentId: 1, fromDate: -1 });
equipmentHistorySchema.index({ equipmentId: 1, isStatusChange: 1 });

// Validate that toDate is after fromDate if provided
equipmentHistorySchema.pre('save', function (next) {
    if (this.toDate && this.fromDate > this.toDate) {
        next(new Error('La date de fin doit être postérieure à la date de début'));
    }
    next();
});

module.exports = mongoose.model('EquipmentHistory', equipmentHistorySchema); 