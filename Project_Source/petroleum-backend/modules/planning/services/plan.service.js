const Plan = require('../models/plan.model');
const EquipmentHistory = require('../../equipment/models/history.model');

async function createPlan(planData) {
    try {
        // Save the plan
        const plan = await Plan.create(planData);

        // Create equipment history entry
        const historyEntry = new EquipmentHistory({
            equipmentId: plan.equipment,
            type: plan.type.toLowerCase(), // 'placement' or 'maintenance'
            description: plan.description || plan.title,
            fromDate: plan.startDate,
            toDate: plan.endDate,
            responsiblePerson: { name: plan.responsible },
            createdBy: planData.createdBy || null // Optionally pass user
        });
        console.log('Saving EquipmentHistory:', historyEntry);
        await historyEntry.save();
        console.log('EquipmentHistory saved!');

        return plan;
    } catch (err) {
        console.error('Error in createPlan:', err);
        throw err;
    }
}

async function getPlans(filter = {}) {
    return Plan.find(filter).populate('equipment');
}

async function getPlanById(id) {
    return Plan.findById(id).populate('equipment');
}

async function updatePlan(id, update) {
    return Plan.findByIdAndUpdate(id, update, { new: true }).populate('equipment');
}

async function deletePlan(id) {
    return Plan.findByIdAndDelete(id);
}

module.exports = {
    createPlan,
    getPlans,
    getPlanById,
    updatePlan,
    deletePlan
}; 