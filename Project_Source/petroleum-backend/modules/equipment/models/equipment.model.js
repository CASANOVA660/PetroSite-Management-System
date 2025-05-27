const mongoose = require('mongoose');
const Schema = mongoose.Schema;

// Equipment Status Constants
const EQUIPMENT_STATUS = {
    AVAILABLE: 'AVAILABLE',
    IN_USE: 'IN_USE',
    MAINTENANCE: 'MAINTENANCE',
    REPAIR: 'REPAIR',
    OUT_OF_SERVICE: 'OUT_OF_SERVICE'
};

// Activity Type Constants
const ACTIVITY_TYPE = {
    PLACEMENT: 'placement',
    OPERATION: 'operation',
    MAINTENANCE: 'maintenance',
    REPAIR: 'repair'
};

// Map old status values to new ones for backward compatibility
const STATUS_MAPPING = {
    'disponible': EQUIPMENT_STATUS.AVAILABLE,
    'disponible_needs_repair': EQUIPMENT_STATUS.AVAILABLE,
    'on_repair': EQUIPMENT_STATUS.REPAIR,
    'disponible_bon_etat': EQUIPMENT_STATUS.AVAILABLE,
    'working_non_disponible': EQUIPMENT_STATUS.IN_USE
};

const dimensionsSchema = new Schema({
    height: {
        type: Number,
        required: [true, 'La hauteur est requise']
    },
    width: {
        type: Number,
        required: [true, 'La largeur est requise']
    },
    length: {
        type: Number,
        required: [true, 'La longueur est requise']
    },
    weight: {
        type: Number,
        required: [true, 'Le poids est requis']
    },
    volume: {
        type: Number,
        default: function () {
            return this.height * this.width * this.length / 1000000; // Convert to cubic meters
        }
    }
});

const operatingConditionsSchema = new Schema({
    temperature: {
        type: String,
        required: [true, 'La température de fonctionnement est requise']
    },
    pressure: {
        type: String,
        required: [true, 'La pression de fonctionnement est requise']
    }
});

// Activity schema for scheduled and current activities
const activitySchema = new Schema({
    type: {
        type: String,
        enum: Object.values(ACTIVITY_TYPE),
        required: true
    },
    description: {
        type: String,
        trim: true
    },
    startDate: {
        type: Date,
        required: true
    },
    endDate: {
        type: Date,
        required: true
    },
    actualStartDate: {
        type: Date
    },
    actualEndDate: {
        type: Date
    },
    status: {
        type: String,
        enum: ['SCHEDULED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED'],
        default: 'SCHEDULED'
    },
    location: {
        type: String,
        trim: true
    },
    responsiblePerson: {
        name: String,
        email: String,
        phone: String,
        userId: {
            type: Schema.Types.ObjectId,
            ref: 'User'
        }
    },
    planId: {
        type: Schema.Types.ObjectId,
        ref: 'Plan'
    },
    createdBy: {
        type: Schema.Types.ObjectId,
        ref: 'User'
    }
});

const equipmentSchema = new Schema({
    nom: {
        type: String,
        required: [true, 'Le nom de l\'équipement est requis'],
        trim: true
    },
    reference: {
        type: String,
        required: [true, 'La référence est requise'],
        unique: true,
        trim: true
    },
    matricule: {
        type: String,
        required: [true, 'Le matricule est requis'],
        unique: true,
        trim: true
    },
    dimensions: {
        type: dimensionsSchema,
        required: [true, 'Les dimensions sont requises']
    },
    operatingConditions: {
        type: operatingConditionsSchema,
        required: [true, 'Les conditions de fonctionnement sont requises']
    },
    location: {
        type: String,
        required: [true, 'L\'emplacement est requis'],
        trim: true
    },
    status: {
        type: String,
        enum: [...Object.values(EQUIPMENT_STATUS), ...Object.keys(STATUS_MAPPING)],
        default: EQUIPMENT_STATUS.AVAILABLE
    },
    activities: [activitySchema],
    lastMaintenanceDate: {
        type: Date
    },
    nextMaintenanceDate: {
        type: Date
    },
    createdBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
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
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
});

// Virtual field for external activities from EquipmentHistory
equipmentSchema.virtual('externalActivities', {
    ref: 'EquipmentHistory',
    localField: '_id',
    foreignField: 'equipmentId',
    options: {
        match: {
            toDate: { $exists: false },
            isStatusChange: false
        },
        sort: { fromDate: 1 }
    }
});

// Indexes for faster queries
equipmentSchema.index({ reference: 1 });
equipmentSchema.index({ matricule: 1 });
equipmentSchema.index({ status: 1 });
equipmentSchema.index({ nom: 'text', reference: 'text', matricule: 'text' });
equipmentSchema.index({ isDeleted: 1 });

// Check for scheduling conflicts
equipmentSchema.methods.hasScheduleConflict = function (startDate, endDate) {
    return this.activities.some(activity => {
        if (activity.status === 'CANCELLED') return false;
        return (
            (activity.startDate <= endDate && activity.endDate >= startDate) &&
            (activity.status === 'SCHEDULED' || activity.status === 'IN_PROGRESS')
        );
    });
};

// Normalize old status values to new ones
equipmentSchema.pre('save', function (next) {
    if (STATUS_MAPPING[this.status]) {
        this.status = STATUS_MAPPING[this.status];
    }
    next();
});

module.exports = mongoose.model('Equipment', equipmentSchema);
module.exports.EQUIPMENT_STATUS = EQUIPMENT_STATUS;
module.exports.ACTIVITY_TYPE = ACTIVITY_TYPE; 