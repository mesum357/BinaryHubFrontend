const mongoose = require('mongoose');

const enrollmentSchema = new mongoose.Schema({
  studentName: { type: String, required: true, trim: true },
  email: { type: String, required: true, trim: true },
  phone: { type: String, default: '' },
  education: { type: String, default: '' },
  city: { type: String, default: '' },
  course: { type: mongoose.Schema.Types.ObjectId, ref: 'Course' },
  courseName: { type: String, default: '' }
}, { timestamps: true });

module.exports = mongoose.model('Enrollment', enrollmentSchema);
