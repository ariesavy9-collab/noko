const Notification = require('../models/Notification');

async function listNotifications(req, res, next) {
  try {
    const [records, unreadCount] = await Promise.all([
      Notification.find({ recipient: req.user._id })
        .sort({ createdAt: -1 })
        .limit(20)
        .populate('actor', 'name avatarId role')
        .populate('post', 'title videoId')
        .populate('comment', 'content')
        .lean(),
      Notification.countDocuments({ recipient: req.user._id, readAt: null })
    ]);

    const notifications = records
      .filter((record) => record.actor && record.post)
      .map((record) => ({
        id: String(record._id),
        type: record.type,
        actor: record.actor,
        postId: String(record.post._id),
        title: record.post.title,
        videoId: record.post.videoId,
        detail: record.comment?.content || '',
        createdAt: record.createdAt,
        readAt: record.readAt
      }));

    res.json({ notifications, unreadCount });
  } catch (error) {
    next(error);
  }
}

async function markNotificationsRead(req, res, next) {
  try {
    await Notification.updateMany(
      { recipient: req.user._id, readAt: null },
      { $set: { readAt: new Date() } }
    );
    res.json({ unreadCount: 0 });
  } catch (error) {
    next(error);
  }
}

module.exports = { listNotifications, markNotificationsRead };
