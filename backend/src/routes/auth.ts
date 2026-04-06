import { Router } from 'express';
import rateLimit from 'express-rate-limit';
import {
  login, logout, getCurrentUser, refreshToken,
  forgotPassword, resetPassword, verifyEmail, resendVerification,
} from '../controllers/authController';
import { authMiddleware } from '../middleware/auth';
import { asyncHandler } from '../middleware/errorHandler';

const router = Router();

const loginLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 10,
  message: 'Too many attempts, please try again in a minute',
  standardHeaders: true,
  legacyHeaders: false,
});

// Registration is disabled — admin accounts are created directly in the database
router.post('/register', (_req, res) => res.status(403).json({ success: false, error: 'Registration is not open' }));
router.post('/login', loginLimiter, asyncHandler(login));
router.post('/logout', asyncHandler(logout));
router.post('/refresh', asyncHandler(refreshToken));

router.get('/verify-email', asyncHandler(verifyEmail));
router.post('/resend-verification', asyncHandler(resendVerification));

router.post('/forgot-password', asyncHandler(forgotPassword));
router.post('/reset-password', asyncHandler(resetPassword));

// Protected routes
router.get('/me', authMiddleware, asyncHandler(getCurrentUser));

export default router;
