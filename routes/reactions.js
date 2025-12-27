const express = require('express');
const router = express.Router();
const Reaction = require('../models/Reaction');
const { isAuthenticated } = require('../middleware/auth');

// Available reaction types
const REACTION_TYPES = ['😍', '😮', '🤯', '😂', '❤️'];

/**
 * @route   GET /reactions/all
 * @desc    Get all reactions for all dashboard funfacts (for initial load)
 * @access  Public
 */
router.get('/all', async (req, res) => {
  try {
    // Get all dashboard reactions with user info
    const reactions = await Reaction.find({ funfactId: { $regex: /^dashboard-/ } })
      .populate('userId', 'displayName avatar')
      .sort({ createdAt: -1 });

    // Group by funfactId, then by reaction type
    const grouped = {};
    reactions.forEach(r => {
      if (!grouped[r.funfactId]) {
        grouped[r.funfactId] = {};
      }
      const type = r.reactionType;
      if (!grouped[r.funfactId][type]) {
        grouped[r.funfactId][type] = {
          count: 0,
          users: [],
        };
      }
      grouped[r.funfactId][type].count++;
      grouped[r.funfactId][type].users.push({
        id: r.userId._id,
        displayName: r.userId.displayName,
        avatar: r.userId.avatar,
        reactedAt: r.createdAt,
      });
    });

    // Get current user's reactions if authenticated
    const userReactions = {};
    if (req.user) {
      reactions
        .filter(r => r.userId._id.toString() === req.user._id.toString())
        .forEach(r => {
          userReactions[r.funfactId] = r.reactionType;
        });
    }

    // Get last update timestamp
    const lastUpdate = reactions.length > 0 
      ? reactions[0].createdAt.toISOString()
      : new Date().toISOString();

    res.json({
      success: true,
      reactions: grouped,
      userReactions,
      lastUpdate,
      totalReactions: reactions.length,
    });
  } catch (error) {
    console.error('Error fetching all reactions:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching all reactions',
    });
  }
});

/**
 * @route   GET /reactions/:funfactId
 * @desc    Get all reactions for a specific funfact with aggregated counts
 * @access  Public (anyone can see reactions)
 */
router.get('/:funfactId', async (req, res) => {
  try {
    const { funfactId } = req.params;

    // Get all reactions for this funfact with user info
    const reactions = await Reaction.find({ funfactId })
      .populate('userId', 'displayName avatar')
      .sort({ createdAt: -1 });

    // Aggregate reactions by type
    const aggregated = REACTION_TYPES.reduce((acc, type) => {
      const typeReactions = reactions.filter(r => r.reactionType === type);
      if (typeReactions.length > 0) {
        acc[type] = {
          count: typeReactions.length,
          users: typeReactions.map(r => ({
            id: r.userId._id,
            displayName: r.userId.displayName,
            avatar: r.userId.avatar,
            reactedAt: r.createdAt,
          })),
        };
      }
      return acc;
    }, {});

    // Get current user's reaction if authenticated
    let userReaction = null;
    if (req.user) {
      const userReactionDoc = reactions.find(
        r => r.userId._id.toString() === req.user._id.toString()
      );
      if (userReactionDoc) {
        userReaction = userReactionDoc.reactionType;
      }
    }

    res.json({
      success: true,
      funfactId,
      reactions: aggregated,
      userReaction,
      totalReactions: reactions.length,
    });
  } catch (error) {
    console.error('Error fetching reactions:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching reactions',
    });
  }
});

/**
 * @route   GET /reactions/country/:countrySlug
 * @desc    Get all reactions for all funfacts in a country
 * @access  Public
 */
router.get('/country/:countrySlug', async (req, res) => {
  try {
    const { countrySlug } = req.params;

    // Get all reactions for this country with user info
    const reactions = await Reaction.find({ countrySlug })
      .populate('userId', 'displayName avatar')
      .sort({ createdAt: -1 });

    // Group by funfactId
    const grouped = {};
    reactions.forEach(r => {
      if (!grouped[r.funfactId]) {
        grouped[r.funfactId] = {};
      }
      const type = r.reactionType;
      if (!grouped[r.funfactId][type]) {
        grouped[r.funfactId][type] = {
          count: 0,
          users: [],
        };
      }
      grouped[r.funfactId][type].count++;
      grouped[r.funfactId][type].users.push({
        id: r.userId._id,
        displayName: r.userId.displayName,
        avatar: r.userId.avatar,
        reactedAt: r.createdAt,
      });
    });

    // Get current user's reactions if authenticated
    const userReactions = {};
    if (req.user) {
      reactions
        .filter(r => r.userId._id.toString() === req.user._id.toString())
        .forEach(r => {
          userReactions[r.funfactId] = r.reactionType;
        });
    }

    res.json({
      success: true,
      countrySlug,
      reactions: grouped,
      userReactions,
    });
  } catch (error) {
    console.error('Error fetching country reactions:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching country reactions',
    });
  }
});

/**
 * @route   POST /reactions/:funfactId
 * @desc    Add or update a reaction to a funfact
 * @access  Private (must be authenticated)
 */
router.post('/:funfactId', isAuthenticated, async (req, res) => {
  try {
    const { funfactId } = req.params;
    const { reactionType, countrySlug } = req.body;
    const userId = req.user._id;

    // Validate reaction type
    if (!REACTION_TYPES.includes(reactionType)) {
      return res.status(400).json({
        success: false,
        message: `Invalid reaction type. Must be one of: ${REACTION_TYPES.join(', ')}`,
      });
    }

    // Validate countrySlug
    if (!countrySlug) {
      return res.status(400).json({
        success: false,
        message: 'countrySlug is required',
      });
    }

    // Check if user already has a reaction for this funfact
    const existingReaction = await Reaction.findOne({ funfactId, userId });

    if (existingReaction) {
      // Update existing reaction
      if (existingReaction.reactionType === reactionType) {
        // Same reaction = remove it (toggle off)
        await Reaction.deleteOne({ _id: existingReaction._id });
        return res.json({
          success: true,
          action: 'removed',
          message: 'Reaction removed',
        });
      } else {
        // Different reaction = update it
        existingReaction.reactionType = reactionType;
        existingReaction.createdAt = new Date();
        await existingReaction.save();
        return res.json({
          success: true,
          action: 'updated',
          message: 'Reaction updated',
          reaction: {
            funfactId,
            reactionType,
            countrySlug,
          },
        });
      }
    }

    // Create new reaction
    const reaction = new Reaction({
      countrySlug,
      funfactId,
      userId,
      reactionType,
    });

    await reaction.save();

    res.status(201).json({
      success: true,
      action: 'added',
      message: 'Reaction added',
      reaction: {
        funfactId,
        reactionType,
        countrySlug,
      },
    });
  } catch (error) {
    console.error('Error adding reaction:', error);
    res.status(500).json({
      success: false,
      message: 'Error adding reaction',
    });
  }
});

/**
 * @route   DELETE /reactions/:funfactId
 * @desc    Remove a reaction from a funfact
 * @access  Private (must be authenticated)
 */
router.delete('/:funfactId', isAuthenticated, async (req, res) => {
  try {
    const { funfactId } = req.params;
    const userId = req.user._id;

    const result = await Reaction.deleteOne({ funfactId, userId });

    if (result.deletedCount === 0) {
      return res.status(404).json({
        success: false,
        message: 'Reaction not found',
      });
    }

    res.json({
      success: true,
      message: 'Reaction removed',
    });
  } catch (error) {
    console.error('Error removing reaction:', error);
    res.status(500).json({
      success: false,
      message: 'Error removing reaction',
    });
  }
});

module.exports = router;
