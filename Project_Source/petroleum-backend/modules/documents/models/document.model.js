const mongoose = require('mongoose');

const documentSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        trim: true
    },
    url: {
        type: String,
        required: true
    },
    publicId: {
        type: String,
        required: true
    },
    category: {
        type: String,
        required: true,
        enum: ['Documents globale', 'Dossier Administratif', 'Dossier Technique', 'Dossier RH', 'Dossier HSE']
    },
    projectId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Project',
        required: true
    },
    uploadedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    // Cloudinary metadata
    format: String,
    resourceType: String,
    size: Number,
    width: Number,
    height: Number,
    optimizedUrl: String,
    transformedUrl: String
}, {
    timestamps: true
});

module.exports = mongoose.model('Document', documentSchema); 