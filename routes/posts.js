import express from "express";
import multer from "multer";
import Post, { CATEGORY_LIST } from "../models/Post.js";
import Comment from "../models/Comment.js";
import { requireAuth } from "../middleware/auth.js";

const router = express.Router();

// ── Multer — memory storage (straight into MongoDB) ──
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB max
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith("image/")) cb(null, true);
    else cb(new Error("Only image files are allowed"));
  },
});

// ── Serve cover image from MongoDB ───────────────
router.get("/:id/image", async (req, res) => {
  try {
    const post = await Post.findById(req.params.id).select("coverImageData coverImageType");
    if (!post || !post.coverImageData) return res.status(404).send("No image");
    res.set("Content-Type", post.coverImageType);
    res.set("Cache-Control", "public, max-age=86400"); // cache 1 day in browser
    res.send(post.coverImageData);
  } catch (err) {
    res.status(500).send("Error");
  }
});

// ── New Post Form ─────────────────────────────────
router.get("/new", requireAuth, (req, res) => {
  res.render("posts/new", { categories: CATEGORY_LIST, error: null });
});

// ── Create Post ───────────────────────────────────
router.post("/", requireAuth, upload.single("coverImage"), async (req, res) => {
  const { title, category, content } = req.body;
  try {
    const postData = { title, category, content, author: req.session.userId };
    if (req.file) {
      postData.coverImageData = req.file.buffer;
      postData.coverImageType = req.file.mimetype;
    }
    await Post.create(postData);
    res.redirect("/feed");
  } catch (err) {
    res.render("posts/new", { categories: CATEGORY_LIST, error: "Could not create post." });
  }
});

// ── Like / Unlike (toggle) ────────────────────────
router.post("/:id/like", requireAuth, async (req, res) => {
  try {
    const post = await Post.findById(req.params.id).select("likes");
    if (!post) return res.status(404).json({ error: "Post not found" });

    const userId = req.session.userId;
    const alreadyLiked = post.likes.some(id => id.toString() === userId.toString());

    // Use updateOne + $pull/$addToSet to avoid triggering the pre-save hook
    // (which requires content to be loaded to recalculate read time)
    if (alreadyLiked) {
      await Post.updateOne({ _id: post._id }, { $pull: { likes: userId } });
    } else {
      await Post.updateOne({ _id: post._id }, { $addToSet: { likes: userId } });
    }

    const newCount = alreadyLiked ? post.likes.length - 1 : post.likes.length + 1;
    res.json({ likes: newCount, liked: !alreadyLiked });
  } catch (err) {
    res.status(500).json({ error: "Server error" });
  }
});

// ── View Single Post ──────────────────────────────
router.get("/:id", async (req, res) => {
  try {
    // Exclude binary data — image is served via /:id/image route
    const post = await Post.findById(req.params.id)
      .select("-coverImageData")
      .populate("author", "username");
    if (!post) return res.redirect("/feed");
    const comments = await Comment.find({ post: post._id })
      .populate("author", "username")
      .sort({ createdAt: -1 });
    res.render("posts/show", { post, comments, categories: CATEGORY_LIST });
  } catch (err) {
    res.redirect("/feed");
  }
});

// ── Edit Form ─────────────────────────────────────
router.get("/:id/edit", requireAuth, async (req, res) => {
  try {
    const post = await Post.findById(req.params.id).select("-coverImageData");
    if (!post || post.author.toString() !== req.session.userId.toString()) {
      return res.redirect("/feed");
    }
    res.render("posts/edit", { post, categories: CATEGORY_LIST, error: null });
  } catch (err) {
    res.redirect("/feed");
  }
});

// ── Update Post ───────────────────────────────────
router.post("/:id/edit", requireAuth, upload.single("coverImage"), async (req, res) => {
  const { title, category, content, removeImage } = req.body;
  try {
    const post = await Post.findById(req.params.id);
    if (!post || post.author.toString() !== req.session.userId.toString()) {
      return res.redirect("/feed");
    }
    post.title = title;
    post.category = category;
    post.content = content;
    if (req.file) {
      // New image uploaded — replace existing
      post.coverImageData = req.file.buffer;
      post.coverImageType = req.file.mimetype;
    } else if (removeImage === "1") {
      // User checked "Remove cover image"
      post.coverImageData = undefined;
      post.coverImageType = undefined;
    }
    // Otherwise — no file, no remove checkbox — keep existing image as-is
    await post.save();
    res.redirect(`/posts/${post._id}`);
  } catch (err) {
    res.redirect("/feed");
  }
});

// ── Delete Post ───────────────────────────────────
router.post("/:id/delete", requireAuth, async (req, res) => {
  try {
    const post = await Post.findById(req.params.id).select("author");
    if (post && post.author.toString() === req.session.userId.toString()) {
      await Comment.deleteMany({ post: post._id });
      await post.deleteOne();
    }
    res.redirect("/feed");
  } catch (err) {
    res.redirect("/feed");
  }
});

export default router;