const Post = require('../models/Post');
const multer = require('multer');

// Multer configuration for file upload
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/images'); // Directory where files will be uploaded
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + '-' + file.originalname); // Unique filename
  }
});

// Separate middleware function for multer upload
const upload = multer({ storage: storage }).single('image');

exports.createPost = async (req, res) => {
  console.log("Request received at createPost function");
  try {
    // Handle file upload middleware
    upload(req, res, async function (err) {
      if (err instanceof multer.MulterError) {
        // A Multer error occurred when uploading.
        console.error('Multer error:', err);
        return res.status(500).json({ error: 'File upload error' });
      } else if (err) {
        // An unknown error occurred when uploading.
        console.error('Unknown error:', err);
        return res.status(500).json({ error: 'Unknown error' });
      }
      console.log('File:', req.file);
      console.log('Request Body:', req.body); // Log request body
      console.log('User ID:', req.userId); // Log user ID extracted from JWT token

      const { message } = req.body;
      const userId = req.userId; // Extract user ID from JWT token

      let image = null;
      if (req.file) {
        // Image data is available, construct image object
        image = {
          contentType: req.file.mimetype,
          data: req.file.buffer.toString('base64')
        };
      }

      console.log('Message:', message);
      console.log('Image:', image);

      // Create new post
      const newPost = new Post({ user: userId, message, image });
      await newPost.save();
      res.status(201).json({ message: 'Post created successfully' });
    });
  } catch (error) {
    console.error('createPost error:', error);
    res.status(500).json({ error: error.message });
  }
};


exports.getAllPosts = async (req, res) => {
    try {
      const posts = await Post.find()
        .populate('user', 'username')
        .populate({
          path: 'comments',
          populate: {
            path: 'user',
            select: 'username'
          },
          select: 'text createdAt' // Select the text and createdAt fields for comments
        })
        .populate('likes');
      res.json(posts);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  };
  
  
  

exports.addComment = async (req, res) => {
    try {
      const postId = req.params.postId;
      const { comment, userId } = req.body;
      const post = await Post.findById(postId);
      if (!post) {
        return res.status(404).json({ error: 'Post not found' });
      }
      // Ensure comment text is provided
      if (!comment) {
        return res.status(400).json({ error: 'Comment text is required' });
      }
      post.comments.push({ user: userId, text: comment }); // Ensure 'text' field is set
      await post.save();
      res.status(201).json({ message: 'Comment added successfully' });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  };
  

  exports.toggleLike = async (req, res) => {
    try {
      const postId = req.params.postId;
      const userId = req.query.userId; // Extract userId from query parameters
      if (!ObjectId.isValid(userId)) {
        return res.status(400).json({ error: 'Invalid userId' });
      }
  
      const post = await Post.findById(postId);
      if (!post) {
        return res.status(404).json({ error: 'Post not found' });
      }
  
      // Check if the user has already liked the post
      const index = post.likes.indexOf(userId);
      if (index === -1) {
        // Add the user to the likes array
        post.likes.push(userId);
      } else {
        // Remove the user from the likes array
        post.likes.splice(index, 1);
      }
  
      await post.save();
      res.json(post);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  };

exports.deletePost = async (req, res) => {
    try {
      const postId = req.params.postId;
      const userId = req.body.userId; // Receive userId from the client
      const post = await Post.findById(postId);
      if (!post) {
        return res.status(404).json({ error: 'Post not found' });
      }
      // Check if the user deleting the post is the owner of the post
      if (post.user.toString() !== userId) {
        return res.status(403).json({ error: 'Unauthorized: You are not the owner of this post' });
      }
      await post.remove();
      res.json({ message: 'Post deleted successfully' });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  };
