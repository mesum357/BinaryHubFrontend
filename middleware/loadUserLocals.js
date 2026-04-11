const Notification = require('../models/Notification');

module.exports = async function loadUserLocals(req, res, next) {
  res.locals.currentUser = req.user || null;
  res.locals.unreadNotificationCount = 0;
  if (req.user && req.user._id) {
    try {
      res.locals.unreadNotificationCount = await Notification.countDocuments({
        user: req.user._id,
        read: false
      });
    } catch (e) {
      /* ignore */
    }
  }
  next();
};
