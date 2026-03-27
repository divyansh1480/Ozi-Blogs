import { Router } from 'express';
import { asyncHandler, AppError } from '../middleware/errorHandler';
import { authMiddleware } from '../middleware/auth';
import { getUserByUsername, updateUserProfile } from '../services/userService';
import { getUserPublishedBlogs } from '../services/blogService';

const router = Router();

router.get('/:username', asyncHandler(async (req, res) => {
  const user = await getUserByUsername(req.params.username);
  if (!user) throw new AppError(404, 'User not found');
  const blogs = await getUserPublishedBlogs(user.id);
  const { getFollowerCount } = await import('../services/interactionService');
  const followers = await getFollowerCount(user.id);
  res.json({ success: true, data: { user: { ...user, followers }, blogs } });
}));

router.put('/me', authMiddleware, asyncHandler(async (req, res) => {
  if (!req.user) throw new AppError(401, 'Unauthorized');
  const user = await updateUserProfile(req.user.id, req.body);
  res.json({ success: true, data: { user } });
}));

export default router;
