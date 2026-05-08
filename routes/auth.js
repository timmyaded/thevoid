import express from "express";
import User from "../models/User.js";
import { requireAuth, redirectIfAuth } from "../middleware/auth.js";

const router = express.Router();

// ── Register ─────────────────────────────────────
router.get("/register", redirectIfAuth, (req, res) => {
  res.render("auth/register", { error: null });
});

router.post("/register", redirectIfAuth, async (req, res) => {
  const { username, email, password, bio } = req.body;
  try {
    const exists = await User.findOne({ $or: [{ email }, { username }] });
    if (exists) {
      const field = exists.email === email.toLowerCase() ? "email" : "username";
      return res.render("auth/register", { error: `That ${field} is already taken.` });
    }
    const user = await User.create({ username, email, password, bio });
    req.session.userId = user._id;
    req.session.username = user.username;
    res.redirect("/feed");
  } catch (err) {
    res.render("auth/register", { error: "Something went wrong. Please try again." });
  }
});

// ── Login ─────────────────────────────────────────
router.get("/login", redirectIfAuth, (req, res) => {
  res.render("auth/login", { error: null });
});

router.post("/login", redirectIfAuth, async (req, res) => {
  const { email, password } = req.body;
  try {
    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user || !(await user.comparePassword(password))) {
      return res.render("auth/login", { error: "Invalid email or password." });
    }
    req.session.userId = user._id;
    req.session.username = user.username;
    res.redirect("/feed");
  } catch (err) {
    res.render("auth/login", { error: "Something went wrong. Please try again." });
  }
});

// ── Logout ────────────────────────────────────────
router.post("/logout", (req, res) => {
  req.session.destroy(() => res.redirect("/login"));
});

// ── Profile ───────────────────────────────────────
router.get("/profile/:username", async (req, res) => {
  try {
    const user = await User.findOne({ username: req.params.username });
    if (!user) return res.redirect("/feed");
    const Post = (await import("../models/Post.js")).default;
    const posts = await Post.find({ author: user._id })
      .select("-coverImageData")
      .sort({ createdAt: -1 });
    res.render("profile", { profileUser: user, posts });
  } catch (err) {
    res.redirect("/feed");
  }
});

// ── Edit Profile (GET) ────────────────────────────
router.get("/profile/:username/edit", requireAuth, async (req, res) => {
  try {
    // Only the owner can edit their profile
    if (req.session.username !== req.params.username) return res.redirect(`/profile/${req.params.username}`);
    const user = await User.findById(req.session.userId);
    if (!user) return res.redirect("/feed");
    res.render("auth/edit-profile", { user, error: null, success: null });
  } catch (err) {
    res.redirect("/feed");
  }
});

// ── Edit Profile (POST) ───────────────────────────
router.post("/profile/:username/edit", requireAuth, async (req, res) => {
  try {
    if (req.session.username !== req.params.username) return res.redirect(`/profile/${req.params.username}`);
    const { username, bio } = req.body;
    const trimmedUsername = username?.trim();

    // Check if new username is already taken by someone else
    if (trimmedUsername !== req.params.username) {
      const exists = await User.findOne({ username: trimmedUsername });
      if (exists) {
        const user = await User.findById(req.session.userId);
        return res.render("auth/edit-profile", { user, error: "That username is already taken.", success: null });
      }
    }

    await User.findByIdAndUpdate(req.session.userId, {
      username: trimmedUsername,
      bio: bio?.trim() || "",
    });

    // Update session so navbar reflects new username immediately
    req.session.username = trimmedUsername;

    res.redirect(`/profile/${trimmedUsername}`);
  } catch (err) {
    const user = await User.findById(req.session.userId);
    res.render("auth/edit-profile", { user, error: "Could not save changes.", success: null });
  }
});

export default router;