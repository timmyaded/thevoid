import express from "express";
import Post, { CATEGORY_LIST } from "../models/Post.js";
import Comment from "../models/Comment.js";

const router = express.Router();

// Attach comment counts to a posts array
async function attachCommentCounts(posts) {
  const postIds = posts.map(p => p._id);
  const counts = await Comment.aggregate([
    { $match: { post: { $in: postIds } } },
    { $group: { _id: "$post", count: { $sum: 1 } } }
  ]);
  const map = Object.fromEntries(counts.map(c => [c._id.toString(), c.count]));
  posts.forEach(p => { p.commentCount = map[p._id.toString()] || 0; });
}

// ── Global Feed ───────────────────────────────────
router.get("/", async (req, res) => {
  try {
    // Exclude binary image data — served separately via /posts/:id/image
    const posts = await Post.find()
      .select("-coverImageData")
      .populate("author", "username")
      .sort({ createdAt: -1 });
    await attachCommentCounts(posts);
    res.render("feed/index", { posts, categories: CATEGORY_LIST, activeCategory: null });
  } catch (err) {
    res.render("feed/index", { posts: [], categories: CATEGORY_LIST, activeCategory: null });
  }
});

// ── Category Feed ─────────────────────────────────
router.get("/:category", async (req, res) => {
  const category = CATEGORY_LIST.find(
    c => c.toLowerCase() === req.params.category.toLowerCase()
  );
  if (!category) return res.redirect("/feed");
  try {
    const posts = await Post.find({ category })
      .select("-coverImageData")
      .populate("author", "username")
      .sort({ createdAt: -1 });
    await attachCommentCounts(posts);
    res.render("feed/index", { posts, categories: CATEGORY_LIST, activeCategory: category });
  } catch (err) {
    res.redirect("/feed");
  }
});

export default router;