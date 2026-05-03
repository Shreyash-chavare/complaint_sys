import Complaint from '../models/Complaint.js';
import AuditLog from '../models/AuditLog.js';
import Notification from '../models/Notification.js';
import Technician from '../models/technician.js';
import Department from '../models/Department.js';
import Teacher from '../models/teacher.js'

// ─── SLA map (priority → hours) ─────────────────────────────────────────────
const SLA_HOURS = { high: 24, medium: 72, low: 120 };

// ─── helpers ────────────────────────────────────────────────────────────────

const logAction = async ({ complaintId, actorId, actorModel = "Student", action, details }) => {
  try {
    await AuditLog.create({
      complaint: complaintId,
      actor: actorId,
      actorModel,
      action,
      details
    });
  } catch (err) {
    console.error('Audit log failed:', err.message);
  }
};

const notify = async ({ userId, userModel, message, type, complaintId }) => {
  try {
    await Notification.create({
      user: userId,
      userModel,
      message,
      type,
      complaint: complaintId
    });
  } catch (err) {
    console.error('Notification failed:', err.message);
  }
};

// ─── Department auto-routing ─────────────────────────────────────────────────
const KEYWORD_MAP = {
  'IT Support': ['wifi', 'internet', 'network', 'server', 'software', 'computer', 'laptop', 'printer', 'login', 'password', 'email', 'system'],
  'Electrical': ['power', 'electricity', 'ac', 'air conditioner', 'fan', 'wiring', 'light', 'bulb', 'switch', 'socket', 'voltage', 'generator'],
  'Maintenance': ['plumbing', 'water', 'leak', 'furniture', 'chair', 'desk', 'table', 'door', 'window', 'lock', 'paint', 'wall', 'ceiling', 'floor', 'tile', 'cleaning'],
  'Facilities': ['parking', 'garden', 'canteen', 'washroom', 'toilet', 'bathroom', 'elevator', 'lift', 'security', 'cctv', 'gate']
};

const detectDepartment = (title, description) => {
  const text = `${title} ${description}`.toLowerCase();
  let bestDept = null;
  let bestScore = 0;

  for (const [dept, keywords] of Object.entries(KEYWORD_MAP)) {
    const score = keywords.filter(kw => text.includes(kw)).length;
    if (score > bestScore) {
      bestScore = score;
      bestDept = dept;
    }
  }
  return bestDept;
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
      assignedTeachers,
      location
    } = req.body;

    // Parse assignedTeachers if sent as JSON string (multipart/form-data)
    let teachers = [];

if (assignedTeachers) {
  teachers = typeof assignedTeachers === 'string'
    ? JSON.parse(assignedTeachers)
    : assignedTeachers;
}

let teacherDocs = [];

if (teachers.length > 0) {
  teacherDocs = await Teacher.find({
    employeeId: { $in: teachers }
  });
}

console.log("Parsed:", teachers);
console.log("Found:", teacherDocs.map(t => t.employeeId));
    const teacherIds = teacherDocs.map(t => t._id);

    // Parse location same way
    let parsedLocation = {};
    if (location) {
      parsedLocation = typeof location === 'string'
        ? JSON.parse(location)
        : location;
    }

    // Academic complaints must have at least one teacher
    if (category === 'Academic' && teacherIds.length === 0) {
      return res.status(400).json({
        message: 'Academic complaints require at least one teacher assigned'
      });
    }

    // Build attachments array from uploaded files
    const attachments = (req.files || []).map(file => ({
      url: file.path,
      resourceType: file.mimetype.startsWith('video/') ? 'video' : 'image',
      originalName: file.originalname
    }));

    // ── SLA deadline calculation ──
    const slaHours = SLA_HOURS[priority] || SLA_HOURS.low;
    const slaDeadline = new Date(Date.now() + slaHours * 60 * 60 * 1000);

    // ── Auto-route to department (Infrastructure only) ──
    let departmentId = null;
    if (category === 'Infrastructure') {
      const deptName = detectDepartment(title, description);
      if (deptName) {
        let dept = await Department.findOne({ name: deptName });
        if (!dept) {
          // Auto-create the department if it doesn't exist
          dept = await Department.create({ name: deptName, categoryKeywords: KEYWORD_MAP[deptName] || [] });
        }
        departmentId = dept._id;
      }
    }

    const complaint = await Complaint.create({
      title,
      description,
      category,
      priority: priority || 'low',
      isPrivate: isPrivate === 'true' || isPrivate === true,
      assignedTeachers: category === 'Academic' ? teacherIds : [],
      location: parsedLocation,
      attachments,
      student: req.user.id,
      slaDeadline,
      department: departmentId
    });

    await logAction({
      complaintId: complaint._id,
      actorId: req.user.id,
      action: 'CREATED',
      details: `Complaint #${complaint._id} created — "${title}" [${category}] SLA: ${slaHours}h`
    });

    // Notify assigned teachers for academic complaints
    if (category === 'Academic' && teacherIds.length > 0) {
      for (const teacherId of teacherIds) {
        await notify({
          userId: teacherId,
          userModel: 'Teacher',
          message: `New academic complaint assigned to you: "${title}"`,
          type: 'complaint_assigned',
          complaintId: complaint._id
        });
      }
    }

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
    if (status) filter.status = status;
    if (category) filter.category = category;
    if (priority) filter.priority = priority;

    const skip = (Number(page) - 1) * Number(limit);

    const [complaints, total] = await Promise.all([
      Complaint.find(filter)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(Number(limit))
        .populate('assignedTeachers', 'name email')
        .populate('assignedTo', 'name email')
        .populate('department', 'name'),
      Complaint.countDocuments(filter)
    ]);

    res.status(200).json({
      total,
      page: Number(page),
      totalPages: Math.ceil(total / Number(limit)),
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
      isPrivate: false,
      status: { $ne: 'withdrawn' }
    };
    if (status) filter.status = status;
    if (category) filter.category = category;
    if (priority) filter.priority = priority;

    const skip = (Number(page) - 1) * Number(limit);

    const [complaints, total] = await Promise.all([
      Complaint.find(filter)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(Number(limit))
        .populate('student', 'name department year')
        .populate('assignedTeachers', 'name')
        .populate('department', 'name')
        .select('-attachments'),
      Complaint.countDocuments(filter)
    ]);

    res.status(200).json({
      total,
      page: Number(page),
      totalPages: Math.ceil(total / Number(limit)),
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

    if (complaint.isPrivate) {
      return res.status(403).json({ message: 'Cannot upvote a private complaint' });
    }

    if (complaint.student.toString() === req.user.id) {
      return res.status(400).json({ message: 'Cannot upvote your own complaint' });
    }

    const alreadyUpvoted = complaint.upvotes.includes(req.user.id);

    if (alreadyUpvoted) {
      complaint.upvotes.pull(req.user.id);
    } else {
      complaint.upvotes.push(req.user.id);
    }

    await complaint.save();

    res.status(200).json({
      message: alreadyUpvoted ? 'Upvote removed' : 'Upvoted',
      upvoteCount: complaint.upvotes.length
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
      await complaint.deleteOne();

      await logAction({
        complaintId: complaint._id,
        actorId: req.user.id,
        action: 'DELETED',
        details: `Complaint #${complaint._id} hard deleted by student`
      });

      return res.status(200).json({ message: 'Complaint deleted' });
    }

    if (['resolved', 'closed'].includes(complaint.status)) {
      return res.status(400).json({
        message: 'Cannot withdraw a resolved or closed complaint'
      });
    }

    complaint.status = 'withdrawn';
    complaint.withdrawnAt = new Date();
    await complaint.save();

    await logAction({
      complaintId: complaint._id,
      actorId: req.user.id,
      action: 'WITHDRAWN',
      details: `Complaint #${complaint._id} withdrawn by student`
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

    if (complaint.student.toString() !== req.user.id) {
      return res.status(403).json({ message: 'Not your complaint' });
    }

    if (complaint.status !== 'resolved') {
      return res.status(400).json({
        message: 'Only resolved complaints can be reopened'
      });
    }

    const hoursSinceResolved =
      (Date.now() - new Date(complaint.resolvedAt).getTime()) / (1000 * 60 * 60);

    if (hoursSinceResolved > 48) {
      return res.status(400).json({
        message: 'Reopen window expired (48h after resolution)'
      });
    }

    complaint.status = 'reopened';
    complaint.reopenedCount += 1;
    await complaint.save();

    await logAction({
      complaintId: complaint._id,
      actorId: req.user.id,
      action: 'REOPENED',
      details: `Complaint #${complaint._id} reopened by student (count: ${complaint.reopenedCount})`
    });

    // Notify assigned technician / teachers
    if (complaint.assignedTo) {
      await notify({
        userId: complaint.assignedTo,
        userModel: 'Technician',
        message: `Complaint "${complaint.title}" has been reopened by the student`,
        type: 'complaint_reopened',
        complaintId: complaint._id
      });
    }
    for (const teacherId of complaint.assignedTeachers) {
      await notify({
        userId: teacherId,
        userModel: 'Teacher',
        message: `Complaint "${complaint.title}" has been reopened by the student`,
        type: 'complaint_reopened',
        complaintId: complaint._id
      });
    }

    res.status(200).json({ message: 'Complaint reopened', complaint });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

// ═══════════════════════════════════════════════════════════════════════════════
//  NEW ENDPOINTS — Technician / Teacher / DeptAdmin
// ═══════════════════════════════════════════════════════════════════════════════

// ─── GET /api/complaints/assigned ────────────────────────────────────────────
// Technician sees infra complaints assigned to them
// Teacher sees academic complaints assigned to them
export const getAssignedComplaints = async (req, res) => {
  try {
    const { status, priority, page = 1, limit = 10 } = req.query;
    const role = req.user.role;

    let filter = {};

    if (role === 'Technician') {
      filter.assignedTo = req.user.id;
    } else if (role === 'Teacher') {
      filter.assignedTeachers = req.user.id;
    } else {
      return res.status(403).json({ message: 'Access denied' });
    }

    if (status) filter.status = status;
    if (priority) filter.priority = priority;

    const skip = (Number(page) - 1) * Number(limit);

    const [complaints, total] = await Promise.all([
      Complaint.find(filter)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(Number(limit))
        .populate('student', 'name email department')
        .populate('assignedTeachers', 'name email')
        .populate('assignedTo', 'name email')
        .populate('department', 'name'),
      Complaint.countDocuments(filter)
    ]);

    res.status(200).json({
      total,
      page: Number(page),
      totalPages: Math.ceil(total / Number(limit)),
      complaints
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

// ─── GET /api/complaints/department ──────────────────────────────────────────
// DeptAdmin sees all complaints routed to their department
export const getDepartmentComplaints = async (req, res) => {
  try {
    const { status, priority, category, page = 1, limit = 10 } = req.query;

    // Find department by admin's department name
    const adminDept = req.user.department; // from JWT — we'll need to include it
    // Fallback: look up DeptAdmin to get their department
    const DeptAdmin = (await import('../models/deptAdmin.js')).default;
    const admin = await DeptAdmin.findById(req.user.id);
    if (!admin) {
      return res.status(404).json({ message: 'Admin not found' });
    }

    const dept = await Department.findOne({ name: admin.department });

    const filter = {};
    if (dept) {
      filter.department = dept._id;
    } else {
      // If no department document, try matching by category for infra
      filter.category = 'Infrastructure';
    }

    if (status) filter.status = status;
    if (priority) filter.priority = priority;
    if (category) filter.category = category;

    const skip = (Number(page) - 1) * Number(limit);

    const [complaints, total] = await Promise.all([
      Complaint.find(filter)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(Number(limit))
        .populate('student', 'name email department')
        .populate('assignedTeachers', 'name email')
        .populate('assignedTo', 'name email specialization')
        .populate('department', 'name'),
      Complaint.countDocuments(filter)
    ]);

    res.status(200).json({
      total,
      page: Number(page),
      totalPages: Math.ceil(total / Number(limit)),
      complaints
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

// ─── PATCH /api/complaints/:id/assign ────────────────────────────────────────
// DeptAdmin assigns a technician to an infrastructure complaint
export const assignComplaint = async (req, res) => {
  try {
    const { technicianId } = req.body;
    const complaint = await Complaint.findById(req.params.id);

    if (!complaint) {
      return res.status(404).json({ message: 'Complaint not found' });
    }

    if (complaint.category !== 'Infrastructure') {
      return res.status(400).json({ message: 'Only infrastructure complaints can be assigned to technicians' });
    }

    if (!['open', 'reopened'].includes(complaint.status)) {
      return res.status(400).json({ message: `Cannot assign a complaint with status "${complaint.status}"` });
    }

    // Verify technician exists
    const technician = await Technician.findById(technicianId);
    if (!technician) {
      return res.status(404).json({ message: 'Technician not found' });
    }

    complaint.assignedTo = technicianId;
    complaint.status = 'assigned';
    await complaint.save();

    await logAction({
      complaintId: complaint._id,
      actorId: req.user.id,
      actorModel: 'DeptAdmin',
      action: 'ASSIGNED',
      details: `Assigned to technician ${technician.name} (${technicianId})`
    });

    // Notify technician
    await notify({
      userId: technicianId,
      userModel: 'Technician',
      message: `New complaint assigned to you: "${complaint.title}"`,
      type: 'complaint_assigned',
      complaintId: complaint._id
    });

    // Notify student
    await notify({
      userId: complaint.student,
      userModel: 'Student',
      message: `Your complaint "${complaint.title}" has been assigned to a technician`,
      type: 'complaint_assigned',
      complaintId: complaint._id
    });

    res.status(200).json({ message: 'Complaint assigned', complaint });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

// ─── PATCH /api/complaints/:id/status ────────────────────────────────────────
// Technician / DeptAdmin / Teacher can update status
export const updateStatus = async (req, res) => {
  try {
    const { status } = req.body;
    const role = req.user.role;
    const complaint = await Complaint.findById(req.params.id);

    if (!complaint) {
      return res.status(404).json({ message: 'Complaint not found' });
    }

    // Define allowed transitions per role
    const TRANSITIONS = {
      Technician: {
        assigned: ['in_progress'],
        in_progress: ['resolved'],
        reopened: ['in_progress']
      },
      Teacher: {
        assigned: ['in_progress'],
        in_progress: ['resolved'],
        reopened: ['in_progress']
      },
      DeptAdmin: {
        assigned: ['in_progress'],
        in_progress: ['resolved'],
        resolved: ['closed'],
        reopened: ['in_progress', 'assigned']
      }
    };

    const allowed = TRANSITIONS[role];
    if (!allowed) {
      return res.status(403).json({ message: 'Your role cannot update complaint status' });
    }

    const validNext = allowed[complaint.status];
    if (!validNext || !validNext.includes(status)) {
      return res.status(400).json({
        message: `Cannot transition from "${complaint.status}" to "${status}" as ${role}`,
        allowedTransitions: validNext || []
      });
    }

    // Verify the user is actually assigned to this complaint
    if (role === 'Technician' && complaint.assignedTo?.toString() !== req.user.id) {
      return res.status(403).json({ message: 'This complaint is not assigned to you' });
    }
    if (role === 'Teacher' && !complaint.assignedTeachers.map(t => t.toString()).includes(req.user.id)) {
      return res.status(403).json({ message: 'This complaint is not assigned to you' });
    }

    const oldStatus = complaint.status;
    complaint.status = status;

    if (status === 'resolved') {
      complaint.resolvedAt = new Date();
    }

    await complaint.save();

    await logAction({
      complaintId: complaint._id,
      actorId: req.user.id,
      actorModel: role,
      action: 'STATUS_UPDATE',
      details: `Status changed: ${oldStatus} → ${status} by ${role}`
    });

    // Notify student about status change
    await notify({
      userId: complaint.student,
      userModel: 'Student',
      message: `Your complaint "${complaint.title}" status updated to ${status.replace('_', ' ').toUpperCase()}`,
      type: status === 'resolved' ? 'complaint_resolved' : 'status_change',
      complaintId: complaint._id
    });

    res.status(200).json({ message: `Status updated to ${status}`, complaint });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

// ─── GET /api/complaints/technicians ─────────────────────────────────────────
// DeptAdmin gets list of technicians in their department for assignment
export const getDepartmentTechnicians = async (req, res) => {
  try {
    const DeptAdmin = (await import('../models/deptAdmin.js')).default;
    const admin = await DeptAdmin.findById(req.user.id);
    if (!admin) {
      return res.status(404).json({ message: 'Admin not found' });
    }

    const technicians = await Technician.find({ department: admin.department })
      .select('name email employeeId specialization');

    // Get active complaint count per technician
    const techsWithWorkload = await Promise.all(
      technicians.map(async (tech) => {
        const activeCount = await Complaint.countDocuments({
          assignedTo: tech._id,
          status: { $in: ['assigned', 'in_progress'] }
        });
        return {
          ...tech.toObject(),
          activeComplaints: activeCount
        };
      })
    );

    res.status(200).json({ technicians: techsWithWorkload });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

// ─── GET /api/complaints/:id ─────────────────────────────────────────────────
// Get single complaint detail (for any authenticated user with access)
export const getComplaintById = async (req, res) => {
  try {
    const complaint = await Complaint.findById(req.params.id)
      .populate('student', 'name email department year')
      .populate('assignedTeachers', 'name email department')
      .populate('assignedTo', 'name email specialization department')
      .populate('department', 'name');

    if (!complaint) {
      return res.status(404).json({ message: 'Complaint not found' });
    }

    // Access control
    const role = req.user.role;
    const userId = req.user.id;

    const isOwner = complaint.student._id.toString() === userId;
    const isAssignedTech = complaint.assignedTo?._id?.toString() === userId;
    const isAssignedTeacher = complaint.assignedTeachers.some(t => t._id.toString() === userId);
    const isDeptAdmin = role === 'DeptAdmin';

    if (!isOwner && !isAssignedTech && !isAssignedTeacher && !isDeptAdmin) {
      if (complaint.isPrivate) {
        return res.status(403).json({ message: 'Access denied — private complaint' });
      }
    }

    res.status(200).json({ complaint });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

// ─── GET /api/complaints/audit/:id ───────────────────────────────────────────
// Get audit trail for a specific complaint
export const getComplaintAuditLog = async (req, res) => {
  try {
    const logs = await AuditLog.find({ complaint: req.params.id })
      .sort({ createdAt: -1 })
      .populate('actor', 'name email');

    res.status(200).json({ logs });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};