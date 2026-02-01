const express = require('express');
const { body } = require('express-validator');
const authController = require('../controllers/authController');
const { authenticate } = require('../middleware/auth');
const { authLimiter, emailLimiter } = require('../middleware/rateLimiter');

const router = express.Router();

// Validation middleware
const signUpValidation = [
  body('email').isEmail().normalizeEmail(),
  body('password').isLength({ min: 8 }).withMessage('Password must be at least 8 characters'),
  body('full_name').optional().trim().isLength({ max: 255 }),
];

const signInValidation = [
  body('email').isEmail().normalizeEmail(),
  body('password').notEmpty(),
];

// Public routes
router.post('/signup', authLimiter, signUpValidation, authController.signUp);
router.post('/signin', authLimiter, signInValidation, authController.signIn);
router.post('/signout', authController.signOut);
router.post('/refresh', authController.refresh);
router.get('/verify-email', authController.verifyEmail);
router.post('/reset-password', authLimiter, authController.requestPasswordReset);
router.post('/reset-password/confirm', authController.resetPassword);

// Protected routes (require authentication)
router.get('/me', authenticate, authController.getCurrentUser);
router.post('/resend-verification', authenticate, emailLimiter, authController.resendVerification);
router.post('/update-password', authenticate, authController.updatePassword);

module.exports = router;
