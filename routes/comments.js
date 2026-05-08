import express from "express";
import Comment from "../models/Comment.js";
import { requireAuth } from "../middleware/auth.js";

const router = express.Router();

// ── Add Comment ───────────────────────────────────
router.post("/", requireAuth, async (req, res) => {
  const { content, postId } = req.body;
  try {
    await Comment.create({ content, author: req.session.userId, post: postId });
    res.redirect(`/posts/${postId}`);
  } catch (err) {
    res.redirect(`/posts/${postId}`);
  }
});

// ── Delete Comment ────────────────────────────────
router.post("/:id/delete", requireAuth, async (req, res) => {
  try {
    const comment = await Comment.findById(req.params.id);
    const postId = comment?.post;
    if (comment && comment.author.toString() === req.session.userId.toString()) {
      await comment.deleteOne();
    }
    res.redirect(`/posts/${postId}`);
  } catch (err) {
    res.redirect("/feed");
  }
});

export default router;
