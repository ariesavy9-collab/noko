const mongoose = require('mongoose');

const postSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true, maxlength: 120 },
    description: { type: String, trim: true, maxlength: 2000, default: '' },
    category: { type: String, enum: ['Comedy', 'Anime'], default: 'Comedy' },
    videoId: { type: String, required: true, trim: true },
    thumbnail: { type: String, default: '' },
    views: { type: Number, default: 0, min: 0 },
    publishedAt: { type: Date, default: Date.now }
  },
  { timestamps: true }
);

module.exports = mongoose.model('Post', postSchema);
