const express = require('express');
const router = express.Router();
const { signup, login, verifyEmail, resendOTP, googleAuth, clerkSync, getMe, updateProfile } = require('../controllers/auth.controller');
const { verifyToken } = require('../middleware/auth.middleware');

// Public routes
router.post('/signup', signup);
router.post('/login', login);
router.post('/google', googleAuth);
router.post('/clerk-sync', clerkSync);

// Protected routes
router.get('/me', verifyToken, getMe);
router.patch('/me', verifyToken, updateProfile);
router.post('/verify-email', verifyToken, verifyEmail);
router.post('/resend-otp', verifyToken, resendOTP);

module.exports = router;
