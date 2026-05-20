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
router.get(
  "/google/callback",
  passport.authenticate("google", {
    failureRedirect: "/login",
    session: false,
  }),
  async (req, res) => {
    try {
      // Generate JWT Token
      const token = jwt.sign(
        {
          id: req.user._id,
          role: req.user.role,
        },
        process.env.JWT_SECRET,
        {
          expiresIn: process.env.JWT_EXPIRE,
        }
      );

      // Redirect to Frontend with Token
      res.redirect(
        `${process.env.CLIENT_URL}/google-success?token=${token}`
      );
    } catch (error) {
      console.log(error);

      res.redirect(
        `${process.env.CLIENT_URL}/login`
      );
    }
  }
);

module.exports = router;