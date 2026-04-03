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

const router = Router();
const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';

router.post('/register', registerValidationRules(), validate, AuthController.register);
router.post('/login', loginValidationRules(), validate, AuthController.login);

router.get('/google', passport.authenticate('google', { scope: ['profile', 'email'] }));

router.get('/google/callback', passport.authenticate('google', { failureRedirect: `${frontendUrl}/login?error=oauth_failed` }), (req, res) => {
  const token = jwt.sign({ userId: req.user.id }, process.env.JWT_SECRET || 'your_jwt_secret', {
    expiresIn: '1h',
  });
  res.redirect(`${frontendUrl}/oauth/callback?token=${token}`);
});

router.post('/forgot-password', AuthController.forgotPassword);
router.post('/reset-password', AuthController.resetPassword);

export default router;
