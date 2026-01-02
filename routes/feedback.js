const express = require('express');
const router = express.Router();
const Feedback = require('../models/Feedback');
const User = require('../models/User');
const { isAuthenticated } = require('../middleware/auth');

// Helper: only allow admin / owner
function requireAdminOrOwner(req, res, next) {
  if (!req.user || (req.user.role !== 'admin' && req.user.role !== 'owner')) {
    return res.status(403).json({
      success: false,
      message: 'Admin access required',
    });
  }
  next();
}

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
router.get('/all', isAuthenticated, requireAdminOrOwner, async (req, res) => {
  try {
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

// GET /feedback/summary - Aggregated summary for admin console
router.get('/summary', isAuthenticated, requireAdminOrOwner, async (req, res) => {
  try {
    const totalPromise = Feedback.countDocuments();

    const avgPromise = Feedback.aggregate([
      {
        $group: {
          _id: null,
          avgEaseOfUse: { $avg: '$easeOfUse' },
          avgRecommendation: { $avg: '$recommendation' },
        },
      },
    ]);

    const firstImpressionPromise = Feedback.aggregate([
      { $group: { _id: '$firstImpression', count: { $sum: 1 } } },
    ]);

    const issuesPromise = Feedback.aggregate([
      { $unwind: '$issues' },
      { $group: { _id: '$issues', count: { $sum: 1 } } },
    ]);

    const referralPromise = Feedback.aggregate([
      { $group: { _id: '$referral', count: { $sum: 1 } } },
    ]);

    const easeOfUsePromise = Feedback.aggregate([
      { $group: { _id: '$easeOfUse', count: { $sum: 1 } } },
      { $sort: { _id: 1 } },
    ]);

    const recommendationPromise = Feedback.aggregate([
      { $group: { _id: '$recommendation', count: { $sum: 1 } } },
      { $sort: { _id: 1 } },
    ]);

    const [
      total,
      avgResult,
      firstImpressionAgg,
      issuesAgg,
      referralAgg,
      easeOfUseAgg,
      recommendationAgg,
    ] = await Promise.all([
      totalPromise,
      avgPromise,
      firstImpressionPromise,
      issuesPromise,
      referralPromise,
      easeOfUsePromise,
      recommendationPromise,
    ]);

    const avgData = avgResult[0] || { avgEaseOfUse: 0, avgRecommendation: 0 };

    res.json({
      success: true,
      summary: {
        total,
        avgEaseOfUse: avgData.avgEaseOfUse || 0,
        avgRecommendation: avgData.avgRecommendation || 0,
        firstImpression: firstImpressionAgg,
        issues: issuesAgg,
        referral: referralAgg,
        easeOfUse: easeOfUseAgg,
        recommendation: recommendationAgg,
      },
    });
  } catch (error) {
    console.error('Error building feedback summary:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to build feedback summary',
    });
  }
});

module.exports = router;
