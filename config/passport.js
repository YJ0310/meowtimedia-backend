const passport = require('passport');
const GoogleStrategy = require('passport-google-oauth20').Strategy;

// In-memory user store (replace with database in production)
const users = new Map();

passport.serializeUser((user, done) => {
  done(null, user.id);
});

passport.deserializeUser((id, done) => {
  const user = users.get(id);
  done(null, user || null);
});

passport.use(
  new GoogleStrategy(
    {
      clientID: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      callbackURL: process.env.GOOGLE_CALLBACK_URL,
    },
    (accessToken, refreshToken, profile, done) => {
      // Check if user already exists
      let user = users.get(profile.id);

      if (!user) {
        // Create new user
        user = {
          id: profile.id,
          googleId: profile.id,
          email: profile.emails?.[0]?.value,
          displayName: profile.displayName,
          firstName: profile.name?.givenName,
          lastName: profile.name?.familyName,
          avatar: profile.photos?.[0]?.value,
          createdAt: new Date(),
        };
        users.set(profile.id, user);
        console.log('New user created:', user.email);
      } else {
        console.log('Existing user logged in:', user.email);
      }

      return done(null, user);
    }
  )
);

module.exports = passport;
