import { Router } from 'express';
import { authMiddleware } from '../middleware/auth';
import { asyncHandler, AppError } from '../middleware/errorHandler';
import {
  likeBlog, unlikeBlog, getLikeStatus,
  addComment, getComments, deleteComment,
  followUser, unfollowUser, getFollowStatus,
} from '../services/interactionService';

const router = Router();

// ── Likes ──
router.get('/blogs/:blogId/likes', authMiddleware, asyncHandler(async (req, res) => {
  if (!req.user) throw new AppError(401, 'Unauthorized');
  const data = await getLikeStatus(req.params.blogId, req.user.id);
  res.json({ success: true, data });
}));

router.post('/blogs/:blogId/like', authMiddleware, asyncHandler(async (req, res) => {
  if (!req.user) throw new AppError(401, 'Unauthorized');
  await likeBlog(req.params.blogId, req.user.id);
  const data = await getLikeStatus(req.params.blogId, req.user.id);
  res.json({ success: true, data });
}));

router.delete('/blogs/:blogId/like', authMiddleware, asyncHandler(async (req, res) => {
  if (!req.user) throw new AppError(401, 'Unauthorized');
  await unlikeBlog(req.params.blogId, req.user.id);
  const data = await getLikeStatus(req.params.blogId, req.user.id);
  res.json({ success: true, data });
}));

// ── Comments ──
router.get('/blogs/:blogId/comments', asyncHandler(async (req, res) => {
  const comments = await getComments(req.params.blogId);
  res.json({ success: true, data: { comments } });
}));

router.post('/blogs/:blogId/comments', authMiddleware, asyncHandler(async (req, res) => {
  if (!req.user) throw new AppError(401, 'Unauthorized');
  const { content, parentId } = req.body;
  if (!content?.trim()) throw new AppError(400, 'Comment content is required');
  const comment = await addComment(req.params.blogId, req.user.id, content.trim(), parentId);
  res.status(201).json({ success: true, data: { comment } });
}));

router.delete('/comments/:commentId', authMiddleware, asyncHandler(async (req, res) => {
  if (!req.user) throw new AppError(401, 'Unauthorized');
  await deleteComment(req.params.commentId, req.user.id);
  res.json({ success: true, message: 'Comment deleted' });
}));

// ── Follows ──
router.get('/users/:userId/follow', authMiddleware, asyncHandler(async (req, res) => {
  if (!req.user) throw new AppError(401, 'Unauthorized');
  const data = await getFollowStatus(req.user.id, req.params.userId);
  res.json({ success: true, data });
}));

router.post('/users/:userId/follow', authMiddleware, asyncHandler(async (req, res) => {
  if (!req.user) throw new AppError(401, 'Unauthorized');
  await followUser(req.user.id, req.params.userId);
  const data = await getFollowStatus(req.user.id, req.params.userId);
  res.json({ success: true, data });
}));

router.delete('/users/:userId/follow', authMiddleware, asyncHandler(async (req, res) => {
  if (!req.user) throw new AppError(401, 'Unauthorized');
  await unfollowUser(req.user.id, req.params.userId);
  const data = await getFollowStatus(req.user.id, req.params.userId);
  res.json({ success: true, data });
}));

export default router;
