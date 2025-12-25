require('dotenv').config();

const express = require('express');
const session = require('express-session');
const cors = require('cors');
const passport = require('./config/passport');
const authRoutes = require('./routes/auth');
const countryRoutes = require('./routes/country');
const { isAuthenticated } = require('./middleware/auth');
const connectDB = require('./lib/mongodb');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware to ensure DB connection on each request (for serverless)
app.use(async (req, res, next) => {
  try {
    await connectDB();
    next();
  } catch (error) {
    console.error('Database connection failed:', error);
    res.status(500).json({ success: false, message: 'Database connection failed' });
  }
});

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// CORS configuration
app.use(
  cors({
    origin: process.env.CLIENT_URL || 'http://localhost:5000',
    credentials: true,
  })
);

// Session configuration
app.use(
  session({
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: false,
    cookie: {
      secure: process.env.NODE_ENV === 'production',
      httpOnly: true,
      maxAge: 24 * 60 * 60 * 1000, // 24 hours
    },
  })
);

// Initialize Passport
app.use(passport.initialize());
app.use(passport.session());

// Routes
app.use('/auth', authRoutes);
app.use('/country', countryRoutes);

// Home route
app.get('/', (req, res) => {
  res.json({
    message: 'Meowtimedia Backend API',
    endpoints: {
      auth: {
        login: 'GET /auth/google',
        callback: 'GET /auth/google/callback',
        user: 'GET /auth/user',
        logout: 'GET /auth/logout',
      },
      country: {
        content: 'GET /country/:slug - Get country festivals, food, funfacts',
        quiz: 'GET /country/:slug/quiz - Get quiz questions',
        update: 'POST /country/:slug/update - Update quiz results (auth required)',
      },
      protected: 'GET /api/protected',
    },
  });
});

// Protected route example
app.get('/api/protected', isAuthenticated, (req, res) => {
  res.json({
    success: true,
    message: 'You have access to protected content!',
    user: req.user,
  });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Error:', err.stack);
  res.status(500).json({
    success: false,
    message: 'Internal server error',
  });
});

// Start server (only in non-serverless environment)
if (process.env.NODE_ENV !== 'production') {
  app.listen(PORT, () => {
    console.log(`🚀 Server running on http://localhost:${PORT}`);
    console.log(`📝 Google OAuth login: http://localhost:${PORT}/auth/google`);
  });
}

// Export for Vercel serverless
module.exports = app;
