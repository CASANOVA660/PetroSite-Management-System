const mongoose = require('mongoose');
const Schema = mongoose.Schema;

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
        enum: ['disponible', 'disponible_needs_repair', 'on_repair', 'disponible_bon_etat', 'working_non_disponible'],
        default: 'disponible'
    },
    createdBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    }
}, {
    timestamps: true
});

// Indexes for faster queries
equipmentSchema.index({ reference: 1 });
equipmentSchema.index({ matricule: 1 });
equipmentSchema.index({ status: 1 });
equipmentSchema.index({ nom: 'text', reference: 'text', matricule: 'text' });

module.exports = mongoose.model('Equipment', equipmentSchema); 