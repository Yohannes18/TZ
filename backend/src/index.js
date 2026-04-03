import './config/env.js';

import express from 'express';
import cors from 'cors';
import session from 'express-session';
import connectPgSimple from 'connect-pg-simple';
import helmet from 'helmet';
import passport from 'passport';
import rateLimit from 'express-rate-limit';
import { initDb, pool } from './db.js';
import authRouter from './routes/auth.routes.js';
import tradeRouter from './routes/trade.routes.js';
import categoryRouter from './routes/category.routes.js';
import threadRouter from './routes/thread.routes.js';
import postRouter from './routes/post.routes.js';
import tagRouter from './routes/tag.routes.js';
import reactionRouter from './routes/reaction.routes.js';
import followRouter from './routes/follow.routes.js';
import playbookRouter from './routes/playbook.routes.js';
import backtestingRouter from './routes/backtesting.routes.js';
import reportRouter from './routes/report.routes.js';
import brokerRouter from './routes/broker.routes.js';
import dashboardRouter from './routes/dashboard.routes.js';
import errorHandler from './middleware/errorHandler.js';
import './services/passport.js';

const app = express();
const PgSession = connectPgSimple(session);

// Export the app instance for testing or other modules that need it
export default app;

if (process.env.NODE_ENV === 'production') {
  app.set('trust proxy', 1);
}

const isProduction = process.env.NODE_ENV === 'production';
const sessionCookieName = process.env.SESSION_COOKIE_NAME || 'tradezella.sid';
const sessionMaxAge = Number(process.env.SESSION_MAX_AGE_MS || 1000 * 60 * 60 * 24 * 7);
const sessionStore = isProduction
  ? new PgSession({
      pool,
      tableName: 'user_sessions',
      createTableIfMissing: true,
    })
  : undefined;

const globalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: isProduction ? 300 : 1000,
  standardHeaders: true,
  legacyHeaders: false,
});

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: isProduction ? 25 : 200,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: 'Too many authentication requests, please try again later.',
  },
});

// Middleware
const corsOrigins = process.env.CORS_ORIGIN
  ? process.env.CORS_ORIGIN.split(',').map(origin => origin.trim()).filter(Boolean)
  : true;

app.disable('x-powered-by');
app.use(helmet({
  crossOriginResourcePolicy: { policy: 'cross-origin' },
}));
app.use(globalLimiter);
app.use(cors({
  origin: corsOrigins,
  credentials: true,
}));
app.use(express.json({ limit: '1mb' }));
app.use(session({
  name: sessionCookieName,
  secret: process.env.SESSION_SECRET || 'your_session_secret',
  resave: false,
  saveUninitialized: false,
  proxy: isProduction,
  store: sessionStore,
  cookie: {
    httpOnly: true,
    secure: isProduction,
    sameSite: isProduction ? 'none' : 'lax',
    maxAge: sessionMaxAge,
  },
}));
app.use(passport.initialize());
app.use(passport.session());


// Routes
app.get('/', (req, res) => {
  res.send('TradeZella Backend is running!');
});

app.get('/health', async (_req, res) => {
  try {
    await pool.query('SELECT 1');
    res.status(200).json({ status: 'ok' });
  } catch (error) {
    res.status(503).json({
      status: 'error',
      message: 'Database connection failed',
    });
  }
});

app.use('/api/auth', authLimiter, authRouter);
app.use('/api/trades', tradeRouter);
app.use('/api/community/categories', categoryRouter);
app.use('/api/community/threads', threadRouter);
app.use('/api/community/posts', postRouter);
app.use('/api/community/tags', tagRouter);
app.use('/api/community/reactions', reactionRouter);
app.use('/api/community/follow', followRouter);
app.use('/api/playbooks', playbookRouter);
app.use('/api/backtesting', backtestingRouter);
app.use('/api/reports', reportRouter);
app.use('/api/brokers', brokerRouter);
app.use('/api/dashboard', dashboardRouter);

app.use(errorHandler);

// Only start the server if this file is executed directly (not imported for testing)
if (process.env.NODE_ENV !== 'test' && !process.env.JEST_WORKER_ID) {
  const startServer = async () => {
    try {
      // Initialize database tables
      await initDb();
      
      // Start the server
      const PORT = process.env.PORT || 5000;
      app.listen(PORT, () => {
        console.log(`Server running on port ${PORT}`);
      });
    } catch (error) {
      console.error('Failed to start server:', error);
      process.exit(1);
    }
  };
  startServer();
}
