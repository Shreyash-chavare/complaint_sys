import express from 'express';
import authRouter         from './auth.js';
import complaintRouter    from './complaint.js';
// import notificationRouter from './notification.js';
import feedbackRouter     from './feedback.js';
import analyticsRouter    from './analytics.js';

const router = express.Router();

router.use('/auth',          authRouter);
router.use('/complaints',    complaintRouter);
// router.use('/notifications', notificationRouter);
router.use('/feedback',      feedbackRouter);
router.use('/analytics',     analyticsRouter);

export default router;