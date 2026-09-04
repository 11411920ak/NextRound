const express = require('express');
const router = express.Router();
const {
  startSession,
  endSession,
  getSession,
  getUserSessions,
  getSessionReport,
} = require('../controllers/session.controller');
const { optionalAuth } = require('../middleware/auth.middleware');

router.use(optionalAuth);

router.post('/start', startSession);
router.get('/', getUserSessions);
router.get('/:id', getSession);
router.patch('/:id/end', endSession);
router.get('/:id/report', getSessionReport);

module.exports = router;
