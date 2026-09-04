const express = require('express');
const router = express.Router();
const { submitResponse, getSessionResponses } = require('../controllers/response.controller');
const { optionalAuth } = require('../middleware/auth.middleware');

router.use(optionalAuth);

router.post('/submit', submitResponse);
router.get('/session/:session_id', getSessionResponses);

module.exports = router;
