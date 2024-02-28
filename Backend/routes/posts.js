// routes/posts.js
const express = require('express');
const router = express.Router();
const postController = require('../controllers/postController');
const authMiddleware = require('../middleware/authMiddleware');

router.post('/', authMiddleware, postController.createPost);
router.get('/', postController.getAllPosts);
router.post('/:postId/comment', authMiddleware, postController.addComment);
router.put('/:postId/like', authMiddleware, postController.toggleLike);
router.delete('/:postId', authMiddleware, postController.deletePost);



module.exports = router;
