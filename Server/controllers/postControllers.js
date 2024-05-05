const Post = require("../models/postModel");
const User = require("../models/userModel");
const path = require("path");
const fs = require("fs");
const { v4: uuid } = require("uuid");
const HttpError = require("../models/errorModel");

//===========create post
const createPost = async (req, res, next) => {
  try {
    let { title, category, description } = req.body;
    if (
      !title ||
      !category ||
      !description ||
      !req.files ||
      !req.files.thumbnail
    ) {
      return next(new HttpError("Fill in all fields", 422));
    }

    const { thumbnail } = req.files;
    if (thumbnail.size > 2000000) {
      return next(
        new HttpError("Thumbnail too big. File should be less than 2mb", 422)
      );
    }

    const newFilename = uuid() + "-" + thumbnail.name;
    await thumbnail.mv(path.join(__dirname, "..", "/uploads", newFilename));

    const newPost = await Post.create({
      title,
      category,
      description,
      thumbnail: newFilename,
      creator: req.user.id, // Corrected typo from 'creater' to 'creator'
    });

    if (!newPost) {
      return next(new HttpError("Post couldn't be created", 422));
    }

    const currentUser = await User.findById(req.user.id);
    const userPostCount = (currentUser.posts || 0) + 1; // Increment user's post count
    await User.findByIdAndUpdate(req.user.id, { posts: userPostCount });

    res.status(201).json(newPost);
  } catch (error) {
    return next(
      new HttpError(
        error.message || "An error occurred while creating the post",
        500
      )
    );
  }
};

const getPosts = async (req, res, next) => {
  try {
    const posts = await Post.find().sort({ updatedAt: -1 });
    res.status(200).json(posts);
  } catch (error) {
    return next(new HttpError(error));
  }
};
const getPost = async (req, res, next) => {
  try {
    const postId = req.params.id;
    const post = await Post.findById(postId);
    if (!post) {
      return next(new HttpError("pag not found", 404));
    }
    res.status(200).json(post);
  } catch (error) {
    return next(new HttpError(error));
  }
};
const getCatPosts = async (req, res, next) => {
  try {
    const { category } = req.params;
    const catPosts = await Post.find(category).sort({ createdAt: -1 });
    res.status(200).json(catPosts);
  } catch (error) {
    return next(new HttpError(error));
  }
};
const getUserPosts = async (req, res, next) => {
  try {
    const { id } = req.params;
    const posts = await Post.find({ creator: id }).sort({ createdAt: -1 });
    res.status(200).json(posts);
  } catch (error) {
    return next(new HttpError(error));
  }
};
const editPost = async (req, res, next) => {
  try {
    const postId = req.params.id;
    let { title, category, description } = req.body;

    // Validate fields
    if (!title || !category || description.length < 12) {
      return next(new HttpError("Fill in all fields", 422));
    }

    let updatedPost;

    // Check if files were uploaded
    if (req.files && req.files.thumbnail) {
      const { thumbnail } = req.files;

      // Check thumbnail size
      if (thumbnail.size > 2000000) {
        return next(
          new HttpError("Thumbnail is too big, Should be less than 2mb")
        );
      }

      const oldPost = await Post.findById(postId);
      if (oldPost && oldPost.thumbnail) {
        fs.unlink(
          path.join(__dirname, "..", "uploads", oldPost.thumbnail),
          (err) => {
            if (err) {
              return next(new HttpError(err));
            }
          }
        );
      }

      // Generate new filename
      const fileName = thumbnail.name;
      const fileExtension = fileName.split(".").pop();
      const newFilename = uuid() + "." + fileExtension;

      // Move thumbnail to uploads directory
      await thumbnail.mv(path.join(__dirname, "..", "uploads", newFilename));

      // Update post with new details
      updatedPost = await Post.findByIdAndUpdate(
        postId,
        { title, category, description, thumbnail: newFilename },
        { new: true }
      );
    } else {
      // If no files uploaded, update post without thumbnail
      updatedPost = await Post.findByIdAndUpdate(
        postId,
        { title, category, description },
        { new: true }
      );
    }

    if (!updatedPost) {
      return next(new HttpError("Couldn't update the post", 400));
    }

    res.status(200).json(updatedPost);
  } catch (error) {
    return next(new HttpError(error));
  }
};

const deletePost = async (req, res, next) => {
  try {
    const postId = req.params.id;
    if (!postId) {
      return next(new HttpError("Post unavailable", 400));
    }
    const post = await Post.findById(postId);
    if (!post) {
      return next(new HttpError("Post not found", 404));
    }
    const fileName = post.thumbnail;
    if (!fileName) {
      return next(new HttpError("Thumbnail not found for post", 404));
    }
    fs.unlink(path.join(__dirname, "..", "uploads", fileName), async (err) => {
      if (err) {
        return next(new HttpError(err));
      } else {
        await Post.findByIdAndDelete(postId);
        const currentUser = await User.findById(req.user.id);
        const userPostCount = currentUser?.posts - 1;
        await User.findByIdAndUpdate(req.user.id, { posts: userPostCount });
      }
    });
    res.json(`Post ${postId} deleted successfully`);
  } catch (error) {
    return next(new HttpError(error));
  }
};

module.exports = {
  createPost,
  getPosts,
  getPost,
  getCatPosts,
  getUserPosts,
  editPost,
  deletePost,
};
