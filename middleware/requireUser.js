module.exports = function requireUser(req, res, next) {
  if (req.user && req.user._id) return next();
  req.flash('error', 'Please sign in to continue.');
  res.redirect('/auth/login?next=' + encodeURIComponent(req.originalUrl || '/'));
};
