const mongoose = require('mongoose');

const equipmentSchema = new mongoose.Schema({
    name: {
        type: String,
        required: [true, 'Le nom de l\'équipement est requis'],
        trim: true
    },
    description: {
        type: String,
        trim: true
    },
    type: {
        type: String,
        required: [true, 'Le type d\'équipement est requis'],
        enum: ['pump', 'valve', 'tank', 'compressor', 'generator', 'other']
    },
    specifications: {
        type: Map,
        of: String
    },
    status: {
        type: String,
        enum: ['available', 'in_use', 'maintenance', 'retired'],
        default: 'available'
    },
    project: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Project',
        required: [true, 'Le projet est requis']
    },
    assignedTo: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    },
    installationDate: {
        type: Date
    },
    lastMaintenanceDate: {
        type: Date
    },
    nextMaintenanceDate: {
        type: Date
    },
    isDeleted: {
        type: Boolean,
        default: false
    }
}, {
    timestamps: true
});

// Index for faster queries
equipmentSchema.index({ project: 1, type: 1 });
equipmentSchema.index({ name: 'text', description: 'text' });

module.exports = mongoose.model('Equipment', equipmentSchema); 