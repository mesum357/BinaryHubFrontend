const express = require('express');
const crypto = require('crypto');
const bcrypt = require('bcrypt');
const passport = require('../config/passport');
const User = require('../models/User');
const Notification = require('../models/Notification');
const { sendVerificationEmail, sendPasswordResetEmail } = require('../lib/mail');

const router = express.Router();

const BCRYPT_ROUNDS = 10;
const VERIFY_HOURS = 48;
const RESET_HOURS = 1;

function randomToken() {
  return crypto.randomBytes(32).toString('hex');
}

router.get('/signup', (req, res) => {
  if (req.user) return res.redirect('/');
  res.render('auth-signup', { title: 'Create account' });
});

router.post('/signup', async (req, res) => {
  try {
    const name = String(req.body.name || '').trim();
    const email = String(req.body.email || '')
      .trim()
      .toLowerCase();
    const password = String(req.body.password || '');
    const password2 = String(req.body.passwordConfirm || '');

    if (name.length < 2) {
      req.flash('error', 'Please enter your name.');
      return res.redirect('/auth/signup');
    }
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      req.flash('error', 'Please enter a valid email address.');
      return res.redirect('/auth/signup');
    }
    if (password.length < 8) {
      req.flash('error', 'Password must be at least 8 characters.');
      return res.redirect('/auth/signup');
    }
    if (password !== password2) {
      req.flash('error', 'Passwords do not match.');
      return res.redirect('/auth/signup');
    }

    const existing = await User.findOne({ email });
    if (existing) {
      req.flash('error', 'An account with this email already exists.');
      return res.redirect('/auth/signup');
    }

    const token = randomToken();
    const passwordHash = await bcrypt.hash(password, BCRYPT_ROUNDS);
    await User.create({
      name,
      email,
      passwordHash,
      emailVerified: false,
      emailVerifyToken: token,
      emailVerifyExpires: new Date(Date.now() + VERIFY_HOURS * 60 * 60 * 1000)
    });

    await sendVerificationEmail(email, name, token).catch((e) => console.error(e));

    req.flash(
      'success',
      'Account created. Check your email for a verification link before signing in.'
    );
    res.redirect('/auth/verify-pending');
  } catch (e) {
    console.error(e);
    if (e.code === 11000) {
      req.flash('error', 'An account with this email already exists.');
    } else {
      req.flash('error', 'Could not create account. Please try again.');
    }
    res.redirect('/auth/signup');
  }
});

router.get('/verify-pending', (req, res) => {
  res.render('auth-verify-pending', { title: 'Check your email' });
});

router.get('/verify-email', async (req, res) => {
  const token = String(req.query.token || '').trim();
  if (!token) {
    req.flash('error', 'Invalid verification link.');
    return res.redirect('/auth/login');
  }
  try {
    const user = await User.findOne({
      emailVerifyToken: token,
      emailVerifyExpires: { $gt: new Date() }
    });
    if (!user) {
      req.flash('error', 'This verification link is invalid or has expired.');
      return res.redirect('/auth/signup');
    }
    user.emailVerified = true;
    user.emailVerifyToken = '';
    user.emailVerifyExpires = undefined;
    await user.save();

    await Notification.create({
      user: user._id,
      type: 'welcome',
      title: 'Welcome to Binary Hub',
      body: 'Thanks for joining! Browse courses, enroll, and track your payments from your account.',
      read: false
    });

    req.flash('success', 'Email verified. You can sign in now.');
    res.redirect('/auth/login');
  } catch (e) {
    console.error(e);
    req.flash('error', 'Verification failed. Please try again.');
    res.redirect('/auth/login');
  }
});

router.get('/login', (req, res) => {
  if (req.user) return res.redirect('/');
  res.render('auth-login', {
    title: 'Sign in',
    nextUrl: String(req.query.next || '').startsWith('/') ? req.query.next : ''
  });
});

router.post('/login', (req, res, next) => {
  const nextUrl = String(req.body.next || '').startsWith('/') ? req.body.next : '';
  passport.authenticate('local', (err, user, info) => {
    if (err) return next(err);
    if (!user) {
      req.flash('error', (info && info.message) || 'Sign in failed.');
      const q = nextUrl ? `?next=${encodeURIComponent(nextUrl)}` : '';
      return res.redirect('/auth/login' + q);
    }
    req.logIn(user, (e) => {
      if (e) return next(e);
      return res.redirect(nextUrl || '/');
    });
  })(req, res, next);
});

router.post('/logout', (req, res, next) => {
  req.logout((err) => {
    if (err) return next(err);
    req.flash('success', 'You have been signed out.');
    res.redirect('/');
  });
});

router.get('/forgot-password', (req, res) => {
  if (req.user) return res.redirect('/');
  res.render('auth-forgot', { title: 'Forgot password' });
});

router.post('/forgot-password', async (req, res) => {
  const email = String(req.body.email || '')
    .trim()
    .toLowerCase();
  try {
    const user = await User.findOne({ email });
    if (user) {
      const token = randomToken();
      user.passwordResetToken = token;
      user.passwordResetExpires = new Date(Date.now() + RESET_HOURS * 60 * 60 * 1000);
      await user.save();
      await sendPasswordResetEmail(email, user.name, token).catch((e) => console.error(e));
    }
    req.flash(
      'success',
      'If an account exists for that email, we sent password reset instructions.'
    );
    res.redirect('/auth/login');
  } catch (e) {
    console.error(e);
    req.flash('error', 'Something went wrong. Please try again.');
    res.redirect('/auth/forgot-password');
  }
});

router.get('/reset-password', async (req, res) => {
  const token = String(req.query.token || '').trim();
  if (!token) {
    req.flash('error', 'Invalid reset link.');
    return res.redirect('/auth/forgot-password');
  }
  const user = await User.findOne({
    passwordResetToken: token,
    passwordResetExpires: { $gt: new Date() }
  }).lean();
  if (!user) {
    req.flash('error', 'This reset link is invalid or has expired.');
    return res.redirect('/auth/forgot-password');
  }
  res.render('auth-reset', { title: 'Set new password', resetToken: token });
});

router.post('/reset-password', async (req, res) => {
  const token = String(req.body.token || '').trim();
  const password = String(req.body.password || '');
  const password2 = String(req.body.passwordConfirm || '');
  try {
    if (password.length < 8) {
      req.flash('error', 'Password must be at least 8 characters.');
      return res.redirect('/auth/reset-password?token=' + encodeURIComponent(token));
    }
    if (password !== password2) {
      req.flash('error', 'Passwords do not match.');
      return res.redirect('/auth/reset-password?token=' + encodeURIComponent(token));
    }
    const user = await User.findOne({
      passwordResetToken: token,
      passwordResetExpires: { $gt: new Date() }
    });
    if (!user) {
      req.flash('error', 'This reset link is invalid or has expired.');
      return res.redirect('/auth/forgot-password');
    }
    user.passwordHash = await bcrypt.hash(password, BCRYPT_ROUNDS);
    user.passwordResetToken = '';
    user.passwordResetExpires = undefined;
    await user.save();
    req.flash('success', 'Password updated. You can sign in now.');
    res.redirect('/auth/login');
  } catch (e) {
    console.error(e);
    req.flash('error', 'Could not reset password.');
    res.redirect('/auth/forgot-password');
  }
});

module.exports = router;
