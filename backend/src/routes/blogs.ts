// import { Router } from 'express';
// import multer from 'multer';
// import { listBlogs, getBlog, getBlogSlug, create, update, remove, getUserBlogList } from '../controllers/blogController';
// import { importBlogsFromExcel } from '../controllers/importController';
// import { authMiddleware } from '../middleware/auth';
// import { asyncHandler } from '../middleware/errorHandler';

// const router = Router();
// const upload = multer({
//   storage: multer.memoryStorage(),
//   limits: { fileSize: 5 * 1024 * 1024 }, // 5 MB max
//   fileFilter: (_req, file, cb) => {
//     const allowed = [
//       'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
//       'application/vnd.ms-excel',
//     ];
//     cb(null, allowed.includes(file.mimetype) || file.originalname.endsWith('.xlsx') || file.originalname.endsWith('.xls'));
//   },
// });

// // Public routes
// router.get('/', asyncHandler(listBlogs));
// router.get('/slug/:slug', asyncHandler(getBlogSlug));

// // Protected routes — must be before /:id to avoid param capture
// router.get('/user/me', authMiddleware, asyncHandler(getUserBlogList));
// router.post('/import', authMiddleware, upload.single('file'), asyncHandler(importBlogsFromExcel));
// router.post('/', authMiddleware, asyncHandler(create));
// router.put('/:id', authMiddleware, asyncHandler(update));
// router.delete('/:id', authMiddleware, asyncHandler(remove));

// // Wildcard param route last
// router.get('/:id', asyncHandler(getBlog));

// export default router;


import { Router, RequestHandler } from 'express';
import multer from 'multer';
import {
  listBlogs,
  getBlog,
  getBlogSlug,
  create,
  update,
  remove,
  getUserBlogList
} from '../controllers/blogController';
import { importBlogsFromExcel } from '../controllers/importController';
import { authMiddleware } from '../middleware/auth';
import { asyncHandler } from '../middleware/errorHandler';

const router = Router();

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 }, // 5 MB max
  fileFilter: (_req, file, cb) => {
    const allowed = [
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'application/vnd.ms-excel',
    ];
    cb(
      null,
      allowed.includes(file.mimetype) ||
      file.originalname.endsWith('.xlsx') ||
      file.originalname.endsWith('.xls')
    );
  },
});

// Public routes
router.get('/', asyncHandler(listBlogs));
router.get('/slug/:slug', asyncHandler(getBlogSlug));

// Protected routes — must be before /:id to avoid param capture
router.get('/user/me', authMiddleware, asyncHandler(getUserBlogList));

router.post(
  '/import',
  authMiddleware,
  upload.single('file') as RequestHandler, // ✅ FIXED HERE
  asyncHandler(importBlogsFromExcel)
);

router.post('/', authMiddleware, asyncHandler(create));
router.put('/:id', authMiddleware, asyncHandler(update));
router.delete('/:id', authMiddleware, asyncHandler(remove));

// Wildcard param route last
router.get('/:id', asyncHandler(getBlog));

export default router;