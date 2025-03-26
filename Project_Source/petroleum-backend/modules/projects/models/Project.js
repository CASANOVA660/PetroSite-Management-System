const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const projectSchema = new Schema({
    projectNumber: {
        type: String,
        unique: true,
    },
    name: {
        type: String,
        required: [true, 'Le nom du projet est requis'],
    },
    clientName: {
        type: String,
        required: [true, 'Le nom du client est requis'],
    },
    description: {
        type: String,
        required: [true, 'La description est requise'],
    },
    startDate: {
        type: Date,
        required: [true, 'La date de début est requise'],
    },
    endDate: {
        type: Date,
        required: [true, 'La date de fin est requise'],
    },
    creationDate: {
        type: Date,
        required: true,
        default: Date.now,
    },
    status: {
        type: String,
        enum: ['En cours', 'Fermé', 'Annulé'],
        default: 'En cours',
    },
    clientRepresentative: {
        name: String,
        surname: String,
        phone: String,
        email: String,
    },
    requirements: {
        type: String,
    },
    createdBy: {
        type: Schema.Types.ObjectId,
        ref: 'User',
        required: true,
    },
    updatedAt: {
        type: Date,
    },
});

// Generate project number before saving
projectSchema.pre('save', async function (next) {
    if (!this.projectNumber) {
        const year = new Date().getFullYear();
        const count = await mongoose.model('Project').countDocuments();
        const number = (count + 1).toString().padStart(3, '0');
        this.projectNumber = `PROJ-${year}-${number}`;
    }
    next();
});

module.exports = mongoose.model('Project', projectSchema);