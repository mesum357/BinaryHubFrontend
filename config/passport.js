const passport = require('passport');
const LocalStrategy = require('passport-local').Strategy;
const bcrypt = require('bcrypt');
const User = require('../models/User');

passport.serializeUser((user, done) => {
  done(null, user._id.toString());
});

passport.deserializeUser(async (id, done) => {
  try {
    const u = await User.findById(id).select('name email').lean();
    done(null, u || false);
  } catch (e) {
    done(e);
  }
});

passport.use(
  new LocalStrategy(
    { usernameField: 'email', passwordField: 'password' },
    async (email, password, done) => {
      try {
        const normalized = String(email || '')
          .trim()
          .toLowerCase();
        const user = await User.findOne({ email: normalized });
        if (!user) {
          return done(null, false, { message: 'Invalid email or password.' });
        }
        const ok = await bcrypt.compare(password, user.passwordHash);
        if (!ok) {
          return done(null, false, { message: 'Invalid email or password.' });
        }
        if (!user.emailVerified) {
          return done(null, false, {
            message: 'Please verify your email before signing in. Check your inbox for the link.'
          });
        }
        return done(null, { _id: user._id, name: user.name, email: user.email });
      } catch (err) {
        return done(err);
      }
    }
  )
);

module.exports = passport;
