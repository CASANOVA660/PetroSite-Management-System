const express = require('express');
const { getFields } = require('./fields.controller');

const router = express.Router();

router.get('/fields', getFields);

module.exports = router; 