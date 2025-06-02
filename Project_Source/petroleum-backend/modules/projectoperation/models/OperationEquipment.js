const mongoose = require('mongoose');

const operationEquipmentSchema = new mongoose.Schema({
    projectId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Project',
        required: [true, 'Project ID is required']
    },
    equipmentId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Equipment',
        required: [true, 'Equipment ID is required']
    },
    status: {
        type: String,
        enum: ['available', 'inUse', 'maintenance', 'reserved'],
        default: 'available'
    },
    location: {
        type: String,
        default: 'Site principal'
    },
    maintenanceDate: {
        type: Date
    },
    assignedTo: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Employee'
    },
    notes: {
        type: String,
        default: ''
    },
    createdBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: [true, 'Creator ID is required']
    },
    isDeleted: {
        type: Boolean,
        default: false
    }
}, {
    timestamps: true
});

// Indexes for faster queries
operationEquipmentSchema.index({ projectId: 1 });
operationEquipmentSchema.index({ equipmentId: 1 });
operationEquipmentSchema.index({ status: 1 });

module.exports = mongoose.model('OperationEquipment', operationEquipmentSchema); 