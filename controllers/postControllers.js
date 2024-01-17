const Post = require("../models/postModels");
const User = require("../models/userModel");
const path = require("path");
const fs = require("fs");
const { v4: uuid } = require("uuid");
const HttpError = require("../models/errorModels");
const { error } = require("console");

// ========= CREATE A POST
// POST : api/posts
//PROTCTED
const createPost = async (req, res, next) => {
  try {
    let { title, category, description, location, jobCategory } = req.body;
    if (
      !title ||
      !category ||
      !description ||
      !location ||
      !jobCategory ||
      !req.files
    ) {
      return next(
        new HttpError("Fill in all fields and choose thumbnail.", 422)
      );
    }

    const { thumbnail } = req.files;
    //   check the file size
    if (thumbnail.files > 3000000) {
      return next(
        new HttpError("Thumbnail too big. file should be less than 3mb")
      );
    }

    let fileName = thumbnail.name;
    let splittedFilename = fileName.split(".");
    let newFilename =
      splittedFilename[0] +
      uuid() +
      "." +
      splittedFilename[splittedFilename.length - 1];
    thumbnail.mv(
      path.join(__dirname, "..", "/uploads", newFilename),
      async (err) => {
        if (err) {
          return next(new HttpError(err));
        } else {
          const newPost = await Post.create({
            title,
            category,
            description,
            location,
            jobCategory,
            thumbnail: newFilename,
            creator: req.user.id,
          });
          if (!newPost) {
            return next(new HttpError("Please Couldn't be created ", 422));
          }
          // find user and increate post count by 1
          const currentUser = await User.findById(req.user.id);
          const userPostCount = currentUser.posts + 1;
          await User.findByIdAndUpdate(req.user.id, { posts: userPostCount });
          res.status(201).json(newPost);
        }
      }
    );
  } catch (error) {
    return next(new HttpError(error));
  }
};

// ========= GET ALL POST
// get : /posts
//UNPROTCTED
const getPosts = async (req, res, next) => {
  try {
    const posts = await Post.find().sort({ updatedAt: -1 });
    res.status(200).json(posts);
  } catch (error) {
    return next(new HttpError(error));
  }
};

// ========= GET SINGLE POST
// get : /posts/:id
//UNPROTCTED
const getPost = async (req, res, next) => {
  try {
    const postId = req.params.id;
    const post = await Post.findById(postId);
    if (!post) {
      return next(new HttpError("Post not found.", 404));
    }
    res.status(200).json(post);
  } catch (error) {
    return next(new HttpError(error));
  }
};

// ========= GET POSTS BY CATEGORY
// GET : /posts/categories/:category
//PROTCTED
const getCatPosts = async (req, res, next) => {
  try {
    const { category } = req.params;
    const catPosts = await Post.find({ category }).sort({ createdAt: -1 });
    res.status(200).json(catPosts);
  } catch (error) {
    return next(new HttpError(error));
  }
};

// ========= GET AUTHOR POST
// GET : /posts/users/:id
//PROTCTED
const getUserPosts = async (req, res, next) => {
  try {
    const { id } = req.params;
    const posts = await Post.find({ creator: id }).sort({ createdAt: -1 });
    res.status(200).json(posts);
  } catch (error) {
    return next(new HttpError(error));
  }
};

// ========= EDIT POST
// PATCH : /posts/:id
//PROTCTED
const editPost = async (req, res, next) => {
  try {
    let fileName;
    let newFilename;
    let updatedPost;
    const postId = req.params.id;
    let { title, category, location, description, jobCategory } = req.body;

    if (
      !title ||
      !category ||
      !location ||
      !jobCategory ||
      description.length < 12
    ) {
      return next(new HttpError("Fill in all fields.", 422));
    }

    if (!req.files) {
      updatedPost = await Post.findByIdAndUpdate(
        postId,
        { title, category, description, location, jobCategory },
        { new: true }
      );
    } else {
      // get old post from database
      const oldPost = await Post.findById(postId);
      // delete old thumbnail from upload
      fs.unlink(
        path.join(__dirname, "..", "uploads", oldPost.thumbnail),
        async (err) => {
          if (err) {
            return next(new HttpError(err));
          }
        }
      );

      // upload new thumbnail
      const { thumbnail } = req.files;
      //check file size
      if (thumbnail.size > 3000000) {
        return next(new HttpError("thumbnail to big. should be less than 3mb"));
      }

      fileName = thumbnail.name;
      let splittedFilename = fileName.split(".");
      newFilename =
        splittedFilename[0] +
        uuid() +
        "." +
        splittedFilename[splittedFilename.length - 1];

      thumbnail.mv(
        path.join(__dirname, "..", "uploads", newFilename),
        async (err) => {
          if (err) {
            return next(new HttpError(err));
          }
        }
      );
      updatedPost = await Post.findByIdAndUpdate(
        postId,
        {
          title,
          category,
          description,
          location,
          jobCategory,
          thumbnail: newFilename,
        },
        { new: true }
      );
    }

    if (!updatedPost) {
      return next(new HttpError("Couldn't update post", 422));
    }
    res.status(200).json(updatedPost);
  } catch (error) {
    return next(new HttpError(error));
  }
};

// ========= DELETE POST
// delete : /posts/:id
//PROTCTED
const deletePost = async (req, res, next) => {
  try {
    const postId = req.params.id;
    if (!postId) {
      return next(new HttpError("post Unavailable.", 400));
    }
    const post = await Post.findById(postId);
    const fileName = post?.thumbnail;

    if (req.user.id == post.creator) {
      //  delete thumbnail from uploads folder
      fs.unlink(
        path.join(__dirname, "..", "uploads", fileName),
        async (err) => {
          if (err) {
            return next(new HttpError(err));
          } else {
            await Post.findByIdAndDelete(postId);
            //find user and reducer post count by 1
            const currentUser = await User.findById(req.user.id);
            const userPostCount = currentUser?.posts - 1;
            await User.findByIdAndUpdate(req.user.id, { posts: userPostCount });
            res.json(`Post ${postId} deleted successfully`);
          }
        }
      );
    } else {
      return next(new HttpError("post couldn't be deleted", 403));
    }
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
