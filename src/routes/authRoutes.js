/**
 * 認証ルート
 * ユーザー登録、ログイン、トークン更新、ログアウトのエンドポイント
 */
const express = require('express');
const authService = require('../services/authService');
const { authenticate } = require('../middlewares/auth');
const { authRateLimiter } = require('../middlewares/rateLimit');
const { validate } = require('../middlewares/validate');
const {
  validateEmail,
  validatePassword,
  validateName,
  validateRefreshToken,
} = require('../utils/validators');

const router = express.Router();

/**
 * POST /api/v1/auth/register
 * 新規ユーザー登録
 */
router.post(
  '/register',
  authRateLimiter,
  validate([validateEmail, validatePassword, validateName]),
  async (req, res, next) => {
    try {
      const { email, password, name } = req.body;
      
      const user = await authService.register({ email, password, name });
      
      res.status(201).json(user);
    } catch (error) {
      next(error);
    }
  }
);

/**
 * POST /api/v1/auth/login
 * ログイン
 */
router.post(
  '/login',
  authRateLimiter,
  validate([validateEmail, validatePassword]),
  async (req, res, next) => {
    try {
      const { email, password } = req.body;
      
      const tokens = await authService.login({ email, password });
      
      res.json(tokens);
    } catch (error) {
      next(error);
    }
  }
);

/**
 * POST /api/v1/auth/refresh
 * トークン更新
 */
router.post(
  '/refresh',
  authRateLimiter,
  validate([validateRefreshToken]),
  async (req, res, next) => {
    try {
      const { refreshToken } = req.body;
      
      const tokens = await authService.refresh(refreshToken);
      
      res.json(tokens);
    } catch (error) {
      next(error);
    }
  }
);

/**
 * POST /api/v1/auth/logout
 * ログアウト
 */
router.post(
  '/logout',
  authenticate,
  validate([validateRefreshToken]),
  async (req, res, next) => {
    try {
      const { refreshToken } = req.body;
      
      const result = await authService.logout(refreshToken, req.user.id);
      
      res.json(result);
    } catch (error) {
      next(error);
    }
  }
);

module.exports = router;
