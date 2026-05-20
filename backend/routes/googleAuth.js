const express = require("express");
const passport = require("passport");
const jwt = require("jsonwebtoken");

const router = express.Router();

// Start Google Login
router.get(
  "/google",
  passport.authenticate("google", {
    scope: ["profile", "email"],
  })
);

// Google Callback
router.get("/google/callback", (req, res, next) => {
  passport.authenticate(
    "google",
    {
      session: false,
    },
    (err, user, info) => {
      try {
        if (err) {
          console.log("PASSPORT ERROR:");
          console.log(err);

          return res.redirect(
            `${process.env.CLIENT_URL}/login`
          );
        }

        if (!user) {
          console.log("NO USER RETURNED");

          return res.redirect(
            `${process.env.CLIENT_URL}/login`
          );
        }

        console.log("GOOGLE USER:");
        console.log(user);

        // Generate JWT
        const token = jwt.sign(
          {
            id: user._id,
            role: user.role,
          },
          process.env.JWT_SECRET,
          {
            expiresIn: process.env.JWT_EXPIRE,
          }
        );

        console.log("TOKEN GENERATED");

        // Redirect Frontend
        return res.redirect(
          `${process.env.CLIENT_URL}/google-success?token=${token}`
        );
      } catch (error) {
        console.log("GOOGLE CALLBACK ERROR:");
        console.log(error);

        return res.redirect(
          `${process.env.CLIENT_URL}/login`
        );
      }
    }
  )(req, res, next);
});

module.exports = router;