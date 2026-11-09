const express = require('express');
const { createPost, dashboard, deletePost, listPosts, recordView, toggleLike } = require('../controllers/postController');
const { createComment, deleteComment, listComments } = require('../controllers/commentController');
const { authenticate, optionalAuthenticate, requireCreator } = require('../middleware/auth');

const router = express.Router();

router.get('/', optionalAuthenticate, listPosts);
router.get('/dashboard', authenticate, requireCreator, dashboard);
router.post('/', authenticate, requireCreator, createPost);
router.delete('/:id', authenticate, requireCreator, deletePost);
router.post('/:id/view', recordView);
router.post('/:id/like', authenticate, toggleLike);
router.get('/:id/comments', listComments);
router.post('/:id/comments', authenticate, createComment);
router.delete('/comments/:id', authenticate, deleteComment);

module.exports = router;
