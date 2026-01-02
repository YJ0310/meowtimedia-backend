require('dotenv').config();

const express = require('express');
const session = require('express-session');
const MongoStore = require('connect-mongo');
const cors = require('cors');
const passport = require('./config/passport');
const authRoutes = require('./routes/auth');
const countryRoutes = require('./routes/country');
const reactionsRoutes = require('./routes/reactions');
const feedbackRoutes = require('./routes/feedback');
const adminRoutes = require('./routes/admin');
const { isAuthenticated } = require('./middleware/auth');
const connectDB = require('./lib/mongodb');

const app = express();
const PORT = process.env.PORT || 3000;

// Trust proxy for Vercel (required for secure cookies behind proxy)
app.set('trust proxy', 1);

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

// Session configuration with MongoDB store for serverless
// Extended session: 30 days for "remember me" functionality
const SESSION_TTL = 30 * 24 * 60 * 60; // 30 days in seconds

app.use(
  session({
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: false,
    store: MongoStore.create({
      mongoUrl: process.env.MONGODB_URI,
      ttl: SESSION_TTL,
      autoRemove: 'native',
    }),
    cookie: {
      secure: process.env.NODE_ENV === 'production',
      httpOnly: true,
      sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
      domain: process.env.NODE_ENV === 'production' ? '.smoltako.space' : undefined,
      maxAge: SESSION_TTL * 1000, // 30 days in milliseconds
    },
  })
);

// Initialize Passport
app.use(passport.initialize());
app.use(passport.session());

// Routes
app.use('/auth', authRoutes);
app.use('/country', countryRoutes);
app.use('/reactions', reactionsRoutes);
app.use('/feedback', feedbackRoutes);
app.use('/admin/feedback', feedbackRoutes);
app.use('/admin', adminRoutes);

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
      reactions: {
        getByFunfact: 'GET /reactions/:funfactId - Get reactions for a funfact',
        getByCountry: 'GET /reactions/country/:countrySlug - Get all reactions for a country',
        addReaction: 'POST /reactions/:funfactId - Add/toggle reaction (auth required)',
        removeReaction: 'DELETE /reactions/:funfactId - Remove reaction (auth required)',
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
