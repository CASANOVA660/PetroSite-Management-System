const mongoose = require('mongoose');

// Document Schema
const documentSchema = new mongoose.Schema({
    url: { type: String },
    type: { type: String },
    name: { type: String },
    publicId: { type: String },
    uploadedBy: { type: String },
    uploadedAt: { type: Date, default: Date.now },
    size: { type: Number },
    format: { type: String },
    resourceType: { type: String },
    width: { type: Number },
    height: { type: Number }
}, { _id: false });

// Folder Schema
const folderSchema = new mongoose.Schema({
    id: { type: String, required: true },
    name: { type: String, required: true },
    parentId: { type: String, default: null },
    documents: { type: [documentSchema], default: [] },
    subfolders: { type: [mongoose.Schema.Types.Mixed], default: [] }
}, { _id: false });

// Employee Schema
const employeeSchema = new mongoose.Schema({
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    phone: { type: String },
    position: { type: String },
    department: { type: String },
    hireDate: { type: Date },
    profileImage: { type: String },
    folders: { type: [folderSchema], default: [] },
    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now }
});

// Update timestamps on save
employeeSchema.pre('save', function (next) {
    this.updatedAt = new Date();
    next();
});

const Employee = mongoose.model('Employee', employeeSchema);

module.exports = Employee; 