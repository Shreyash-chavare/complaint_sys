import express from 'express';
import {
  createComplaint,
  getMyComplaints,
  getPublicFeed,
  toggleUpvote,
  deleteOrWithdrawComplaint,
  reopenComplaint
} from '../controllers/complaintController.js';
import { verifyToken, authorizeRoles } from '../middleware/authMiddleware.js';
import { attachmentUpload } from '../utils/multer.js';

const router = express.Router();

// All routes require login + Student role
router.use(verifyToken, authorizeRoles('Student'));

router.post(  '/',              attachmentUpload,       createComplaint           );
router.get(   '/my',                                    getMyComplaints           );
router.get(   '/feed',                                  getPublicFeed             );
router.patch( '/:id/upvote',                            toggleUpvote              );
router.delete('/:id',                                   deleteOrWithdrawComplaint );
router.patch( '/:id/reopen',                            reopenComplaint           );

export default router;