const express = require('express');
const router = express.Router();
const { getReport, getDashboard } = require('../controllers/report.controller');
const { optionalAuth } = require('../middleware/auth.middleware');

router.use(optionalAuth);

router.get('/dashboard', getDashboard);
router.get('/session/:session_id', getReport);

module.exports = router;
