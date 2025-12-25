const express = require('express');
const router = express.Router();
const { Content, Quiz, User } = require('../models');
const { isAuthenticated } = require('../middleware/auth');

// Stamp unlock threshold - minimum score percentage to earn a stamp
const STAMP_THRESHOLD = 0.7; // 70%

/**
 * @route   GET /country/:slug
 * @desc    Get country content (festivals, food, funfacts)
 * @access  Public (but frontend requires auth)
 */
router.get('/:slug', async (req, res) => {
  try {
    const { slug } = req.params;
    
    // Normalize slug to match database format (e.g., "south-korea" -> "south_korea")
    const countryName = slug.replace(/-/g, '_');
    
    // Fetch all content types for this country
    const content = await Content.find({ country: countryName });
    
    if (!content || content.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Country content not found',
      });
    }

    // Organize content by type
    const festivals = content.find(c => c.type === 'festival')?.contents || [];
    const foods = content.find(c => c.type === 'food')?.contents || [];
    const funfacts = content.find(c => c.type === 'funfact')?.contents || [];

    res.json({
      success: true,
      country: slug,
      data: {
        festivals: festivals.map((f, index) => ({
          id: `${slug}-festival-${index}`,
          countrySlug: slug,
          type: 'festival',
          title: f.title,
          date: f.date,
          content: f.content,
          image: f.picture_url || '',
        })),
        foods: foods.map((f, index) => ({
          id: `${slug}-food-${index}`,
          countrySlug: slug,
          type: 'food',
          title: f.title,
          content: f.content,
          image: f.picture_url || '',
        })),
        funfacts: funfacts.map((f, index) => ({
          id: `${slug}-funfact-${index}`,
          countrySlug: slug,
          type: 'funfact',
          title: f.title,
          content: f.content,
          image: f.picture_url || '',
        })),
      },
    });
  } catch (error) {
    console.error('Error fetching country content:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching country content',
    });
  }
});

/**
 * @route   GET /country/:slug/quiz
 * @desc    Get quiz questions for a country
 * @access  Public (but frontend requires auth)
 */
router.get('/:slug/quiz', async (req, res) => {
  try {
    const { slug } = req.params;
    
    // Normalize slug for database query
    const countryName = slug.replace(/-/g, '_');
    
    // Find quizzes for this country
    const quizzes = await Quiz.find({ 
      country: { $regex: new RegExp(`^${countryName}$`, 'i') }
    });

    if (!quizzes || quizzes.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Quiz not found for this country',
      });
    }

    // Combine all quizzes for this country
    const allQuestions = quizzes.flatMap(quiz => 
      quiz.questions.map(q => ({
        id: q.id,
        question: q.text,
        options: [q.options.A, q.options.B, q.options.C, q.options.D],
        correctAnswer: ['A', 'B', 'C', 'D'].indexOf(q.correctAnswer),
      }))
    );

    res.json({
      success: true,
      country: slug,
      totalQuestions: allQuestions.length,
      questions: allQuestions,
    });
  } catch (error) {
    console.error('Error fetching quiz:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching quiz',
    });
  }
});

/**
 * @route   POST /country/:slug/update
 * @desc    Update user quiz results and check stamp conditions
 * @access  Private (requires authentication)
 */
router.post('/:slug/update', isAuthenticated, async (req, res) => {
  try {
    const { slug } = req.params;
    const { score, totalQuestions } = req.body;
    const userId = req.user._id || req.user.id;

    if (typeof score !== 'number' || typeof totalQuestions !== 'number') {
      return res.status(400).json({
        success: false,
        message: 'Invalid score or totalQuestions',
      });
    }

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found',
      });
    }

    // Find or create country progress
    let countryProgress = user.countriesProgress?.find(
      cp => cp.countrySlug === slug
    );

    const scorePercentage = score / totalQuestions;
    const now = new Date();

    if (!countryProgress) {
      // Create new progress entry
      countryProgress = {
        countrySlug: slug,
        lastQuizTime: now,
        lastQuizScore: score,
        highestScore: score,
        totalAttempts: 1,
        stampCollectedAt: null,
      };
      
      if (!user.countriesProgress) {
        user.countriesProgress = [];
      }
      user.countriesProgress.push(countryProgress);
    } else {
      // Update existing progress
      countryProgress.lastQuizTime = now;
      countryProgress.lastQuizScore = score;
      countryProgress.totalAttempts += 1;
      
      if (score > countryProgress.highestScore) {
        countryProgress.highestScore = score;
      }
    }

    // Check stamp condition: if score >= 70% and stamp not yet collected
    let stampAwarded = false;
    if (scorePercentage >= STAMP_THRESHOLD && !countryProgress.stampCollectedAt) {
      countryProgress.stampCollectedAt = now;
      stampAwarded = true;
    }

    // Update the progress in the array
    const progressIndex = user.countriesProgress.findIndex(
      cp => cp.countrySlug === slug
    );
    if (progressIndex !== -1) {
      user.countriesProgress[progressIndex] = countryProgress;
    }

    await user.save();

    res.json({
      success: true,
      message: stampAwarded 
        ? 'Quiz completed! You earned a stamp!' 
        : 'Quiz results saved',
      data: {
        countrySlug: slug,
        lastQuizTime: countryProgress.lastQuizTime,
        lastQuizScore: countryProgress.lastQuizScore,
        highestScore: countryProgress.highestScore,
        totalAttempts: countryProgress.totalAttempts,
        stampCollectedAt: countryProgress.stampCollectedAt,
        stampAwarded,
      },
    });
  } catch (error) {
    console.error('Error updating quiz results:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating quiz results',
    });
  }
});

module.exports = router;
