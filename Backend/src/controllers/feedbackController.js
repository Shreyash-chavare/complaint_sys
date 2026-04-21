import Feedback  from '../models/Feedback.js';
import Complaint from '../models/Complaint.js';
import AuditLog  from '../models/AuditLog.js';
import Notification from '../models/Notification.js';

// ─── POST /api/feedback/:complaintId ─────────────────────────────────────────
export const submitFeedback = async (req, res) => {
  try {
    const { rating, comment } = req.body;
    const complaintId = req.params.complaintId;

    // Validate rating
    if (!rating || rating < 1 || rating > 5) {
      return res.status(400).json({ message: 'Rating must be between 1 and 5' });
    }

    const complaint = await Complaint.findById(complaintId);
    if (!complaint) {
      return res.status(404).json({ message: 'Complaint not found' });
    }

    // Only the complaint owner can give feedback
    if (complaint.student.toString() !== req.user.id) {
      return res.status(403).json({ message: 'Only the complaint owner can submit feedback' });
    }

    // Only resolved/closed complaints can receive feedback
    if (!['resolved', 'closed'].includes(complaint.status)) {
      return res.status(400).json({ message: 'Feedback can only be given on resolved or closed complaints' });
    }

    // Check if feedback already exists
    const existing = await Feedback.findOne({ complaint: complaintId });
    if (existing) {
      return res.status(409).json({ message: 'Feedback already submitted for this complaint' });
    }

    const feedback = await Feedback.create({
      complaint : complaintId,
      student   : req.user.id,
      rating,
      comment
    });

    // Log it
    await AuditLog.create({
      complaint  : complaintId,
      actor      : req.user.id,
      actorModel : 'Student',
      action     : 'FEEDBACK',
      details    : `Rating: ${rating}/5` + (comment ? ` — "${comment}"` : '')
    });

    // Notify assigned technician / teachers
    if (complaint.assignedTo) {
      await Notification.create({
        user        : complaint.assignedTo,
        userModel   : 'Technician',
        message     : `Student gave ${rating}/5 feedback on "${complaint.title}"`,
        type        : 'feedback_received',
        complaint   : complaintId
      });
    }
    for (const teacherId of complaint.assignedTeachers) {
      await Notification.create({
        user        : teacherId,
        userModel   : 'Teacher',
        message     : `Student gave ${rating}/5 feedback on "${complaint.title}"`,
        type        : 'feedback_received',
        complaint   : complaintId
      });
    }

    res.status(201).json({ message: 'Feedback submitted', feedback });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

// ─── GET /api/feedback/:complaintId ──────────────────────────────────────────
export const getFeedback = async (req, res) => {
  try {
    const feedback = await Feedback.findOne({ complaint: req.params.complaintId })
      .populate('student', 'name');

    if (!feedback) {
      return res.status(404).json({ message: 'No feedback found for this complaint' });
    }

    res.status(200).json({ feedback });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};
