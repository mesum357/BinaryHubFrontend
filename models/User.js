const mongoose = require('mongoose');

const userSchema = new mongoose.Schema(
  {
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    passwordHash: { type: String, required: true },
    name: { type: String, required: true, trim: true },
    emailVerified: { type: Boolean, default: false },
    emailVerifyToken: { type: String, default: '' },
    emailVerifyExpires: { type: Date },
    passwordResetToken: { type: String, default: '' },
    passwordResetExpires: { type: Date }
  },
  { timestamps: true }
);

module.exports = mongoose.model('User', userSchema);
