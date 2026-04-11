const express = require('express');
const mongoose = require('mongoose');
const Notification = require('../models/Notification');

const router = express.Router();

function requireApiUser(req, res, next) {
  if (req.user && req.user._id) return next();
  res.status(401).json({ error: 'Unauthorized' });
}

router.get('/notifications', requireApiUser, async (req, res) => {
  try {
    const list = await Notification.find({ user: req.user._id })
      .sort({ createdAt: -1 })
      .limit(50)
      .lean();
    const unread = await Notification.countDocuments({ user: req.user._id, read: false });
    res.json({ notifications: list, unreadCount: unread });
  } catch (e) {
    res.status(500).json({ error: 'Failed to load notifications' });
  }
});

router.post('/notifications/:id/read', requireApiUser, async (req, res) => {
  try {
    const { id } = req.params;
    if (!mongoose.isValidObjectId(id)) return res.status(400).json({ error: 'Bad id' });
    const n = await Notification.findOneAndUpdate(
      { _id: id, user: req.user._id },
      { read: true },
      { new: true }
    ).lean();
    if (!n) return res.status(404).json({ error: 'Not found' });
    const unreadCount = await Notification.countDocuments({ user: req.user._id, read: false });
    res.json({ ok: true, unreadCount });
  } catch (e) {
    res.status(500).json({ error: 'Failed' });
  }
});

router.post('/notifications/read-all', requireApiUser, async (req, res) => {
  try {
    await Notification.updateMany({ user: req.user._id, read: false }, { read: true });
    res.json({ ok: true, unreadCount: 0 });
  } catch (e) {
    res.status(500).json({ error: 'Failed' });
  }
});

module.exports = router;
