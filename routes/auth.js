const express = require('express');
const passport = require('passport');
const router = express.Router();

// @route   GET /auth/google
// @desc    Initiate Google OAuth login
router.get(
  '/google',
  passport.authenticate('google', {
    scope: ['profile', 'email'],
  })
);

// @route   GET /auth/google/callback
// @desc    Google OAuth callback
router.get(
  '/google/callback',
  passport.authenticate('google', {
    failureRedirect: process.env.CLIENT_URL || 'http://localhost:3000',
  }),
  (req, res) => {
    // Successful authentication - redirect to frontend dashboard
    const clientUrl = process.env.CLIENT_URL || 'http://localhost:3000';
    res.redirect(`${clientUrl}/dashboard`);
  }
);

// @route   GET /auth/login-success
// @desc    Login success response
router.get('/login-success', (req, res) => {
  if (req.user) {
    res.json({
      success: true,
      message: 'Login successful',
      user: {
        id: req.user.id,
        email: req.user.email,
        displayName: req.user.displayName,
        avatar: req.user.avatar,
      },
    });
  } else {
    res.status(401).json({
      success: false,
      message: 'Not authenticated',
    });
  }
});

// @route   GET /auth/login-failed
// @desc    Login failure response
router.get('/login-failed', (req, res) => {
  res.status(401).json({
    success: false,
    message: 'Login failed',
  });
});

// @route   GET /auth/logout
// @desc    Logout user
router.get('/logout', (req, res) => {
  req.logout((err) => {
    if (err) {
      return res.status(500).json({
        success: false,
        message: 'Error logging out',
      });
    }
    req.session.destroy();
    res.json({
      success: true,
      message: 'Logged out successfully',
    });
  });
});

// @route   GET /auth/user
// @desc    Get current user
router.get('/user', (req, res) => {
  if (req.user) {
    res.json({
      success: true,
      user: {
        id: req.user._id || req.user.id,
        email: req.user.email,
        displayName: req.user.displayName,
        firstName: req.user.firstName,
        lastName: req.user.lastName,
        avatar: req.user.avatar,
      },
    });
  } else {
    res.status(401).json({
      success: false,
      message: 'Not authenticated',
    });
  }
});

module.exports = router;
