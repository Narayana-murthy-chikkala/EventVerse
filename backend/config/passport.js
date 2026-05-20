const passport = require("passport");
const GoogleStrategy = require("passport-google-oauth20").Strategy;

const User = require("../models/User");

passport.use(
  new GoogleStrategy(
    {
      clientID: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      callbackURL: process.env.GOOGLE_CALLBACK_URL,
    },
    async (accessToken, refreshToken, profile, done) => {
      try {
        console.log("GOOGLE LOGIN START");

        const email = profile.emails[0].value;

        let user = await User.findOne({ email });

        // Existing User
        if (user) {
          console.log("USER EXISTS");
          return done(null, user);
        }

        // Create New User
        user = new User({
          name: profile.displayName,
          email: email,
          googleId: profile.id,
          avatar: profile.photos?.[0]?.value || "",
          password: Math.random().toString(36).slice(-8),
        });

        await user.save();

        console.log("NEW USER CREATED");

        return done(null, user);
      } catch (error) {
        console.log("GOOGLE AUTH ERROR:");
        console.log(error);

        return done(error, null);
      }
    }
  )
);
//console.log(process.env.GOOGLE_CLIENT_SECRET);