const express = require('express');
const bcrypt = require('bcrypt');
const User = require('../models/User');
const PaymentRequest = require('../models/PaymentRequest');
const requireUser = require('../middleware/requireUser');

const router = express.Router();
router.use(requireUser);

router.get('/settings', async (req, res) => {
  const user = await User.findById(req.user._id).select('name email').lean();
  res.render('account-settings', { title: 'Account settings', accountUser: user });
});

router.post('/settings', async (req, res) => {
  try {
    const name = String(req.body.name || '').trim();
    const currentPassword = String(req.body.currentPassword || '');
    const newPassword = String(req.body.newPassword || '');
    const newPasswordConfirm = String(req.body.newPasswordConfirm || '');

    const user = await User.findById(req.user._id);
    if (!user) {
      req.flash('error', 'Account not found.');
      return res.redirect('/account/settings');
    }

    if (name.length >= 2) {
      user.name = name;
    }

    const wantsPasswordChange = newPassword.length > 0 || newPasswordConfirm.length > 0;
    if (wantsPasswordChange) {
      if (!currentPassword) {
        req.flash('error', 'Enter your current password to set a new one.');
        return res.redirect('/account/settings');
      }
      const ok = await bcrypt.compare(currentPassword, user.passwordHash);
      if (!ok) {
        req.flash('error', 'Current password is incorrect.');
        return res.redirect('/account/settings');
      }
      if (newPassword.length < 8) {
        req.flash('error', 'New password must be at least 8 characters.');
        return res.redirect('/account/settings');
      }
      if (newPassword !== newPasswordConfirm) {
        req.flash('error', 'New passwords do not match.');
        return res.redirect('/account/settings');
      }
      user.passwordHash = await bcrypt.hash(newPassword, 10);
    }

    await user.save();
    req.flash('success', 'Settings saved.');
    res.redirect('/account/settings');
  } catch (e) {
    console.error(e);
    req.flash('error', 'Could not save settings.');
    res.redirect('/account/settings');
  }
});

router.get('/purchases', async (req, res) => {
  const uid = req.user._id;
  const payments = await PaymentRequest.find({ user: uid })
    .sort({ updatedAt: -1 })
    .populate('course', 'name slug')
    .lean();
  res.render('account-purchases', { title: 'Recent purchases', payments: payments || [] });
});

module.exports = router;
