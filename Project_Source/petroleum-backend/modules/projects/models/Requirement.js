const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const RequirementSchema = new Schema({
    content: {
        type: String,
        required: [true, 'Le contenu de l\'exigence est requis'],
        trim: true
    },
    type: {
        type: String,
        required: [true, 'Le type d\'exigence est requis'],
        enum: {
            values: ['REGULATORY', 'TECHNICAL', 'BUSINESS', 'ENVIRONMENTAL', 'SAFETY', 'OTHER'],
            message: 'Type d\'exigence invalide'
        }
    },
    projectId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Project',
        required: [true, 'L\'ID du projet est requis']
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
    timestamps: true
});

// Create index on projectId for efficient queries
RequirementSchema.index({ projectId: 1 });

// Add method to convert Mongoose object to API response format
RequirementSchema.methods.toAPI = function () {
    return {
        _id: this._id,
        content: this.content,
        type: this.type,
        projectId: this.projectId,
        createdAt: this.createdAt,
        updatedAt: this.updatedAt,
        createdBy: this.createdBy,
        updatedBy: this.updatedBy
    };
};

module.exports = mongoose.model('Requirement', RequirementSchema); 