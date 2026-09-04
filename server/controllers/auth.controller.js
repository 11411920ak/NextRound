const jwt = require('jsonwebtoken');
const validator = require('validator');
const { OAuth2Client } = require('google-auth-library');
const User = require('../models/User');
const { generateOTP, sendVerificationOTP } = require('../utils/mailer');

/** Generate JWT token */
const generateToken = (userId) => {
  return jwt.sign({ id: userId }, process.env.JWT_SECRET, { expiresIn: '7d' });
};

/** Google OAuth client (lazily initialized) */
let googleClient = null;
const getGoogleClient = () => {
  if (!googleClient && process.env.GOOGLE_CLIENT_ID) {
    googleClient = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);
  }
  return googleClient;
};

// ── POST /api/auth/signup ─────────────────────────────────────────────────────
const signup = async (req, res, next) => {
  try {
    const { name, email, password } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({ error: 'Name, email, and password are required.' });
    }

    // Strict email format validation
    if (!validator.isEmail(email)) {
      return res.status(400).json({ error: 'Please provide a valid email address.' });
    }

    if (password.length < 6) {
      return res.status(400).json({ error: 'Password must be at least 6 characters.' });
    }

    // Check for existing user
    const existing = await User.findOne({ email: email.toLowerCase() });
    if (existing) {
      return res.status(409).json({ error: 'An account with this email already exists.' });
    }

    // Generate OTP for email verification
    const otp = generateOTP();
    const otpExpiry = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

    // Create user — password_hash will be hashed by pre-save hook
    const user = await User.create({
      name: name.trim(),
      email: email.toLowerCase().trim(),
      password_hash: password,
      authProvider: 'local',
      isVerified: false,
      verifyOTP: { code: otp, expiresAt: otpExpiry },
    });

    // Send verification email (non-blocking — don't fail signup if email fails)
    const emailResult = await sendVerificationOTP(email, otp, name.split(' ')[0]);

    const token = generateToken(user._id);

    res.status(201).json({
      message: emailResult.sent
        ? 'Account created! Check your email for a verification code.'
        : 'Account created! Email verification is pending.',
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        target_role: user.target_role,
        isVerified: user.isVerified,
        profileComplete: user.profileComplete,
      },
      requiresVerification: true,
    });
  } catch (error) {
    next(error);
  }
};

// ── POST /api/auth/login ──────────────────────────────────────────────────────
const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required.' });
    }

    // Strict email format validation
    if (!validator.isEmail(email)) {
      return res.status(400).json({ error: 'Please provide a valid email address.' });
    }

    // Find user and include password_hash
    const user = await User.findOne({ email: email.toLowerCase() }).select('+password_hash');
    if (!user) {
      return res.status(401).json({ error: 'Invalid email or password.' });
    }

    // Google-only users can't login with password
    if (user.authProvider === 'google' && !user.password_hash) {
      return res.status(400).json({
        error: 'This account uses Google Sign-In. Please use the "Sign in with Google" button.',
      });
    }

    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(401).json({ error: 'Invalid email or password.' });
    }

    // Check email verification for local auth
    if (!user.isVerified) {
      // Re-send OTP automatically
      const otp = generateOTP();
      user.verifyOTP = { code: otp, expiresAt: new Date(Date.now() + 10 * 60 * 1000) };
      await user.save();
      await sendVerificationOTP(user.email, otp, user.name.split(' ')[0]);

      const token = generateToken(user._id);
      return res.status(200).json({
        message: 'Please verify your email. A new code has been sent.',
        token,
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          target_role: user.target_role,
          isVerified: false,
          profileComplete: user.profileComplete,
        },
        requiresVerification: true,
      });
    }

    const token = generateToken(user._id);

    res.json({
      message: 'Login successful.',
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        target_role: user.target_role,
        isVerified: user.isVerified,
        profileComplete: user.profileComplete,
      },
    });
  } catch (error) {
    next(error);
  }
};

// ── POST /api/auth/verify-email ───────────────────────────────────────────────
const verifyEmail = async (req, res, next) => {
  try {
    const { otp } = req.body;

    if (!otp || otp.length !== 6) {
      return res.status(400).json({ error: 'Please enter a valid 6-digit verification code.' });
    }

    // Fetch user with OTP fields
    const user = await User.findById(req.user._id).select('+verifyOTP.code +verifyOTP.expiresAt');
    if (!user) {
      return res.status(404).json({ error: 'User not found.' });
    }

    if (user.isVerified) {
      return res.json({ message: 'Email is already verified.', verified: true });
    }

    // Check OTP
    if (!user.verifyOTP?.code) {
      return res.status(400).json({ error: 'No verification code found. Please request a new one.' });
    }

    if (new Date() > user.verifyOTP.expiresAt) {
      return res.status(400).json({ error: 'Verification code has expired. Please request a new one.' });
    }

    if (user.verifyOTP.code !== otp) {
      return res.status(400).json({ error: 'Incorrect verification code. Please try again.' });
    }

    // Verify the user
    user.isVerified = true;
    user.verifyOTP = { code: null, expiresAt: null };
    await user.save();

    res.json({
      message: 'Email verified successfully! 🎉',
      verified: true,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        isVerified: true,
        profileComplete: user.profileComplete,
      },
    });
  } catch (error) {
    next(error);
  }
};

// ── POST /api/auth/resend-otp ─────────────────────────────────────────────────
const resendOTP = async (req, res, next) => {
  try {
    const user = await User.findById(req.user._id);
    if (!user) {
      return res.status(404).json({ error: 'User not found.' });
    }

    if (user.isVerified) {
      return res.json({ message: 'Email is already verified.' });
    }

    const otp = generateOTP();
    user.verifyOTP = { code: otp, expiresAt: new Date(Date.now() + 10 * 60 * 1000) };
    await user.save();

    const emailResult = await sendVerificationOTP(user.email, otp, user.name.split(' ')[0]);

    res.json({
      message: emailResult.sent
        ? 'New verification code sent to your email.'
        : 'Could not send email. Please check your email address and try again.',
      sent: emailResult.sent,
    });
  } catch (error) {
    next(error);
  }
};

// ── POST /api/auth/google ─────────────────────────────────────────────────────
const googleAuth = async (req, res, next) => {
  try {
    const { credential } = req.body;

    if (!credential) {
      return res.status(400).json({ error: 'Google credential token is required.' });
    }

    const client = getGoogleClient();
    if (!client) {
      return res.status(500).json({ error: 'Google Sign-In is not configured on the server.' });
    }

    // Verify the Google ID token
    let payload;
    try {
      const ticket = await client.verifyIdToken({
        idToken: credential,
        audience: process.env.GOOGLE_CLIENT_ID,
      });
      payload = ticket.getPayload();
    } catch (err) {
      return res.status(401).json({ error: 'Invalid Google token. Please try again.' });
    }

    const { email, name, picture, email_verified } = payload;

    if (!email) {
      return res.status(400).json({ error: 'Could not retrieve email from Google account.' });
    }

    // Find or create user
    let user = await User.findOne({ email: email.toLowerCase() });
    let isNewUser = false;

    if (user) {
      // Existing user — ensure they're marked as verified (Google verified the email)
      if (!user.isVerified) {
        user.isVerified = true;
        user.verifyOTP = { code: null, expiresAt: null };
        await user.save();
      }
    } else {
      // New user — create with Google provider (no password needed)
      user = await User.create({
        name: name || 'Google User',
        email: email.toLowerCase(),
        authProvider: 'google',
        isVerified: true, // Google already verified the email
      });
      isNewUser = true;
    }

    const token = generateToken(user._id);

    res.json({
      message: isNewUser ? 'Account created with Google!' : 'Signed in with Google.',
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        target_role: user.target_role,
        isVerified: user.isVerified,
        profileComplete: user.profileComplete,
      },
      isNewUser,
    });
  } catch (error) {
    next(error);
  }
};

// ── GET /api/auth/me ──────────────────────────────────────────────────────────
const getMe = async (req, res) => {
  res.json({ user: req.user });
};

// ── PATCH /api/auth/me ────────────────────────────────────────────────────────
const updateProfile = async (req, res, next) => {
  try {
    const { target_role, gender, workAs, experience, name } = req.body;

    const updates = {};
    if (target_role !== undefined) updates.target_role = target_role;
    if (name) updates.name = name.trim();
    if (gender) updates.gender = gender;
    if (workAs) updates.workAs = workAs.trim();
    if (experience) updates.experience = experience;

    // Mark profile complete when the key profile fields are provided
    if (gender && workAs && experience) {
      updates.profileComplete = true;
    }

    const user = await User.findByIdAndUpdate(
      req.user._id,
      { $set: updates },
      { new: true, runValidators: true }
    );
    res.json({ user });
  } catch (error) {
    next(error);
  }
};

module.exports = { signup, login, verifyEmail, resendOTP, googleAuth, getMe, updateProfile };
