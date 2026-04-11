const mongoose = require('mongoose');

const visitSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  description: { type: String, default: '' },
  images: [{ type: String }]
}, { timestamps: true });

module.exports = mongoose.model('Visit', visitSchema);
