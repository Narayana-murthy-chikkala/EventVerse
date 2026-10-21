const passport = require("passport");
const GoogleStrategy = require("passport-google-oauth20").Strategy;

const User = require("../models/User");
const { sendEmail, welcomeEmailTemplate, loginAlertTemplate } = require("../utils/sendEmail");

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
          console.log("USER EXISTS:", email);
          
          // Send sign-in security notification email
          try {
            await sendEmail({
              to: user.email,
              subject: "🔐 EventVerse Sign-in Notification",
              html: loginAlertTemplate(user.name, new Date().toLocaleString('en-IN')),
            });
          } catch (e) {
            console.error("Login alert email failed:", e.message);
          }

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

        console.log("NEW USER CREATED:", email);

        // Send welcome email to new Google user
        try {
          await sendEmail({
            to: user.email,
            subject: "🪔 Welcome to EventVerse!",
            html: welcomeEmailTemplate(user.name),
          });
          console.log(`[Google Auth] Welcome email delivered to: ${user.email}`);
        } catch (emailErr) {
          console.error("[Google Auth] Welcome email failed:", emailErr.message);
        }

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