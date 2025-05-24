const express = require('express');
const {
    createKpi,
    getAllKpis,
    getKpiById,
    updateKpi,
    deleteKpi,
} = require('./kpi.controller');

const router = express.Router();

router.post('/', createKpi);
router.get('/', getAllKpis);
router.get('/:id', getKpiById);
router.put('/:id', updateKpi);
router.delete('/:id', deleteKpi);

module.exports = router; 