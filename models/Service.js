const mongoose = require('mongoose');

const outlineModuleSchema = new mongoose.Schema({
  title: { type: String, required: true },
  items: [{ type: String }]
}, { _id: false });

const serviceSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  slug: { type: String, required: true, unique: true, lowercase: true, trim: true },
  shortDescription: { type: String, default: '' },
  image: { type: String, default: '' },
  introduction: { type: String, default: '' },
  outline: [outlineModuleSchema]
}, { timestamps: true });

module.exports = mongoose.model('Service', serviceSchema);
