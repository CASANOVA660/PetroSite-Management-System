const mongoose = require('mongoose');

const actionSchema = new mongoose.Schema({
    content: {
        type: String,
        required: true,
        trim: true
    },
    responsible: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    startDate: {
        type: Date,
        required: true
    },
    endDate: {
        type: Date,
        required: true
    },
    status: {
        type: String,
        enum: ['pending', 'completed', 'cancelled'],
        default: 'pending'
    },
    projectId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Project',
        required: true
    },
    category: {
        type: String,
        enum: [
            'Documents globale',
            'Dossier Administratif',
            'Dossier Technique',
            'Dossier RH',
            'Dossier HSE'
        ],
        required: true
    },
}, {
    timestamps: true
});

// Indexes for better query performance
actionSchema.index({ projectId: 1, category: 1 });
actionSchema.index({ responsible: 1 });
actionSchema.index({ status: 1 });

// Add validation for endDate to be after startDate
actionSchema.pre('save', function (next) {
    if (this.endDate <= this.startDate) {
        next(new Error('End date must be after start date'));
    }
    next();
});

const Action = mongoose.model('Action', actionSchema);

module.exports = Action; 