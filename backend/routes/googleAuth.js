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
    failureRedirect: `${process.env.CLIENT_URL || 'http://localhost:5173'}/login`,
    session: false,
  }),
  async (req, res) => {
    const jwt = require("jsonwebtoken");

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

    const redirectClientUrl = process.env.CLIENT_URL || 'http://localhost:5173';
    res.redirect(
      `${redirectClientUrl}/google-success?token=${token}`
    );
  }
);

module.exports = router;