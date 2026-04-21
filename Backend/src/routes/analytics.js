import express from 'express';
import { getAnalytics } from '../controllers/analyticsController.js';
import { verifyToken, authorizeRoles } from '../middleware/authMiddleware.js';

const router = express.Router();

// Only DeptAdmin can view analytics
router.get('/', verifyToken, authorizeRoles('DeptAdmin'), getAnalytics);

export default router;
