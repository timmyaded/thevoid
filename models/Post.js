import mongoose from "mongoose";

const CATEGORIES = [
  "Technology", "Life", "Travel", "Finance",
  "Health", "Creative", "Science", "Culture", "General"
];

const postSchema = new mongoose.Schema(
  {
    title:              { type: String, required: true, trim: true, maxlength: 150 },
    content:            { type: String, required: true },
    category:           { type: String, enum: CATEGORIES, default: "General" },
    author:             { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    readTime:           { type: String, default: "1 min read" },
    likes:              [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
    // Image stored directly in MongoDB
    coverImageData:     { type: Buffer },
    coverImageType:     { type: String }, // e.g. "image/jpeg"
  },
  { timestamps: true }
);

// Auto-calculate read time
postSchema.pre("save", function (next) {
  const words = this.content.trim().split(/\s+/).length;
  const mins = Math.max(1, Math.ceil(words / 200));
  this.readTime = `${mins} min read`;
  next();
});

export const CATEGORY_LIST = CATEGORIES;
export default mongoose.model("Post", postSchema);