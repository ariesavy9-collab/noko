const mongoose = require('mongoose');

const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true, maxlength: 60 },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    passwordHash: { type: String, required: true, select: false },
    avatarId: {
      type: String,
      enum: ['avatar-1', 'avatar-2', 'avatar-3', 'avatar-4', 'avatar-5', 'avatar-6', 'avatar-7', 'avatar-8'],
      default: 'avatar-1'
    },
    role: { type: String, enum: ['viewer', 'creator'], default: 'viewer' }
  },
  { timestamps: true }
);

module.exports = mongoose.model('User', userSchema);
