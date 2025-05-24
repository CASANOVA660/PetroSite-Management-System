const mongoose = require('mongoose');

const KpiSchema = new mongoose.Schema({
    name: { type: String, required: true },
    formula: { type: String, required: true },
    modules: [{ type: String }],
    chartType: { type: String },
    createdBy: { type: String },
    config: { type: Object }, // for storing chart config, fields, etc.
    category: { type: String, default: 'basic' },
}, {
    timestamps: true // adds createdAt and updatedAt
});

module.exports = mongoose.model('Kpi', KpiSchema); 