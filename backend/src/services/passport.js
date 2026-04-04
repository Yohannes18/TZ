import '../config/env.js';
import passport from 'passport';
import { Strategy as GoogleStrategy } from 'passport-google-oauth20';
import { getDb } from '../db.js';
import { UserModel } from '../models/user.model.js';

const googleCallbackURL = process.env.GOOGLE_CALLBACK_URL || '/api/auth/google/callback';
const googleAuthEnabled = Boolean(
  process.env.GOOGLE_CLIENT_ID &&
  process.env.GOOGLE_CLIENT_SECRET &&
  process.env.GOOGLE_CALLBACK_URL,
);

passport.serializeUser((user, done) => {
  done(null, user.id);
});

passport.deserializeUser(async (id, done) => {
  try {
    const db = await getDb();
    const result = await db.query('SELECT * FROM users WHERE id = $1', [id]);
    done(null, result.rows[0] || null);
  } catch (error) {
    done(error, null);
  }
});

if (googleAuthEnabled) {
  passport.use(new GoogleStrategy({
    clientID: process.env.GOOGLE_CLIENT_ID,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    callbackURL: googleCallbackURL,
    scope: ['profile', 'email']
  },
    async (accessToken, refreshToken, profile, done) => {
      const email = profile.emails[0].value;
      try {
        let user = await UserModel.findByEmail(email);
        if (!user) {
          user = await UserModel.create({ email, googleId: profile.id, name: profile.displayName });
        }
        return done(null, user);
      } catch (error) {
        return done(error, null);
      }
    }
  ));
}

export { googleAuthEnabled };
