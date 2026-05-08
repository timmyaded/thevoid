import dns from 'node:dns';
import 'dotenv/config';
import express from "express";
import mongoose from "mongoose";
import session from "express-session";
import MongoStore from "connect-mongo";
import authRoutes from "./routes/auth.js";
import postRoutes from "./routes/posts.js";
import feedRoutes from "./routes/feed.js";
import commentRoutes from "./routes/comments.js";

const app = express();
const PORT = 3000;

// ── MongoDB ──────────────────────────────────────
const MONGO_URI = process.env.MONGO_URI || "mongodb://127.0.0.1:27017/inkwell";

mongoose
  .connect(MONGO_URI)
  .then(() => console.log("✓ MongoDB connected"))
  .catch((err) => console.error("✗ MongoDB error:", err));

// ── Middleware ───────────────────────────────────
app.set("view engine", "ejs");
app.set("views", "./views");
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(express.static("public"));

app.use(
  session({
    secret: process.env.SESSION_SECRET || "inkwell-secret-change-in-production",
    resave: false,
    saveUninitialized: false,
    store: MongoStore.create({ mongoUrl: MONGO_URI }),
    cookie: { maxAge: 1000 * 60 * 60 * 24 * 7 }, // 7 days
  })
);

// Make user available in all views
app.use((req, res, next) => {
  res.locals.currentUser = req.session.userId ? req.session : null;
  res.locals.currentUserId = req.session.userId || null;
  res.locals.currentUsername = req.session.username || null;
  next();
});

// ── Routes ───────────────────────────────────────
app.use("/", authRoutes);
app.use("/posts", postRoutes);
app.use("/feed", feedRoutes);
app.use("/comments", commentRoutes);

// Home → redirect to feed
app.get("/", (req, res) => res.redirect("/feed"));

// ── Start ────────────────────────────────────────
app.listen(PORT, () => {
  console.log(`✓ Inkwell running at http://localhost:${PORT}`);
});
