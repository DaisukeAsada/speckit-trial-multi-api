/**
 * 記事ルート
 * 記事のCRUD操作エンドポイント
 */
const express = require('express');
const postService = require('../services/postService');
const { authenticate, optionalAuthenticate } = require('../middlewares/auth');
const { validate } = require('../middlewares/validate');
const {
  validateTitle,
  validateContent,
  validateStatus,
  validateIdParam,
  validatePage,
  validateLimit,
  validateStatusFilter,
  validateSort,
} = require('../utils/validators');

const router = express.Router();

/**
 * GET /api/v1/posts
 * 記事一覧取得
 */
router.get(
  '/',
  validate([validatePage, validateLimit, validateStatusFilter, validateSort]),
  async (req, res, next) => {
    try {
      const { page, limit, status, sort } = req.query;
      
      const result = postService.getPosts({
        page: page || 1,
        limit: limit || 20,
        status,
        sort,
      });
      
      res.json(result);
    } catch (error) {
      next(error);
    }
  }
);

/**
 * GET /api/v1/posts/:id
 * 記事詳細取得
 */
router.get(
  '/:id',
  validate([validateIdParam]),
  async (req, res, next) => {
    try {
      const post = postService.getPostById(req.params.id);
      res.json(post);
    } catch (error) {
      next(error);
    }
  }
);

/**
 * POST /api/v1/posts
 * 記事作成（認証必須）
 */
router.post(
  '/',
  authenticate,
  validate([validateTitle, validateContent, validateStatus]),
  async (req, res, next) => {
    try {
      const { title, content, status } = req.body;
      
      const post = postService.createPost(
        { title, content, status },
        req.user
      );
      
      res.status(201).json(post);
    } catch (error) {
      next(error);
    }
  }
);

/**
 * PUT /api/v1/posts/:id
 * 記事更新（認証必須、作成者またはadmin）
 */
router.put(
  '/:id',
  authenticate,
  validate([validateIdParam, validateTitle, validateContent, validateStatus]),
  async (req, res, next) => {
    try {
      const { title, content, status } = req.body;
      
      const post = postService.updatePost(
        req.params.id,
        { title, content, status },
        req.user
      );
      
      res.json(post);
    } catch (error) {
      next(error);
    }
  }
);

/**
 * DELETE /api/v1/posts/:id
 * 記事削除（認証必須、作成者またはadmin）
 */
router.delete(
  '/:id',
  authenticate,
  validate([validateIdParam]),
  async (req, res, next) => {
    try {
      postService.deletePost(req.params.id, req.user);
      res.status(204).send();
    } catch (error) {
      next(error);
    }
  }
);

module.exports = router;
