const { Router } = require("express");

const {
  createPost,
  getPosts,
  getPost,
  getCatPosts,
  getUserPosts,
  editPost,
  deletePost,
} = require("../controllers/postControllers");
const authMiddleware = require("../middleware/authMiddleware.js");

const router = Router();

// Create a new post
router.post("/", authMiddleware, createPost);

// Get all posts
router.get("/", getPosts);

// Get a specific post by ID
router.get("/:id", getPost);

// Get posts by category
router.get("/categories/:category", getCatPosts);

// Get posts by user (assuming this is what you intended for this route)
router.get("/users/:id", getUserPosts);

// Edit a post
router.patch("/:id", authMiddleware, editPost);

// Delete a post
router.delete("/:id", authMiddleware, deletePost);

module.exports = router;
