const Comment = require('../models/Comment');
const Notification = require('../models/Notification');
const Post = require('../models/Post');
const User = require('../models/User');
const { validId } = require('./postController');

async function listComments(req, res, next) {
  try {
    if (!validId(req.params.id)) return res.status(404).json({ message: 'Video not found.' });
    const comments = await Comment.find({ post: req.params.id })
      .sort({ createdAt: 1 })
      .populate('user', 'name role avatarId')
      .lean();
    res.json({ comments });
  } catch (error) {
    next(error);
  }
}

async function createComment(req, res, next) {
  try {
    const { content, parentComment = null } = req.body;
    if (!content?.trim() || content.trim().length > 1000) {
      return res.status(400).json({ message: 'Write a comment of 1,000 characters or fewer.' });
    }
    const post = await Post.findById(req.params.id);
    if (!post) return res.status(404).json({ message: 'Video not found.' });
    let notificationRecipient;
    if (parentComment) {
      if (!validId(parentComment)) return res.status(400).json({ message: 'Invalid comment reply.' });
      const parent = await Comment.findOne({ _id: parentComment, post: post._id, parentComment: null });
      if (!parent) return res.status(404).json({ message: 'The comment you are replying to was not found.' });
      if (req.user.role !== 'creator') return res.status(403).json({ message: 'Only the creator can reply to comments.' });
      notificationRecipient = parent.user;
    } else {
      const creatorEmail = process.env.CREATOR_EMAIL?.trim().toLowerCase();
      const creatorFilter = creatorEmail ? { email: creatorEmail, role: 'creator' } : { role: 'creator' };
      const creator = await User.findOne(creatorFilter).select('_id');
      notificationRecipient = creator?._id;
    }
    const comment = await Comment.create({
      post: post._id,
      user: req.user._id,
      content: content.trim(),
      parentComment
    });
    if (notificationRecipient && String(notificationRecipient) !== String(req.user._id)) {
      await Notification.create({
        recipient: notificationRecipient,
        actor: req.user._id,
        post: post._id,
        comment: comment._id,
        type: parentComment ? 'reply' : 'comment'
      });
    }
    const populated = await comment.populate('user', 'name role avatarId');
    res.status(201).json({ comment: populated });
  } catch (error) {
    next(error);
  }
}

async function deleteComment(req, res, next) {
  try {
    if (!validId(req.params.id)) return res.status(404).json({ message: 'Comment not found.' });
    const comment = await Comment.findById(req.params.id);
    if (!comment) return res.status(404).json({ message: 'Comment not found.' });
    const ownsComment = String(comment.user) === String(req.user._id);
    if (!ownsComment && req.user.role !== 'creator') {
      return res.status(403).json({ message: 'You can only delete your own comments.' });
    }
    const commentIds = await Comment.find({
      $or: [{ _id: comment._id }, { parentComment: comment._id }]
    }).distinct('_id');
    await Promise.all([
      Comment.deleteMany({ _id: { $in: commentIds } }),
      Notification.deleteMany({ comment: { $in: commentIds } })
    ]);
    res.json({ message: 'Comment deleted.' });
  } catch (error) {
    next(error);
  }
}

module.exports = { listComments, createComment, deleteComment };
