const express = require('express');
const router = express.Router();
const User = require('../models/User');
const Feedback = require('../models/Feedback');
const Candidate = require('../models/Candidate');
const { isOwner, isAdmin } = require('../middleware/auth');

// --- Owner Routes ---

// Get all users
router.get('/users', isOwner, async (req, res) => {
  try {
    const users = await User.find({}, 'displayName email role adminExpiresAt avatar lastLogin');
    res.json({ success: true, users });
  } catch (error) {
    console.error('Error fetching users:', error);
    res.status(500).json({ success: false, message: 'Error fetching users' });
  }
});

// Update user role
router.put('/users/:id/role', isOwner, async (req, res) => {
  try {
    const { role, expiresIn } = req.body;
    const update = { role };
    
    if (expiresIn) {
      // expiresIn is in days
      const date = new Date();
      date.setDate(date.getDate() + parseInt(expiresIn));
      update.adminExpiresAt = date;
    } else if (role === 'user') {
      update.adminExpiresAt = null;
    } else if (role === 'admin' && !expiresIn) {
       // Permanent admin
       update.adminExpiresAt = null;
    }

    const user = await User.findByIdAndUpdate(req.params.id, update, { new: true });
    res.json({ success: true, user });
  } catch (error) {
    console.error('Error updating user role:', error);
    res.status(500).json({ success: false, message: 'Error updating user role' });
  }
});

// Get candidates (Owner view)
router.get('/candidates', isOwner, async (req, res) => {
  try {
    const candidates = await Candidate.find().populate('suggestedBy', 'displayName email');
    res.json({ success: true, candidates });
  } catch (error) {
    console.error('Error fetching candidates:', error);
    res.status(500).json({ success: false, message: 'Error fetching candidates' });
  }
});


// --- Admin Routes ---

// Get feedback summary
router.get('/feedback/summary', isAdmin, async (req, res) => {
  try {
    const totalFeedback = await Feedback.countDocuments();
    const avgEaseOfUse = await Feedback.aggregate([
      { $group: { _id: null, avg: { $avg: '$easeOfUse' } } }
    ]);
    const avgRecommendation = await Feedback.aggregate([
      { $group: { _id: null, avg: { $avg: '$recommendation' } } }
    ]);
    
    // Issue counts
    const issues = await Feedback.aggregate([
      { $unwind: '$issues' },
      { $group: { _id: '$issues', count: { $sum: 1 } } }
    ]);

    res.json({
      success: true,
      summary: {
        total: totalFeedback,
        avgEaseOfUse: avgEaseOfUse[0]?.avg || 0,
        avgRecommendation: avgRecommendation[0]?.avg || 0,
        issues
      }
    });
  } catch (error) {
    console.error('Error fetching summary:', error);
    res.status(500).json({ success: false, message: 'Error fetching summary' });
  }
});

// Get all feedback
router.get('/feedback', isAdmin, async (req, res) => {
  try {
    const feedback = await Feedback.find()
      .populate('userId', 'displayName email avatar')
      .sort({ createdAt: -1 });
    res.json({ success: true, feedback });
  } catch (error) {
    console.error('Error fetching feedback:', error);
    res.status(500).json({ success: false, message: 'Error fetching feedback' });
  }
});

// Suggest candidate
router.post('/candidates', isAdmin, async (req, res) => {
  try {
    const { candidateName, candidateEmail, reason } = req.body;
    const candidate = new Candidate({
      suggestedBy: req.user._id,
      candidateName,
      candidateEmail,
      reason
    });
    await candidate.save();
    res.json({ success: true, message: 'Candidate suggested successfully' });
  } catch (error) {
    console.error('Error suggesting candidate:', error);
    res.status(500).json({ success: false, message: 'Error suggesting candidate' });
  }
});

module.exports = router;
