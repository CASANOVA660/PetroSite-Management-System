const mongoose = require('mongoose');

const documentSchema = new mongoose.Schema({
    name: {
        type: String,
        required: [true, 'Le nom du document est requis'],
        trim: true
    },
    description: {
        type: String,
        trim: true
    },
    fileUrl: {
        type: String,
        required: [true, 'L\'URL du fichier est requise']
    },
    fileType: {
        type: String,
        required: [true, 'Le type de fichier est requis']
    },
    category: {
        type: String,
        enum: ['general', 'administrative', 'technical', 'hse', 'hr'],
        default: 'general'
    },
    project: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Project',
        required: [true, 'Le projet est requis']
    },
    uploadedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: [true, 'L\'utilisateur qui a téléchargé le document est requis']
    },
    uploadDate: {
        type: Date,
        default: Date.now
    },
    isDeleted: {
        type: Boolean,
        default: false
    }
}, {
    timestamps: true
});

// Index for faster queries
documentSchema.index({ project: 1, category: 1 });
documentSchema.index({ name: 'text', description: 'text' });

module.exports = mongoose.model('Document', documentSchema); 