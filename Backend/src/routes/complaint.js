import express from 'express';
import {
  createComplaint,
  getMyComplaints,
  getPublicFeed,
  toggleUpvote,
  deleteOrWithdrawComplaint,
  reopenComplaint,
  getAssignedComplaints,
  getDepartmentComplaints,
  assignComplaint,
  updateStatus,
  getDepartmentTechnicians,
  getComplaintById,
  getComplaintAuditLog,
  getTeachersByStudentDept,
  addTeacherRemark
} from '../controllers/complaintController.js';
import { verifyToken, authorizeRoles } from '../middleware/authMiddleware.js';
import { attachmentUpload } from '../utils/multer.js';

const router = express.Router();

// All complaint routes require authentication
router.use(verifyToken);

router.get(
  '/teachers',
  authorizeRoles('Student'),
  getTeachersByStudentDept
);

router.patch(
  '/:id/remark',
  authorizeRoles('Teacher'),
  addTeacherRemark
);

// ── Student routes ───────────────────────────────────────────────────────────
router.post('/',           authorizeRoles('Student'),                        attachmentUpload, createComplaint);
router.get('/my',          authorizeRoles('Student'),                        getMyComplaints);
router.get('/feed',        authorizeRoles('Student', 'Teacher', 'Technician', 'DeptAdmin'), getPublicFeed);
router.patch('/:id/upvote', authorizeRoles('Student'),                      toggleUpvote);
router.delete('/:id',     authorizeRoles('Student'),                        deleteOrWithdrawComplaint);
router.patch('/:id/reopen', authorizeRoles('Student'),                      reopenComplaint);

// ── Technician / Teacher routes ──────────────────────────────────────────────
router.get('/assigned',    authorizeRoles('Technician', 'Teacher'),          getAssignedComplaints);

router.get(
  '/teachers',
  authorizeRoles('Student'),
  getTeachersByStudentDept
);

// ── DeptAdmin routes ─────────────────────────────────────────────────────────
router.get('/department',  authorizeRoles('DeptAdmin'),                      getDepartmentComplaints);
router.get('/technicians', authorizeRoles('DeptAdmin'),                      getDepartmentTechnicians);

router.patch('/:id/assign', authorizeRoles('DeptAdmin'),                    assignComplaint);

// ── Shared: status update (Technician, Teacher, DeptAdmin) ───────────────────
router.patch('/:id/status', authorizeRoles('Technician', 'Teacher', 'DeptAdmin'), updateStatus);

// ── Shared: single complaint detail + audit log ──────────────────────────────
router.get('/:id',         getComplaintById);
router.get('/:id/audit',   authorizeRoles('DeptAdmin'),                     getComplaintAuditLog);

export default router;