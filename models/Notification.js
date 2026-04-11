const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    title: { type: String, required: true, trim: true },
    body: { type: String, default: '', trim: true },
    type: {
      type: String,
      enum: ['welcome', 'payment_approved', 'payment_rejected', 'system'],
      default: 'system'
    },
    read: { type: Boolean, default: false },
    meta: { type: mongoose.Schema.Types.Mixed, default: {} }
  },
  { timestamps: true }
);

module.exports = mongoose.model('Notification', notificationSchema);
