const mongoose = require('mongoose');
const Schema = mongoose.Schema;

/**
 * Plan Schema
 */
const planSchema = new Schema({
    title: {
        type: String,
        required: [true, 'Le titre est requis'],
        trim: true
    },
    description: {
        type: String,
        trim: true
    },
    startDate: {
        type: Date,
        required: [true, 'La date de début est requise']
    },
    endDate: {
        type: Date,
        required: [true, 'La date de fin est requise']
    },
    type: {
        type: String,
        enum: ['placement', 'maintenance', 'repair', 'custom'],
        required: [true, 'Le type de plan est requis']
    },
    customTypeName: {
        type: String,
        trim: true
    },
    status: {
        type: String,
        enum: ['scheduled', 'in_progress', 'completed', 'cancelled'],
        default: 'scheduled'
    },
    projectId: {
        type: Schema.Types.ObjectId,
        ref: 'Project'
    },
    equipmentId: {
        type: Schema.Types.ObjectId,
        ref: 'Equipment',
        required: [function () {
            // Equipment is only required for non-custom plan types
            return this.type !== 'custom';
        }, 'L\'ID de l\'équipement est requis pour les plans standard']
    },
    activityId: {
        type: Schema.Types.ObjectId,
        ref: 'Equipment.activities'
    },
    location: {
        type: String,
        trim: true
    },
    responsiblePerson: {
        name: {
            type: String,
            required: [true, 'Le nom du responsable est requis']
        },
        email: String,
        phone: String,
        userId: {
            type: Schema.Types.ObjectId,
            ref: 'User'
        }
    },
    notes: {
        type: String,
        trim: true
    },
    createdBy: {
        type: Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    updatedBy: {
        type: Schema.Types.ObjectId,
        ref: 'User'
    },
    isDeleted: {
        type: Boolean,
        default: false
    }
}, {
    timestamps: true
});

// Create indexes for better query performance
planSchema.index({ equipmentId: 1, startDate: 1, endDate: 1 });
planSchema.index({ status: 1 });
planSchema.index({ type: 1 });

/**
 * Validate end date is after start date
 */
planSchema.pre('validate', function (next) {
    if (this.startDate && this.endDate && this.startDate > this.endDate) {
        this.invalidate('endDate', 'La date de fin doit être postérieure à la date de début');
    }
    next();
});

/**
 * Format for API response
 */
planSchema.methods.toAPI = function () {
    return {
        id: this._id,
        title: this.title,
        description: this.description,
        startDate: this.startDate,
        endDate: this.endDate,
        type: this.type,
        customTypeName: this.customTypeName,
        status: this.status,
        projectId: this.projectId,
        equipmentId: this.equipmentId,
        activityId: this.activityId,
        location: this.location,
        responsiblePerson: this.responsiblePerson,
        notes: this.notes,
        createdBy: this.createdBy,
        createdAt: this.createdAt,
        updatedAt: this.updatedAt
    };
};

module.exports = mongoose.model('Plan', planSchema);