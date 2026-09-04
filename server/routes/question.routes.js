const express = require('express');
const router = express.Router();
const { getQuestions, getQuestionById } = require('../controllers/question.controller');
const { optionalAuth } = require('../middleware/auth.middleware');

router.get('/', optionalAuth, getQuestions);
router.get('/:id', optionalAuth, getQuestionById);

module.exports = router;
