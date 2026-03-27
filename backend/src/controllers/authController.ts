import { Request, Response } from 'express';
import { registerUser, loginUser, getUserById, createPasswordResetToken, resetUserPassword } from '../services/authService';
import { AppError } from '../middleware/errorHandler';
import { verifyRefreshToken, generateAccessToken } from '../utils/jwt';

export async function register(req: Request, res: Response) {
  try {
    const { username, email, password, displayName } = req.body;

    // Validate request
    if (!username || !email || !password) {
      throw new AppError(400, 'Missing required fields: username, email, password');
    }

    const { user, tokens } = await registerUser({ username, email, password, displayName });

    // Set cookies
    res.cookie('accessToken', tokens.accessToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 15 * 60 * 1000, // 15 minutes
    });

    res.cookie('refreshToken', tokens.refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    });

    res.status(201).json({
      success: true,
      data: {
        user,
      },
    });
  } catch (error: any) {
    const statusCode = error instanceof AppError ? error.statusCode : 400;
    res.status(statusCode).json({
      success: false,
      error: error.message || 'Registration failed',
    });
  }
}

export async function login(req: Request, res: Response) {
  try {
    const { email, password } = req.body;

    // Validate request
    if (!email || !password) {
      throw new AppError(400, 'Missing required fields: email, password');
    }

    const { user, tokens } = await loginUser({ email, password });

    // Set cookies
    res.cookie('accessToken', tokens.accessToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 15 * 60 * 1000, // 15 minutes
    });

    res.cookie('refreshToken', tokens.refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    });

    res.status(200).json({
      success: true,
      data: {
        user,
      },
    });
  } catch (error: any) {
    const statusCode = error instanceof AppError ? error.statusCode : 401;
    res.status(statusCode).json({
      success: false,
      error: error.message || 'Login failed',
    });
  }
}

export async function logout(req: Request, res: Response) {
  try {
    // Clear cookies
    res.clearCookie('accessToken');
    res.clearCookie('refreshToken');

    res.status(200).json({
      success: true,
      message: 'Logged out successfully',
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: 'Logout failed',
    });
  }
}

export async function getCurrentUser(req: Request, res: Response) {
  try {
    if (!req.user) {
      throw new AppError(401, 'Unauthorized');
    }

    const user = await getUserById(req.user.id);

    if (!user) {
      throw new AppError(404, 'User not found');
    }

    res.status(200).json({
      success: true,
      data: {
        user,
      },
    });
  } catch (error: any) {
    const statusCode = error instanceof AppError ? error.statusCode : 500;
    res.status(statusCode).json({
      success: false,
      error: error.message || 'Failed to fetch user',
    });
  }
}

export async function refreshToken(req: Request, res: Response) {
  try {
    const token = req.cookies?.refreshToken;

    if (!token) {
      throw new AppError(401, 'No refresh token');
    }

    const payload = verifyRefreshToken(token);
    if (!payload) {
      throw new AppError(401, 'Invalid or expired refresh token');
    }

    const newAccessToken = generateAccessToken({
      id: payload.id,
      email: payload.email,
      username: payload.username,
    });

    res.cookie('accessToken', newAccessToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 15 * 60 * 1000,
    });

    res.json({ success: true });
  } catch (error: any) {
    const statusCode = error instanceof AppError ? error.statusCode : 500;
    res.status(statusCode).json({ success: false, error: error.message || 'Token refresh failed' });
  }
}

export async function forgotPassword(req: Request, res: Response) {
  try {
    const { email } = req.body;
    if (!email) throw new AppError(400, 'Email is required');

    const result = await createPasswordResetToken(email);

    // Always respond with success (don't reveal if email exists)
    const resetUrl = result
      ? `${process.env.FRONTEND_URL || 'http://localhost:3000'}/auth/reset-password?token=${result.resetToken}`
      : null;

    res.json({
      success: true,
      message: 'If that email exists, a reset link has been generated.',
      // Only expose reset URL in development (in production this would be emailed)
      ...(process.env.NODE_ENV !== 'production' && resetUrl ? { resetUrl } : {}),
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
