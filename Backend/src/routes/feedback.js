import express from 'express';
import { submitFeedback, getFeedback } from '../controllers/feedbackController.js';
import { verifyToken, authorizeRoles } from '../middleware/authMiddleware.js';

const router = express.Router();

router.use(verifyToken);

// Student submits feedback on a resolved complaint
router.post('/:complaintId',  authorizeRoles('Student'),  submitFeedback);

// Anyone involved can view feedback
router.get('/:complaintId',   getFeedback);

export default router;
