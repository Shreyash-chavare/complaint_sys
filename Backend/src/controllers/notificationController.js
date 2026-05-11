import Notification from '../models/Notification.js';

// ─── GET /api/notifications ──────────────────────────────────────────────────
export const getMyNotifications = async (req, res) => {
  try {
    const { page = 1, limit = 20, unreadOnly } = req.query;
    const skip = (Number(page) - 1) * Number(limit);

    const filter = { user: req.user.id };
    if (unreadOnly === 'true') filter.read = false;

    const [notifications, total, unreadCount] = await Promise.all([
      Notification.find(filter)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(Number(limit))
        .populate('complaint', 'title status'),
      Notification.countDocuments(filter),
      Notification.countDocuments({ user: req.user.id, read: false })
    ]);

    res.status(200).json({
      total,
      unreadCount,
      page       : Number(page),
      totalPages : Math.ceil(total / Number(limit)),
      notifications
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

// ─── PATCH /api/notifications/:id/read ───────────────────────────────────────
export const markAsRead = async (req, res) => {
  try {
    const notification = await Notification.findOneAndUpdate(
      { _id: req.params.id, user: req.user.id },
      { read: true },
      { new: true }
    );

    if (!notification) {
      return res.status(404).json({ message: 'Notification not found' });
    }

    res.status(200).json({ message: 'Marked as read', notification });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

// ─── PATCH /api/notifications/read-all ───────────────────────────────────────
export const markAllAsRead = async (req, res) => {
  try {
    const result = await Notification.updateMany(
      { user: req.user.id, read: false },
      { read: true }
    );

    res.status(200).json({
      message: `${result.modifiedCount} notifications marked as read`
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};
