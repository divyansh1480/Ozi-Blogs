import { Request, Response } from 'express';
import {
  registerUser, loginUser, getUserById,
  createPasswordResetToken, resetUserPassword,
  verifyUserEmail, resendVerificationEmail,
} from '../services/authService';
import { AppError } from '../middleware/errorHandler';
import { verifyRefreshToken, generateAccessToken, generateRefreshToken } from '../utils/jwt';

const cookieOpts = (maxAge: number) => ({
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: (process.env.NODE_ENV === 'production' ? 'none' : 'lax') as 'none' | 'lax',
  maxAge,
});

export async function register(req: Request, res: Response) {
  try {
    const { username, email, password, displayName } = req.body;
    if (!username || !email || !password) throw new AppError(400, 'Missing required fields: username, email, password');

    const { user, tokens } = await registerUser({ username, email, password, displayName });

    res.cookie('accessToken', tokens.accessToken, cookieOpts(15 * 60 * 1000));
    res.cookie('refreshToken', tokens.refreshToken, cookieOpts(7 * 24 * 60 * 60 * 1000));

    res.status(201).json({
      success: true,
      data: { user },
      message: 'Account created! Please check your email to verify your account before logging in.',
    });
  } catch (error: any) {
    const statusCode = error instanceof AppError ? error.statusCode : 400;
    res.status(statusCode).json({ success: false, error: error.message || 'Registration failed' });
  }
}

export async function login(req: Request, res: Response) {
  try {
    const { emailOrUsername, password } = req.body;
    if (!emailOrUsername || !password) throw new AppError(400, 'Email/username and password are required');

    const { user, tokens } = await loginUser({ emailOrUsername, password });

    res.cookie('accessToken', tokens.accessToken, cookieOpts(15 * 60 * 1000));
    res.cookie('refreshToken', tokens.refreshToken, cookieOpts(7 * 24 * 60 * 60 * 1000));

    res.status(200).json({ success: true, data: { user } });
  } catch (error: any) {
    const statusCode = error instanceof AppError ? error.statusCode : 401;
    res.status(statusCode).json({ success: false, error: error.message || 'Login failed' });
  }
}

export async function logout(req: Request, res: Response) {
  res.clearCookie('accessToken');
  res.clearCookie('refreshToken');
  res.status(200).json({ success: true, message: 'Logged out successfully' });
}

export async function getCurrentUser(req: Request, res: Response) {
  try {
    if (!req.user) throw new AppError(401, 'Unauthorized');
    const user = await getUserById(req.user.id);
    if (!user) throw new AppError(404, 'User not found');
    res.status(200).json({ success: true, data: { user } });
  } catch (error: any) {
    const statusCode = error instanceof AppError ? error.statusCode : 500;
    res.status(statusCode).json({ success: false, error: error.message || 'Failed to fetch user' });
  }
}

export async function refreshToken(req: Request, res: Response) {
  try {
    const token = req.cookies?.refreshToken;
    if (!token) throw new AppError(401, 'No refresh token');

    const payload = verifyRefreshToken(token);
    if (!payload) throw new AppError(401, 'Invalid or expired refresh token');

    const userPayload = { id: payload.id, email: payload.email, username: payload.username, role: payload.role };
    res.cookie('accessToken', generateAccessToken(userPayload), cookieOpts(15 * 60 * 1000));
    res.cookie('refreshToken', generateRefreshToken(userPayload), cookieOpts(7 * 24 * 60 * 60 * 1000));

    res.json({ success: true });
  } catch (error: any) {
    const statusCode = error instanceof AppError ? error.statusCode : 500;
    res.status(statusCode).json({ success: false, error: error.message || 'Token refresh failed' });
  }
}

export async function verifyEmail(req: Request, res: Response) {
  try {
    const { token } = req.query as { token: string };
    if (!token) throw new AppError(400, 'Verification token is required');

    const success = await verifyUserEmail(token);
    if (!success) throw new AppError(400, 'Invalid or already-used verification token');

    res.json({ success: true, message: 'Email verified successfully. You can now log in.' });
  } catch (error: any) {
    const statusCode = error instanceof AppError ? error.statusCode : 400;
    res.status(statusCode).json({ success: false, error: error.message });
  }
}

export async function resendVerification(req: Request, res: Response) {
  try {
    const { emailOrUsername } = req.body;
    if (!emailOrUsername) throw new AppError(400, 'Email or username is required');
    await resendVerificationEmail(emailOrUsername);
    res.json({ success: true, message: 'Verification email resent if account exists and is unverified.' });
  } catch (error: any) {
    const statusCode = error instanceof AppError ? error.statusCode : 500;
    res.status(statusCode).json({ success: false, error: error.message });
  }
}

export async function forgotPassword(req: Request, res: Response) {
  try {
    const { email } = req.body;
    if (!email) throw new AppError(400, 'Email is required');

    const result = await createPasswordResetToken(email);
    if (!result) {
      return res.status(404).json({ success: false, error: 'No account found with that email address' });
    }

    res.json({
      success: true,
      message: 'Password reset link sent to your email.',
      // Expose reset URL in dev only
      ...(process.env.NODE_ENV !== 'production'
        ? { resetUrl: `${process.env.FRONTEND_URL || 'http://localhost:3000'}/auth/reset-password?token=${result.resetToken}` }
        : {}),
    });
  } catch (error: any) {
    const statusCode = error instanceof AppError ? error.statusCode : 500;
    res.status(statusCode).json({ success: false, error: error.message });
  }
}

export async function resetPassword(req: Request, res: Response) {
  try {
    const { token, password } = req.body;
    if (!token || !password) throw new AppError(400, 'Token and password are required');

    const success = await resetUserPassword(token, password);
    if (!success) throw new AppError(400, 'Invalid or expired reset token');

    res.json({ success: true, message: 'Password reset successfully' });
  } catch (error: any) {
    const statusCode = error instanceof AppError ? error.statusCode : 500;
    res.status(statusCode).json({ success: false, error: error.message });
  }
}
