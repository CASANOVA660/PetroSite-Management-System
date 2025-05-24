const redis = require('../../config/redis');
const equipmentFields = require('../equipment/kpi.fields');
const userFields = require('../users/kpi.fields');
const projectFields = require('../projects/kpi.fields');
const actionsFields = require('../actions/kpi.fields');
const documentsFields = require('../documents/kpi.fields');
const gestionRhFields = require('../gestion-rh/kpi.fields');
// Add more as needed

const CACHE_KEY = 'kpi:fields:all';
const CACHE_TTL = 60 * 60; // 1 hour

async function getAllKpiFields() {
    const cached = await redis.get(CACHE_KEY);
    if (cached) return JSON.parse(cached);

    const allFields = [
        ...equipmentFields.map(f => ({ ...f, module: 'equipment' })),
        ...userFields.map(f => ({ ...f, module: 'users' })),
        ...projectFields.map(f => ({ ...f, module: 'projects' })),
        ...actionsFields.map(f => ({ ...f, module: 'actions' })),
        ...documentsFields.map(f => ({ ...f, module: 'documents' })),
        ...gestionRhFields.map(f => ({ ...f, module: 'gestion-rh' })),
        // ...add more as needed
    ];

    await redis.set(CACHE_KEY, JSON.stringify(allFields), 'EX', CACHE_TTL);
    return allFields;
}

module.exports = { getAllKpiFields }; 