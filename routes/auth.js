const express = require('express');
const passport = require('passport');
const { User } = require('../models');
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
    req.session.destroy((destroyErr) => {
      if (destroyErr) {
        console.error('Session destroy error:', destroyErr);
      }
      // Clear cookie with same settings as session config
      res.clearCookie('connect.sid', {
        path: '/',
        domain: process.env.NODE_ENV === 'production' ? '.smoltako.space' : undefined,
        secure: process.env.NODE_ENV === 'production',
        sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
      });
      res.json({
        success: true,
        message: 'Logged out successfully',
      });
    });
  });
});

// @route   GET /auth/user
// @desc    Get current user with progress data
router.get('/user', async (req, res) => {
  if (req.user) {
    try {
      // Fetch full user data with progress
      const userId = req.user._id || req.user.id;
      const user = await User.findById(userId);
      
      if (!user) {
        return res.status(404).json({
          success: false,
          message: 'User not found',
        });
      }

      // Build countries progress response
      const countriesProgress = (user.countriesProgress || []).map(cp => ({
        countrySlug: cp.countrySlug,
        lastQuizTime: cp.lastQuizTime,
        lastQuizScore: cp.lastQuizScore,
        highestScore: cp.highestScore,
        totalAttempts: cp.totalAttempts,
        stampCollectedAt: cp.stampCollectedAt,
        hasStamp: !!cp.stampCollectedAt,
      }));

      // Count total stamps
      const totalStamps = countriesProgress.filter(cp => cp.hasStamp).length;

      res.json({
        success: true,
        user: {
          id: user._id,
          email: user.email,
          displayName: user.displayName,
          firstName: user.firstName,
          lastName: user.lastName,
          avatar: user.avatar,
          totalStamps,
          countriesProgress,
          feedbackStampCollectedAt: user.feedbackStampCollectedAt,
          createdAt: user.createdAt,
          lastLoginAt: user.lastLoginAt,
        },
      });
    } catch (error) {
      console.error('Error fetching user data:', error);
      res.status(500).json({
        success: false,
        message: 'Error fetching user data',
      });
    }
  } else {
    res.status(401).json({
      success: false,
      message: 'Not authenticated',
    });
  }
});

module.exports = router;
