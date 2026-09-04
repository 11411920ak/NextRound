const express = require('express');
const { verifyToken, optionalAuth } = require('../middleware/auth.middleware');
const {
  analyseSkills,
  analyseGap,
  claimGuestAnalyses,
  getMyAnalyses,
  getLatestAnalyses,
} = require('../controllers/analysis.controller');

const router = express.Router();

router.post('/skill', optionalAuth, analyseSkills);
router.post('/gap', optionalAuth, analyseGap);
router.post('/claim-guest', verifyToken, claimGuestAnalyses);
router.get('/mine', verifyToken, getMyAnalyses);
router.get('/latest', verifyToken, getLatestAnalyses);

module.exports = router;
