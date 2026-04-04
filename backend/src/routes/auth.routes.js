import '../config/env.js';
import { Router } from 'express';
import passport from 'passport';
import { AuthController } from '../controllers/auth.controller.js';
import {
  registerValidationRules,
  loginValidationRules,
  validate,
} from '../middleware/validator.js';
import jwt from 'jsonwebtoken';
import { googleAuthEnabled } from '../services/passport.js';

const router = Router();
const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';

router.post('/register', registerValidationRules(), validate, AuthController.register);
router.post('/login', loginValidationRules(), validate, AuthController.login);

router.get('/google', (req, res, next) => {
  if (!googleAuthEnabled) {
    return res.status(503).json({
      success: false,
      message: 'Google sign-in is not configured on this deployment.',
    });
  }

  return passport.authenticate('google', { scope: ['profile', 'email'] })(req, res, next);
});

router.get('/google/callback', (req, res, next) => {
  if (!googleAuthEnabled) {
    return res.status(503).json({
      success: false,
      message: 'Google sign-in is not configured on this deployment.',
    });
  }

  return passport.authenticate('google', { failureRedirect: `${frontendUrl}/login?error=oauth_failed` })(req, res, next);
}, (req, res) => {
  const token = jwt.sign({ userId: req.user.id }, process.env.JWT_SECRET || 'your_jwt_secret', {
    expiresIn: '1h',
  });
  res.redirect(`${frontendUrl}/oauth/callback?token=${token}`);
});

router.post('/forgot-password', AuthController.forgotPassword);
router.post('/reset-password', AuthController.resetPassword);

export default router;
