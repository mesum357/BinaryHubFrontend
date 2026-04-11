const mongoose = require('mongoose');

const internApplicationSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  email: { type: String, required: true, trim: true },
  phone: { type: String, default: '' },
  cnic: { type: String, default: '' },
  department: { type: String, default: '' },
  education: { type: String, default: '' },
  internship: { type: mongoose.Schema.Types.ObjectId, ref: 'Internship' }
}, { timestamps: true });

module.exports = mongoose.model('InternApplication', internApplicationSchema);
