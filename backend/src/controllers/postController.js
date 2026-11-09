const mongoose = require('mongoose');
const Comment = require('../models/Comment');
const Like = require('../models/Like');
const Notification = require('../models/Notification');
const Post = require('../models/Post');
const User = require('../models/User');

function validId(id) {
  return mongoose.isValidObjectId(id);
}

function videoSummary(post, likeCount, commentCount, liked = false) {
  return {
    id: String(post._id),
    title: post.title,
    description: post.description,
    category: post.category,
    videoId: post.videoId,
    thumbnail: post.thumbnail || `https://img.youtube.com/vi/${post.videoId}/hqdefault.jpg`,
    publishedAt: post.publishedAt,
    views: post.views || 0,
    likes: likeCount,
    comments: commentCount,
    liked
  };
}

async function listPosts(req, res, next) {
  try {
    const filter = {};
    if (req.query.category && req.query.category !== 'All Videos') filter.category = req.query.category;
    if (req.query.q) filter.title = { $regex: req.query.q.trim().replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), $options: 'i' };
    const posts = await Post.find(filter).sort({ publishedAt: -1 }).lean();
    const ids = posts.map((post) => post._id);
    const [likes, comments, userLikes] = await Promise.all([
      Like.aggregate([{ $match: { post: { $in: ids } } }, { $group: { _id: '$post', count: { $sum: 1 } } }]),
      Comment.aggregate([{ $match: { post: { $in: ids }, parentComment: null } }, { $group: { _id: '$post', count: { $sum: 1 } } }]),
      req.user
        ? Like.find({ user: req.user._id, post: { $in: ids } }).distinct('post')
        : Promise.resolve([])
    ]);
    const likeCounts = new Map(likes.map((item) => [String(item._id), item.count]));
    const commentCounts = new Map(comments.map((item) => [String(item._id), item.count]));
    const likedIds = new Set(userLikes.map(String));
    res.json({
      posts: posts.map((post) =>
        videoSummary(post, likeCounts.get(String(post._id)) || 0, commentCounts.get(String(post._id)) || 0, likedIds.has(String(post._id)))
      )
    });
  } catch (error) {
    next(error);
  }
}

async function recordView(req, res, next) {
  try {
    if (!validId(req.params.id)) return res.status(404).json({ message: 'Video not found.' });
    const post = await Post.findByIdAndUpdate(
      req.params.id,
      { $inc: { views: 1 } },
      { new: true, projection: { views: 1 } }
    );
    if (!post) return res.status(404).json({ message: 'Video not found.' });
    res.json({ views: post.views });
  } catch (error) {
    next(error);
  }
}

async function toggleLike(req, res, next) {
  try {
    if (!validId(req.params.id)) return res.status(404).json({ message: 'Video not found.' });
    if (!(await Post.exists({ _id: req.params.id }))) return res.status(404).json({ message: 'Video not found.' });
    const existing = await Like.findOne({ user: req.user._id, post: req.params.id });
    if (existing) {
      await existing.deleteOne();
      return res.json({ liked: false, likes: await Like.countDocuments({ post: req.params.id }) });
    }
    await Like.create({ user: req.user._id, post: req.params.id });
    const creatorEmail = process.env.CREATOR_EMAIL?.trim().toLowerCase();
    const creatorFilter = creatorEmail ? { email: creatorEmail, role: 'creator' } : { role: 'creator' };
    const creator = await User.findOne(creatorFilter).select('_id');
    if (creator && String(creator._id) !== String(req.user._id)) {
      await Notification.create({
        recipient: creator._id,
        actor: req.user._id,
        post: req.params.id,
        type: 'like'
      });
    }
    res.json({ liked: true, likes: await Like.countDocuments({ post: req.params.id }) });
  } catch (error) {
    if (error.code === 11000) return res.status(409).json({ message: 'This video is already liked.' });
    next(error);
  }
}

async function createPost(req, res, next) {
  try {
    const { title, description = '', category = 'Comedy', videoId, thumbnail = '' } = req.body;
    const parsedVideoId = typeof videoId === 'string' ? videoId.match(/(?:youtu\.be\/|youtube\.com\/(?:watch\?v=|embed\/|shorts\/))([\w-]{11})/)?.[1] || videoId.trim() : '';
    if (!title?.trim() || !/^[\w-]{11}$/.test(parsedVideoId)) {
      return res.status(400).json({ message: 'Add a title and a valid YouTube video link or 11-character video ID.' });
    }
    if (!['Comedy', 'Anime'].includes(category)) {
      return res.status(400).json({ message: 'Choose a valid video category.' });
    }
    const post = await Post.create({ title: title.trim(), description, category, videoId: parsedVideoId, thumbnail });
    res.status(201).json({ post: videoSummary(post, 0, 0) });
  } catch (error) {
    next(error);
  }
}

async function deletePost(req, res, next) {
  try {
    if (!validId(req.params.id)) return res.status(404).json({ message: 'Video not found.' });
    const post = await Post.findByIdAndDelete(req.params.id);
    if (!post) return res.status(404).json({ message: 'Video not found.' });
    await Promise.all([
      Like.deleteMany({ post: post._id }),
      Comment.deleteMany({ post: post._id }),
      Notification.deleteMany({ post: post._id })
    ]);
    res.json({ message: 'Video deleted.' });
  } catch (error) {
    next(error);
  }
}

async function dashboard(req, res, next) {
  try {
    const [videos, likes, comments, totalViews, recentComments] = await Promise.all([
      Post.countDocuments(),
      Like.countDocuments(),
      Comment.countDocuments({ parentComment: null }),
      Post.aggregate([{ $group: { _id: null, total: { $sum: '$views' } } }]),
      Comment.find().sort({ createdAt: -1 }).limit(8).populate('user', 'name role avatarId').populate('post', 'title').lean()
    ]);
    res.json({ stats: { videos, likes, comments, views: totalViews[0]?.total || 0 }, recentComments });
  } catch (error) {
    next(error);
  }
}

module.exports = { listPosts, recordView, toggleLike, createPost, deletePost, dashboard, validId };
