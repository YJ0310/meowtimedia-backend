const express = require('express');
const router = express.Router();
const Feedback = require('../models/Feedback');
const User = require('../models/User');
const { isAuthenticated } = require('../middleware/auth');

// GET /feedback/status - Check if user has submitted feedback
router.get('/status', isAuthenticated, async (req, res) => {
  try {
    const feedback = await Feedback.findOne({ userId: req.user._id });
    res.json({
      success: true,
      hasSubmitted: !!feedback,
      submittedAt: feedback?.createdAt || null,
    });
  } catch (error) {
    console.error('Error checking feedback status:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to check feedback status',
    });
  }
});

// POST /feedback - Submit feedback
router.post('/', isAuthenticated, async (req, res) => {
  try {
    const {
      firstImpression,
      firstImpressionOther,
      easeOfUse,
      issues,
      issuesOther,
      recommendation,
      additionalFeedback,
      referral,
    } = req.body;

    // Check if user already submitted feedback
    const existingFeedback = await Feedback.findOne({ userId: req.user._id });
    if (existingFeedback) {
      return res.status(400).json({
        success: false,
        message: 'You have already submitted feedback',
      });
    }

    // Validate required fields
    if (!firstImpression || !easeOfUse || !recommendation || !referral) {
      return res.status(400).json({
        success: false,
        message: 'Please answer all required questions',
      });
    }

    // Create feedback
    const feedback = new Feedback({
      userId: req.user._id,
      firstImpression,
      firstImpressionOther: firstImpression === 'other' ? firstImpressionOther : undefined,
      easeOfUse,
      issues: issues || ['none'],
      issuesOther: issues?.includes('other') ? issuesOther : undefined,
      recommendation,
      additionalFeedback,
      referral,
      userAgent: req.headers['user-agent'],
    });

    await feedback.save();

    // Award feedback stamp to user
    const user = await User.findById(req.user._id);
    if (user && !user.feedbackStampCollectedAt) {
      user.feedbackStampCollectedAt = new Date();
      await user.save();
    }

    res.json({
      success: true,
      message: 'Thank you for your feedback!',
      stampAwarded: true,
    });
  } catch (error) {
    console.error('Error submitting feedback:', error);
    
    // Handle duplicate key error
    if (error.code === 11000) {
      return res.status(400).json({
        success: false,
        message: 'You have already submitted feedback',
      });
    }

    res.status(500).json({
      success: false,
      message: 'Failed to submit feedback',
    });
  }
});

// GET /feedback/all - Admin endpoint to get all feedback (optional)
router.get('/all', isAuthenticated, async (req, res) => {
  try {
    // Only allow admin users (you can customize this check)
    const feedbacks = await Feedback.find()
      .populate('userId', 'displayName email avatar')
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      count: feedbacks.length,
      feedbacks,
    });
  } catch (error) {
    console.error('Error fetching all feedback:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch feedback',
    });
  }
});

module.exports = router;
