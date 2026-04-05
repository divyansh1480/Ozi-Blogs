import { Router, Request, Response } from 'express';
import rateLimit from 'express-rate-limit';
import { register, login, logout, getCurrentUser, refreshToken, forgotPassword, resetPassword } from '../controllers/authController';
import { authMiddleware } from '../middleware/auth';
import { asyncHandler } from '../middleware/errorHandler';

const router = Router();

// Rate limit only register and login — not /me or /logout
const loginLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 10,
  message: 'Too many attempts, please try again in a minute',
  standardHeaders: true,
  legacyHeaders: false,
});

// Public routes
router.post('/register', loginLimiter, asyncHandler(register));
router.post('/login', loginLimiter, asyncHandler(login));
router.post('/logout', asyncHandler(logout));
router.post('/refresh', asyncHandler(refreshToken));

router.post('/forgot-password', asyncHandler(forgotPassword));
router.post('/reset-password', asyncHandler(resetPassword));

// Protected routes — not rate limited
router.get('/me', authMiddleware, asyncHandler(getCurrentUser));

export default router;