import Complaint from '../models/Complaint.js';

// ─── GET /api/analytics ──────────────────────────────────────────────────────
export const getAnalytics = async (req, res) => {
  try {
    const now = new Date();

    // Basic counts
    const [
      totalComplaints,
      openCount,
      assignedCount,
      inProgressCount,
      resolvedCount,
      closedCount,
      reopenedCount,
      withdrawnCount
    ] = await Promise.all([
      Complaint.countDocuments(),
      Complaint.countDocuments({ status: 'open' }),
      Complaint.countDocuments({ status: 'assigned' }),
      Complaint.countDocuments({ status: 'in_progress' }),
      Complaint.countDocuments({ status: 'resolved' }),
      Complaint.countDocuments({ status: 'closed' }),
      Complaint.countDocuments({ status: 'reopened' }),
      Complaint.countDocuments({ status: 'withdrawn' })
    ]);

    // Resolution rate
    const resolvable = totalComplaints - withdrawnCount;
    const resolutionRate = resolvable > 0
      ? Math.round(((resolvedCount + closedCount) / resolvable) * 100)
      : 0;

    // Average resolution time (for resolved/closed complaints)
    const resolvedComplaints = await Complaint.find({
      status     : { $in: ['resolved', 'closed'] },
      resolvedAt : { $exists: true }
    }).select('createdAt resolvedAt');

    let avgResolutionHours = 0;
    if (resolvedComplaints.length > 0) {
      const totalHours = resolvedComplaints.reduce((sum, c) => {
        return sum + (new Date(c.resolvedAt) - new Date(c.createdAt)) / (1000 * 60 * 60);
      }, 0);
      avgResolutionHours = Math.round(totalHours / resolvedComplaints.length);
    }

    // SLA breaches
    const slaBreached = await Complaint.countDocuments({
      status      : { $in: ['open', 'assigned', 'in_progress', 'reopened'] },
      slaDeadline : { $lt: now }
    });

    // SLA at risk (within 80% of deadline)
    const slaAtRisk = await Complaint.countDocuments({
      status      : { $in: ['open', 'assigned', 'in_progress', 'reopened'] },
      slaDeadline : { $gte: now, $lt: new Date(now.getTime() + 24 * 60 * 60 * 1000) }
    });

    // Complaints by priority
    const byPriority = {
      high   : await Complaint.countDocuments({ priority: 'high' }),
      medium : await Complaint.countDocuments({ priority: 'medium' }),
      low    : await Complaint.countDocuments({ priority: 'low' })
    };

    // Complaints by category
    const byCategory = {
      Academic       : await Complaint.countDocuments({ category: 'Academic' }),
      Infrastructure : await Complaint.countDocuments({ category: 'Infrastructure' })
    };

    // Complaints per department (aggregation)
    const byDepartment = await Complaint.aggregate([
      { $match: { department: { $exists: true, $ne: null } } },
      { $group: { _id: '$department', count: { $sum: 1 } } },
      {
        $lookup: {
          from         : 'departments',
          localField   : '_id',
          foreignField : '_id',
          as           : 'dept'
        }
      },
      { $unwind: { path: '$dept', preserveNullAndEmptyArrays: true } },
      { $project: { department: { $ifNull: ['$dept.name', 'Unassigned'] }, count: 1 } },
      { $sort: { count: -1 } }
    ]);

    // Recent 7 days trend
    const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const dailyTrend = await Complaint.aggregate([
      { $match: { createdAt: { $gte: sevenDaysAgo } } },
      {
        $group: {
          _id   : { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
          count : { $sum: 1 }
        }
      },
      { $sort: { _id: 1 } }
    ]);

    res.status(200).json({
      totalComplaints,
      statusBreakdown: {
        open: openCount,
        assigned: assignedCount,
        in_progress: inProgressCount,
        resolved: resolvedCount,
        closed: closedCount,
        reopened: reopenedCount,
        withdrawn: withdrawnCount
      },
      resolutionRate,
      avgResolutionHours,
      sla: {
        breached: slaBreached,
        atRisk: slaAtRisk
      },
      byPriority,
      byCategory,
      byDepartment,
      dailyTrend
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};
