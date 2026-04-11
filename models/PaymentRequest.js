const mongoose = require('mongoose');

const paymentRequestSchema = new mongoose.Schema({
  studentName: { type: String, required: true, trim: true },
  email: { type: String, default: '' },
  phone: { type: String, default: '' },
  department: { type: String, default: '' },
  transactionId: { type: String, required: true, trim: true },
  paymentMethod: { type: String, default: 'bank' },
  screenshot: { type: String, default: '' },
  amount: { type: Number, default: 0 },
  status: { type: String, enum: ['pending', 'approved', 'rejected'], default: 'pending' },
  course: { type: mongoose.Schema.Types.ObjectId, ref: 'Course' },
  courseName: { type: String, default: '' },
  education: { type: String, default: '' },
  city: { type: String, default: '' }
}, { timestamps: true });

module.exports = mongoose.model('PaymentRequest', paymentRequestSchema);
