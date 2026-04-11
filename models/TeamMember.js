const mongoose = require('mongoose');

const teamMemberSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  department: { type: String, required: true, trim: true },
  image: { type: String, default: '' }
}, { timestamps: true });

module.exports = mongoose.model('TeamMember', teamMemberSchema);
