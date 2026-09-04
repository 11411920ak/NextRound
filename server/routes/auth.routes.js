const express = require('express');
const router = express.Router();
const { signup, login, getMe, updateProfile } = require('../controllers/auth.controller');
const { verifyToken } = require('../middleware/auth.middleware');

// Public routes
router.post('/signup', signup);
router.post('/login', login);

// Protected routes
router.get('/me', verifyToken, getMe);
router.patch('/me', verifyToken, updateProfile);

module.exports = router;
