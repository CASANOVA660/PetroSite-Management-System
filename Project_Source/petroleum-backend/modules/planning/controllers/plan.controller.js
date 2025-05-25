const planService = require('../services/plan.service');

async function createPlan(req, res) {
    try {
        const planData = req.body;
        // Optionally, set createdBy from req.user if using auth
        const plan = await planService.createPlan(planData);
        res.status(201).json(plan);
    } catch (err) {
        res.status(400).json({ error: err.message });
    }
}

async function getPlans(req, res) {
    try {
        const plans = await planService.getPlans(req.query);
        res.json(plans);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
}

async function getPlanById(req, res) {
    try {
        const plan = await planService.getPlanById(req.params.id);
        if (!plan) return res.status(404).json({ error: 'Plan not found' });
        res.json(plan);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
}

async function updatePlan(req, res) {
    try {
        const plan = await planService.updatePlan(req.params.id, req.body);
        if (!plan) return res.status(404).json({ error: 'Plan not found' });
        res.json(plan);
    } catch (err) {
        res.status(400).json({ error: err.message });
    }
}

async function deletePlan(req, res) {
    try {
        const plan = await planService.deletePlan(req.params.id);
        if (!plan) return res.status(404).json({ error: 'Plan not found' });
        res.json({ message: 'Plan deleted' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
}

module.exports = {
    createPlan,
    getPlans,
    getPlanById,
    updatePlan,
    deletePlan
}; 