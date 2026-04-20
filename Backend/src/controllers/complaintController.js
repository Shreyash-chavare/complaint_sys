import Complaint  from '../models/Complaint.js';
import AuditLog   from '../models/AuditLog.js';

// ─── helpers ────────────────────────────────────────────────────────────────

const logAction = async ({ complaintId, actorId, actorModel = "Student", action, details }) => {
  try {
    await AuditLog.create({
      complaint : complaintId,
      actor     : actorId,
      actorModel,              // added
      action,
      details
    });
  } catch (err) {
    console.error('Audit log failed:', err.message);
  }
};

// ─── POST /api/complaints ────────────────────────────────────────────────────
export const createComplaint = async (req, res) => {
  try {
    const {
      title,
      description,
      category,
      priority,
      isPrivate,
      assignedTeachers, // JSON string array from form-data, or plain array from JSON
      location          // { building, floor, room }
    } = req.body;

    // Parse assignedTeachers if sent as JSON string (multipart/form-data)
    let teachers = [];
    if (assignedTeachers) {
      teachers = typeof assignedTeachers === 'string'
        ? JSON.parse(assignedTeachers)
        : assignedTeachers;
    }

    // Parse location same way
    let parsedLocation = {};
    if (location) {
      parsedLocation = typeof location === 'string'
        ? JSON.parse(location)
        : location;
    }

    // Academic complaints must have at least one teacher
    if (category === 'Academic' && teachers.length === 0) {
      return res.status(400).json({
        message: 'Academic complaints require at least one teacher assigned'
      });
    }

    // Build attachments array from uploaded files
    const attachments = (req.files || []).map(file => ({
      url          : file.path,           // Cloudinary URL
      resourceType : file.mimetype.startsWith('video/') ? 'video' : 'image',
      originalName : file.originalname
    }));

    const complaint = await Complaint.create({
      title,
      description,
      category,
      priority      : priority || 'low',
      isPrivate     : isPrivate === 'true' || isPrivate === true,
      assignedTeachers : category === 'Academic' ? teachers : [],
      location      : parsedLocation,
      attachments,
      student       : req.user.id
    });

    await logAction({
      complaintId : complaint._id,
      actorId     : req.user.id,
      action      : 'CREATED',
      details     : `Complaint #${complaint._id} created — "${title}" [${category}]`
    });

    // TODO Step 12: send email to assignedTeachers (Academic) or Dept Admin (Infrastructure)

    res.status(201).json({ message: 'Complaint created', complaint });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

// ─── GET /api/complaints/my ──────────────────────────────────────────────────
export const getMyComplaints = async (req, res) => {
  try {
    const { status, category, priority, page = 1, limit = 10 } = req.query;

    const filter = { student: req.user.id };
    if (status)   filter.status   = status;
    if (category) filter.category = category;
    if (priority) filter.priority = priority;

    const skip = (Number(page) - 1) * Number(limit);

    const [complaints, total] = await Promise.all([
      Complaint.find(filter)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(Number(limit))
        .populate('assignedTeachers', 'name email')
        .populate('assignedTo',       'name email')
        .populate('department',       'name'),
      Complaint.countDocuments(filter)
    ]);

    res.status(200).json({
      total,
      page        : Number(page),
      totalPages  : Math.ceil(total / Number(limit)),
      complaints
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

// ─── GET /api/complaints/feed ────────────────────────────────────────────────
export const getPublicFeed = async (req, res) => {
  try {
    const { status, category, priority, page = 1, limit = 10 } = req.query;

    const filter = {
      isPrivate : false,
      status    : { $ne: 'withdrawn' }   // hide withdrawn from feed
    };
    if (status)   filter.status   = status;
    if (category) filter.category = category;
    if (priority) filter.priority = priority;

    const skip = (Number(page) - 1) * Number(limit);

    const [complaints, total] = await Promise.all([
      Complaint.find(filter)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(Number(limit))
        .populate('student',          'name department year')
        .populate('assignedTeachers', 'name')
        .populate('department',       'name')
        .select('-attachments'),   // don't bulk-send attachment data in feed
      Complaint.countDocuments(filter)
    ]);

    res.status(200).json({
      total,
      page       : Number(page),
      totalPages : Math.ceil(total / Number(limit)),
      complaints
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

// ─── PATCH /api/complaints/:id/upvote ───────────────────────────────────────
export const toggleUpvote = async (req, res) => {
  try {
    const complaint = await Complaint.findById(req.params.id);

    if (!complaint) {
      return res.status(404).json({ message: 'Complaint not found' });
    }

    // Block upvote on private complaints
    if (complaint.isPrivate) {
      return res.status(403).json({ message: 'Cannot upvote a private complaint' });
    }

    // Block upvote on own complaint
    if (complaint.student.toString() === req.user.id) {
      return res.status(400).json({ message: 'Cannot upvote your own complaint' });
    }

    const alreadyUpvoted = complaint.upvotes.includes(req.user.id);

    if (alreadyUpvoted) {
      complaint.upvotes.pull(req.user.id);   // remove upvote
    } else {
      complaint.upvotes.push(req.user.id);   // add upvote
    }

    await complaint.save();

    res.status(200).json({
      message     : alreadyUpvoted ? 'Upvote removed' : 'Upvoted',
      upvoteCount : complaint.upvotes.length
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

// ─── DELETE /api/complaints/:id ──────────────────────────────────────────────
export const deleteOrWithdrawComplaint = async (req, res) => {
  try {
    const complaint = await Complaint.findById(req.params.id);

    if (!complaint) {
      return res.status(404).json({ message: 'Complaint not found' });
    }

    // Only the owner can delete
    if (complaint.student.toString() !== req.user.id) {
      return res.status(403).json({ message: 'Not your complaint' });
    }

    const isUnassigned =
      complaint.assignedTeachers.length === 0 &&
      !complaint.assignedTo;

    if (complaint.status === 'open' && isUnassigned) {
      // Hard delete — no one assigned yet, safe to remove
      await complaint.deleteOne();

      await logAction({
        complaintId : complaint._id,
        actorId     : req.user.id,
        action      : 'DELETED',
        details     : `Complaint #${complaint._id} hard deleted by student`
      });

      return res.status(200).json({ message: 'Complaint deleted' });
    }

    // Soft delete — already assigned, keep record
    if (['resolved', 'closed'].includes(complaint.status)) {
      return res.status(400).json({
        message: 'Cannot withdraw a resolved or closed complaint'
      });
    }

    complaint.status      = 'withdrawn';
    complaint.withdrawnAt = new Date();
    await complaint.save();

    await logAction({
      complaintId : complaint._id,
      actorId     : req.user.id,
      action      : 'WITHDRAWN',
      details     : `Complaint #${complaint._id} withdrawn by student`
    });

    res.status(200).json({ message: 'Complaint withdrawn' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

// ─── PATCH /api/complaints/:id/reopen ───────────────────────────────────────
export const reopenComplaint = async (req, res) => {
  try {
    const complaint = await Complaint.findById(req.params.id);

    if (!complaint) {
      return res.status(404).json({ message: 'Complaint not found' });
    }

    // Only owner can reopen
    if (complaint.student.toString() !== req.user.id) {
      return res.status(403).json({ message: 'Not your complaint' });
    }

    if (complaint.status !== 'resolved') {
      return res.status(400).json({
        message: 'Only resolved complaints can be reopened'
      });
    }

    // 48h window check
    const hoursSinceResolved =
      (Date.now() - new Date(complaint.resolvedAt).getTime()) / (1000 * 60 * 60);

    if (hoursSinceResolved > 48) {
      return res.status(400).json({
        message: 'Reopen window expired (48h after resolution)'
      });
    }

    complaint.status        = 'reopened';
    complaint.reopenedCount += 1;
    await complaint.save();

    await logAction({
      complaintId : complaint._id,
      actorId     : req.user.id,
      action      : 'REOPENED',
      details     : `Complaint #${complaint._id} reopened by student (count: ${complaint.reopenedCount})`
    });

    // TODO Step 12: notify assignedTeachers / assignedTo that complaint reopened

    res.status(200).json({ message: 'Complaint reopened', complaint });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};