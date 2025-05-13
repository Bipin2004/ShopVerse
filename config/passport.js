const passport = require('passport');
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const User = require('../models/users');

// Configure Passport
module.exports = function(passport) {
  // Serialize user
  passport.serializeUser((user, done) => {
    done(null, user.id);
  });

  // Deserialize user
  passport.deserializeUser(async (id, done) => {
    try {
      const user = await User.findById(id);
      done(null, user);
    } catch (err) {
      done(err, null);
    }
  });

  // Google OAuth Strategy
  passport.use(
    new GoogleStrategy(
      {
        clientID: process.env.GOOGLE_CLIENT_ID,
        clientSecret: process.env.GOOGLE_CLIENT_SECRET,
        callbackURL: 'http://localhost:3000/users/auth/google/callback',
        proxy: true
      },
      async (accessToken, refreshToken, profile, done) => {
        try {
          // Check if user already exists
          let user = await User.findOne({ email: profile.emails[0].value });
          
          if (user) {
            // User exists, return user
            return done(null, user);
          } else {
            // Create new user
            const newUser = new User({
              fullname: profile.displayName,
              email: profile.emails[0].value,
              // Generate random password for OAuth users
              password: Math.random().toString(36).slice(-8),
              authType: 'google',
              googleId: profile.id
            });
            
            // Save user
            await newUser.save();
            return done(null, newUser);
          }
        } catch (err) {
          console.error('Error in Google auth:', err);
          return done(err, null);
        }
      }
    )  );
};
