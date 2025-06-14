const mongoose = require('mongoose');

const projectSchema = new mongoose.Schema({
    name: {
        type: String,
        required: [true, 'Le nom du projet est requis'],
        trim: true
    },
    projectNumber: {
        type: String,
        required: true,
        unique: true
    },
    clientName: {
        type: String,
        required: [true, 'Le nom du client est requis'],
        trim: true
    },
    description: {
        type: String,
        required: [true, 'La description est requise'],
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
    status: {
        type: String,
        enum: ['En cours', 'Clôturé', 'Annulé', 'En opération'],
        default: 'En cours'
    },
    statusNote: {
        type: String,
        default: ''
    },
    categories: {
        type: [String],
        default: [
            'Documents globale',
            'Dossier Administratif',
            'Dossier Technique',
            'Dossier RH',
            'Dossier HSE'
        ]
    },
    equipment: [{
        equipmentId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Equipment',
            required: true
        },
        description: {
            type: String,
            default: ''
        },
        dossierType: {
            type: String,
            required: true,
            enum: ['Dossier Technique', 'Dossier RH', 'Dossier HSE', 'Dossier Administratif']
        }
    }],
    employees: [{
        employeeId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Employee',
            required: true
        },
        status: {
            type: String,
            enum: ['Assigné', 'En opération', 'Terminé'],
            default: 'Assigné'
        },
        role: {
            type: String,
            required: true
        },
        startDate: {
            type: Date
        },
        endDate: {
            type: Date
        },
        assignedBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User'
        },
        assignedAt: {
            type: Date,
            default: Date.now
        }
    }],
    createdBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: [true, 'L\'utilisateur qui a créé le projet est requis']
    },
    isDeleted: {
        type: Boolean,
        default: false
    }
}, {
    timestamps: true
});

// Index for faster queries
projectSchema.index({ projectNumber: 1 });
projectSchema.index({ name: 'text', description: 'text' });

// Validate that end date is after start date
projectSchema.pre('save', function (next) {
    if (this.startDate > this.endDate) {
        next(new Error('La date de fin doit être postérieure à la date de début'));
    }
    next();
});

module.exports = mongoose.model('Project', projectSchema);