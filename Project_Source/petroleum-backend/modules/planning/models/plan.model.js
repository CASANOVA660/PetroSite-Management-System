const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const planSchema = new Schema({
    title: { type: String, required: true },
    description: { type: String },
    type: { type: String, enum: ['placement', 'maintenance'], required: true },
    equipment: { type: mongoose.Schema.Types.ObjectId, ref: 'Equipment', required: true },
    responsible: { type: String, required: true },
    route: [{ type: String }],
    startDate: { type: Date, required: true },
    endDate: { type: Date, required: true },
    status: { type: String, enum: ['Upcoming', 'In Progress', 'Done'], default: 'Upcoming' },
    notes: { type: String }
}, {
    timestamps: true
});

module.exports = mongoose.model('Plan', planSchema); 