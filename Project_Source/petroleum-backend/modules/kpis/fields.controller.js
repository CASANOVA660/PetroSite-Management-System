const { getAllKpiFields } = require('./fields.service');

async function getFields(req, res) {
    try {
        const fields = await getAllKpiFields();
        res.json(fields);
    } catch (err) {
        res.status(500).json({ error: 'Failed to fetch KPI fields', details: err.message });
    }
}

module.exports = { getFields }; 