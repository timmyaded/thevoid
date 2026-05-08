# Inkwell v2 — Social Blogging Platform

A full-featured social blog built with Node.js, Express.js, EJS, and MongoDB.

## Features
- **User accounts** — register, log in, log out, profile pages
- **Write posts** — with category and auto-calculated read time
- **Global feed** — all posts from all users, newest first
- **Category feeds** — browse posts by topic (Technology, Life, Travel, etc.)
- **Comments** — leave responses on any post; delete your own
- **Edit & delete** — authors can manage their own posts
- **Persistent storage** — MongoDB keeps data between sessions

## Prerequisites
- Node.js v18+
- MongoDB running locally **or** a MongoDB Atlas connection string

### Install MongoDB locally (if needed)
- **Mac**: `brew tap mongodb/brew && brew install mongodb-community && brew services start mongodb-community`
- **Windows**: https://www.mongodb.com/docs/manual/tutorial/install-mongodb-on-windows/
- **Linux**: https://www.mongodb.com/docs/manual/administration/install-on-linux/

## Setup

```bash
# 1. Install dependencies
npm install

# 2. (Optional) Set environment variables
#    Create a .env file or set these in your shell:
#    MONGO_URI=mongodb://127.0.0.1:27017/inkwell
#    SESSION_SECRET=your-secret-key

# 3. Start the server
npm start

# Auto-restart on file changes (development)
npm run dev
```

Then open **http://localhost:3000**

## Project Structure

```
inkwell-v2/
├── index.js                  # Express server entry point
├── package.json
├── models/
│   ├── User.js               # User schema (bcrypt hashed passwords)
│   ├── Post.js               # Post schema (with auto read time)
│   └── Comment.js            # Comment schema
├── routes/
│   ├── auth.js               # Register, login, logout, profile
│   ├── posts.js              # CRUD for posts
│   ├── feed.js               # Global + category feeds
│   └── comments.js           # Add / delete comments
├── middleware/
│   └── auth.js               # requireAuth, redirectIfAuth
├── views/
│   ├── partials/
│   │   ├── header.ejs
│   │   └── footer.ejs
│   ├── auth/
│   │   ├── login.ejs
│   │   └── register.ejs
│   ├── feed/
│   │   └── index.ejs         # Global + category feed
│   ├── posts/
│   │   ├── show.ejs          # Single post + comments
│   │   ├── new.ejs
│   │   └── edit.ejs
│   └── profile.ejs
└── public/
    ├── css/style.css
    └── js/main.js
```

## Routes

| Method | Path                    | Description                  |
|--------|-------------------------|------------------------------|
| GET    | /feed                   | Global feed (all posts)      |
| GET    | /feed/:category         | Category feed                |
| GET    | /register               | Register form                |
| POST   | /register               | Create account               |
| GET    | /login                  | Login form                   |
| POST   | /login                  | Authenticate user            |
| POST   | /logout                 | Destroy session              |
| GET    | /profile/:username      | User profile + their posts   |
| GET    | /posts/new              | New post form (auth required)|
| POST   | /posts                  | Create post                  |
| GET    | /posts/:id              | View single post + comments  |
| GET    | /posts/:id/edit         | Edit form (author only)      |
| POST   | /posts/:id/edit         | Update post                  |
| POST   | /posts/:id/delete       | Delete post                  |
| POST   | /comments               | Add comment (auth required)  |
| POST   | /comments/:id/delete    | Delete comment (author only) |
